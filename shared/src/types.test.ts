import { describe, it, expect } from 'vitest';
import {
  isJoker,
  cardId,
  ALL_RANKS,
  ALL_SUITS,
  RANK_ORDER,
  SUIT_ORDER,
  type Card,
  type JokerCard,
} from './types';

describe('types', () => {
  describe('isJoker', () => {
    it('should return true for joker cards', () => {
      const smallJoker: JokerCard = { type: 'small', copyIndex: 1 };
      const bigJoker: JokerCard = { type: 'big', copyIndex: 1 };
      
      expect(isJoker(smallJoker)).toBe(true);
      expect(isJoker(bigJoker)).toBe(true);
    });

    it('should return false for regular cards', () => {
      const card: Card = { 
        rank: '7', 
        suit: 'heart', 
        copyIndex: 1, 
        isTrump: false, 
        isRedTrump: false 
      };
      
      expect(isJoker(card)).toBe(false);
    });
  });

  describe('cardId', () => {
    it('should generate correct ID for joker cards', () => {
      const smallJoker: JokerCard = { type: 'small', copyIndex: 1 };
      const smallJoker2: JokerCard = { type: 'small', copyIndex: 2 };
      const bigJoker: JokerCard = { type: 'big', copyIndex: 1 };
      
      expect(cardId(smallJoker)).toBe('small-copy1');
      expect(cardId(smallJoker2)).toBe('small-copy2');
      expect(cardId(bigJoker)).toBe('big-copy1');
    });

    it('should generate correct ID for regular cards', () => {
      const card1: Card = { 
        rank: '7', 
        suit: 'heart', 
        copyIndex: 1, 
        isTrump: false, 
        isRedTrump: false 
      };
      const card2: Card = { 
        rank: '7', 
        suit: 'heart', 
        copyIndex: 2, 
        isTrump: false, 
        isRedTrump: false 
      };
      const card3: Card = { 
        rank: 'A', 
        suit: 'spade', 
        copyIndex: 1, 
        isTrump: false, 
        isRedTrump: false 
      };
      
      expect(cardId(card1)).toBe('heart-7-copy1');
      expect(cardId(card2)).toBe('heart-7-copy2');
      expect(cardId(card3)).toBe('spade-A-copy1');
    });

    it('should generate unique IDs for all card combinations', () => {
      const ids = new Set<string>();
      
      ids.add(cardId({ type: 'small', copyIndex: 1 }));
      ids.add(cardId({ type: 'small', copyIndex: 2 }));
      ids.add(cardId({ type: 'big', copyIndex: 1 }));
      ids.add(cardId({ type: 'big', copyIndex: 2 }));
      
      for (const suit of ALL_SUITS) {
        for (const rank of ALL_RANKS) {
          for (const copy of [1, 2] as const) {
            const card: Card = {
              rank,
              suit,
              copyIndex: copy,
              isTrump: false,
              isRedTrump: false,
            };
            ids.add(cardId(card));
          }
        }
      }
      
      expect(ids.size).toBe(108);
    });
  });

  describe('RANK_ORDER', () => {
    it('should have correct order for all ranks', () => {
      expect(RANK_ORDER['3']).toBe(3);
      expect(RANK_ORDER['4']).toBe(4);
      expect(RANK_ORDER['5']).toBe(5);
      expect(RANK_ORDER['6']).toBe(6);
      expect(RANK_ORDER['7']).toBe(7);
      expect(RANK_ORDER['8']).toBe(8);
      expect(RANK_ORDER['9']).toBe(9);
      expect(RANK_ORDER['10']).toBe(10);
      expect(RANK_ORDER['J']).toBe(11);
      expect(RANK_ORDER['Q']).toBe(12);
      expect(RANK_ORDER['K']).toBe(13);
      expect(RANK_ORDER['A']).toBe(14);
      expect(RANK_ORDER['2']).toBe(15);
    });

    it('should be in ascending order', () => {
      const ranks: string[] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
      for (let i = 1; i < ranks.length; i++) {
        expect(RANK_ORDER[ranks[i] as keyof typeof RANK_ORDER]).toBeGreaterThan(
          RANK_ORDER[ranks[i - 1] as keyof typeof RANK_ORDER]
        );
      }
    });
  });

  describe('SUIT_ORDER', () => {
    it('should have spade as highest', () => {
      expect(SUIT_ORDER['spade']).toBe(4);
    });

    it('should have heart second', () => {
      expect(SUIT_ORDER['heart']).toBe(3);
    });

    it('should have club third', () => {
      expect(SUIT_ORDER['club']).toBe(2);
    });

    it('should have diamond as lowest', () => {
      expect(SUIT_ORDER['diamond']).toBe(1);
    });
  });

  describe('ALL_RANKS', () => {
    it('should contain all 13 ranks', () => {
      expect(ALL_RANKS).toHaveLength(13);
      expect(ALL_RANKS).toContain('3');
      expect(ALL_RANKS).toContain('4');
      expect(ALL_RANKS).toContain('5');
      expect(ALL_RANKS).toContain('6');
      expect(ALL_RANKS).toContain('7');
      expect(ALL_RANKS).toContain('8');
      expect(ALL_RANKS).toContain('9');
      expect(ALL_RANKS).toContain('10');
      expect(ALL_RANKS).toContain('J');
      expect(ALL_RANKS).toContain('Q');
      expect(ALL_RANKS).toContain('K');
      expect(ALL_RANKS).toContain('A');
      expect(ALL_RANKS).toContain('2');
    });
  });

  describe('ALL_SUITS', () => {
    it('should contain all 4 suits', () => {
      expect(ALL_SUITS).toHaveLength(4);
      expect(ALL_SUITS).toContain('spade');
      expect(ALL_SUITS).toContain('heart');
      expect(ALL_SUITS).toContain('diamond');
      expect(ALL_SUITS).toContain('club');
    });
  });
});
