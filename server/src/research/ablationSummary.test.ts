import { describe, expect, it } from 'vitest'
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  summarizeAblations,
  writeAblationSummary,
} from './ablationSummary'

describe('ablationSummary', () => {
  it('emits a readiness artifact without treating missing metrics as results', () => {
    const summary = summarizeAblations({
      fullVerifierMetricsPath: 'missing-full.json',
      variants: [
        {
          variantId: 'no-hidden-info-check',
          title: 'No Hidden-Info Check',
          removedComponent: 'hidden information',
          targetLabel: 'hiddenInfoDisciplined',
          metricsPath: 'missing-variant.json',
        },
      ],
    })

    expect(summary.status).toBe('missing_metrics')
    expect(summary.rows[0]).toMatchObject({
      status: 'missing_metrics',
      hardFailures: '[NEED_EXPERIMENT]',
      targetFailureBurden: '[NEED_EXPERIMENT]',
    })
    expect(summary.notes).toContain('readiness artifact')
  })

  it('computes ablation deltas when full and variant metrics exist', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-ablation-summary-'))
    const fullPath = join(rootDir, 'full.json')
    const variantPath = join(rootDir, 'variant.json')
    const outputDir = join(rootDir, 'out')

    try {
      writeFileSync(fullPath, JSON.stringify(metricsFile({
        hardFailures: 1,
        hiddenFail: 2,
        hiddenUnknown: 1,
        reasonFail: 1,
        reasonUnknown: 0,
      })), 'utf8')
      writeFileSync(variantPath, JSON.stringify(metricsFile({
        hardFailures: 4,
        hiddenFail: 5,
        hiddenUnknown: 2,
        reasonFail: 3,
        reasonUnknown: 1,
      })), 'utf8')

      const result = writeAblationSummary({
        outputDir,
        input: {
          fullVerifierMetricsPath: fullPath,
          variants: [
            {
              variantId: 'no-hidden-info-check',
              title: 'No Hidden-Info Check',
              removedComponent: 'hidden information',
              targetLabel: 'hiddenInfoDisciplined',
              metricsPath: variantPath,
            },
          ],
        },
      })

      expect(result.summary.status).toBe('metrics_available')
      expect(result.summary.rows[0]).toMatchObject({
        status: 'metrics_available',
        hardFailures: 4,
        hardFailureDeltaVsFull: 3,
        targetFailureBurden: 7,
        targetBurdenDeltaVsFull: 4,
        reasonActionFailureBurden: 4,
        reasonActionBurdenDeltaVsFull: 3,
      })

      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('# Verifier Ablation Summary')
      expect(markdown).toContain('| No Hidden-Info Check | metrics_available |')
      expect(JSON.parse(readFileSync(result.jsonPath, 'utf8')).status).toBe('metrics_available')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('computes post-hoc label ablations from paired attribution rows', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-post-hoc-ablation-'))
    const attributionPath = join(rootDir, 'attribution.json')

    try {
      writeFileSync(attributionPath, JSON.stringify({
        status: 'metrics_available',
        pairedDecisionCount: 32,
        hardFailureAttribution: {
          beforeHardFailureCount: 35,
          afterHardFailureCount: 10,
          hardFailureDelta: -25,
        },
        labelRows: [
          {
            label: 'publicHistoryConsistent',
            beforeFailureBurden: 29,
            afterFailureBurden: 9,
            burdenDelta: -20,
          },
          {
            label: 'hiddenInfoDisciplined',
            beforeFailureBurden: 6,
            afterFailureBurden: 1,
            burdenDelta: -5,
          },
          {
            label: 'reasonActionConsistent',
            beforeFailureBurden: 1,
            afterFailureBurden: 0,
            burdenDelta: -1,
          },
        ],
      }), 'utf8')

      const summary = summarizeAblations({
        attributionPath,
        variants: [
          {
            variantId: 'no-public-history-check',
            title: 'No Public-History Check',
            removedComponent: 'public-history consistency',
            targetLabel: 'publicHistoryConsistent',
          },
          {
            variantId: 'no-hidden-info-check',
            title: 'No Hidden-Info Check',
            removedComponent: 'hidden information',
            targetLabel: 'hiddenInfoDisciplined',
          },
        ],
      })

      expect(summary).toMatchObject({
        status: 'metrics_available',
        analysisMode: 'post_hoc_label_ablation',
        pairedDecisionCount: 32,
        fullObservedBurdenDelta: -26,
        fullObservedBurdenReduction: 26,
      })
      expect(summary.rows[0]).toMatchObject({
        status: 'metrics_available',
        targetBeforeBurden: 29,
        targetAfterBurden: 9,
        targetBurdenDeltaVsFull: -20,
        residualBurdenDeltaWithoutTarget: -6,
      })
      expect(summary.rows[0].shareOfObservedReduction).toBeCloseTo(20 / 26)
      expect(summary.notes).toContain('Post-hoc label ablations')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function metricsFile(options: {
  hardFailures: number
  hiddenFail: number
  hiddenUnknown: number
  reasonFail: number
  reasonUnknown: number
}) {
  return {
    hardFailureCount: options.hardFailures,
    labelStatusCounts: {
      hiddenInfoDisciplined: {
        pass: 10,
        fail: options.hiddenFail,
        unknown: options.hiddenUnknown,
        not_applicable: 0,
      },
      reasonActionConsistent: {
        pass: 10,
        fail: options.reasonFail,
        unknown: options.reasonUnknown,
        not_applicable: 0,
      },
    },
  }
}
