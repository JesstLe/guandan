import { WebSocketServer, WebSocket } from 'ws'
import { v4 as uuid } from 'uuid'
import { type WSMessage, type WSError, ERROR_CODES } from '@guandan/shared'
import { GameSession, getHighestCombination } from '../engine/gameSession'
import { buildStructuredState } from '../ai/stateBuilder'
import { compressHistory } from '../ai/historyCompressor'
import { buildPrompt } from '../ai/promptBuilder'
import { parseAIResponse } from '../ai/responseParser'
import { validateCardType } from '../validator/cardTypeValidator'
import { validateHandOwnership } from '../validator/handValidator'
import { validateTablePlay } from '../validator/tableValidator'
import { detectCombination } from '../engine/combinationDetector'
import { canBeat } from '../engine/combinationCompare'
import { getMyHand } from '../engine/cardPool'
import { cardId, isJoker, type AnyCard, type Card } from '@guandan/shared'

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

        // 用中文写注释，增加代码可读性
        // 获取当前回合桌面上最大的牌型组合进行出牌合法性校验
        const highestCombo = getHighestCombination(session.getState().currentRound)
        if (highestCombo && typeValidation.detectedCombination) {
          const tableValidation = validateTablePlay(
            typeValidation.detectedCombination,
            highestCombo,
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
    const payload = msg.payload as { player?: number } | undefined
    const activePlayer = payload?.player !== undefined ? payload.player : state.currentPlayer

    let structuredState: any = null
    if (session.simulatedHands) {
      structuredState = session.getStructuredStateForPlayer(activePlayer)
    } else {
      structuredState = buildStructuredState(
        state.pool,
        state.trumpRank,
        state.seats.me,
        state.seats.teammate,
        state.currentRound,
        state.rounds,
        state.finishedPlayers,
      )
    }

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
      const apiKey = process.env.KIMI_API_KEY
      if (!apiKey) {
        console.error('[AI] KIMI_API_KEY 未设置, cwd:', process.cwd())
        return sendError(ws, msg.id, 'AI_001', ERROR_CODES.AI_001)
      }

      console.log('[AI] 请求 Kimi K2.5, prompt 长度:', prompt.length)
      const response = await fetch('https://api.kimi.com/coding/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'kimi-k2.5',
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) {
        const errBody = await response.text().catch(() => '')
        console.error('[AI] API 返回错误:', response.status, errBody.substring(0, 200))
        return sendError(ws, msg.id, 'AI_001', `AI服务返回错误: ${response.status}`)
      }

      const data = await response.json() as any
      const text = data.content?.[0]?.text || ''
      const parsed = parseAIResponse(text)

      if (!parsed.success || !parsed.suggestion) {
        return sendError(ws, msg.id, 'AI_003', parsed.error || 'AI建议解析失败')
      }

      const suggestion = validateSuggestion(parsed.suggestion, session, activePlayer)
      if (suggestion.warnings) {
        suggestion.primary.reasoning = `[校验修正] ${suggestion.warnings.join('; ')} | ${suggestion.primary.reasoning}`
      }

      send(ws, {
        id: uuid(),
        correlationId: msg.id,
        type: 'game:suggest',
        timestamp: Date.now(),
        payload: suggestion,
      })
    } catch (e) {
      console.error('[AI] 请求异常:', (e as Error).message)
      sendError(ws, msg.id, 'AI_001', `AI请求失败: ${(e as Error).message}`)
    }
  }

  function validateSuggestion(
    suggestion: import('@guandan/shared').AISuggestion,
    session: GameSession,
    activePlayer: number,
  ): import('@guandan/shared').AISuggestion {
    const warnings: string[] = []
    const state = session.getState()

    let cardIds = new Set<string>()
    if (session.simulatedHands && session.simulatedHands[activePlayer]) {
      cardIds = new Set(session.simulatedHands[activePlayer].map(c => cardId(c)))
    } else {
      const myHand = getMyHand(state.pool)
      cardIds = new Set(myHand.map(s => s.id))
    }

    const validatedPrimary = validateOption(suggestion.primary, cardIds, state, warnings)
    const validatedAlternative = suggestion.alternative
      ? validateOption(suggestion.alternative, cardIds, state, warnings)
      : undefined

    return {
      primary: validatedPrimary,
      alternative: validatedAlternative,
      warnings: [...(suggestion.warnings || []), ...warnings],
      isDilemma: suggestion.isDilemma,
    }
  }

  function validateOption(
    option: import('@guandan/shared').AISuggestionOption,
    myCardIds: Set<string>,
    state: import('../engine/gameSession').GameState,
    warnings: string[],
  ): import('@guandan/shared').AISuggestionOption {
    if (option.action === 'pass') return option

    const cards: AnyCard[] = option.cards.map(c => {
      if (c.rank === 'BJ' || c.rank === 'SJ') {
        return { type: (c.rank === 'BJ' ? 'big' : 'small') as 'big' | 'small', copyIndex: c.copyIndex } as AnyCard
      }
      return {
        rank: c.rank,
        suit: c.suit,
        copyIndex: c.copyIndex,
        isTrump: c.rank === state.trumpRank,
        isRedTrump: c.rank === state.trumpRank && c.suit === 'heart',
      } as AnyCard
    })

    // 校验1：牌型合法性
    const detection = detectCombination(cards)
    if (detection.combinations.length === 0) {
      warnings.push(`AI建议的牌型不合法(${option.combinationType})，已降级为过牌`)
      return { ...option, action: 'pass', cards: [], reasoning: option.reasoning + ' [牌型不合法]' }
    }

    // 校验2：手牌持有 + copyIndex 修正
    // AI 可能返回错误的 copyIndex（如建议 copy1 但手牌是 copy2），
    // 按 suit+rank 匹配实际手牌，自动修正 copyIndex
    const notInHand = cards.filter(c => !myCardIds.has(cardId(c)))
    if (notInHand.length > 0) {
      const remapped = remapCardsToHand(cards, myCardIds)
      if (remapped) {
        return validateOption({ ...option, cards: remapped }, myCardIds, state, warnings)
      }
      warnings.push(`AI建议的牌中有${notInHand.length}张不在手牌中且无法修正`)
    }

    // 校验3：台面压牌校验
    const highestCombo = getHighestCombination(state.currentRound)
    if (highestCombo) {
      const combo = detection.preferred
      if (combo.type !== highestCombo.type) {
        const isBomb = combo.type === 'bomb' || combo.type === 'joker_bomb' || combo.type === 'same_suit_straight'
        if (!isBomb) {
          warnings.push(`AI建议的牌型(${combo.type})与台面(${highestCombo.type})不一致且非炸弹`)
        }
      } else if (!canBeat(combo, highestCombo)) {
        warnings.push(`AI建议的牌无法压过台面`)
      }
    }

    return { ...option, combinationType: detection.preferred.type }
  }

  function remapCardsToHand(
    cards: AnyCard[],
    myCardIds: Set<string>,
  ): { rank: import('@guandan/shared').Rank | 'BJ' | 'SJ'; suit: import('@guandan/shared').Suit | 'joker'; copyIndex: 1 | 2 }[] | null {
    type CardEntry = { rank: string; suit: string; copyIndex: number }
    const handByRankSuit = new Map<string, CardEntry[]>()
    for (const id of myCardIds) {
      const match = id.match(/^(.+)-(.+)-copy(\d+)$/)
      if (match) {
        const [, suit, rank, copyStr] = match
        const key = `${suit}-${rank}`
        if (!handByRankSuit.has(key)) handByRankSuit.set(key, [])
        handByRankSuit.get(key)!.push({ rank, suit, copyIndex: parseInt(copyStr) })
      }
    }

    const usedIds = new Set<string>()
    const result: { rank: import('@guandan/shared').Rank | 'BJ' | 'SJ'; suit: import('@guandan/shared').Suit | 'joker'; copyIndex: 1 | 2 }[] = []

    for (const card of cards) {
      if (isJoker(card)) {
        const jokerId = cardId(card)
        if (myCardIds.has(jokerId) && !usedIds.has(jokerId)) {
          usedIds.add(jokerId)
          result.push({ rank: (card as any).type === 'big' ? 'BJ' as const : 'SJ' as const, suit: 'joker' as const, copyIndex: card.copyIndex as 1 | 2 })
          continue
        }
        return null
      }
      const key = `${(card as any).suit}-${(card as any).rank}`
      const available = handByRankSuit.get(key)
      if (!available) return null
      const unused = available.find(c => !usedIds.has(`${c.suit}-${c.rank}-copy${c.copyIndex}`))
      if (!unused) return null
      usedIds.add(`${unused.suit}-${unused.rank}-copy${unused.copyIndex}`)
      result.push({
        rank: unused.rank as import('@guandan/shared').Rank,
        suit: unused.suit as import('@guandan/shared').Suit,
        copyIndex: unused.copyIndex as 1 | 2,
      })
    }

    return result
  }

  function sendState(ws: WebSocket, session: GameSession, correlationId: string): void {
    const state = session.getState()
    const cardTracker = buildCardTracker(state.pool)
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
        rounds: state.rounds,
        myHand: state.pool.allCardStates.filter(s => s.status === 'in_my_hand'),
        players: Object.values(state.pool.players).map(p => ({
          seat: p.seat,
          handCount: p.handCount,
        })),
        cardTracker,
      },
    })
  }

  function buildCardTracker(pool: import('@guandan/shared').CardPool): Record<string, { total: number; remaining: number; played: number }> {
    const tracker: Record<string, { total: number; remaining: number; played: number }> = {}
    for (const state of pool.allCardStates) {
      const key = isJokerCard(state.card) ? (state.card.type === 'big' ? 'BJ' : 'SJ') : `${state.card.rank}`
      if (!tracker[key]) tracker[key] = { total: 0, remaining: 0, played: 0 }
      tracker[key].total++
      if (state.status === 'in_play' || state.status === 'archived') {
        tracker[key].played++
      } else {
        tracker[key].remaining++
      }
    }
    return tracker
  }

  function isJokerCard(card: import('@guandan/shared').AnyCard): card is import('@guandan/shared').JokerCard {
    return 'type' in card && (card.type === 'small' || card.type === 'big')
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
