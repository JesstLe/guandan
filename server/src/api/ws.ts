import { WebSocketServer, WebSocket } from 'ws'
import { v4 as uuid } from 'uuid'
import { type WSMessage, type WSError, ERROR_CODES } from '@guandan/shared'
import { GameSession } from '../engine/gameSession'
import { buildStructuredState } from '../ai/stateBuilder'
import { compressHistory } from '../ai/historyCompressor'
import { buildPrompt } from '../ai/promptBuilder'
import { parseAIResponse } from '../ai/responseParser'
import { validateCardType } from '../validator/cardTypeValidator'
import { validateHandOwnership } from '../validator/handValidator'
import { validateTablePlay } from '../validator/tableValidator'

interface ClientConnection {
  ws: WebSocket
  session: GameSession | null
}

export function createWSServer(wss: WebSocketServer): void {
  const clients = new Map<string, ClientConnection>()

  wss.on('connection', (ws) => {
    const clientId = uuid()
    clients.set(clientId, { ws, session: null })

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString()) as WSMessage
        handleMessage(clientId, msg)
      } catch (e) {
        sendError(ws, '', 'PARSE_ERROR', '消息格式错误')
      }
    })

    ws.on('close', () => {
      clients.delete(clientId)
    })

    send(ws, {
      id: uuid(),
      type: 'system:connected',
      timestamp: Date.now(),
      payload: { clientId },
    })
  })

  function handleMessage(clientId: string, msg: WSMessage): void {
    const client = clients.get(clientId)
    if (!client) return

    const { ws, session } = client

    switch (msg.type) {
      case 'game:new': {
        const newSession = new GameSession()
        client.session = newSession
        const payload = msg.payload as {
          mode: any
          seats: any
          handCards: any[]
        }
        const event = newSession.startGame(payload.mode, payload.seats, payload.handCards)
        sendState(ws, newSession, msg.id)
        break
      }

      case 'game:play': {
        if (!session) return sendError(ws, msg.id, 'GAME_001', ERROR_CODES.GAME_001)
        const payload = msg.payload as { player: number; cards: any[] }

        const typeValidation = validateCardType(payload.cards)
        if (!typeValidation.valid) {
          return sendError(ws, msg.id, 'VALIDATION_001', typeValidation.errors.join('; '))
        }

        const handValidation = validateHandOwnership(session.getState().pool, payload.player, payload.cards)
        if (!handValidation.valid) {
          return sendError(ws, msg.id, 'VALIDATION_002', handValidation.errors.join('; '))
        }

        if (session.getState().currentRound?.leadCombination && typeValidation.detectedCombination) {
          const tableValidation = validateTablePlay(
            typeValidation.detectedCombination,
            session.getState().currentRound!.leadCombination,
          )
          if (!tableValidation.valid) {
            return sendError(ws, msg.id, 'VALIDATION_003', tableValidation.errors.join('; '))
          }
        }

        const result = session.play(payload.player, payload.cards)
        if ('error' in result) {
          return sendError(ws, msg.id, 'VALIDATION_001', result.error)
        }

        sendState(ws, session, msg.id)
        break
      }

      case 'game:pass': {
        if (!session) return sendError(ws, msg.id, 'GAME_001', ERROR_CODES.GAME_001)
        const payload = msg.payload as { player: number }
        const result = session.pass(payload.player)
        if ('error' in result) {
          return sendError(ws, msg.id, 'VALIDATION_004', result.error)
        }
        sendState(ws, session, msg.id)
        break
      }

      case 'game:undo': {
        if (!session) return sendError(ws, msg.id, 'GAME_001', ERROR_CODES.GAME_001)
        session.undo()
        sendState(ws, session, msg.id)
        break
      }

      case 'game:suggest': {
        if (!session) return sendError(ws, msg.id, 'GAME_001', ERROR_CODES.GAME_001)
        handleSuggest(ws, session, msg)
        break
      }

      case 'game:state': {
        if (!session) return sendError(ws, msg.id, 'GAME_001', ERROR_CODES.GAME_001)
        sendState(ws, session, msg.id)
        break
      }

      default:
        sendError(ws, msg.id, 'UNKNOWN_TYPE', `未知消息类型: ${msg.type}`)
    }
  }

  async function handleSuggest(ws: WebSocket, session: GameSession, msg: WSMessage): Promise<void> {
    const state = session.getState()
    const structuredState = buildStructuredState(
      state.pool,
      state.trumpRank,
      state.seats.me,
      state.seats.teammate,
      state.currentRound,
      state.rounds,
      state.finishedPlayers,
    )

    const history = compressHistory(session.getTimeline().all, state.rounds)
    const prompt = buildPrompt(structuredState, history, '我该出什么牌？请给出建议。')

    send(ws, {
      id: uuid(),
      correlationId: msg.id,
      type: 'game:suggest',
      timestamp: Date.now(),
      payload: {
        status: 'thinking',
        prompt,
      },
    })

    try {
      const apiKey = process.env.CLAUDE_API_KEY
      if (!apiKey) {
        return sendError(ws, msg.id, 'AI_001', ERROR_CODES.AI_001)
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) {
        return sendError(ws, msg.id, 'AI_001', `AI服务返回错误: ${response.status}`)
      }

      const data = await response.json() as any
      const text = data.content?.[0]?.text || ''
      const parsed = parseAIResponse(text)

      if (!parsed.success || !parsed.suggestion) {
        return sendError(ws, msg.id, 'AI_003', parsed.error || 'AI建议解析失败')
      }

      send(ws, {
        id: uuid(),
        correlationId: msg.id,
        type: 'game:suggest',
        timestamp: Date.now(),
        payload: parsed.suggestion,
      })
    } catch (e) {
      sendError(ws, msg.id, 'AI_001', `AI请求失败: ${(e as Error).message}`)
    }
  }

  function sendState(ws: WebSocket, session: GameSession, correlationId: string): void {
    const state = session.getState()
    send(ws, {
      id: uuid(),
      correlationId,
      type: 'game:state',
      timestamp: Date.now(),
      payload: {
        phase: state.phase,
        trumpRank: state.trumpRank,
        currentPlayer: state.currentPlayer,
        roundNumber: state.roundNumber,
        finishedPlayers: state.finishedPlayers,
        currentRound: state.currentRound,
        myHand: state.pool.allCardStates.filter(s => s.status === 'in_my_hand'),
        players: Object.values(state.pool.players).map(p => ({
          seat: p.seat,
          handCount: p.handCount,
        })),
      },
    })
  }

  function send(ws: WebSocket, msg: WSMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg))
    }
  }

  function sendError(ws: WebSocket, correlationId: string, code: string, message: string): void {
    send(ws, {
      id: uuid(),
      correlationId,
      type: 'game:error',
      timestamp: Date.now(),
      payload: { code, message } as WSError,
    })
  }
}
