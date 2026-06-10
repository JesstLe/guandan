import { describe, it, expect } from 'vitest';
import { validateTablePlay } from './tableValidator';
import type { CardCombination } from '@guandan/shared';

describe('tableValidator', () => {
  describe('validateTablePlay', () => {
    it('should allow any play when no lead combination', () => {
      const play: CardCombination = {
        type: 'single',
        cards: [{ rank: '7', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false }],
        mainRank: '7',
        isTrump: false,
        wildcards: [],
      };
      const result = validateTablePlay(play, null);
      expect(result.valid).toBe(true);
    });

    it('should allow same type with greater rank', () => {
      const lead: CardCombination = {
        type: 'single',
        cards: [{ rank: '7', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false }],
        mainRank: '7',
        isTrump: false,
        wildcards: [],
      };
      const play: CardCombination = {
        type: 'single',
        cards: [{ rank: '8', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }],
        mainRank: '8',
        isTrump: false,
        wildcards: [],
      };
      const result = validateTablePlay(play, lead);
      expect(result.valid).toBe(true);
    });

    it('should reject same type with lesser rank', () => {
      const lead: CardCombination = {
        type: 'single',
        cards: [{ rank: '8', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false }],
        mainRank: '8',
        isTrump: false,
        wildcards: [],
      };
      const play: CardCombination = {
        type: 'single',
        cards: [{ rank: '7', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }],
        mainRank: '7',
        isTrump: false,
        wildcards: [],
      };
      const result = validateTablePlay(play, lead);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('小于台面');
    });

    it('should reject same type with equal rank', () => {
      const lead: CardCombination = {
        type: 'pair',
        cards: [
          { rank: '7', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
          { rank: '7', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        ],
        mainRank: '7',
        isTrump: false,
        wildcards: [],
      };
      const play: CardCombination = {
        type: 'pair',
        cards: [
          { rank: '7', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
          { rank: '7', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
        ],
        mainRank: '7',
        isTrump: false,
        wildcards: [],
      };
      const result = validateTablePlay(play, lead);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('相同大小');
    });

    it('should allow bomb to beat non-bomb', () => {
      const lead: CardCombination = {
        type: 'straight',
        cards: [],
        mainRank: '7',
        isTrump: false,
        length: 5,
        wildcards: [],
      };
      const play: CardCombination = {
        type: 'bomb',
        cards: [],
        mainRank: '5',
        isTrump: false,
        length: 4,
        wildcards: [],
      };
      const result = validateTablePlay(play, lead);
      expect(result.valid).toBe(true);
    });

    it('should allow bigger bomb to beat smaller bomb', () => {
      const lead: CardCombination = {
        type: 'bomb',
        cards: [],
        mainRank: '7',
        isTrump: false,
        length: 4,
        wildcards: [],
      };
      const play: CardCombination = {
        type: 'bomb',
        cards: [],
        mainRank: '8',
        isTrump: false,
        length: 4,
        wildcards: [],
      };
      const result = validateTablePlay(play, lead);
      expect(result.valid).toBe(true);
    });

    it('should reject smaller bomb beating bigger bomb', () => {
      const lead: CardCombination = {
        type: 'bomb',
        cards: [],
        mainRank: '8',
        isTrump: false,
        length: 5,
        wildcards: [],
      };
      const play: CardCombination = {
        type: 'bomb',
        cards: [],
        mainRank: '7',
        isTrump: false,
        length: 4,
        wildcards: [],
      };
      const result = validateTablePlay(play, lead);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('小于');
    });

    it('should reject non-bomb beating bomb', () => {
      const lead: CardCombination = {
        type: 'bomb',
        cards: [],
        mainRank: '7',
        isTrump: false,
        length: 4,
        wildcards: [],
      };
      const play: CardCombination = {
        type: 'straight',
        cards: [],
        mainRank: 'A',
        isTrump: false,
        length: 5,
        wildcards: [],
      };
      const result = validateTablePlay(play, lead);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('非炸弹牌型无法压过炸弹');
    });

    it('should reject mismatched types', () => {
      const lead: CardCombination = {
        type: 'pair',
        cards: [],
        mainRank: '7',
        isTrump: false,
        wildcards: [],
      };
      const play: CardCombination = {
        type: 'straight',
        cards: [],
        mainRank: 'A',
        isTrump: false,
        length: 5,
        wildcards: [],
      };
      const result = validateTablePlay(play, lead);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('牌型不匹配');
    });
  });
});
