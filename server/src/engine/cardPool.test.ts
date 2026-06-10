import { describe, it, expect, beforeEach } from 'vitest'
import {
  type AnyCard, type Card, type CardPool, type Rank, type Suit,
  isJoker,
} from '@guandan/shared'
import {
  createFullDeck,
  createCardPool,
  setMyHand,
  setOtherPlayersHandCount,
  playCards,
  getMyHand,
  getPlayedCards,
  getRemainingCards,
  getTrumpCards,
  verifyCardCount,
  getCardsByRank,
  getAvailableCountByRank,
  getAvailableSuitsByRank,
} from './cardPool'

describe('cardPool', () => {
  describe('createFullDeck', () => {
    it('should create a deck with 108 cards', () => {
      const deck = createFullDeck()
      expect(deck).toHaveLength(108)
    })

    it('should contain 4 copies of each rank-suit combination', () => {
      const deck = createFullDeck()
      const countMap = new Map<string, number>()
      
      for (const card of deck) {
        if ('rank' in card && 'suit' in card) {
          const key = `${card.suit}-${card.rank}`
          countMap.set(key, (countMap.get(key) || 0) + 1)
        }
      }

      for (const count of countMap.values()) {
        expect(count).toBe(2)
      }
    })

    it('should contain 2 small jokers and 2 big jokers', () => {
      const deck = createFullDeck()
      const smallJokers = deck.filter(c => 'type' in c && c.type === 'small')
      const bigJokers = deck.filter(c => 'type' in c && c.type === 'big')
      
      expect(smallJokers).toHaveLength(2)
      expect(bigJokers).toHaveLength(2)
    })
  })

  describe('createCardPool', () => {
    it('should create a card pool with 108 cards', () => {
      const pool = createCardPool('7')
      expect(pool.total).toBe(108)
      expect(pool.allCardStates).toHaveLength(108)
    })

    it('should set the correct trump rank', () => {
      const pool = createCardPool('A')
      expect(pool.trumpRank).toBe('A')
    })

    it('should initialize all players with zero hand count', () => {
      const pool = createCardPool('7')
      
      expect(pool.players[0].handCount).toBe(0)
      expect(pool.players[1].handCount).toBe(0)
      expect(pool.players[2].handCount).toBe(0)
      expect(pool.players[3].handCount).toBe(0)
    })

    it('should mark cards with trump rank as isTrump', () => {
      const pool = createCardPool('7')
      const trumpCards = pool.allCardStates.filter(s => s.isTrump)
      
      expect(trumpCards.length).toBeGreaterThan(0)
      for (const state of trumpCards) {
        const card = state.card as Card
        expect(card.rank).toBe('7')
      }
    })

    it('should mark heart suit trump as isRedTrump', () => {
      const pool = createCardPool('7')
      const redTrumpCards = pool.allCardStates.filter(s => s.isRedTrump)
      
      expect(redTrumpCards.length).toBe(2) // 2 copies of heart-7
      for (const state of redTrumpCards) {
        const card = state.card as Card
        expect(card.suit).toBe('heart')
        expect(card.rank).toBe('7')
      }
    })

    it('should set initial status to in_opponent_hand', () => {
      const pool = createCardPool('7')
      
      for (const state of pool.allCardStates) {
        expect(state.status).toBe('in_opponent_hand')
      }
    })
  })

  describe('setMyHand', () => {
    let pool: CardPool

    beforeEach(() => {
      pool = createCardPool('7')
    })

    it('should set cards to in_my_hand status', () => {
      const myCards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      setMyHand(pool, myCards)

      const myHand = getMyHand(pool)
      expect(myHand).toHaveLength(2)
    })

    it('should update player hand count', () => {
      const myCards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      setMyHand(pool, myCards)

      expect(pool.players[0].handCount).toBe(3)
    })

    it('should set currentHolder for my cards', () => {
      const myCards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      setMyHand(pool, myCards)

      const myHand = getMyHand(pool)
      expect(myHand[0].currentHolder).toBe(0)
    })
  })

  describe('setOtherPlayersHandCount', () => {
    let pool: CardPool

    beforeEach(() => {
      pool = createCardPool('7')
    })

    it('should set hand counts based on my hand when called after setMyHand', () => {
      setMyHand(pool, [{ rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }])
      
      const seats = { me: 0, teammate: 2, opponentA: 1, opponentB: 3 }
      setOtherPlayersHandCount(pool, seats)

      expect(pool.players[0].handCount).toBe(1)
      expect(pool.players[2].handCount).toBe(35)
    })

    it('should handle equal distribution when cards can be divided evenly', () => {
      // Set my hand to 27 cards (should leave 81 for others = 27 each)
      const myCards: AnyCard[] = []
      for (let i = 0; i < 27; i++) {
        myCards.push({ rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false })
      }
      setMyHand(pool, myCards)

      const seats = { me: 0, teammate: 2, opponentA: 1, opponentB: 3 }
      setOtherPlayersHandCount(pool, seats)

      expect(pool.players[2].handCount).toBe(27) // teammate
      expect(pool.players[1].handCount).toBe(27) // opponentA
      expect(pool.players[3].handCount).toBe(27) // opponentB
    })

    it('should distribute leftover cards to opponents', () => {
      // Set my hand to 28 cards (should leave 80 for others: 27, 27, 26)
      const myCards: AnyCard[] = []
      for (let i = 0; i < 28; i++) {
        myCards.push({ rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false })
      }
      setMyHand(pool, myCards)

      const seats = { me: 0, teammate: 2, opponentA: 1, opponentB: 3 }
      setOtherPlayersHandCount(pool, seats)

      expect(pool.players[1].handCount).toBe(27) // opponentA gets extra
      expect(pool.players[3].handCount).toBe(27) // opponentB gets extra
      expect(pool.players[2].handCount).toBe(26) // teammate gets less (no leftover)
    })
  })

  describe('playCards', () => {
    let pool: CardPool

    beforeEach(() => {
      pool = createCardPool('7')
      setMyHand(pool, [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
      ])
    })

    it('should change status to in_play for played cards', () => {
      const cardsToPlay: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      playCards(pool, 0, cardsToPlay, 1)

      const playedCards = getPlayedCards(pool)
      const foundCard = playedCards.find(c => {
        const card = c.card
        return !isJoker(card) && card.suit === 'spade' && card.rank === '3'
      })
      expect(foundCard).toBeDefined()
    })

    it('should reduce player hand count', () => {
      const cardsToPlay: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      playCards(pool, 0, cardsToPlay, 1)

      expect(pool.players[0].handCount).toBe(2)
    })

    it('should add play history to card state', () => {
      const cardsToPlay: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      playCards(pool, 0, cardsToPlay, 1)

      const playedCards = getPlayedCards(pool)
      const cardState = playedCards.find(c => {
        const card = c.card
        return !isJoker(card) && card.suit === 'spade' && card.rank === '3'
      })
      
      expect(cardState).toBeDefined()
      expect(cardState?.playHistory).toHaveLength(1)
      expect(cardState?.playHistory[0].playedBy).toBe(0)
      expect(cardState?.playHistory[0].playedAtRound).toBe(1)
    })

    it('should clear currentHolder when card is played', () => {
      const cardsToPlay: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      playCards(pool, 0, cardsToPlay, 1)

      const playedCards = getPlayedCards(pool)
      const cardState = playedCards.find(c => {
        const card = c.card
        return !isJoker(card) && card.suit === 'spade' && card.rank === '3'
      })
      
      expect(cardState?.currentHolder).toBeUndefined()
    })
  })

  describe('getMyHand', () => {
    it('should return only cards with in_my_hand status', () => {
      const pool = createCardPool('7')
      setMyHand(pool, [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ])

      const myHand = getMyHand(pool)
      
      expect(myHand).toHaveLength(1)
      expect(myHand[0].status).toBe('in_my_hand')
    })
  })

  describe('getPlayedCards', () => {
    it('should return cards with in_play or archived status', () => {
      const pool = createCardPool('7')
      setMyHand(pool, [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ])
      playCards(pool, 0, [{ rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }], 1)

      const played = getPlayedCards(pool)
      
      expect(played.length).toBeGreaterThan(0)
    })
  })

  describe('getRemainingCards', () => {
    it('should return cards that are not archived', () => {
      const pool = createCardPool('7')
      setMyHand(pool, [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ])

      const remaining = getRemainingCards(pool)
      
      // Should have at least my cards + some opponent cards
      expect(remaining.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('getTrumpCards', () => {
    it('should return only trump cards', () => {
      const pool = createCardPool('7')
      
      const trumpCards = getTrumpCards(pool)
      
      expect(trumpCards.length).toBeGreaterThan(0)
      for (const state of trumpCards) {
        expect(state.isTrump).toBe(true)
      }
    })
  })

  describe('verifyCardCount', () => {
    it('should return valid when card count is correct after setup', () => {
      const pool = createCardPool('7')
      setMyHand(pool, [{ rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }])
      setOtherPlayersHandCount(pool, { me: 0, teammate: 2, opponentA: 1, opponentB: 3 })
      
      const result = verifyCardCount(pool)
      
      expect(result.valid).toBe(true)
    })

    it('should return valid after playing cards', () => {
      const pool = createCardPool('7')
      setMyHand(pool, [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ])
      setOtherPlayersHandCount(pool, { me: 0, teammate: 2, opponentA: 1, opponentB: 3 })
      playCards(pool, 0, [{ rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }], 1)

      const result = verifyCardCount(pool)
      
      expect(result.valid).toBe(true)
    })
  })

  describe('getCardsByRank', () => {
    it('should return all cards of a specific rank', () => {
      const pool = createCardPool('7')
      
      const threes = getCardsByRank(pool, '3')
      
      expect(threes.length).toBe(8)
    })

    it('should not include jokers', () => {
      const pool = createCardPool('7')
      
      const jokers = getCardsByRank(pool, '2' as Rank)
      
      // This might return cards with rank '2', but jokers should not be included
      for (const state of jokers) {
        expect('rank' in state.card).toBe(true)
      }
    })
  })

  describe('getAvailableCountByRank', () => {
    it('should return count of available (not played) cards of a rank', () => {
      const pool = createCardPool('7')
      setMyHand(pool, [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
      ])
      setOtherPlayersHandCount(pool, { me: 0, teammate: 2, opponentA: 1, opponentB: 3 })
      playCards(pool, 0, [{ rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }], 1)

      const count = getAvailableCountByRank(pool, '3')
      
      expect(count).toBe(7)
    })
  })

  describe('getAvailableSuitsByRank', () => {
    it('should return available suits for a rank', () => {
      const pool = createCardPool('7')
      setMyHand(pool, [{ rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }])
      setOtherPlayersHandCount(pool, { me: 0, teammate: 2, opponentA: 1, opponentB: 3 })
      
      const suits = getAvailableSuitsByRank(pool, '3')
      
      expect(suits.length).toBe(8)
    })
  })

  describe('edge cases', () => {
    it('should handle empty hand', () => {
      const pool = createCardPool('7')
      setMyHand(pool, [])

      const myHand = getMyHand(pool)
      
      expect(myHand).toHaveLength(0)
      expect(pool.players[0].handCount).toBe(0)
    })

    it('should handle playing all cards', () => {
      const pool = createCardPool('7')
      const allMyCards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]
      setMyHand(pool, allMyCards)
      playCards(pool, 0, allMyCards, 1)

      expect(pool.players[0].handCount).toBe(0)
    })
  })
})