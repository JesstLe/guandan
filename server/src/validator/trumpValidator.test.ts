import { describe, it, expect } from 'vitest';
import { validateTrumpUsage } from './trumpValidator';
import type { Card, WildcardEntry } from '@guandan/shared';

describe('trumpValidator', () => {
  describe('validateTrumpUsage', () => {
    it('should pass for valid non-wildcard usage', () => {
      const cards: Card[] = [
        { rank: '7', suit: 'heart', copyIndex: 1, isTrump: true, isRedTrump: true },
      ];
      const combination = { wildcards: [] as WildcardEntry[] };
      const result = validateTrumpUsage(cards, combination, '7');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass for valid wildcard usage', () => {
      const wildcardCard: Card = { rank: '7', suit: 'heart', copyIndex: 1, isTrump: true, isRedTrump: true };
      const cards: Card[] = [wildcardCard];
      const combination = {
        wildcards: [{
          card: wildcardCard,
          substitute: '8',
        } as WildcardEntry],
      };
      const result = validateTrumpUsage(cards, combination, '7');
      expect(result.valid).toBe(true);
    });

    it('should reject multiple wildcards', () => {
      const wildcardCard1: Card = { rank: '7', suit: 'heart', copyIndex: 1, isTrump: true, isRedTrump: true };
      const wildcardCard2: Card = { rank: '7', suit: 'heart', copyIndex: 2, isTrump: true, isRedTrump: true };
      const cards: Card[] = [wildcardCard1, wildcardCard2];
      const combination = {
        wildcards: [
          { card: wildcardCard1, substitute: '8' } as WildcardEntry,
          { card: wildcardCard2, substitute: '9' } as WildcardEntry,
        ],
      };
      const result = validateTrumpUsage(cards, combination, '7');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('最多使用1张逢人配');
    });

    it('should reject non-red-trump as wildcard', () => {
      const nonRedTrump: Card = { rank: '7', suit: 'spade', copyIndex: 1, isTrump: true, isRedTrump: false };
      const cards: Card[] = [nonRedTrump];
      const combination = {
        wildcards: [{ card: nonRedTrump, substitute: '8' } as WildcardEntry],
      };
      const result = validateTrumpUsage(cards, combination, '7');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('逢人配必须是红桃主牌');
    });

    it('should warn when substituting 2 without suit', () => {
      const wildcardCard: Card = { rank: '7', suit: 'heart', copyIndex: 1, isTrump: true, isRedTrump: true };
      const cards: Card[] = [wildcardCard];
      const combination = {
        wildcards: [{ card: wildcardCard, substitute: '2' } as WildcardEntry],
      };
      const result = validateTrumpUsage(cards, combination, '7');
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should warn when using trump cards with wildcards', () => {
      const wildcardCard: Card = { rank: '7', suit: 'heart', copyIndex: 1, isTrump: true, isRedTrump: true };
      const trumpCard: Card = { rank: '7', suit: 'spade', copyIndex: 1, isTrump: true, isRedTrump: false };
      const cards: Card[] = [wildcardCard, trumpCard];
      const combination = {
        wildcards: [{ card: wildcardCard, substitute: '8' } as WildcardEntry],
      };
      const result = validateTrumpUsage(cards, combination, '7');
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('同时使用了主牌和逢人配');
    });
  });
});
