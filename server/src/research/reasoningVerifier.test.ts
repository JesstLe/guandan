import { describe, expect, it } from 'vitest'
import type { AnyCard, GuandanDecisionPoint, LLMReasoningTrace } from '@guandan/shared'
import { verifyReasoningTrace } from './reasoningVerifier'

const threeSpade: AnyCard = { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }
const fourSpade: AnyCard = { rank: '4', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false }

function baseDecision(): GuandanDecisionPoint {
  return {
    schemaVersion: '0.1.0',
    gameId: 'game-a',
    decisionId: 'game-a-turn-1-player-1',
    turnIndex: 1,
    roundNumber: 1,
    currentPlayer: 1,
    teamId: 1,
    phase: 'follow',
    trumpRank: '7',
    privateHand: [fourSpade],
    tableLead: {
      player: 0,
      combination: {
        type: 'single',
        cards: [threeSpade],
        mainRank: '3',
        isTrump: false,
        wildcards: [],
      },
      passCount: 0,
    },
    publicHistory: [{
      eventId: 'event-play-0',
      type: 'play',
      player: 0,
      combination: {
        type: 'single',
        cards: [threeSpade],
        mainRank: '3',
        isTrump: false,
        wildcards: [],
      },
    }],
    handCounts: [3, 1, 27, 27],
    playedCardSummary: {
      playedCount: 1,
      trumpPlayed: 0,
      bombsPlayed: 0,
      bigCardsPlayed: 0,
    },
    inferences: [],
    legalActions: [
      {
        actionId: 'play-single-spade-4-copy1',
        action: 'play',
        cards: [fourSpade],
        combinationType: 'single',
        metadata: {
          beatsTable: true,
        },
      },
      {
        actionId: 'pass',
        action: 'pass',
        cards: [],
        combinationType: 'single',
        metadata: {
          beatsTable: false,
        },
      },
    ],
    actualActionId: null,
    outcome: null,
    scenarioTags: ['follow_beat_or_pass'],
  }
}

function taggedDecision(...scenarioTags: GuandanDecisionPoint['scenarioTags']): GuandanDecisionPoint {
  const decision = baseDecision()
  return {
    ...decision,
    handCounts: [3, 1, 2, 1],
    scenarioTags,
  }
}

function trace(selectedActionId: string, opponentSummary = 'Opponent may have higher cards'): LLMReasoningTrace {
  return {
    schemaVersion: '0.1.0',
    decisionId: 'game-a-turn-1-player-1',
    agentId: 'test-agent',
    selectedActionId,
    teamObjective: {
      type: 'gain_lead',
      explanation: 'Beat the current single to gain control.',
    },
    partnerBelief: {
      summary: 'Partner may prefer that we contest the lead.',
      confidence: 0.5,
      evidence: ['event-play-0'],
    },
    opponentBelief: {
      summary: opponentSummary,
      confidence: 0.5,
      evidence: ['event-play-0'],
    },
    actionRationale: {
      primaryReason: 'The selected action beats the table lead.',
      whyNotAlternatives: [{ actionId: 'pass', reason: 'Passing gives up the chance to win lead.' }],
    },
    riskAssessment: {
      risks: ['Opponent may still beat this single later.'],
      mitigation: 'Use the lowest beating card.',
    },
    confidence: 0.7,
  }
}

describe('reasoningVerifier', () => {
  it('passes hard labels for a legal selected action that beats the table', () => {
    const result = verifyReasoningTrace(baseDecision(), trace('play-single-spade-4-copy1'))

    expect(result.labels.legalAction.status).toBe('pass')
    expect(result.labels.beatsTable.status).toBe('pass')
    expect(result.labels.publicHistoryConsistent.status).toBe('pass')
    expect(result.labels.hiddenInfoDisciplined.status).toBe('pass')
    expect(result.labels.reasonActionConsistent.status).toBe('pass')
    expect(result.labels.teamObjectiveValid.status).toBe('pass')
    expect(result.hardFailures).toHaveLength(0)
  })

  it('fails hard labels when the selected action is not legal for the decision point', () => {
    const result = verifyReasoningTrace(baseDecision(), trace('play-single-spade-9-copy1'))

    expect(result.labels.legalAction.status).toBe('fail')
    expect(result.hardFailures.some(issue => issue.code === 'LEGAL_ACTION_NOT_FOUND')).toBe(true)
  })

  it('fails hidden-information discipline when unknown cards are asserted as facts', () => {
    const result = verifyReasoningTrace(
      baseDecision(),
      trace('pass', 'Opponent definitely has the big joker and the 2 of spades'),
    )

    expect(result.labels.legalAction.status).toBe('pass')
    expect(result.labels.hiddenInfoDisciplined.status).toBe('fail')
    expect(result.hardFailures.some(issue => issue.code === 'HIDDEN_INFO_ASSERTED_AS_FACT')).toBe(true)
  })

  it('adds soft warnings when objective and rationale conflict with a pass action', () => {
    const result = verifyReasoningTrace(baseDecision(), trace('pass'))

    expect(result.labels.legalAction.status).toBe('pass')
    expect(result.labels.reasonActionConsistent.status).toBe('fail')
    expect(result.labels.teamObjectiveValid.status).toBe('fail')
    expect(result.hardFailures).toHaveLength(0)
    expect(result.softWarnings.map(issue => issue.code)).toEqual(expect.arrayContaining([
      'REASON_ACTION_MISMATCH',
      'TEAM_OBJECTIVE_ACTION_MISMATCH',
    ]))
  })

  it('passes partner and opponent consistency when beliefs reflect near-finish public tags', () => {
    const beliefTrace = trace('play-single-spade-4-copy1')
    beliefTrace.partnerBelief.summary = 'Partner may be close to finishing based on public hand count.'
    beliefTrace.opponentBelief.summary = 'Opponent may be close to finishing based on public hand count.'

    const result = verifyReasoningTrace(
      taggedDecision('follow_beat_or_pass', 'partner_near_finish', 'opponent_near_finish'),
      beliefTrace,
    )

    expect(result.labels.partnerConsistent.status).toBe('pass')
    expect(result.labels.opponentConsistent.status).toBe('pass')
  })

  it('adds soft warnings when beliefs ignore near-finish public tags', () => {
    const beliefTrace = trace('play-single-spade-4-copy1')
    beliefTrace.partnerBelief.summary = 'Partner state is uncertain.'
    beliefTrace.opponentBelief.summary = 'Opponent state is uncertain.'

    const result = verifyReasoningTrace(
      taggedDecision('follow_beat_or_pass', 'partner_near_finish', 'opponent_near_finish'),
      beliefTrace,
    )

    expect(result.labels.partnerConsistent.status).toBe('fail')
    expect(result.labels.opponentConsistent.status).toBe('fail')
    expect(result.softWarnings.map(issue => issue.code)).toEqual(expect.arrayContaining([
      'PARTNER_BELIEF_OMITS_PUBLIC_TAG',
      'OPPONENT_BELIEF_OMITS_PUBLIC_TAG',
    ]))
  })
})
