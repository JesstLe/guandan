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

    try {
      const result = writePaperTableArtifacts({
        metricsSummaryPath: metricsPath,
        revisionComparisonPath: revisionPath,
        ablationSummaryPath: ablationPath,
        outputDir,
      })

      expect(result.tableZeroPath).toBe(join(outputDir, 'table-0-related-work-positioning.md'))
      expect(result.tableOnePath).toBe(join(outputDir, 'table-1-reasoning-reliability.md'))
      expect(result.tableTwoPath).toBe(join(outputDir, 'table-2-verifier-revision-effect.md'))
      expect(result.tableThreePath).toBe(join(outputDir, 'table-3-verifier-ablation.md'))

      const tableZero = readFileSync(result.tableZeroPath, 'utf8')
      expect(tableZero).toContain('# Table 0: Related-Work Positioning')
      expect(tableZero).toContain('| Strat-Reasoner | multi-agent games |')
      expect(tableZero).toContain('| This project | Guandan decision points | zero explicit communication |')

      const tableOne = readFileSync(result.tableOnePath, 'utf8')
      expect(tableOne).toContain('| strategic-heuristic | metrics_available | 50 / 50 | 0 | 50/0/0 | 50/0/0 | 50/0/0 | 50/0/0 |')
      expect(tableOne).toContain('| plain-llm | missing_raw_outputs | 0 / 50 | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] |')
      expect(tableOne).toContain('Rows with `missing_raw_outputs` are not model results.')

      const tableTwo = readFileSync(result.tableTwoPath, 'utf8')
      expect(tableTwo).toContain('Status: `missing_raw_outputs`')
      expect(tableTwo).toContain('| reasonActionConsistent | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] |')

      const tableThree = readFileSync(result.tableThreePath, 'utf8')
      expect(tableThree).toContain('Status: `missing_metrics`')
      expect(tableThree).toContain('| No Hidden-Info Check | missing_metrics | hidden-information discipline | [NEED_EXPERIMENT] |')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
