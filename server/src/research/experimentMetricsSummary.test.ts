import { describe, expect, it } from 'vitest'
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { renderMetricsSummaryMarkdown, writeMetricsSummary } from './experimentMetricsSummary'

describe('experimentMetricsSummary', () => {
  it('summarizes verifier metrics and raw-output audit rows without inventing LLM results', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-metrics-summary-'))
    const metricsPath = join(rootDir, 'metrics.json')
    const auditPath = join(rootDir, 'audit.json')
    const outputDir = join(rootDir, 'summary')

    writeFileSync(metricsPath, JSON.stringify({
      schemaVersion: '0.1.0',
      agentId: 'baseline',
      totalDecisionPoints: 2,
      hardFailureCount: 1,
      labelStatusCounts: {
        legalAction: statusCounts(1, 1, 0, 0),
        beatsTable: statusCounts(1, 0, 0, 1),
        publicHistoryConsistent: statusCounts(2, 0, 0, 0),
        hiddenInfoDisciplined: statusCounts(2, 0, 0, 0),
        partnerConsistent: statusCounts(1, 0, 1, 0),
        opponentConsistent: statusCounts(0, 1, 1, 0),
        reasonActionConsistent: statusCounts(1, 1, 0, 0),
        teamObjectiveValid: statusCounts(2, 0, 0, 0),
      },
    }), 'utf8')
    writeFileSync(auditPath, JSON.stringify({
      expectedCount: 2,
      presentCount: 0,
      missingCount: 2,
      emptyCount: 0,
      unexpectedCount: 0,
      readyForIngest: false,
    }), 'utf8')

    try {
      const result = writeMetricsSummary({
        outputDir,
        sources: [
          { agentId: 'baseline', metricsPath },
          { agentId: 'plain-llm', rawAuditPath: auditPath },
        ],
      })

      expect(result.summary.rows).toHaveLength(2)
      expect(result.summary.rows[0].status).toBe('metrics_available')
      expect(result.summary.rows[0].hardFailures).toBe(1)
      expect(result.summary.rows[1].status).toBe('missing_raw_outputs')
      expect(result.summary.rows[1].legalAction).toBe('[NEED_EXPERIMENT]')

      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('baseline')
      expect(markdown).toContain('missing_raw_outputs')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('renders markdown with escaped cells', () => {
    const markdown = renderMetricsSummaryMarkdown({
      schemaVersion: '0.1.0',
      rows: [{
        agentId: 'agent|x',
        status: 'missing_metrics',
        totalDecisionPoints: null,
        parsedTraces: null,
        parseFailures: null,
        hardFailures: null,
        legalAction: '[NEED_EXPERIMENT]',
        publicHistoryConsistent: '[NEED_EXPERIMENT]',
        hiddenInfoDisciplined: '[NEED_EXPERIMENT]',
        partnerOpponentTagConsistency: '[NEED_EXPERIMENT]',
        reasonActionConsistent: '[NEED_EXPERIMENT]',
        teamObjectiveValid: '[NEED_EXPERIMENT]',
        notes: 'needs|data',
      }],
    })

    expect(markdown).toContain('agent\\|x')
    expect(markdown).toContain('needs\\|data')
  })
})

function statusCounts(pass: number, fail: number, unknown: number, notApplicable: number) {
  return {
    pass,
    fail,
    unknown,
    not_applicable: notApplicable,
  }
}
