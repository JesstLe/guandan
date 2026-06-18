import { describe, expect, it } from 'vitest'
import type { AnyCard, GameMode } from '@guandan/shared'
import { GameSession } from '../engine/gameSession'
import { exportDecisionPoint } from './decisionPointExporter'

const mode: GameMode = {
  type: 'single',
  tributeEnabled: false,
  tripleWithSingle: false,
  initialTrumpRank: '7',
}

const seats = { me: 0, teammate: 2, opponentA: 1, opponentB: 3 }

const openingHand: AnyCard[] = [
  { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
  { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
  { rank: '4', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
  { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
]

describe('decisionPointExporter', () => {
  it('exports the current lead decision with private hand and legal play actions', () => {
    const session = new GameSession()
    session.startGame(mode, seats, openingHand)

    const decision = exportDecisionPoint(session, { gameId: 'game-a' })

    expect(decision.schemaVersion).toBe('0.1.0')
    expect(decision.gameId).toBe('game-a')
    expect(decision.currentPlayer).toBe(0)
    expect(decision.teamId).toBe(0)
    expect(decision.phase).toBe('lead')
    expect(decision.privateHand).toHaveLength(4)
    expect(decision.handCounts).toEqual([4, 27, 27, 27])
    expect(decision.tableLead).toBeNull()
    expect(decision.publicHistory).toHaveLength(1)
    expect(decision.legalActions.some(action => action.action === 'pass')).toBe(false)
    expect(decision.legalActions.some(action => action.action === 'play' && action.combinationType === 'single')).toBe(true)
    expect(decision.scenarioTags).toContain('lead_opening')
  })

  it('exports a follow decision with pass available after a table lead exists', () => {
    const session = new GameSession()
    session.startGame(mode, seats, openingHand)
    session.play(0, [openingHand[0]])

    const decision = exportDecisionPoint(session, { gameId: 'game-b' })

    expect(decision.currentPlayer).toBe(1)
    expect(decision.phase).toBe('follow')
    expect(decision.tableLead?.player).toBe(0)
    expect(decision.tableLead?.combination.type).toBe('single')
    expect(decision.publicHistory.map(event => event.type)).toEqual(['play'])
    expect(decision.legalActions.some(action => action.action === 'pass')).toBe(true)
    expect(decision.scenarioTags).toContain('follow_beat_or_pass')
  })
})
