import {
  type AnyCard, type Card, type TributeState, type TributeEntry,
  type TrumpRank, type Rank,
  RANK_ORDER, isJoker,
} from '@guandan/shared'

export interface TributeResult {
  success: boolean
  error?: string
  tribute?: TributeEntry
}

export function determineTributeType(
  loserRank: number,
  winnerRank: number,
): 'single' | 'double' {
  const diff = winnerRank - loserRank
  return diff >= 2 ? 'double' : 'single'
}

export function isAntiTribute(
  playerCards: AnyCard[],
  trumpRank: TrumpRank,
): boolean {
  const jokerCount = playerCards.filter(isJoker).length
  if (jokerCount >= 2) return true

  const trumpCards = playerCards.filter(
    c => !isJoker(c) && c.rank === trumpRank
  )
  if (trumpCards.length >= 2) return true

  return false
}

export function validateTributeCard(
  card: AnyCard,
  handCards: AnyCard[],
  tributeType: 'single' | 'double',
  trumpRank: TrumpRank,
): { valid: boolean; error?: string } {
  if (isJoker(card)) {
    return { valid: false, error: '不能进贡王牌' }
  }

  const c = card as Card
  if (c.rank === trumpRank) {
    return { valid: false, error: '不能进贡主牌' }
  }

  const inHand = handCards.some(h => cardId(h) === cardId(card))
  if (!inHand) {
    return { valid: false, error: '手牌中没有这张牌' }
  }

  return { valid: true }
}

export function validateReturnCard(
  card: AnyCard,
  handCards: AnyCard[],
  trumpRank: TrumpRank,
  tributeRank: Rank,
): { valid: boolean; error?: string } {
  if (isJoker(card)) {
    return { valid: false, error: '不能还贡王牌' }
  }

  const inHand = handCards.some(h => cardId(h) === cardId(card))
  if (!inHand) {
    return { valid: false, error: '手牌中没有这张牌' }
  }

  return { valid: true }
}

export function selectBestTributeCard(
  handCards: AnyCard[],
  trumpRank: TrumpRank,
): AnyCard | null {
  const candidates = handCards.filter(c => {
    if (isJoker(c)) return false
    return (c as Card).rank !== trumpRank
  })

  if (candidates.length === 0) return null

  candidates.sort((a, b) => {
    if (isJoker(a)) return 1
    if (isJoker(b)) return -1
    return RANK_ORDER[(b as Card).rank] - RANK_ORDER[(a as Card).rank]
  })

  return candidates[0]
}

export function selectBestReturnCard(
  handCards: AnyCard[],
  trumpRank: TrumpRank,
  tributeRank: Rank,
): AnyCard | null {
  const candidates = handCards.filter(c => {
    if (isJoker(c)) return false
    return true
  })

  if (candidates.length === 0) return null

  candidates.sort((a, b) => {
    if (isJoker(a)) return 1
    if (isJoker(b)) return -1
    const aRank = (a as Card).rank
    const bRank = (b as Card).rank
    if (aRank === trumpRank && bRank !== trumpRank) return 1
    if (bRank === trumpRank && aRank !== trumpRank) return -1
    return RANK_ORDER[aRank] - RANK_ORDER[bRank]
  })

  return candidates[0]
}

function cardId(card: AnyCard): string {
  if (isJoker(card)) return `${card.type}-copy${card.copyIndex}`
  return `${card.suit}-${card.rank}-copy${card.copyIndex}`
}
