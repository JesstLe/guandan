import { describe, expect, it } from 'vitest'
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writePaperTableArtifacts } from './paperTableArtifacts'

describe('paperTableArtifacts', () => {
  it('writes compact paper table sources without converting missing outputs into results', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-paper-tables-'))
    const metricsPath = join(rootDir, 'metrics.json')
    const revisionPath = join(rootDir, 'revision.json')
    const ablationPath = join(rootDir, 'ablation.json')
    const humanAuditPath = join(rootDir, 'human-audit-agreement.json')
    const humanAuditPacketQualityPath = join(rootDir, 'human-audit-packet-quality.json')
    const outputDir = join(rootDir, 'tables')

    writeFileSync(metricsPath, JSON.stringify({
      schemaVersion: '0.1.0',
      rows: [
        {
          agentId: 'strategic-heuristic',
          status: 'metrics_available',
          parsedTraces: 50,
          totalDecisionPoints: 50,
          hardFailures: 0,
          legalAction: '50 pass / 0 fail / 0 unknown / 0 n/a',
          hiddenInfoDisciplined: '50 pass / 0 fail / 0 unknown / 0 n/a',
          reasonActionConsistent: '50 pass / 0 fail / 0 unknown / 0 n/a',
          teamObjectiveValid: '50 pass / 0 fail / 0 unknown / 0 n/a',
        },
        {
          agentId: 'plain-llm',
          status: 'missing_raw_outputs',
          parsedTraces: 0,
          totalDecisionPoints: 50,
          hardFailures: null,
          legalAction: '[NEED_EXPERIMENT]',
          hiddenInfoDisciplined: '[NEED_EXPERIMENT]',
          reasonActionConsistent: '[NEED_EXPERIMENT]',
          teamObjectiveValid: '[NEED_EXPERIMENT]',
        },
      ],
    }), 'utf8')
    writeFileSync(revisionPath, JSON.stringify({
      schemaVersion: '0.1.0',
      status: 'missing_raw_outputs',
      rows: [
        {
          label: 'reasonActionConsistent',
          beforeFailureBurden: '[NEED_EXPERIMENT]',
          afterFailureBurden: '[NEED_EXPERIMENT]',
          burdenDelta: '[NEED_EXPERIMENT]',
        },
      ],
    }), 'utf8')
    writeFileSync(ablationPath, JSON.stringify({
      schemaVersion: '0.1.0',
      status: 'missing_metrics',
      rows: [
        {
          title: 'No Hidden-Info Check',
          status: 'missing_metrics',
          removedComponent: 'hidden-information discipline',
          targetFailureBurden: '[NEED_EXPERIMENT]',
          targetBurdenDeltaVsFull: '[NEED_EXPERIMENT]',
          reasonActionBurdenDeltaVsFull: '[NEED_EXPERIMENT]',
        },
      ],
    }), 'utf8')
    writeFileSync(humanAuditPath, JSON.stringify({
      schemaVersion: '0.1.0',
      status: 'pending',
      sampleCount: 40,
      completedRows: 0,
      fullyCompletedRows: 0,
      completedLabels: 0,
      totalLabels: 200,
      remainingLabels: 200,
      readyForPaperEvidence: false,
      macroAgreement: null,
      labels: [
        {
          label: 'humanPartnerConsistent',
          verifierLabel: 'verifierPartnerConsistent',
          completed: 0,
          matched: 0,
          agreement: null,
        },
      ],
    }), 'utf8')
    writeFileSync(humanAuditPacketQualityPath, JSON.stringify({
      schemaVersion: '0.1.0',
      status: 'packet_ready',
      sampleCount: 40,
      readyForAnnotation: true,
      readyForPaperEvidence: false,
      checks: [
        { id: 'blind-hides-verifier-labels', status: 'pass', detail: 'blind JSONL contains no verifier fields' },
        { id: 'answer-key-id-match', status: 'pass', detail: 'answer-key sample ids match blind ids' },
      ],
      warnings: ['Annotation CSV contains no human labels yet.'],
    }), 'utf8')

    try {
      const result = writePaperTableArtifacts({
        metricsSummaryPath: metricsPath,
        revisionComparisonPath: revisionPath,
        ablationSummaryPath: ablationPath,
        humanAuditAgreementPath: humanAuditPath,
        humanAuditPacketQualityPath,
        outputDir,
      })

      expect(result.tableZeroPath).toBe(join(outputDir, 'table-0-related-work-positioning.md'))
      expect(result.tableOnePath).toBe(join(outputDir, 'table-1-reasoning-reliability.md'))
      expect(result.tableTwoPath).toBe(join(outputDir, 'table-2-verifier-revision-effect.md'))
      expect(result.tableThreePath).toBe(join(outputDir, 'table-3-verifier-ablation.md'))
      expect(result.tableFourPath).toBe(join(outputDir, 'table-4-human-audit-agreement.md'))

      const tableZero = readFileSync(result.tableZeroPath, 'utf8')
      expect(tableZero).toContain('# Table 0: Related-Work Positioning')
      expect(tableZero).toContain('| Strat-Reasoner | multi-agent games |')
      expect(tableZero).toContain('| This project | Guandan decision points | zero explicit communication |')

      const tableOne = readFileSync(result.tableOnePath, 'utf8')
      expect(tableOne).toContain('| strategic-heuristic | metrics_available | 50 / 50 | 0 | 50/0/0 | 50/0/0 | 50/0/0 | 50/0/0 |')
      expect(tableOne).toContain('| plain-llm | missing_raw_outputs | 0 / 50 | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] |')
      expect(tableOne).toContain('Rows with `missing_raw_outputs` are not model results; rows with `partial_metrics_available` are exploratory partial evidence')

      const tableTwo = readFileSync(result.tableTwoPath, 'utf8')
      expect(tableTwo).toContain('Status: `missing_raw_outputs`')
      expect(tableTwo).toContain('| reasonActionConsistent | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] |')

      const tableThree = readFileSync(result.tableThreePath, 'utf8')
      expect(tableThree).toContain('Status: `missing_metrics`')
      expect(tableThree).toContain('| No Hidden-Info Check | missing_metrics | hidden-information discipline | [NEED_EXPERIMENT] |')

      const tableFour = readFileSync(result.tableFourPath, 'utf8')
      expect(tableFour).toContain('# Table 4: Human Soft-Label Audit Readiness')
      expect(tableFour).toContain('Agreement status: `pending`')
      expect(tableFour).toContain('Packet status: `packet_ready`')
      expect(tableFour).toContain('readiness artifact only')
      expect(tableFour).toContain('| Blind samples | 40 |')
      expect(tableFour).toContain('| Failed packet checks | 0 |')
      expect(tableFour).toContain('| Ready for annotation | yes |')
      expect(tableFour).toContain('| Packet ready for paper evidence | no |')
      expect(tableFour).toContain('| humanPartnerConsistent | 0 | 0 | n/a |')
      expect(tableFour).toContain('| Completed labels | 0 / 200 |')
      expect(tableFour).toContain('| Remaining labels | 200 |')
      expect(tableFour).toContain('| Ready for paper evidence | no |')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('renders completed human audit agreement as reportable paper evidence', () => {
    const output = writePaperTableArtifacts({
      metricsSummaryPath: fixtureJson({
        rows: [],
      }),
      revisionComparisonPath: fixtureJson({
        status: 'metrics_available',
        rows: [],
      }),
      ablationSummaryPath: fixtureJson({
        status: 'metrics_available',
        rows: [],
      }),
      humanAuditAgreementPath: fixtureJson({
        status: 'completed',
        sampleCount: 2,
        completedRows: 2,
        fullyCompletedRows: 2,
        completedLabels: 10,
        totalLabels: 10,
        remainingLabels: 0,
        readyForPaperEvidence: true,
        macroAgreement: 0.8,
        labels: [
          {
            label: 'humanReasonActionConsistent',
            verifierLabel: 'verifierReasonActionConsistent',
            completed: 2,
            matched: 1,
            agreement: 0.5,
          },
        ],
      }),
      outputDir: mkdtempSync(join(tmpdir(), 'guandan-paper-tables-completed-')),
    })

    const tableFour = readFileSync(output.tableFourPath, 'utf8')
    expect(tableFour).toContain('Agreement status: `completed`')
    expect(tableFour).toContain('can be reported as human agreement')
    expect(tableFour).toContain('| humanReasonActionConsistent | 2 | 1 | 50% |')
    expect(tableFour).toContain('| Remaining labels | 0 |')
    expect(tableFour).toContain('| Ready for paper evidence | yes |')
    expect(tableFour).toContain('| Macro agreement | 80% |')
  })

  it('falls back to completed minus total when older human-audit reports lack remaining-label metadata', () => {
    const output = writePaperTableArtifacts({
      metricsSummaryPath: fixtureJson({ rows: [] }),
      revisionComparisonPath: fixtureJson({ status: 'metrics_available', rows: [] }),
      ablationSummaryPath: fixtureJson({ status: 'metrics_available', rows: [] }),
      humanAuditAgreementPath: fixtureJson({
        status: 'partial',
        sampleCount: 2,
        completedRows: 1,
        fullyCompletedRows: 0,
        completedLabels: 3,
        totalLabels: 10,
        macroAgreement: null,
        labels: [],
      }),
      outputDir: mkdtempSync(join(tmpdir(), 'guandan-paper-tables-legacy-human-audit-')),
    })

    const tableFour = readFileSync(output.tableFourPath, 'utf8')
    expect(tableFour).toContain('| Remaining labels | 7 |')
    expect(tableFour).toContain('| Ready for paper evidence | no |')
  })
})

function fixtureJson(value: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), 'guandan-paper-table-fixture-'))
  const path = join(dir, 'fixture.json')
  writeFileSync(path, JSON.stringify(value), 'utf8')
  return path
}
