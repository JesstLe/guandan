import { describe, it, expect } from 'vitest';
import {
  validateCardType,
  isValidCombinationType,
  getCombinationRequirements,
} from './cardTypeValidator';
import type { AnyCard, Card } from '@guandan/shared';

describe('cardTypeValidator', () => {
  describe('validateCardType', () => {
    it('should return invalid for empty cards', () => {
      const result = validateCardType([]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('未选择任何牌');
    });

    it('should validate single card', () => {
      const card: Card = { rank: '7', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false };
      const result = validateCardType([card]);
      expect(result.valid).toBe(true);
      expect(result.detectedCombination?.type).toBe('single');
    });

    it('should validate pair', () => {
      const cards: Card[] = [
        { rank: '7', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '7', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ];
      const result = validateCardType(cards);
      expect(result.valid).toBe(true);
      expect(result.detectedCombination?.type).toBe('pair');
    });

    it('should validate bomb', () => {
      const cards: Card[] = [
        { rank: '7', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '7', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '7', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '7', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
      ];
      const result = validateCardType(cards);
      expect(result.valid).toBe(true);
      expect(result.detectedCombination?.type).toBe('bomb');
    });

    it('should validate straight', () => {
      const cards: Card[] = [
        { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '6', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '7', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
      ];
      const result = validateCardType(cards);
      expect(result.valid).toBe(true);
      expect(result.detectedCombination?.type).toBe('straight');
    });

    it('should return invalid for invalid combination', () => {
      const cards: Card[] = [
        { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '7', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
      ];
      const result = validateCardType(cards);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('选出的牌不构成任何合法牌型');
    });

    it('should detect ambiguous combinations', () => {
      const cards: Card[] = [
        { rank: '7', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '7', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '7', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '7', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '8', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
      ];
      const result = validateCardType(cards);
      expect(result.valid).toBe(false);
    });
  });

  describe('isValidCombinationType', () => {
    it('should return true for all valid types', () => {
      const validTypes = [
        'single', 'pair', 'triple', 'triple_with_pair',
        'airplane', 'straight', 'pair_straight', 'bomb',
        'same_suit_straight', 'joker_bomb',
      ];
      for (const type of validTypes) {
        expect(isValidCombinationType(type as any)).toBe(true);
      }
    });

    it('should return false for invalid type', () => {
      expect(isValidCombinationType('invalid' as any)).toBe(false);
    });
  });

  describe('getCombinationRequirements', () => {
    it('should return correct requirements for single', () => {
      const req = getCombinationRequirements('single');
      expect(req.minCards).toBe(1);
      expect(req.description).toBe('任意1张牌');
    });

    it('should return correct requirements for bomb', () => {
      const req = getCombinationRequirements('bomb');
      expect(req.minCards).toBe(4);
      expect(req.description).toBe('4张以上相同点数');
    });

    it('should return correct requirements for joker_bomb', () => {
      const req = getCombinationRequirements('joker_bomb');
      expect(req.minCards).toBe(4);
      expect(req.description).toBe('4张王牌(2小王+2大王)');
    });

    it('should return correct requirements for straight', () => {
      const req = getCombinationRequirements('straight');
      expect(req.minCards).toBe(5);
      expect(req.description).toBe('5张以上连续点数(不含2)');
    });
  });
});
