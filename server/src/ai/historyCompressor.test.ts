import { describe, it, expect } from 'vitest'
import {
  type GameEvent, type Round, type CardCombination, type AnyCard,
} from '@guandan/shared'
import { compressHistory, type CompressedHistory, type CompressedRound } from './historyCompressor'

describe('historyCompressor', () => {
  describe('compressHistory', () => {
    it('should compress empty history', () => {
      const events: GameEvent[] = []
      const rounds: Round[] = []

      const result = compressHistory(events, rounds)

      expect(result.totalRounds).toBe(0)
      expect(result.rounds).toHaveLength(0)
      expect(result.keyEvents).toHaveLength(0)
    })

    it('should compress single round', () => {
      const events: GameEvent[] = [
        {
          id: 'e1',
          type: 'play',
          data: { player: 0, cards: [], combination: { type: 'single', cards: [], isTrump: false, wildcards: [], mainRank: '3' } },
          timestamp: 1000,
          derivedInferences: [],
        },
      ]
      const rounds: Round[] = [
        {
          roundNumber: 1,
          leadPlayer: 0,
          leadCombination: { type: 'single', cards: [], isTrump: false, wildcards: [], mainRank: '3' },
          plays: [
            { player: 0, action: 'play', cards: [], combination: { type: 'single', cards: [], isTrump: false, wildcards: [], mainRank: '3' } },
          ],
          winner: 0,
          isWindRound: false,
        },
      ]

      const result = compressHistory(events, rounds)

      expect(result.totalRounds).toBe(1)
      expect(result.rounds).toHaveLength(1)
      expect(result.rounds[0].roundNumber).toBe(1)
      expect(result.rounds[0].leadPlayer).toBe(0)
      expect(result.rounds[0].leadType).toBe('single')
      expect(result.rounds[0].winner).toBe(0)
    })

    it('should count plays and passes in round', () => {
      const events: GameEvent[] = [
        {
          id: 'e1',
          type: 'play',
          data: { player: 0, cards: [], combination: { type: 'single', cards: [], isTrump: false, wildcards: [] } },
          timestamp: 1000,
          derivedInferences: [],
        },
        {
          id: 'e2',
          type: 'pass',
          data: { player: 1 },
          timestamp: 1001,
          derivedInferences: [],
        },
        {
          id: 'e3',
          type: 'play',
          data: { player: 2, cards: [], combination: { type: 'single', cards: [], isTrump: false, wildcards: [] } },
          timestamp: 1002,
          derivedInferences: [],
        },
        {
          id: 'e4',
          type: 'pass',
          data: { player: 3 },
          timestamp: 1003,
          derivedInferences: [],
        },
      ]
      const rounds: Round[] = [
        {
          roundNumber: 1,
          leadPlayer: 0,
          leadCombination: { type: 'single', cards: [], isTrump: false, wildcards: [] },
          plays: [
            { player: 0, action: 'play' },
            { player: 1, action: 'pass' },
            { player: 2, action: 'play' },
            { player: 3, action: 'pass' },
          ],
          winner: 2,
          isWindRound: false,
        },
      ]

      const result = compressHistory(events, rounds)

      expect(result.rounds[0].playCount).toBe(2)
      expect(result.rounds[0].passCount).toBe(2)
    })

    it('should include play events in keyEvents', () => {
      const events: GameEvent[] = [
        {
          id: 'e1',
          type: 'play',
          data: { player: 0, cards: [], combination: { type: 'single', cards: [], isTrump: false, wildcards: [], mainRank: '3' } },
          timestamp: 1000,
          derivedInferences: [],
        },
        {
          id: 'e2',
          type: 'pass',
          data: { player: 1 },
          timestamp: 1001,
          derivedInferences: [],
        },
        {
          id: 'e3',
          type: 'play',
          data: { player: 2, cards: [], combination: { type: 'pair', cards: [], isTrump: false, wildcards: [], mainRank: '5' } },
          timestamp: 1002,
          derivedInferences: [],
        },
      ]
      const rounds: Round[] = []

      const result = compressHistory(events, rounds)

      expect(result.keyEvents).toHaveLength(3)
      expect(result.keyEvents[0].action).toBe('play')
      expect(result.keyEvents[0].type).toBe('single')
      expect(result.keyEvents[1].action).toBe('pass')
      expect(result.keyEvents[2].action).toBe('play')
      expect(result.keyEvents[2].type).toBe('pair')
    })

    it('should include pass events in keyEvents', () => {
      const events: GameEvent[] = [
        {
          id: 'e1',
          type: 'pass',
          data: { player: 1 },
          timestamp: 1000,
          derivedInferences: [],
        },
      ]
      const rounds: Round[] = []

      const result = compressHistory(events, rounds)

      expect(result.keyEvents).toHaveLength(1)
      expect(result.keyEvents[0].action).toBe('pass')
    })

    it('should limit keyEvents to last 20', () => {
      const events: GameEvent[] = []
      for (let i = 0; i < 30; i++) {
        events.push({
          id: `e${i}`,
          type: 'play',
          data: { player: i % 4, cards: [], combination: { type: 'single', cards: [], isTrump: false, wildcards: [] } },
          timestamp: 1000 + i,
          derivedInferences: [],
        })
      }
      const rounds: Round[] = []

      const result = compressHistory(events, rounds)

      expect(result.keyEvents).toHaveLength(20)
    })

    it('should handle null leadCombination', () => {
      const rounds: Round[] = [
        {
          roundNumber: 1,
          leadPlayer: 0,
          leadCombination: null,
          plays: [],
          winner: null,
          isWindRound: false,
        },
      ]

      const result = compressHistory([], rounds)

      expect(result.rounds[0].leadType).toBe('unknown')
      expect(result.rounds[0].leadMainRank).toBeNull()
    })

    it('should handle undefined mainRank', () => {
      const events: GameEvent[] = [
        {
          id: 'e1',
          type: 'play',
          data: { player: 0, cards: [], combination: { type: 'single', cards: [], isTrump: false, wildcards: [] } },
          timestamp: 1000,
          derivedInferences: [],
        },
      ]
      const rounds: Round[] = [
        {
          roundNumber: 1,
          leadPlayer: 0,
          leadCombination: { type: 'single', cards: [], isTrump: false, wildcards: [] },
          plays: [],
          winner: null,
          isWindRound: false,
        },
      ]

      const result = compressHistory(events, rounds)

      expect(result.rounds[0].leadMainRank).toBeNull()
    })

    it('should handle multiple rounds', () => {
      const rounds: Round[] = [
        {
          roundNumber: 1,
          leadPlayer: 0,
          leadCombination: { type: 'single', cards: [], isTrump: false, wildcards: [], mainRank: '3' },
          plays: [{ player: 0, action: 'play' }],
          winner: 0,
          isWindRound: true,
        },
        {
          roundNumber: 2,
          leadPlayer: 2,
          leadCombination: { type: 'pair', cards: [], isTrump: false, wildcards: [], mainRank: '5' },
          plays: [{ player: 2, action: 'play' }],
          winner: 2,
          isWindRound: false,
        },
        {
          roundNumber: 3,
          leadPlayer: 1,
          leadCombination: { type: 'straight', cards: [], isTrump: false, wildcards: [], mainRank: '9', length: 5 },
          plays: [{ player: 1, action: 'play' }],
          winner: 1,
          isWindRound: false,
        },
      ]

      const result = compressHistory([], rounds)

      expect(result.totalRounds).toBe(3)
      expect(result.rounds).toHaveLength(3)
      expect(result.rounds[0].leadType).toBe('single')
      expect(result.rounds[1].leadType).toBe('pair')
      expect(result.rounds[2].leadType).toBe('straight')
    })

    it('should track player for each key event', () => {
      const events: GameEvent[] = [
        {
          id: 'e1',
          type: 'play',
          data: { player: 0, cards: [], combination: { type: 'single', cards: [], isTrump: false, wildcards: [] } },
          timestamp: 1000,
          derivedInferences: [],
        },
        {
          id: 'e2',
          type: 'play',
          data: { player: 1, cards: [], combination: { type: 'single', cards: [], isTrump: false, wildcards: [] } },
          timestamp: 1001,
          derivedInferences: [],
        },
        {
          id: 'e3',
          type: 'play',
          data: { player: 2, cards: [], combination: { type: 'single', cards: [], isTrump: false, wildcards: [] } },
          timestamp: 1002,
          derivedInferences: [],
        },
        {
          id: 'e4',
          type: 'play',
          data: { player: 3, cards: [], combination: { type: 'single', cards: [], isTrump: false, wildcards: [] } },
          timestamp: 1003,
          derivedInferences: [],
        },
      ]
      const rounds: Round[] = []

      const result = compressHistory(events, rounds)

      expect(result.keyEvents[0].player).toBe(0)
      expect(result.keyEvents[1].player).toBe(1)
      expect(result.keyEvents[2].player).toBe(2)
      expect(result.keyEvents[3].player).toBe(3)
    })

    it('should capture mainRank in key events', () => {
      const events: GameEvent[] = [
        {
          id: 'e1',
          type: 'play',
          data: { player: 0, cards: [], combination: { type: 'single', cards: [], isTrump: false, wildcards: [], mainRank: 'A' } },
          timestamp: 1000,
          derivedInferences: [],
        },
        {
          id: 'e2',
          type: 'play',
          data: { player: 1, cards: [], combination: { type: 'pair', cards: [], isTrump: false, wildcards: [], mainRank: 'K' } },
          timestamp: 1001,
          derivedInferences: [],
        },
      ]
      const rounds: Round[] = []

      const result = compressHistory(events, rounds)

      expect(result.keyEvents[0].mainRank).toBe('A')
      expect(result.keyEvents[1].mainRank).toBe('K')
    })

    it('should handle non-play events (new_game, set_hand)', () => {
      const events: GameEvent[] = [
        {
          id: 'e1',
          type: 'new_game',
          data: { trumpRank: '7' },
          timestamp: 1000,
          derivedInferences: [],
        },
        {
          id: 'e2',
          type: 'set_hand',
          data: { player: 0, handCards: [] },
          timestamp: 1001,
          derivedInferences: [],
        },
      ]
      const rounds: Round[] = []

      const result = compressHistory(events, rounds)

      expect(result.keyEvents).toHaveLength(0)
    })
  })

  describe('output structure', () => {
    it('should return proper CompressedHistory type', () => {
      const events: GameEvent[] = []
      const rounds: Round[] = [
        {
          roundNumber: 1,
          leadPlayer: 0,
          leadCombination: { type: 'single', cards: [], isTrump: false, wildcards: [] },
          plays: [],
          winner: 0,
          isWindRound: false,
        },
      ]

      const result: CompressedHistory = compressHistory(events, rounds)

      expect(result.totalRounds).toBe(1)
      expect(Array.isArray(result.rounds)).toBe(true)
      expect(Array.isArray(result.keyEvents)).toBe(true)
    })

    it('should return proper CompressedRound type', () => {
      const rounds: Round[] = [
        {
          roundNumber: 1,
          leadPlayer: 0,
          leadCombination: { type: 'single', cards: [], isTrump: false, wildcards: [], mainRank: '3' },
          plays: [{ player: 0, action: 'play' }],
          winner: 0,
          isWindRound: true,
        },
      ]

      const result = compressHistory([], rounds)
      const round: CompressedRound = result.rounds[0]

      expect(typeof round.roundNumber).toBe('number')
      expect(typeof round.leadPlayer).toBe('number')
      expect(typeof round.leadType).toBe('string')
      expect(round.leadMainRank === null || typeof round.leadMainRank === 'string').toBe(true)
      expect(round.winner === null || typeof round.winner === 'number').toBe(true)
      expect(typeof round.playCount).toBe('number')
      expect(typeof round.passCount).toBe('number')
    })
  })

  describe('edge cases', () => {
    it('should handle round without plays', () => {
      const rounds: Round[] = [
        {
          roundNumber: 1,
          leadPlayer: 0,
          leadCombination: null,
          plays: [],
          winner: null,
          isWindRound: false,
        },
      ]

      const result = compressHistory([], rounds)

      expect(result.rounds[0].playCount).toBe(0)
      expect(result.rounds[0].passCount).toBe(0)
    })

    it('should handle all players passing', () => {
      const events: GameEvent[] = [
        { id: 'e1', type: 'play', data: { player: 0, cards: [], combination: { type: 'single', cards: [], isTrump: false, wildcards: [] } }, timestamp: 1000, derivedInferences: [] },
        { id: 'e2', type: 'pass', data: { player: 1 }, timestamp: 1001, derivedInferences: [] },
        { id: 'e3', type: 'pass', data: { player: 2 }, timestamp: 1002, derivedInferences: [] },
        { id: 'e4', type: 'pass', data: { player: 3 }, timestamp: 1003, derivedInferences: [] },
      ]
      const rounds: Round[] = [
        {
          roundNumber: 1,
          leadPlayer: 0,
          leadCombination: { type: 'single', cards: [], isTrump: false, wildcards: [] },
          plays: [
            { player: 0, action: 'play' },
            { player: 1, action: 'pass' },
            { player: 2, action: 'pass' },
            { player: 3, action: 'pass' },
          ],
          winner: 0,
          isWindRound: false,
        },
      ]

      const result = compressHistory(events, rounds)

      expect(result.rounds[0].playCount).toBe(1)
      expect(result.rounds[0].passCount).toBe(3)
      expect(result.rounds[0].winner).toBe(0)
    })

    it('should handle wind round (player finished)', () => {
      const rounds: Round[] = [
        {
          roundNumber: 1,
          leadPlayer: 0,
          leadCombination: { type: 'single', cards: [], isTrump: false, wildcards: [] },
          plays: [{ player: 0, action: 'play' }],
          winner: 0,
          windReceiver: 2,
          isWindRound: true,
          playerFinished: 0,
        },
      ]

      const result = compressHistory([], rounds)

      expect(result.rounds[0].winner).toBe(0)
    })
  })
})