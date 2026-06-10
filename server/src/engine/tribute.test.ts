import { describe, it, expect } from 'vitest'
import {
  type AnyCard, type Rank, type TrumpRank,
} from '@guandan/shared'
import {
  determineTributeType,
  isAntiTribute,
  validateTributeCard,
  validateReturnCard,
  selectBestTributeCard,
  selectBestReturnCard,
} from './tribute'

describe('tribute', () => {
  describe('determineTributeType', () => {
    it('should return single when rank difference is less than 2', () => {
      const result = determineTributeType(5, 6)
      expect(result).toBe('single')
    })

    it('should return double when rank difference is 2 or more', () => {
      const result = determineTributeType(5, 7)
      expect(result).toBe('double')
    })

    it('should return double for large differences', () => {
      const result = determineTributeType(5, 8)
      expect(result).toBe('double')
    })

    it('should handle negative differences (winner has lower rank)', () => {
      const result = determineTributeType(8, 5)
      expect(result).toBe('single')
    })
  })

  describe('isAntiTribute', () => {
    const trumpRank: TrumpRank = '7'

    it('should return true when player has 2 big jokers', () => {
      // 拥有两张大王时应当抗贡
      const cards: AnyCard[] = [
        { type: 'big', copyIndex: 1 },
        { type: 'big', copyIndex: 2 },
      ]

      const result = isAntiTribute(cards, trumpRank)

      expect(result).toBe(true)
    })

    it('should return false when player has 1 big joker and 1 small joker', () => {
      // 一张大王和一张小王不满足抗贡条件
      const cards: AnyCard[] = [
        { type: 'small', copyIndex: 1 },
        { type: 'big', copyIndex: 1 },
      ]

      const result = isAntiTribute(cards, trumpRank)

      expect(result).toBe(false)
    })

    it('should return false when player has 2 small jokers', () => {
      // 两张小王不满足抗贡条件
      const cards: AnyCard[] = [
        { type: 'small', copyIndex: 1 },
        { type: 'small', copyIndex: 2 },
      ]

      const result = isAntiTribute(cards, trumpRank)

      expect(result).toBe(false)
    })

    it('should return false when player has 2 trump cards', () => {
      // 两张主牌不满足抗贡条件
      const cards: AnyCard[] = [
        { rank: '7', suit: 'spade', copyIndex: 1, isTrump: true, isRedTrump: false },
        { rank: '7', suit: 'heart', copyIndex: 1, isTrump: true, isRedTrump: true },
      ]

      const result = isAntiTribute(cards, trumpRank)

      expect(result).toBe(false)
    })

    it('should return false when player has 1 big joker', () => {
      const cards: AnyCard[] = [
        { type: 'big', copyIndex: 1 },
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = isAntiTribute(cards, trumpRank)

      expect(result).toBe(false)
    })

    it('should return false when player has 1 trump card', () => {
      const cards: AnyCard[] = [
        { rank: '7', suit: 'spade', copyIndex: 1, isTrump: true, isRedTrump: false },
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = isAntiTribute(cards, trumpRank)

      expect(result).toBe(false)
    })

    it('should return false when player has no jokers or trump', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = isAntiTribute(cards, trumpRank)

      expect(result).toBe(false)
    })

    it('should return false for empty hand', () => {
      const cards: AnyCard[] = []

      const result = isAntiTribute(cards, trumpRank)

      expect(result).toBe(false)
    })
  })

  describe('validateTributeCard', () => {
    const trumpRank: TrumpRank = '7'
    const handCards: AnyCard[] = [
      { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      { rank: '5', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
      { rank: '8', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
    ]

    it('should accept valid tribute card', () => {
      const card: AnyCard = { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }

      const result = validateTributeCard(card, handCards, 'single', trumpRank)

      expect(result.valid).toBe(true)
    })

    it('should reject joker as tribute', () => {
      const card: AnyCard = { type: 'small', copyIndex: 1 }

      const result = validateTributeCard(card, handCards, 'single', trumpRank)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('王牌')
    })

    it('should reject trump card as tribute', () => {
      const card: AnyCard = { rank: '7', suit: 'spade', copyIndex: 1, isTrump: true, isRedTrump: false }

      const result = validateTributeCard(card, handCards, 'single', trumpRank)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('主牌')
    })

    it('should reject card not in hand', () => {
      const card: AnyCard = { rank: 'A', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }

      const result = validateTributeCard(card, handCards, 'single', trumpRank)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('手牌中没有')
    })

    it('should reject red trump even if not exact trump rank', () => {
      const handWithRedTrump: AnyCard[] = [
        { rank: '7', suit: 'heart', copyIndex: 1, isTrump: true, isRedTrump: true },
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]
      const card: AnyCard = { rank: '7', suit: 'heart', copyIndex: 1, isTrump: true, isRedTrump: true }

      const result = validateTributeCard(card, handWithRedTrump, 'single', '7')

      expect(result.valid).toBe(false)
    })
  })

  describe('validateReturnCard', () => {
    const trumpRank: TrumpRank = '7'
    const tributeRank: Rank = '3'
    const handCards: AnyCard[] = [
      { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      { rank: '5', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
      { rank: '8', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
    ]

    it('should accept valid return card', () => {
      const card: AnyCard = { rank: '5', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false }

      const result = validateReturnCard(card, handCards, trumpRank, tributeRank)

      expect(result.valid).toBe(true)
    })

    it('should reject joker as return card', () => {
      const card: AnyCard = { type: 'small', copyIndex: 1 }

      const result = validateReturnCard(card, handCards, trumpRank, tributeRank)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('王牌')
    })

    it('should reject card not in hand', () => {
      const card: AnyCard = { rank: 'A', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }

      const result = validateReturnCard(card, handCards, trumpRank, tributeRank)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('手牌中没有')
    })

    it('should allow returning trump cards', () => {
      const handWithTrump: AnyCard[] = [
        { rank: '7', suit: 'spade', copyIndex: 1, isTrump: true, isRedTrump: false },
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]
      const card: AnyCard = { rank: '7', suit: 'spade', copyIndex: 1, isTrump: true, isRedTrump: false }

      const result = validateReturnCard(card, handWithTrump, trumpRank, tributeRank)

      expect(result.valid).toBe(true)
    })
  })

  describe('selectBestTributeCard', () => {
    const trumpRank: TrumpRank = '7'

    it('should return highest rank non-trump card', () => {
      const handCards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: 'A', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = selectBestTributeCard(handCards, trumpRank)

      expect(result).not.toBeNull()
      expect((result as { rank: Rank }).rank).toBe('A')
    })

    it('should not select trump cards', () => {
      const handCards: AnyCard[] = [
        { rank: '7', suit: 'spade', copyIndex: 1, isTrump: true, isRedTrump: false },
        { rank: '7', suit: 'heart', copyIndex: 1, isTrump: true, isRedTrump: true },
        { rank: '3', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = selectBestTributeCard(handCards, trumpRank)

      expect(result).not.toBeNull()
      expect((result as { rank: Rank }).rank).toBe('3')
    })

    it('should not select jokers', () => {
      const handCards: AnyCard[] = [
        { type: 'small', copyIndex: 1 },
        { type: 'big', copyIndex: 1 },
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = selectBestTributeCard(handCards, trumpRank)

      expect(result).not.toBeNull()
      expect(result && 'rank' in result).toBe(true)
    })

    it('should return null when no valid cards', () => {
      const handCards: AnyCard[] = [
        { type: 'small', copyIndex: 1 },
      ]

      const result = selectBestTributeCard(handCards, trumpRank)

      expect(result).toBeNull()
    })

    it('should return null for empty hand', () => {
      const handCards: AnyCard[] = []

      const result = selectBestTributeCard(handCards, trumpRank)

      expect(result).toBeNull()
    })

    it('should handle multiple trump cards and select highest non-trump', () => {
      const handCards: AnyCard[] = [
        { rank: '7', suit: 'spade', copyIndex: 1, isTrump: true, isRedTrump: false },
        { rank: '7', suit: 'heart', copyIndex: 1, isTrump: true, isRedTrump: true },
        { rank: 'K', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: 'Q', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = selectBestTributeCard(handCards, trumpRank)

      expect(result).not.toBeNull()
      expect((result as { rank: Rank }).rank).toBe('K')
    })
  })

  describe('selectBestReturnCard', () => {
    const trumpRank: TrumpRank = '7'
    const tributeRank: Rank = '3'

    it('should return lowest rank card', () => {
      const handCards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = selectBestReturnCard(handCards, trumpRank, tributeRank)

      expect(result).not.toBeNull()
    })

    it('should prioritize returning low cards', () => {
      const handCards: AnyCard[] = [
        { rank: 'A', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: 'K', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = selectBestReturnCard(handCards, trumpRank, tributeRank)

      expect(result).not.toBeNull()
    })

    it('should allow returning trump cards', () => {
      const handCards: AnyCard[] = [
        { rank: '7', suit: 'spade', copyIndex: 1, isTrump: true, isRedTrump: false },
        { rank: '3', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = selectBestReturnCard(handCards, trumpRank, tributeRank)

      expect(result).not.toBeNull()
    })

    it('should not select jokers', () => {
      const handCards: AnyCard[] = [
        { type: 'small', copyIndex: 1 },
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = selectBestReturnCard(handCards, trumpRank, tributeRank)

      expect(result).not.toBeNull()
      expect(result && 'rank' in result).toBe(true)
    })

    it('should return null for empty hand', () => {
      const handCards: AnyCard[] = []

      const result = selectBestReturnCard(handCards, trumpRank, tributeRank)

      expect(result).toBeNull()
    })

    it('should return only joker when no other cards', () => {
      const handCards: AnyCard[] = [
        { type: 'small', copyIndex: 1 },
      ]

      const result = selectBestReturnCard(handCards, trumpRank, tributeRank)

      expect(result).toBeNull()
    })

    it('should prefer non-trump over trump when returning', () => {
      const handCards: AnyCard[] = [
        { rank: '7', suit: 'spade', copyIndex: 1, isTrump: true, isRedTrump: false },
        { rank: '4', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = selectBestReturnCard(handCards, trumpRank, tributeRank)

      expect(result).not.toBeNull()
      expect((result as { rank: Rank }).rank).toBe('4')
    })
  })

  describe('edge cases', () => {
    it('should handle double tribute validation', () => {
      const trumpRank: TrumpRank = '7'
      const handCards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]
      const card: AnyCard = { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }

      const result = validateTributeCard(card, handCards, 'double', trumpRank)

      expect(result.valid).toBe(true)
    })
  })
})