import { type GameEvent, type Round, type CardCombination } from '@guandan/shared'

export interface CompressedHistory {
  totalRounds: number
  rounds: CompressedRound[]
  keyEvents: CompressedEvent[]
}

export interface CompressedRound {
  roundNumber: number
  leadPlayer: number
  leadType: string
  leadMainRank: string | null
  winner: number | null
  playCount: number
  passCount: number
}

export interface CompressedEvent {
  round: number
  player: number
  action: 'play' | 'pass'
  type?: string
  mainRank?: string
}

export function compressHistory(events: GameEvent[], rounds: Round[]): CompressedHistory {
  const compressedRounds: CompressedRound[] = rounds.map(r => ({
    roundNumber: r.roundNumber,
    leadPlayer: r.leadPlayer,
    leadType: r.leadCombination?.type || 'unknown',
    leadMainRank: r.leadCombination?.mainRank || null,
    winner: r.winner,
    playCount: r.plays.filter(p => p.action === 'play').length,
    passCount: r.plays.filter(p => p.action === 'pass').length,
  }))

  const keyEvents: CompressedEvent[] = []
  for (const event of events) {
    if (event.type === 'play') {
      keyEvents.push({
        round: 0,
        player: event.data.player ?? 0,
        action: 'play',
        type: event.data.combination?.type,
        mainRank: event.data.combination?.mainRank,
      })
    } else if (event.type === 'pass') {
      keyEvents.push({
        round: 0,
        player: event.data.player ?? 0,
        action: 'pass',
      })
    }
  }

  return {
    totalRounds: rounds.length,
    rounds: compressedRounds,
    keyEvents: keyEvents.slice(-20),
  }
}
