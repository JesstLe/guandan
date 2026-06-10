import { describe, it, expect, beforeEach } from 'vitest'
import {
  type AnyCard, type GameMode,
} from '@guandan/shared'
import { GameSession } from './gameSession'

describe('gameSession', () => {
  let session: GameSession
  const testHand: AnyCard[] = [
    { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
    { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
    { rank: '4', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
    { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
  ]
  const testSeats = { me: 0, teammate: 2, opponentA: 1, opponentB: 3 }

  beforeEach(() => {
    session = new GameSession()
  })

  describe('initial state', () => {
    it('should start in waiting phase', () => {
      const state = session.getState()
      expect(state.phase).toBe('waiting')
    })

    it('should have default trump rank', () => {
      const state = session.getState()
      expect(state.trumpRank).toBe('7')
    })

    it('should have default seats', () => {
      const state = session.getState()
      expect(state.seats.me).toBe(0)
      expect(state.seats.teammate).toBe(2)
    })
  })

  describe('startGame', () => {
    it('should start game with provided hand cards', () => {
      const mode: GameMode = {
        type: 'single',
        tributeEnabled: false,
        tripleWithSingle: false,
        initialTrumpRank: '7',
      }

      const event = session.startGame(mode, testSeats, testHand)

      expect(event.type).toBe('new_game')
      const state = session.getState()
      expect(state.phase).toBe('playing')
      expect(state.pool.players[0].handCount).toBe(4)
    })

    it('should enable tribute phase when tribute is enabled', () => {
      const mode: GameMode = {
        type: 'single',
        tributeEnabled: true,
        tripleWithSingle: false,
        initialTrumpRank: '7',
      }

      session.startGame(mode, testSeats, testHand)

      const state = session.getState()
      expect(state.phase).toBe('tribute')
      expect(state.tributeState.required).toBe(true)
      expect(state.tributeState.phase).toBe('tribute')
    })

    it('should set round number to 1', () => {
      const mode: GameMode = {
        type: 'single',
        tributeEnabled: false,
        tripleWithSingle: false,
        initialTrumpRank: '7',
      }

      session.startGame(mode, testSeats, testHand)

      const state = session.getState()
      expect(state.roundNumber).toBe(1)
    })

    it('should create initial round', () => {
      const mode: GameMode = {
        type: 'single',
        tributeEnabled: false,
        tripleWithSingle: false,
        initialTrumpRank: '7',
      }

      session.startGame(mode, testSeats, testHand)

      const state = session.getState()
      expect(state.currentRound).not.toBeNull()
      expect(state.currentRound?.roundNumber).toBe(1)
    })
  })

  describe('play', () => {
    beforeEach(() => {
      const mode: GameMode = {
        type: 'single',
        tributeEnabled: false,
        tripleWithSingle: false,
        initialTrumpRank: '7',
      }
      session.startGame(mode, testSeats, testHand)
    })

    it('should allow player to play valid cards', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = session.play(0, cards)

      expect('event' in result).toBe(true)
      if ('event' in result) {
        expect(result.event.type).toBe('play')
      }
    })

    it('should reject play when not player turn', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = session.play(1, cards)

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toContain('不是你的回合')
      }
    })

    it('should reject play when not in playing phase', () => {
      const newSession = new GameSession()
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = newSession.play(0, cards)

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toContain('不是出牌阶段')
      }
    })

    it('should reject invalid card combinations', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = session.play(0, cards)

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toContain('无法识别')
      }
    })

    it('should set lead combination when first to play', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      session.play(0, cards)

      const state = session.getState()
      expect(state.currentRound?.leadCombination).not.toBeNull()
      expect(state.currentRound?.leadPlayer).toBe(0)
    })

    it('should update player hand count after play', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      session.play(0, cards)

      const state = session.getState()
      expect(state.pool.players[0].handCount).toBe(3)
    })

    it('should add play to round plays', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      session.play(0, cards)

      const state = session.getState()
      expect(state.currentRound?.plays).toHaveLength(1)
      expect(state.currentRound?.plays[0].action).toBe('play')
    })
  })

  describe('pass', () => {
    beforeEach(() => {
      const mode: GameMode = {
        type: 'single',
        tributeEnabled: false,
        tripleWithSingle: false,
        initialTrumpRank: '7',
      }
      session.startGame(mode, testSeats, testHand)
    })

    it('should allow player to pass', () => {
      session.play(0, [{ rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }])
      const result = session.pass(1)

      expect(result && 'type' in result).toBe(true)
    })

    it('should reject pass when not player turn', () => {
      session.play(0, [{ rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }])
      const result = session.pass(0)

      expect('error' in result).toBe(true)
    })

    it('should reject pass when lead player', () => {
      const result = session.pass(0)

      expect('error' in result).toBe(true)
    })

    it('should add pass to round plays', () => {
      session.play(0, [{ rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }])
      session.pass(1)

      const state = session.getState()
      const passPlay = state.currentRound?.plays.find(p => p.action === 'pass')
      expect(passPlay).toBeDefined()
    })
  })

  describe('winning', () => {
    it('should detect player finishing when hand is empty', () => {
      const mode: GameMode = {
        type: 'single',
        tributeEnabled: false,
        tripleWithSingle: false,
        initialTrumpRank: '7',
      }
      const singleCardHand: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]
      session.startGame(mode, testSeats, singleCardHand)

      session.play(0, singleCardHand)

      const state = session.getState()
      expect(state.finishedPlayers).toContain(0)
    })

    it('should end round when player finishes and other players pass', () => {
      const mode: GameMode = {
        type: 'single',
        tributeEnabled: false,
        tripleWithSingle: false,
        initialTrumpRank: '7',
      }
      const singleCardHand: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]
      session.startGame(mode, testSeats, singleCardHand)

      session.play(0, singleCardHand)
      
      // 玩家0出完牌后，其余活跃玩家(1, 2, 3)选择过牌以结束当前轮次
      session.pass(1)
      session.pass(2)
      session.pass(3)

      const state = session.getState()
      expect(state.rounds.length).toBeGreaterThan(0)
      const lastRound = state.rounds[state.rounds.length - 1]
      expect(lastRound.playerFinished).toBe(0)
      expect(lastRound.isWindRound).toBe(true)
      expect(lastRound.windReceiver).toBe(2) // 玩家0的队友(座位2)获得接风
    })

    it('should not end round if another player beats the finished players final card', () => {
      const mode: GameMode = {
        type: 'single',
        tributeEnabled: false,
        tripleWithSingle: false,
        initialTrumpRank: '7',
      }
      const singleCardHand: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]
      session.startGame(mode, testSeats, singleCardHand)

      session.play(0, singleCardHand)
      
      // 玩家1出大牌(单张5)压死玩家0的牌，此时回合不应结束，赢家将属于玩家1
      const beatCard: AnyCard[] = [
        { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]
      session.play(1, beatCard)
      
      // 玩家2和3过牌，使得玩家1获得新轮首出权
      session.pass(2)
      session.pass(3)

      const state = session.getState()
      expect(state.rounds.length).toBeGreaterThan(0)
      const lastRound = state.rounds[state.rounds.length - 1]
      expect(lastRound.winner).toBe(1) // 赢家是压牌的玩家1
      expect(lastRound.isWindRound).toBeFalsy() // 不应该发生接风
      expect(state.currentPlayer).toBe(1) // 新一回合由玩家1出牌
    })
  })

  describe('undo', () => {
    beforeEach(() => {
      const mode: GameMode = {
        type: 'single',
        tributeEnabled: false,
        tripleWithSingle: false,
        initialTrumpRank: '7',
      }
      session.startGame(mode, testSeats, testHand)
    })

    it('should undo last event', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]
      session.play(0, cards)

      const undone = session.undo()

      expect(undone).not.toBeNull()
      const state = session.getState()
      expect(state.currentRound?.plays).toHaveLength(0)
    })

    it('should return null when nothing to undo', () => {
      const newSession = new GameSession()
      const undone = newSession.undo()

      expect(undone).toBeNull()
    })
  })

  describe('setHand', () => {
    it('should update hand cards', () => {
      const mode: GameMode = {
        type: 'single',
        tributeEnabled: false,
        tripleWithSingle: false,
        initialTrumpRank: '7',
      }
      session.startGame(mode, testSeats, testHand)

      const newHand: AnyCard[] = [
        { rank: 'A', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]
      session.setHand(newHand)

      const state = session.getState()
      expect(state.pool.players[0].handCount).toBe(1)
    })
  })

  describe('verifyState', () => {
    it('should return valid state', () => {
      const mode: GameMode = {
        type: 'single',
        tributeEnabled: false,
        tripleWithSingle: false,
        initialTrumpRank: '7',
      }
      session.startGame(mode, testSeats, testHand)

      const result = session.verifyState()

      expect(result.valid).toBe(true)
    })
  })

  describe('timeline', () => {
    it('should record events in timeline', () => {
      const mode: GameMode = {
        type: 'single',
        tributeEnabled: false,
        tripleWithSingle: false,
        initialTrumpRank: '7',
      }
      session.startGame(mode, testSeats, testHand)

      const timeline = session.getTimeline()

      expect(timeline.length).toBeGreaterThan(0)
    })

    it('should allow undo to restore state', () => {
      const mode: GameMode = {
        type: 'single',
        tributeEnabled: false,
        tripleWithSingle: false,
        initialTrumpRank: '7',
      }
      session.startGame(mode, testSeats, testHand)
      const initialHandCount = session.getState().pool.players[0].handCount

      session.play(0, [{ rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }])
      session.undo()

      const state = session.getState()
      expect(state.pool.players[0].handCount).toBe(initialHandCount)
    })
  })

  describe('edge cases', () => {
    it('should handle multiple players playing in sequence', () => {
      const mode: GameMode = {
        type: 'single',
        tributeEnabled: false,
        tripleWithSingle: false,
        initialTrumpRank: '7',
      }
      const handWithMultipleCards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]
      session.startGame(mode, testSeats, handWithMultipleCards)

      session.play(0, [{ rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }])
      session.play(1, [{ rank: '4', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }])

      const state = session.getState()
      expect(state.currentPlayer).not.toBe(0)
    })

    it('should advance to next player after pass', () => {
      const mode: GameMode = {
        type: 'single',
        tributeEnabled: false,
        tripleWithSingle: false,
        initialTrumpRank: '7',
      }
      const handWithMultipleCards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]
      session.startGame(mode, testSeats, handWithMultipleCards)

      session.play(0, [{ rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }])
      const stateAfterPlay = session.getState()
      const firstPlayer = stateAfterPlay.currentPlayer
      session.pass(1)

      const state = session.getState()
      expect(state.currentPlayer).not.toBe(firstPlayer)
    })
  })
})