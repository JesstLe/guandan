import { describe, expect, it } from 'vitest'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

describe('writeFigureArtifactsCli', () => {
  it('writes paper figure artifacts with manuscript-aligned numbering', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-figure-artifacts-'))
    const outDir = join(rootDir, 'figures')
    const tomMetricsPath = join(rootDir, 'tom-metrics.json')
    const repairMetricsPath = join(rootDir, 'repair-metrics.json')
    const pilotSummaryPath = join(rootDir, 'pilot-summary.json')
    const attributionPath = join(rootDir, 'attribution.json')

    try {
      mkdirSync(outDir, { recursive: true })
      const staleFiles = [
        'figure-2-tom-schema-repair-flow.svg',
        'figure-2-tom-schema-repair-flow.md',
        'figure-3-main-pilot-results.svg',
        'figure-3-main-pilot-results.md',
      ]
      for (const file of staleFiles) {
        writeFileSync(join(outDir, file), 'stale figure artifact', 'utf8')
      }

      writeFileSync(tomMetricsPath, JSON.stringify({
        totalDecisionPoints: 50,
        totalParsedTraces: 36,
        parseFailureCount: 14,
        hardFailureCount: 1,
      }), 'utf8')
      writeFileSync(repairMetricsPath, JSON.stringify({
        totalDecisionPoints: 50,
        totalParsedTraces: 49,
        parseFailureCount: 1,
        hardFailureCount: 1,
        repairStatusCounts: {
          passThrough: 36,
          repaired: 13,
          notRepairable: 1,
        },
      }), 'utf8')
      writeFileSync(pilotSummaryPath, JSON.stringify({
        rows: [
          {
            agentId: 'plain-llm',
            status: 'metrics_available',
            totalDecisionPoints: 50,
            parsedTraces: 26,
            parseFailures: 24,
            hardFailures: 26,
            notes: '',
          },
          {
            agentId: 'candidate-constrained-llm',
            status: 'metrics_available',
            totalDecisionPoints: 50,
            parsedTraces: 32,
            parseFailures: 18,
            hardFailures: 35,
            notes: '',
          },
          {
            agentId: 'tom-prompted-llm',
            status: 'metrics_available',
            totalDecisionPoints: 50,
            parsedTraces: 36,
            parseFailures: 14,
            hardFailures: 1,
            notes: '',
          },
          {
            agentId: 'verifier-revision-llm',
            status: 'metrics_available',
            totalDecisionPoints: 32,
            parsedTraces: 32,
            parseFailures: 0,
            hardFailures: 10,
            notes: '',
          },
        ],
      }), 'utf8')
      writeFileSync(attributionPath, JSON.stringify({
        pairedDecisionCount: 32,
        excludedParseFailureCount: 18,
        hardFailureAttribution: {
          beforeHardFailureCount: 35,
          afterHardFailureCount: 10,
          hardFailureDelta: -25,
          hardFailureDeltaBootstrap95Ci: [-32, -18],
          decisionLevelMcnemar: {
            beforeOnly: 20,
            afterOnly: 0,
            exactPValue: 0.000001,
          },
        },
        hardComponentRows: [
          {
            label: 'publicHistoryConsistent',
            beforeFail: 29,
            afterFail: 9,
            failDelta: -20,
            shareOfHardFailureDrop: 0.8,
          },
          {
            label: 'hiddenInfoDisciplined',
            beforeFail: 6,
            afterFail: 1,
            failDelta: -5,
            shareOfHardFailureDrop: 0.2,
          },
        ],
      }), 'utf8')

      const stdout = execFileSync('npx', [
        'tsx',
        'server/src/research/writeFigureArtifactsCli.ts',
        '--out',
        outDir,
        '--tom-metrics',
        tomMetricsPath,
        '--repair-metrics',
        repairMetricsPath,
        '--pilot-summary',
        pilotSummaryPath,
        '--attribution',
        attributionPath,
      ], {
        cwd: process.cwd(),
        encoding: 'utf8',
      })
      const report = JSON.parse(stdout)

      expect(report.revisionArchitectureSvgPath).toBe(join(outDir, 'figure-2-revision-architecture.svg'))
      expect(report.tomSchemaRepairSvgPath).toBe(join(outDir, 'figure-3-tom-schema-repair-flow.svg'))
      expect(report.mainResultsSvgPath).toBe(join(outDir, 'figure-4-main-pilot-results.svg'))
      expect(report.pairedDecisionCount).toBe(32)
      expect(report.removedStaleFigurePaths).toEqual(staleFiles.map(file => join(outDir, file)))

      const expectedFiles = [
        'figure-1-verifier-pipeline.svg',
        'figure-1-verifier-pipeline.md',
        'figure-2-revision-architecture.svg',
        'figure-2-revision-architecture.md',
        'figure-3-tom-schema-repair-flow.svg',
        'figure-3-tom-schema-repair-flow.md',
        'figure-4-main-pilot-results.svg',
        'figure-4-main-pilot-results.md',
      ]
      for (const file of expectedFiles) {
        expect(existsSync(join(outDir, file))).toBe(true)
      }

      for (const file of staleFiles) {
        expect(existsSync(join(outDir, file))).toBe(false)
      }

      expect(readFileSync(join(outDir, 'figure-2-revision-architecture.md'), 'utf8'))
        .toContain('# Figure 2: Verifier-Grounded Revision Architecture')
      expect(readFileSync(join(outDir, 'figure-3-tom-schema-repair-flow.md'), 'utf8'))
        .toContain('# Figure 3: ToM Schema-Repair Flow')
      expect(readFileSync(join(outDir, 'figure-4-main-pilot-results.md'), 'utf8'))
        .toContain('# Figure 4: Main Pilot Results')
      const pipelineMarkdown = readFileSync(join(outDir, 'figure-1-verifier-pipeline.md'), 'utf8')
      expect(pipelineMarkdown).toContain('| D | Paired evidence accounting |')
      const pipelineSvg = readFileSync(join(outDir, 'figure-1-verifier-pipeline.svg'), 'utf8')
      expect(pipelineSvg).toContain('Verifier-Grounded Reasoning Turns Game Play into Auditable Evidence')
      expect(pipelineSvg).toContain('D. Paired evidence')
      expect(pipelineSvg).toContain('hard failures')
      const mainResultsSvg = readFileSync(join(outDir, 'figure-4-main-pilot-results.svg'), 'utf8')
      expect(mainResultsSvg).toContain('A. End-to-end parse yield')
      expect(mainResultsSvg).toContain('B. Paired verifier revision')
      expect(mainResultsSvg).toContain('C. What failures disappear?')
      const revisionSvg = readFileSync(join(outDir, 'figure-2-revision-architecture.svg'), 'utf8')
      expect(revisionSvg).toContain('<title id="title">Verifier-grounded revision architecture</title>')
      expect(revisionSvg).toContain('A. First-pass trace')
      expect(revisionSvg).toContain('B. Verifier feedback')
      expect(revisionSvg).toContain('C. Bounded revision')
      expect(revisionSvg).toContain('hard failures 35 to 10')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
