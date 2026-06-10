import { describe, it, expect } from 'vitest'
import {
  type AnyCard, type Card, type DetectionResult,
  isJoker,
} from '@guandan/shared'
import { detectCombination } from './combinationDetector'

describe('combinationDetector', () => {
  describe('single', () => {
    it('should detect single card', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)

      expect(result.combinations).toHaveLength(1)
      expect(result.preferred.type).toBe('single')
    })

    it('should detect single joker', () => {
      const cards: AnyCard[] = [{ type: 'small', copyIndex: 1 }]

      const result = detectCombination(cards)

      expect(result.combinations).toHaveLength(1)
      expect(result.preferred.type).toBe('single')
    })

    it('should reject empty cards', () => {
      const result = detectCombination([])

      expect(result.combinations).toHaveLength(0)
    })
  })

  describe('pair', () => {
    it('should detect pair of same rank', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)

      expect(result.combinations).toHaveLength(1)
      expect(result.preferred.type).toBe('pair')
      expect(result.preferred.mainRank).toBe('3')
    })

    it('should reject pair with joker', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { type: 'small', copyIndex: 1 },
      ]

      const result = detectCombination(cards)

      expect(result.combinations.some(c => c.type === 'pair')).toBe(false)
    })
  })

  describe('triple', () => {
    it('should detect triple of same rank', () => {
      // 纯三张（三条）应当被正常识别，且点数作为 mainRank
      const cards: AnyCard[] = [
        { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)

      expect(result.combinations.some(c => c.type === 'triple')).toBe(true)
      const triple = result.combinations.find(c => c.type === 'triple')
      expect(triple?.mainRank).toBe('5')
    })
  })

  describe('triple_with_pair', () => {
    it('should detect triple with pair', () => {
      const cards: AnyCard[] = [
        { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)

      expect(result.combinations.some(c => c.type === 'triple_with_pair')).toBe(true)
      const tripleWithPair = result.combinations.find(c => c.type === 'triple_with_pair')
      expect(tripleWithPair?.mainRank).toBe('5')
    })
  })

  describe('airplane', () => {
    it('should detect airplane (two consecutive triples)', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)

      expect(result.combinations.some(c => c.type === 'airplane')).toBe(true)
    })
  })

  describe('straight', () => {
    it('should detect straight of 5 cards', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '6', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '7', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)

      expect(result.combinations.some(c => c.type === 'straight')).toBe(true)
    })

    it('should detect longer straight', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '6', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '7', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '8', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '9', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)

      expect(result.combinations.some(c => c.type === 'straight')).toBe(true)
    })

    it('should reject straight with 2', () => {
      const cards: AnyCard[] = [
        { rank: 'A', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '2', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)

      expect(result.combinations.some(c => c.type === 'straight')).toBe(false)
    })
  })

  describe('pair_straight', () => {
    it('should detect pair straight', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)

      expect(result.combinations.some(c => c.type === 'pair_straight')).toBe(true)
    })

    it('should reject pair straight with odd number of cards', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)

      expect(result.combinations.some(c => c.type === 'pair_straight')).toBe(false)
    })
  })

  describe('bomb', () => {
    it('should detect 4-card bomb', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)

      expect(result.combinations.some(c => c.type === 'bomb')).toBe(true)
    })

    it('should detect longer bomb', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'spade', copyIndex: 2, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'heart', copyIndex: 2, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)

      expect(result.combinations.some(c => c.type === 'bomb' && c.cards.length === 6)).toBe(true)
    })

    it('should reject non-matching cards as bomb', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)

      expect(result.combinations.some(c => c.type === 'bomb')).toBe(false)
    })
  })

  describe('same_suit_straight', () => {
    it('should detect same suit straight', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '6', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '7', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)

      expect(result.combinations.some(c => c.type === 'same_suit_straight')).toBe(true)
    })

    it('should reject mixed suit straight', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '6', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '7', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)

      expect(result.combinations.some(c => c.type === 'same_suit_straight')).toBe(false)
    })

    it('should reject short same suit straight', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '6', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)

      expect(result.combinations.some(c => c.type === 'same_suit_straight')).toBe(false)
    })
  })

  describe('joker_bomb', () => {
    it('should detect joker bomb', () => {
      const cards: AnyCard[] = [
        { type: 'small', copyIndex: 1 },
        { type: 'small', copyIndex: 2 },
        { type: 'big', copyIndex: 1 },
        { type: 'big', copyIndex: 2 },
      ]

      const result = detectCombination(cards)

      expect(result.combinations.some(c => c.type === 'joker_bomb')).toBe(true)
    })

    it('should reject incomplete joker bomb', () => {
      const cards: AnyCard[] = [
        { type: 'small', copyIndex: 1 },
        { type: 'small', copyIndex: 2 },
        { type: 'big', copyIndex: 1 },
      ]

      const result = detectCombination(cards)

      expect(result.combinations.some(c => c.type === 'joker_bomb')).toBe(false)
    })
  })

  describe('wildcard (red trump)', () => {
    it('should detect straight with wildcard substitution', () => {
      const cards: AnyCard[] = [
        { rank: '7', suit: 'heart', copyIndex: 1, isTrump: true, isRedTrump: true },
        { rank: '8', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '9', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '10', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: 'J', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)

      expect(result.combinations.length).toBeGreaterThan(1)
    })
  })

  describe('priority selection', () => {
    it('should prefer joker bomb over regular bomb', () => {
      const cards: AnyCard[] = [
        { type: 'small', copyIndex: 1 },
        { type: 'small', copyIndex: 2 },
        { type: 'big', copyIndex: 1 },
        { type: 'big', copyIndex: 2 },
      ]

      const result = detectCombination(cards)

      expect(result.preferred.type).toBe('joker_bomb')
    })

    it('should prefer bomb over straight', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '3', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)

      expect(result.preferred.type).toBe('bomb')
    })
  })

  describe('edge cases', () => {
    it('should handle single valid combinations', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '8', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)

      expect(result.combinations.length).toBe(0)
    })
  })
})