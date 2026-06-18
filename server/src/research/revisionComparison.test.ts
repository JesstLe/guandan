import { describe, expect, it } from 'vitest'
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeRevisionComparison } from './revisionComparison'

describe('revisionComparison', () => {
  it('compares first-pass and verifier-revision metrics by failure burden', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-revision-comparison-'))
    const beforePath = join(rootDir, 'before.json')
    const afterPath = join(rootDir, 'after.json')
    const outputDir = join(rootDir, 'comparison')

    writeFileSync(beforePath, JSON.stringify(metricsFile({
      hardFailureCount: 3,
      legalAction: statusCounts(8, 1, 1, 0),
      reasonActionConsistent: statusCounts(6, 2, 2, 0),
      partnerConsistent: statusCounts(4, 1, 5, 0),
    })), 'utf8')
    writeFileSync(afterPath, JSON.stringify(metricsFile({
      hardFailureCount: 1,
      legalAction: statusCounts(9, 0, 1, 0),
      reasonActionConsistent: statusCounts(8, 1, 1, 0),
      partnerConsistent: statusCounts(5, 0, 5, 0),
    })), 'utf8')

    try {
      const result = writeRevisionComparison({
        outputDir,
        input: {
          firstPassAgentId: 'candidate-constrained-llm',
          revisionAgentId: 'verifier-revision-llm',
          firstPassMetricsPath: beforePath,
          revisionMetricsPath: afterPath,
        },
      })

      expect(result.comparison.status).toBe('metrics_available')
      expect(result.comparison.hardFailureDelta).toBe(-2)
      expect(result.comparison.rows.find(row => row.label === 'reasonActionConsistent')).toMatchObject({
        beforeFailureBurden: 4,
        afterFailureBurden: 2,
        burdenDelta: -2,
      })

      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('candidate-constrained-llm')
      expect(markdown).toContain('verifier-revision-llm')
      expect(markdown).toContain('| reasonActionConsistent | 4 | 2 | -2 |')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('renders an explicit non-result placeholder when raw outputs are missing', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-revision-comparison-missing-'))
    const beforeAuditPath = join(rootDir, 'before-audit.json')
    const revisionAuditPath = join(rootDir, 'revision-audit.json')
    const outputDir = join(rootDir, 'comparison')

    writeFileSync(beforeAuditPath, JSON.stringify(rawAudit(50, 0)), 'utf8')
    writeFileSync(revisionAuditPath, JSON.stringify(rawAudit(50, 0)), 'utf8')

    try {
      const result = writeRevisionComparison({
        outputDir,
        input: {
          firstPassAgentId: 'candidate-constrained-llm',
          revisionAgentId: 'verifier-revision-llm',
          firstPassRawAuditPath: beforeAuditPath,
          revisionRawAuditPath: revisionAuditPath,
        },
      })

      expect(result.comparison.status).toBe('missing_raw_outputs')
      expect(result.comparison.rows[0].beforeFailureBurden).toBe('[NEED_EXPERIMENT]')
      expect(result.comparison.rows[0].afterFailureBurden).toBe('[NEED_EXPERIMENT]')

      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('Rows marked `[NEED_EXPERIMENT]` are not model results.')
      expect(markdown).toContain('missing_raw_outputs')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function metricsFile(overrides: {
  hardFailureCount: number
  legalAction?: ReturnType<typeof statusCounts>
  reasonActionConsistent?: ReturnType<typeof statusCounts>
  partnerConsistent?: ReturnType<typeof statusCounts>
}) {
  const defaults = statusCounts(10, 0, 0, 0)
  return {
    schemaVersion: '0.1.0',
    agentId: 'agent',
    totalDecisionPoints: 10,
    totalParsedTraces: 10,
    parseFailureCount: 0,
    hardFailureCount: overrides.hardFailureCount,
    labelStatusCounts: {
      legalAction: overrides.legalAction ?? defaults,
      beatsTable: defaults,
      publicHistoryConsistent: defaults,
      hiddenInfoDisciplined: defaults,
      partnerConsistent: overrides.partnerConsistent ?? defaults,
      opponentConsistent: defaults,
      reasonActionConsistent: overrides.reasonActionConsistent ?? defaults,
      teamObjectiveValid: defaults,
    },
  }
}

function statusCounts(pass: number, fail: number, unknown: number, notApplicable: number) {
  return {
    pass,
    fail,
    unknown,
    not_applicable: notApplicable,
  }
}

function rawAudit(expectedCount: number, presentCount: number) {
  return {
    expectedCount,
    presentCount,
    missingCount: expectedCount - presentCount,
    emptyCount: 0,
    unexpectedCount: 0,
    readyForIngest: presentCount === expectedCount,
  }
}
