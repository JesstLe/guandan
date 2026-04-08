import { useState, useEffect, useRef, useCallback } from 'react'
import { type WSMessage, type AISuggestion, type AnyCard, type Rank } from '@guandan/shared'

export interface GameState {
  phase: string
  trumpRank: Rank
  currentPlayer: number
  roundNumber: number
  finishedPlayers: number[]
  currentRound: any | null
  myHand: any[]
  players: { seat: number; handCount: number }[]
}

export interface UseGameReturn {
  state: GameState | null
  suggestion: AISuggestion | null
  connected: boolean
  loading: boolean
  error: string | null
  startGame: (mode: any, seats: any, handCards: AnyCard[]) => void
  play: (player: number, cards: AnyCard[]) => void
  pass: (player: number) => void
  undo: () => void
  requestSuggestion: () => void
}

export function useGame(): UseGameReturn {
  const [state, setState] = useState<GameState | null>(null)
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pendingRef = useRef<Map<string, { resolve: (msg: WSMessage) => void; reject: (err: Error) => void }>>(new Map())
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`
    let ws: WebSocket
    try {
      ws = new WebSocket(wsUrl)
    } catch {
      return
    }
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => {
      setConnected(false)
      reconnectTimerRef.current = setTimeout(() => connect(), 3000)
    }
    ws.onerror = () => {
      setError('WebSocket连接失败，3秒后重试')
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WSMessage
        handleMessage(msg)
      } catch (e) {
        console.error('消息解析失败', e)
      }
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [connect])

  const handleMessage = useCallback((msg: WSMessage) => {
    switch (msg.type) {
      case 'system:connected':
        break
      case 'game:state':
        setState(msg.payload as GameState)
        setLoading(false)
        setError(null)
        break
      case 'game:suggest':
        if (msg.payload && typeof msg.payload === 'object' && 'primary' in (msg.payload as any)) {
          setSuggestion(msg.payload as AISuggestion)
        }
        setLoading(false)
        break
      case 'game:error':
        setError((msg.payload as any).message || '未知错误')
        setLoading(false)
        break
    }

    if (msg.correlationId) {
      const pending = pendingRef.current.get(msg.correlationId)
      if (pending) {
        pending.resolve(msg)
        pendingRef.current.delete(msg.correlationId)
      }
    }
  }, [])

  const send = useCallback((msg: WSMessage): Promise<WSMessage> => {
    return new Promise((resolve, reject) => {
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket未连接'))
        return
      }
      if (msg.id) {
        pendingRef.current.set(msg.id, { resolve, reject })
      }
      ws.send(JSON.stringify(msg))
      setTimeout(() => {
        if (pendingRef.current.has(msg.id)) {
          pendingRef.current.delete(msg.id)
          reject(new Error('请求超时'))
        }
      }, 30000)
    })
  }, [])

  const startGame = useCallback((mode: any, seats: any, handCards: AnyCard[]) => {
    setLoading(true)
    setError(null)
    send({
      id: crypto.randomUUID(),
      type: 'game:new',
      timestamp: Date.now(),
      payload: { mode, seats, handCards },
    }).catch(e => setError(e.message))
  }, [send])

  const play = useCallback((player: number, cards: AnyCard[]) => {
    setLoading(true)
    setError(null)
    send({
      id: crypto.randomUUID(),
      type: 'game:play',
      timestamp: Date.now(),
      payload: { player, cards },
    }).catch(e => setError(e.message))
  }, [send])

  const pass = useCallback((player: number) => {
    setLoading(true)
    setError(null)
    send({
      id: crypto.randomUUID(),
      type: 'game:pass',
      timestamp: Date.now(),
      payload: { player },
    }).catch(e => setError(e.message))
  }, [send])

  const undo = useCallback(() => {
    send({
      id: crypto.randomUUID(),
      type: 'game:undo',
      timestamp: Date.now(),
      payload: {},
    }).catch(e => setError(e.message))
  }, [send])

  const requestSuggestion = useCallback(() => {
    setLoading(true)
    setSuggestion(null)
    send({
      id: crypto.randomUUID(),
      type: 'game:suggest',
      timestamp: Date.now(),
      payload: {},
    }).catch(e => setError(e.message))
  }, [send])

  return {
    state,
    suggestion,
    connected,
    loading,
    error,
    startGame,
    play,
    pass,
    undo,
    requestSuggestion,
  }
}
