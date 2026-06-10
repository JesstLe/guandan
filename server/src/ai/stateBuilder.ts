import {
  type CardPool, type CardState, type AnyCard, type Card,
  type TrumpRank, type Rank, type Suit, type CardCombination,
  type PlayerProfile, type Round,
  RANK_ORDER, SUIT_ORDER, isJoker,
} from '@guandan/shared'
import { analyzeStyle, getWeakRanks } from '../engine/playerProfile'

export interface StructuredState {
  trumpRank: TrumpRank
  myHand: HandSummary
  opponents: OpponentSummary[]
  teammate: OpponentSummary
  tableLead: TableLead | null
  playedCards: PlayedCardSummary
  roundInfo: RoundInfo
  inferences: InferenceSummary[]
}

export interface HandSummary {
  cards: CardSummary[]
  combinations: CombinationSummary[]
  totalCards: number
  hasBomb: boolean
  hasWildcard: boolean
}

export interface CardSummary {
  rank: Rank | 'BJ' | 'SJ'
  suit: Suit | 'joker'
  isTrump: boolean
  isRedTrump: boolean
}

export interface CombinationSummary {
  type: string
  mainRank: Rank | null
  length: number
  cards: CardSummary[]
}

export interface OpponentSummary {
  seat: number
  handCount: number
  style: {
    aggression: number
    bombTendency: number
    controlTendency: number
  }
  weakRanks: Rank[]
  recentPlays: string[]
}

export interface TeammateSummary extends OpponentSummary {
  cooperationScore: number
}

export interface TableLead {
  player: number
  combination: CardCombination
  passCount: number
}

export interface PlayedCardSummary {
  trumpPlayed: number
  trumpRemaining: number
  bombsPlayed: number
  bigCardsPlayed: number
}

export interface RoundInfo {
  roundNumber: number
  isWindRound: boolean
  finishedPlayers: number[]
}

export interface InferenceSummary {
  player: number
  description: string
  confidence: number
  type: string
}

export function buildStructuredState(
  pool: CardPool,
  trumpRank: TrumpRank,
  mySeat: number,
  teammateSeat: number,
  currentRound: Round | null,
  rounds: Round[],
  finishedPlayers: number[],
): StructuredState {
  const myHand = buildHandSummary(pool, mySeat)
  const opponents = buildOpponentSummaries(pool, [1, 3].filter(s => s !== mySeat && s !== teammateSeat), mySeat)
  const teammate = buildOpponentSummary(pool, teammateSeat, mySeat)
  const tableLead = buildTableLead(currentRound)
  const playedCards = buildPlayedCardSummary(pool, trumpRank)
  const roundInfo = buildRoundInfo(currentRound, rounds, finishedPlayers)
  const inferences = buildInferenceSummary(pool)

  return {
    trumpRank,
    myHand,
    opponents,
    teammate,
    tableLead,
    playedCards,
    roundInfo,
    inferences,
  }
}

function buildHandSummary(pool: CardPool, mySeat: number): HandSummary {
  const myCards = pool.allCardStates.filter(s => s.status === 'in_my_hand')
  const cards: CardSummary[] = myCards.map(s => {
    const c = s.card
    if (isJoker(c)) {
      return { rank: c.type === 'big' ? 'BJ' : 'SJ', suit: 'joker', isTrump: false, isRedTrump: false }
    }
    return { rank: c.rank, suit: c.suit, isTrump: c.isTrump, isRedTrump: c.isRedTrump }
  })

  const hasBomb = (() => {
    const rankCounts: Record<string, number> = {}
    let jokerCount = 0
    for (const s of myCards) {
      if (isJoker(s.card)) { jokerCount++; continue }
      const r = (s.card as Card).rank
      rankCounts[r] = (rankCounts[r] || 0) + 1
    }
    if (jokerCount >= 2) return true
    return Object.values(rankCounts).some(count => count >= 4)
  })()

  const hasWildcard = myCards.some(s => !isJoker(s.card) && (s.card as Card).isRedTrump)

  return {
    cards,
    combinations: [],
    totalCards: myCards.length,
    hasBomb,
    hasWildcard,
  }
}

function buildOpponentSummaries(
  pool: CardPool,
  seats: number[],
  mySeat: number,
): OpponentSummary[] {
  return seats.map(seat => buildOpponentSummary(pool, seat, mySeat))
}

function buildOpponentSummary(
  pool: CardPool,
  seat: number,
  mySeat: number,
): OpponentSummary {
  const profile = pool.players[seat]
  const style = analyzeStyle(profile)
  const weakRanks = getWeakRanks(profile)
  const recentPlays = profile.playedCards.slice(-5).map(p => {
    const combo = p.playedInCombo
    return `${combo.type}(${combo.mainRank || '?'})`
  })

  return {
    seat,
    handCount: profile.handCount,
    style: {
      aggression: style.aggression,
      bombTendency: style.bombTendency,
      controlTendency: style.controlTendency,
    },
    weakRanks,
    recentPlays,
  }
}

function buildTableLead(currentRound: Round | null): TableLead | null {
  if (!currentRound || !currentRound.leadCombination) return null
  const passCount = currentRound.plays.filter(p => p.action === 'pass').length
  return {
    player: currentRound.leadPlayer,
    combination: currentRound.leadCombination,
    passCount,
  }
}

function buildPlayedCardSummary(pool: CardPool, trumpRank: TrumpRank): PlayedCardSummary {
  const played = pool.allCardStates.filter(s => s.status === 'in_play' || s.status === 'archived')
  const trumpPlayed = played.filter(s => s.isTrump).length
  const totalTrump = pool.allCardStates.filter(s => s.isTrump).length
  const bombsPlayed = (() => {
    const bombCombos = new Set<string>()
    for (const s of played) {
      for (const h of s.playHistory) {
        if (h.playedInCombo.type === 'bomb' || h.playedInCombo.type === 'joker_bomb') {
          bombCombos.add(`${h.playedBy}:${h.playedInCombo.type}:${h.playedInCombo.mainRank || 'joker'}`)
        }
      }
    }
    return bombCombos.size
  })()
  const bigCardsPlayed = played.filter(s => {
    if (isJoker(s.card)) return true
    return RANK_ORDER[(s.card as Card).rank] >= 14
  }).length

  return {
    trumpPlayed,
    trumpRemaining: totalTrump - trumpPlayed,
    bombsPlayed,
    bigCardsPlayed,
  }
}

function buildRoundInfo(
  currentRound: Round | null,
  rounds: Round[],
  finishedPlayers: number[],
): RoundInfo {
  return {
    roundNumber: currentRound?.roundNumber || rounds.length + 1,
    isWindRound: currentRound?.isWindRound || false,
    finishedPlayers,
  }
}

function buildInferenceSummary(pool: CardPool): InferenceSummary[] {
  const allInferences: InferenceSummary[] = []
  for (const profile of Object.values(pool.players)) {
    for (const inf of profile.inferences) {
      allInferences.push({
        player: profile.seat,
        description: inf.description,
        confidence: inf.confidence,
        type: inf.type,
      })
    }
  }
  return allInferences
}
