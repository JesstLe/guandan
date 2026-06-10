import { describe, it, expect } from 'vitest'
import {
  type AnyCard, type CardCombination, type CompareResult,
} from '@guandan/shared'
import { compareCombinations, canBeat } from './combinationCompare'

describe('combinationCompare', () => {
  describe('compareCombinations', () => {
    describe('single vs single', () => {
      it('should compare single cards by rank', () => {
        const a: CardCombination = {
          type: 'single',
          cards: [{ rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }],
          mainRank: '5',
          isTrump: false,
          wildcards: [],
        }
        const b: CardCombination = {
          type: 'single',
          cards: [{ rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }],
          mainRank: '3',
          isTrump: false,
          wildcards: [],
        }

        const result = compareCombinations(a, b)

        expect(result).toBe('greater')
      })

      it('should return equal for same cards', () => {
        const a: CardCombination = {
          type: 'single',
          cards: [{ rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }],
          mainRank: '5',
          isTrump: false,
          wildcards: [],
        }
        const b: CardCombination = {
          type: 'single',
          cards: [{ rank: '5', suit: 'spade', copyIndex: 2, isTrump: false, isRedTrump: false }],
          mainRank: '5',
          isTrump: false,
          wildcards: [],
        }

        const result = compareCombinations(a, b)

        expect(result).toBe('equal')
      })

      it('should prioritize trump over non-trump', () => {
        const a: CardCombination = {
          type: 'single',
          cards: [{ rank: '5', suit: 'spade', copyIndex: 1, isTrump: true, isRedTrump: false }],
          mainRank: '5',
          isTrump: true,
          wildcards: [],
        }
        const b: CardCombination = {
          type: 'single',
          cards: [{ rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }],
          mainRank: '5',
          isTrump: false,
          wildcards: [],
        }

        const result = compareCombinations(a, b)

        expect(result).toBe('greater')
      })

      it('should prioritize red trump over regular trump', () => {
        const a: CardCombination = {
          type: 'single',
          cards: [{ rank: '5', suit: 'heart', copyIndex: 1, isTrump: true, isRedTrump: true }],
          mainRank: '5',
          isTrump: true,
          wildcards: [],
        }
        const b: CardCombination = {
          type: 'single',
          cards: [{ rank: '5', suit: 'spade', copyIndex: 1, isTrump: true, isRedTrump: false }],
          mainRank: '5',
          isTrump: true,
          wildcards: [],
        }

        const result = compareCombinations(a, b)

        expect(result).toBe('greater')
      })
    })

    describe('pair vs pair', () => {
      it('should compare pairs by main rank', () => {
        const a: CardCombination = {
          type: 'pair',
          cards: [
            { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '5', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
          ],
          mainRank: '5',
          isTrump: false,
          wildcards: [],
        }
        const b: CardCombination = {
          type: 'pair',
          cards: [
            { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
          ],
          mainRank: '3',
          isTrump: false,
          wildcards: [],
        }

        const result = compareCombinations(a, b)

        expect(result).toBe('greater')
      })
    })

    describe('straight vs straight', () => {
      it('should compare straights by main rank', () => {
        const a: CardCombination = {
          type: 'straight',
          cards: [
            { rank: '7', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '8', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '9', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '10', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'J', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
          ],
          mainRank: 'J',
          isTrump: false,
          length: 5,
          wildcards: [],
        }
        const b: CardCombination = {
          type: 'straight',
          cards: [
            { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '4', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '6', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '7', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
          ],
          mainRank: '7',
          isTrump: false,
          length: 5,
          wildcards: [],
        }

        const result = compareCombinations(a, b)

        expect(result).toBe('greater')
      })

      it('should return incomparable for different lengths', () => {
        const a: CardCombination = {
          type: 'straight',
          cards: [
            { rank: '7', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '8', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '9', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '10', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'J', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
          ],
          mainRank: 'J',
          isTrump: false,
          length: 5,
          wildcards: [],
        }
        const b: CardCombination = {
          type: 'straight',
          cards: [
            { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '4', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '6', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '7', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '8', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
          ],
          mainRank: '8',
          isTrump: false,
          length: 6,
          wildcards: [],
        }

        const result = compareCombinations(a, b)

        expect(result).toBe('incomparable')
      })
    })

    describe('bomb vs bomb', () => {
      it('should compare bombs by length first', () => {
        const a: CardCombination = {
          type: 'bomb',
          cards: [
            { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'spade', copyIndex: 2, isTrump: false, isRedTrump: false },
          ],
          mainRank: '3',
          isTrump: false,
          length: 5,
          wildcards: [],
        }
        const b: CardCombination = {
          type: 'bomb',
          cards: [
            { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '5', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '5', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '5', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
          ],
          mainRank: '5',
          isTrump: false,
          length: 4,
          wildcards: [],
        }

        const result = compareCombinations(a, b)

        expect(result).toBe('greater')
      })

      it('should compare bombs of same length by rank', () => {
        const a: CardCombination = {
          type: 'bomb',
          cards: [
            { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '5', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '5', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '5', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
          ],
          mainRank: '5',
          isTrump: false,
          length: 4,
          wildcards: [],
        }
        const b: CardCombination = {
          type: 'bomb',
          cards: [
            { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
          ],
          mainRank: '3',
          isTrump: false,
          length: 4,
          wildcards: [],
        }

        const result = compareCombinations(a, b)

        expect(result).toBe('greater')
      })
    })

    describe('joker bomb', () => {
      it('should equal all other joker bombs', () => {
        const a: CardCombination = {
          type: 'joker_bomb',
          cards: [
            { type: 'small', copyIndex: 1 },
            { type: 'small', copyIndex: 2 },
            { type: 'big', copyIndex: 1 },
            { type: 'big', copyIndex: 2 },
          ],
          isTrump: true,
          wildcards: [],
        }
        const b: CardCombination = {
          type: 'joker_bomb',
          cards: [
            { type: 'small', copyIndex: 1 },
            { type: 'small', copyIndex: 2 },
            { type: 'big', copyIndex: 1 },
            { type: 'big', copyIndex: 2 },
          ],
          isTrump: true,
          wildcards: [],
        }

        const result = compareCombinations(a, b)

        expect(result).toBe('equal')
      })
    })

    describe('bomb vs non-bomb', () => {
      it('should always make bomb greater than non-bomb', () => {
        const bomb: CardCombination = {
          type: 'bomb',
          cards: [
            { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
          ],
          mainRank: '3',
          isTrump: false,
          length: 4,
          wildcards: [],
        }
        const straight: CardCombination = {
          type: 'straight',
          cards: [
            { rank: 'A', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'K', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'Q', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'J', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '10', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
          ],
          mainRank: 'A',
          isTrump: false,
          length: 5,
          wildcards: [],
        }

        const result = compareCombinations(bomb, straight)

        expect(result).toBe('greater')
      })

      it('should make non-bomb lesser than bomb', () => {
        const straight: CardCombination = {
          type: 'straight',
          cards: [
            { rank: 'A', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'K', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'Q', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'J', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '10', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
          ],
          mainRank: 'A',
          isTrump: false,
          length: 5,
          wildcards: [],
        }
        const bomb: CardCombination = {
          type: 'bomb',
          cards: [
            { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
          ],
          mainRank: '3',
          isTrump: false,
          length: 4,
          wildcards: [],
        }

        const result = compareCombinations(straight, bomb)

        expect(result).toBe('lesser')
      })
    })

    describe('same_suit_straight', () => {
      it('should be treated as bomb type', () => {
        const ss: CardCombination = {
          type: 'same_suit_straight',
          cards: [
            { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '4', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '6', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '7', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
          ],
          mainRank: '7',
          isTrump: false,
          length: 5,
          wildcards: [],
        }
        const straight: CardCombination = {
          type: 'straight',
          cards: [
            { rank: 'A', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'K', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'Q', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'J', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '10', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
          ],
          mainRank: 'A',
          isTrump: false,
          length: 5,
          wildcards: [],
        }

        const result = compareCombinations(ss, straight)

        expect(result).toBe('greater')
      })

      it('should be greater than any 4-card bomb', () => {
        // 5张同花顺应当强于任何4张炸弹，即使4张炸弹的单牌值更大
        const ss: CardCombination = {
          type: 'same_suit_straight',
          cards: [
            { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '4', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '6', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '7', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
          ],
          mainRank: '7',
          isTrump: false,
          length: 5,
          wildcards: [],
        }
        const bombK: CardCombination = {
          type: 'bomb',
          cards: [
            { rank: 'K', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'K', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'K', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'K', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
          ],
          mainRank: 'K',
          isTrump: false,
          length: 4,
          wildcards: [],
        }

        const result = compareCombinations(ss, bombK)
        expect(result).toBe('greater')
      })

      it('should be lesser than any 5-card bomb', () => {
        // 同花顺应弱于任何5张炸弹，即使同花顺的值非常大且5张炸弹的牌值很小
        const ss: CardCombination = {
          type: 'same_suit_straight',
          cards: [
            { rank: '10', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'J', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'Q', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'K', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'A', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
          ],
          mainRank: 'A',
          isTrump: false,
          length: 5,
          wildcards: [],
        }
        const bomb3: CardCombination = {
          type: 'bomb',
          cards: [
            { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'spade', copyIndex: 2, isTrump: false, isRedTrump: false },
          ],
          mainRank: '3',
          isTrump: false,
          length: 5,
          wildcards: [],
        }

        const result = compareCombinations(ss, bomb3)
        expect(result).toBe('lesser')
      })
    })

    describe('incomparable types', () => {
      it('should return incomparable for different non-bomb types', () => {
        const pair: CardCombination = {
          type: 'pair',
          cards: [
            { rank: 'A', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'A', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
          ],
          mainRank: 'A',
          isTrump: false,
          wildcards: [],
        }
        const single: CardCombination = {
          type: 'single',
          cards: [{ rank: 'A', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }],
          mainRank: 'A',
          isTrump: false,
          wildcards: [],
        }

        const result = compareCombinations(pair, single)

        expect(result).toBe('incomparable')
      })
    })
  })

  describe('canBeat', () => {
    it('should return true when play is greater', () => {
      const play: CardCombination = {
        type: 'single',
        cards: [{ rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }],
        mainRank: '5',
        isTrump: false,
        wildcards: [],
      }
      const lead: CardCombination = {
        type: 'single',
        cards: [{ rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }],
        mainRank: '3',
        isTrump: false,
        wildcards: [],
      }

      const result = canBeat(play, lead)

      expect(result).toBe(true)
    })

    it('should return false when play is lesser', () => {
      const play: CardCombination = {
        type: 'single',
        cards: [{ rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }],
        mainRank: '3',
        isTrump: false,
        wildcards: [],
      }
      const lead: CardCombination = {
        type: 'single',
        cards: [{ rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }],
        mainRank: '5',
        isTrump: false,
        wildcards: [],
      }

      const result = canBeat(play, lead)

      expect(result).toBe(false)
    })

    it('should return false when incomparable', () => {
      const play: CardCombination = {
        type: 'pair',
        cards: [
          { rank: 'A', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
          { rank: 'A', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        ],
        mainRank: 'A',
        isTrump: false,
        wildcards: [],
      }
      const lead: CardCombination = {
        type: 'single',
        cards: [{ rank: 'A', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }],
        mainRank: 'A',
        isTrump: false,
        wildcards: [],
      }

      const result = canBeat(play, lead)

      expect(result).toBe(false)
    })

    it('should return true when bomb beats straight', () => {
      const play: CardCombination = {
        type: 'bomb',
        cards: [
          { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
          { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
          { rank: '3', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
          { rank: '3', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
        ],
        mainRank: '3',
        isTrump: false,
        length: 4,
        wildcards: [],
      }
      const lead: CardCombination = {
        type: 'straight',
        cards: [
          { rank: 'A', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
          { rank: 'K', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
          { rank: 'Q', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
          { rank: 'J', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
          { rank: '10', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        ],
        mainRank: 'A',
        isTrump: false,
        length: 5,
        wildcards: [],
      }

      const result = canBeat(play, lead)

      expect(result).toBe(true)
    })
  })
})