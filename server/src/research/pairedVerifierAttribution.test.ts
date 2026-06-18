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
import type { LLMReasoningTrace, VerifierResult } from '@guandan/shared'
import { writeVerifierAttribution } from './pairedVerifierAttribution'

describe('pairedVerifierAttribution', () => {
  it('builds paired label deltas, uncertainty estimates, and case pack', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-verifier-attribution-'))
    const beforeResultsDir = join(rootDir, 'before-results')
    const afterResultsDir = join(rootDir, 'after-results')
    const beforeTracesDir = join(rootDir, 'before-traces')
    const afterTracesDir = join(rootDir, 'after-traces')
    const outputDir = join(rootDir, 'out')
    mkdirp(beforeResultsDir)
    mkdirp(afterResultsDir)
    mkdirp(beforeTracesDir)
    mkdirp(afterTracesDir)

    writeResult(beforeResultsDir, result('d1', {
      publicHistoryConsistent: 'fail',
      hiddenInfoDisciplined: 'pass',
      partnerConsistent: 'fail',
      opponentConsistent: 'unknown',
    }, ['UNKNOWN_PUBLIC_EVIDENCE']))
    writeResult(afterResultsDir, result('d1', {
      publicHistoryConsistent: 'pass',
      hiddenInfoDisciplined: 'pass',
      partnerConsistent: 'pass',
      opponentConsistent: 'unknown',
    }, []))
    writeTrace(beforeTracesDir, trace('d1', 'play-a', 'before reason'))
    writeTrace(afterTracesDir, trace('d1', 'play-a', 'after reason'))

    writeResult(beforeResultsDir, result('d2', {
      publicHistoryConsistent: 'pass',
      hiddenInfoDisciplined: 'fail',
      partnerConsistent: 'unknown',
      opponentConsistent: 'unknown',
    }, ['HIDDEN_INFO_ASSERTED']))
    writeResult(afterResultsDir, result('d2', {
      publicHistoryConsistent: 'pass',
      hiddenInfoDisciplined: 'pass',
      partnerConsistent: 'unknown',
      opponentConsistent: 'unknown',
    }, []))
    writeTrace(beforeTracesDir, trace('d2', 'play-b', 'same'))
    writeTrace(afterTracesDir, trace('d2', 'play-b', 'same'))

    writeResult(beforeResultsDir, result('d3', {
      publicHistoryConsistent: 'fail',
      hiddenInfoDisciplined: 'pass',
      partnerConsistent: 'unknown',
      opponentConsistent: 'unknown',
    }, ['UNKNOWN_PUBLIC_EVIDENCE']))
    writeResult(afterResultsDir, result('d3', {
      publicHistoryConsistent: 'fail',
      hiddenInfoDisciplined: 'pass',
      partnerConsistent: 'unknown',
      opponentConsistent: 'unknown',
    }, ['UNKNOWN_PUBLIC_EVIDENCE']))
    writeTrace(beforeTracesDir, trace('d3', 'play-c', 'before'))
    writeTrace(afterTracesDir, trace('d3', 'play-c', 'after'))

    const parseReportPath = join(rootDir, 'post-provider-report.json')
    writeFileSync(parseReportPath, JSON.stringify({
      ingest: {
        failures: [{
          decisionId: 'd0',
          rawOutputFile: 'raw/d0.txt',
          message: 'Parsed JSON does not match the required reasoning trace shape.',
        }],
      },
    }), 'utf8')

    try {
      const result = writeVerifierAttribution({
        outputDir,
        input: {
          beforeAgentId: 'candidate-constrained-llm',
          afterAgentId: 'verifier-revision-llm',
          beforeResultsDir,
          afterResultsDir,
          beforeTracesDir,
          afterTracesDir,
          parseFailureReportPath: parseReportPath,
          bootstrapIterations: 100,
          bootstrapSeed: 7,
        },
      })

      expect(result.report.status).toBe('metrics_available')
      expect(result.report.pairedDecisionCount).toBe(3)
      expect(result.report.excludedParseFailureCount).toBe(1)
      expect(result.report.hardFailureAttribution).toMatchObject({
        beforeHardFailureCount: 3,
        afterHardFailureCount: 1,
        hardFailureDelta: -2,
      })
      expect(result.report.labelRows.find(row => row.label === 'publicHistoryConsistent')).toMatchObject({
        beforeFailureBurden: 2,
        afterFailureBurden: 1,
        burdenDelta: -1,
      })
      expect(result.report.hardComponentRows.find(row => row.label === 'hiddenInfoDisciplined')).toMatchObject({
        beforeFail: 1,
        afterFail: 0,
        failDelta: -1,
      })
      expect(result.report.qualitativeCases.map(entry => entry.caseType)).toEqual([
        'public_history_repaired',
        'hidden_info_repaired',
        'remaining_hard_failure',
        'parse_failure_outside_revision',
      ])

      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('# Paired Verifier Attribution')
      expect(markdown).toContain('Hard failures: 3 -> 1 (-2)')
      expect(markdown).toContain('public_history_repaired')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function result(
  decisionId: string,
  statuses: Partial<Record<keyof VerifierResult['labels'], VerifierResult['labels']['legalAction']['status']>>,
  hardFailureCodes: string[],
): VerifierResult {
  const label = (status: VerifierResult['labels']['legalAction']['status']) => ({
    status,
    score: status === 'pass' ? 1 : 0,
    evidence: [`${status} evidence`],
  })

  return {
    schemaVersion: '0.1.0',
    decisionId,
    agentId: 'agent',
    selectedActionId: 'play-a',
    labels: {
      legalAction: label(statuses.legalAction ?? 'pass'),
      beatsTable: label(statuses.beatsTable ?? 'not_applicable'),
      publicHistoryConsistent: label(statuses.publicHistoryConsistent ?? 'pass'),
      hiddenInfoDisciplined: label(statuses.hiddenInfoDisciplined ?? 'pass'),
      partnerConsistent: label(statuses.partnerConsistent ?? 'pass'),
      opponentConsistent: label(statuses.opponentConsistent ?? 'pass'),
      reasonActionConsistent: label(statuses.reasonActionConsistent ?? 'pass'),
      teamObjectiveValid: label(statuses.teamObjectiveValid ?? 'pass'),
    },
    hardFailures: hardFailureCodes.map(code => ({ code, message: code })),
    softWarnings: [],
    summary: 'summary',
  }
}

function trace(decisionId: string, selectedActionId: string, primaryReason: string): LLMReasoningTrace {
  return {
    schemaVersion: '0.1.0',
    decisionId,
    agentId: 'agent',
    selectedActionId,
    teamObjective: { type: 'gain_lead', explanation: 'objective' },
    partnerBelief: { summary: 'partner', confidence: 0.5, evidence: [] },
    opponentBelief: { summary: 'opponent', confidence: 0.5, evidence: [] },
    actionRationale: { primaryReason, whyNotAlternatives: [] },
    riskAssessment: { risks: [], mitigation: 'mitigation' },
    confidence: 0.5,
  }
}

function writeResult(dir: string, value: VerifierResult) {
  writeFileSync(join(dir, `${value.decisionId}.json`), JSON.stringify(value, null, 2), 'utf8')
}

function writeTrace(dir: string, value: LLMReasoningTrace) {
  writeFileSync(join(dir, `${value.decisionId}.json`), JSON.stringify(value, null, 2), 'utf8')
}

function mkdirp(path: string) {
  mkdirSync(path, { recursive: true })
}
