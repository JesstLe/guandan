import { describe, expect, it } from 'vitest'
import { generatePilotDecisionDataset } from './pilotDatasetExporter'
import { createBaselineTrace } from './baselineTraceAgents'

describe('baselineTraceAgents', () => {
  it('keeps the original legal-first trace agent for pipeline validation', () => {
    const dataset = generatePilotDecisionDataset({ targetCount: 1, gameIdPrefix: 'baseline' })
    const trace = createBaselineTrace(dataset.decisions[0], 'heuristic-legal-first')

    expect(trace.agentId).toBe('heuristic-legal-first')
    expect(trace.selectedActionId).toBe(dataset.decisions[0].legalActions[0].actionId)
    expect(trace.notes).toContain('pipeline')
  })

  it('uses the strategic heuristic to beat the table instead of passing when a legal play exists', () => {
    const dataset = generatePilotDecisionDataset({ targetCount: 2, gameIdPrefix: 'baseline' })
    const followDecision = dataset.decisions[1]
    const trace = createBaselineTrace(followDecision, 'strategic-heuristic')

    const selected = followDecision.legalActions.find(action => action.actionId === trace.selectedActionId)
    expect(followDecision.phase).toBe('follow')
    expect(selected?.action).toBe('play')
    expect(trace.teamObjective.type).toBe('gain_lead')
    expect(trace.agentId).toBe('strategic-heuristic')
  })

  it('uses finish-hand objective when the strategic heuristic is in an endgame race', () => {
    const dataset = generatePilotDecisionDataset({ targetCount: 5, gameIdPrefix: 'baseline' })
    const endgameDecision = dataset.decisions[4]
    const trace = createBaselineTrace(endgameDecision, 'strategic-heuristic')

    expect(endgameDecision.scenarioTags).toContain('endgame_race')
    expect(trace.teamObjective.type).toBe('finish_hand')
    expect(trace.selectedActionId).not.toBe('pass')
  })
})
