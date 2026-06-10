import {
  type AnyCard, type Card, type JokerCard, type CardState, type CardPool,
  type TrumpRank, type CardStatus, type Rank, type Suit, type SeatConfig,
  ALL_RANKS, ALL_SUITS, RANK_ORDER, SUIT_ORDER,
  isJoker, cardId,
} from '@guandan/shared'

export function createFullDeck(): AnyCard[] {
  const cards: AnyCard[] = []
  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      cards.push({ rank, suit, copyIndex: 1, isTrump: false, isRedTrump: false })
      cards.push({ rank, suit, copyIndex: 2, isTrump: false, isRedTrump: false })
    }
  }
  cards.push({ type: 'small', copyIndex: 1 })
  cards.push({ type: 'small', copyIndex: 2 })
  cards.push({ type: 'big', copyIndex: 1 })
  cards.push({ type: 'big', copyIndex: 2 })
  return cards
}

export function createCardPool(trumpRank: TrumpRank): CardPool {
  const allCards = createFullDeck()
  const allCardStates: CardState[] = allCards.map(card => {
    const trump = !isJoker(card) && card.rank === trumpRank
    const redTrump = trump && card.suit === 'heart'
    if (!isJoker(card)) {
      card.isTrump = trump
      card.isRedTrump = redTrump
    }
    return {
      card,
      id: cardId(card),
      status: 'in_opponent_hand' as CardStatus,
      playHistory: [],
      tributeHistory: [],
      ownershipInferences: [],
      isTrump: trump,
      isRedTrump: redTrump,
    }
  })

  const players: CardPool['players'] = {
    0: { seat: 0, handCount: 0, playedCards: [], passedRounds: [], inferences: [] },
    1: { seat: 1, handCount: 0, playedCards: [], passedRounds: [], inferences: [] },
    2: { seat: 2, handCount: 0, playedCards: [], passedRounds: [], inferences: [] },
    3: { seat: 3, handCount: 0, playedCards: [], passedRounds: [], inferences: [] },
  }

  return { total: 108, trumpRank, allCardStates, players }
}

export function setMyHand(pool: CardPool, cards: AnyCard[]): void {
  const ids = new Set(cards.map(c => cardId(c)))
  for (const state of pool.allCardStates) {
    if (ids.has(state.id)) {
      state.status = 'in_my_hand'
      state.currentHolder = 0
    }
  }
  pool.players[0].handCount = cards.length
}

export function setOtherPlayersHandCount(pool: CardPool, seats: SeatConfig): void {
  const myCount = pool.players[0].handCount
  const remaining = pool.total - myCount
  const perPlayer = Math.floor(remaining / 3)
  const leftover = remaining - perPlayer * 3

  pool.players[seats.opponentA].handCount = perPlayer + (leftover > 0 ? 1 : 0)
  pool.players[seats.opponentB].handCount = perPlayer + (leftover > 1 ? 1 : 0)
  pool.players[seats.teammate].handCount = perPlayer
}

export function playCards(
  pool: CardPool,
  player: number,
  cards: AnyCard[],
  roundNumber: number,
): void {
  const ids = new Set(cards.map(c => cardId(c)))
  for (const state of pool.allCardStates) {
    if (ids.has(state.id)) {
      state.status = 'in_play'
      state.currentHolder = undefined
      state.playHistory.push({
        playedBy: player,
        playedAtRound: roundNumber,
        playedInCombo: { type: 'single', cards, isTrump: false, wildcards: [] },
        timestamp: Date.now(),
      })
    }
  }
  pool.players[player].handCount -= cards.length
}

export function passPlay(pool: CardPool, player: number): void {
}

export function getMyHand(pool: CardPool): CardState[] {
  return pool.allCardStates.filter(s => s.status === 'in_my_hand')
}

export function getPlayedCards(pool: CardPool): CardState[] {
  return pool.allCardStates.filter(s => s.status === 'in_play' || s.status === 'archived')
}

export function getRemainingCards(pool: CardPool): CardState[] {
  return pool.allCardStates.filter(s => s.status !== 'archived')
}

export function getTrumpCards(pool: CardPool): CardState[] {
  return pool.allCardStates.filter(s => s.isTrump)
}

export function verifyCardCount(pool: CardPool): { valid: boolean; detail: string } {
  let inHand = 0
  let played = 0
  let unknown = 0
  for (const state of pool.allCardStates) {
    switch (state.status) {
      case 'in_my_hand':
      case 'in_opponent_hand':
      case 'in_teammate_hand':
        inHand++
        break
      case 'in_play':
      case 'archived':
        played++
        break
      default:
        unknown++
    }
  }
  const total = inHand + played + unknown
  if (total !== 108) {
    return { valid: false, detail: `牌数异常: 手牌${inHand} + 已出${played} + 其他${unknown} = ${total} ≠ 108` }
  }
  let handSum = 0
  for (const p of Object.values(pool.players)) {
    handSum += p.handCount
  }
  if (handSum + played !== 108) {
    return { valid: false, detail: `手牌总数${handSum} + 已出${played} = ${handSum + played} ≠ 108` }
  }
  return { valid: true, detail: '牌数校验通过' }
}

export function getCardsByRank(pool: CardPool, rank: Rank): CardState[] {
  return pool.allCardStates.filter(s => !isJoker(s.card) && s.card.rank === rank)
}

export function getAvailableCountByRank(pool: CardPool, rank: Rank): number {
  return getCardsByRank(pool, rank).filter(s =>
    s.status !== 'in_play' && s.status !== 'archived'
  ).length
}

export function getAvailableSuitsByRank(pool: CardPool, rank: Rank): Suit[] {
  return getCardsByRank(pool, rank)
    .filter(s => s.status !== 'in_play' && s.status !== 'archived' && !isJoker(s.card))
    .map(s => (s.card as Card).suit)
}
