import { describe, it, expect } from 'vitest';
import {
  validateHandOwnership,
  validateNoDuplicateCards,
} from './handValidator';
import { createCardPool, setMyHand } from '../engine/cardPool';
import type { Card } from '@guandan/shared';

describe('handValidator', () => {
  describe('validateHandOwnership', () => {
    it('should validate player 0 has cards', () => {
      const pool = createCardPool('7');
      const myCards: Card[] = [
        { rank: '7', suit: 'heart', copyIndex: 1, isTrump: true, isRedTrump: true },
        { rank: '8', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ];
      setMyHand(pool, myCards);

      const result = validateHandOwnership(pool, 0, myCards);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing cards for player 0', () => {
      const pool = createCardPool('7');
      const myCards: Card[] = [
        { rank: '7', suit: 'heart', copyIndex: 1, isTrump: true, isRedTrump: true },
      ];
      setMyHand(pool, myCards);

      const missingCard: Card = { rank: '9', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false };
      const result = validateHandOwnership(pool, 0, [myCards[0], missingCard]);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.missingCards.length).toBeGreaterThan(0);
    });

    it('should validate other players based on hand count', () => {
      const pool = createCardPool('7');
      pool.players[1].handCount = 10;

      const cards: Card[] = [
        { rank: '7', suit: 'heart', copyIndex: 1, isTrump: true, isRedTrump: true },
        { rank: '8', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ];
      const result = validateHandOwnership(pool, 1, cards);
      expect(result.valid).toBe(true);
    });

    it('should detect when other player does not have enough cards', () => {
      const pool = createCardPool('7');
      pool.players[1].handCount = 1;

      const cards: Card[] = [
        { rank: '7', suit: 'heart', copyIndex: 1, isTrump: true, isRedTrump: true },
        { rank: '8', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ];
      const result = validateHandOwnership(pool, 1, cards);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('手牌仅剩');
    });
  });

  describe('validateNoDuplicateCards', () => {
    it('should pass for unique cards', () => {
      const cards: Card[] = [
        { rank: '7', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '8', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ];
      const result = validateNoDuplicateCards(cards);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect duplicate cards', () => {
      const cards: Card[] = [
        { rank: '7', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '7', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
      ];
      const result = validateNoDuplicateCards(cards);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('重复选牌');
    });

    it('should detect multiple duplicates', () => {
      const cards: Card[] = [
        { rank: '7', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '7', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '8', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '8', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ];
      const result = validateNoDuplicateCards(cards);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2);
    });
  });
});
