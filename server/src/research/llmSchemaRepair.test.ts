import { describe, expect, it } from 'vitest'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { GuandanDecisionPoint, LLMReasoningTrace } from '@guandan/shared'
import { repairRawTrace, runLLMSchemaRepair } from './llmSchemaRepair'

describe('llmSchemaRepair', () => {
  it('passes through valid traces, repairs nested ToM JSON, and rejects tool-call-like output', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-llm-schema-repair-'))
    const decisionsDir = join(rootDir, 'decisions')
    const rawDir = join(rootDir, 'raw')
    const outDir = join(rootDir, 'out')
    mkdirSync(decisionsDir, { recursive: true })
    mkdirSync(rawDir, { recursive: true })

    try {
      const decisions = ['d-pass', 'd-repair', 'd-tool'].map(decisionId => makeDecision(decisionId))
      for (const decision of decisions) {
        writeJson(join(decisionsDir, `${decision.decisionId}.json`), decision)
      }

      writeJson(join(rawDir, 'd-pass.txt'), makeTrace('d-pass', 'source-agent'))
      writeJson(join(rawDir, 'd-repair.txt'), {
        selectedActionId: 'pass-1',
        reasoning: {
          teamObjective: 'Pass to save resources while partner and opponent states remain uncertain.',
          partnerBelief: { summary: 'Partner state is uncertain from public event e-1.' },
          opponentBelief: { summary: 'Opponent pressure is possible but not certain.' },
          actionRationale: { primaryReason: 'Passing preserves resources.' },
          riskAssessment: {
            risks: ['Partner may still need help later.'],
            mitigation: 'Use only public evidence e-1.',
          },
        },
        confidence: 0.71,
      })
      writeJson(join(rawDir, 'd-tool.txt'), {
        action: 'search_files',
        path: '/tmp/project',
        pattern: 'schema',
      })

      const result = runLLMSchemaRepair({
        decisionsDir,
        rawOutputDir: rawDir,
        outputDir: outDir,
        agentId: 'tom-schema-repair-test',
      })
      const metrics = JSON.parse(readFileSync(result.metricsPath, 'utf8')) as {
        totalParsedTraces: number
        parseFailureCount: number
        repairStatusCounts: { passThrough: number; repaired: number; notRepairable: number }
      }

      expect(metrics.totalParsedTraces).toBe(2)
      expect(metrics.parseFailureCount).toBe(1)
      expect(metrics.repairStatusCounts).toEqual({
        passThrough: 1,
        repaired: 1,
        notRepairable: 1,
      })
      expect(readFileSync(result.markdownPath, 'utf8')).toContain('deterministic schema-normalization')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('preserves selectedActionId when repairing non-conforming reasoning output', () => {
    const decision = makeDecision('d-direct')
    const outcome = repairRawTrace(JSON.stringify({
      selectedActionId: 'pass-1',
      reasoningTrace: {
        conclusion: 'Passing is the lowest-risk option from public context.',
      },
      confidence: 0.8,
    }), decision, 'repair-agent')

    expect(outcome?.status).toBe('repaired')
    expect(outcome?.trace.selectedActionId).toBe('pass-1')
    expect(outcome?.trace.agentId).toBe('repair-agent')
  })
})

function makeDecision(decisionId: string): GuandanDecisionPoint {
  return {
    schemaVersion: '0.1.0',
    gameId: 'g-test',
    decisionId,
    turnIndex: 1,
    currentPlayer: 0,
    teamId: 0,
    phase: 'follow',
    trumpRank: '2',
    tableLead: {
      player: 1,
      combination: {
        type: 'single',
        cards: [],
        isTrump: false,
        wildcards: [],
      },
      passCount: 0,
    },
    publicHistory: [
      {
        eventId: 'e-1',
        type: 'play',
        player: 1,
      },
    ],
    handCounts: [6, 5, 7, 4],
    playedCardSummary: {
      playedCount: 10,
      trumpPlayed: 1,
      bombsPlayed: 0,
      bigCardsPlayed: 2,
    },
    legalActions: [
      {
        actionId: 'pass-1',
        action: 'pass',
        cards: [],
        combinationType: 'single',
      },
    ],
    scenarioTags: ['follow_beat_or_pass'],
  }
}

function makeTrace(decisionId: string, agentId: string): LLMReasoningTrace {
  return {
    schemaVersion: '0.1.0',
    decisionId,
    agentId,
    selectedActionId: 'pass-1',
    teamObjective: {
      type: 'save_resources',
      explanation: 'Pass to preserve resources.',
    },
    partnerBelief: {
      summary: 'Partner state is uncertain from public event e-1.',
      confidence: 0.7,
      evidence: ['e-1'],
    },
    opponentBelief: {
      summary: 'Opponent state is uncertain from public event e-1.',
      confidence: 0.7,
      evidence: ['e-1'],
    },
    actionRationale: {
      primaryReason: 'Passing preserves resources.',
      whyNotAlternatives: [],
    },
    riskAssessment: {
      risks: ['Future opportunity cost remains uncertain.'],
      mitigation: 'Track public events only.',
    },
    confidence: 0.7,
  }
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
