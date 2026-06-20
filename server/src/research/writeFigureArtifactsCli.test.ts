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
        qualitativeCases: [
          {
            caseType: 'public_history_repaired',
            decisionId: 'pilot-e1-002-turn-1-player-0',
            beforeSelectedActionId: 'play-single-diamond-3-copy1',
            afterSelectedActionId: 'play-single-diamond-3-copy1',
            actionChanged: false,
            primaryReasonChanged: false,
            labelStatuses: {
              publicHistoryConsistent: { before: 'fail', after: 'pass' },
              partnerConsistent: { before: 'fail', after: 'pass' },
            },
            beforeIssues: ['UNKNOWN_PUBLIC_EVIDENCE'],
            afterIssues: [],
          },
          {
            caseType: 'hidden_info_repaired',
            decisionId: 'pilot-e1-013-turn-1-player-0',
            beforeSelectedActionId: 'play-single-club-3-copy1',
            afterSelectedActionId: 'play-single-club-3-copy1',
            actionChanged: false,
            primaryReasonChanged: true,
            labelStatuses: {
              publicHistoryConsistent: { before: 'fail', after: 'pass' },
              hiddenInfoDisciplined: { before: 'fail', after: 'pass' },
            },
            beforeIssues: ['UNKNOWN_PUBLIC_EVIDENCE', 'HIDDEN_INFO_ASSERTED_AS_FACT'],
            afterIssues: [],
          },
          {
            caseType: 'remaining_hard_failure',
            decisionId: 'pilot-e1-004-turn-1-player-0',
            beforeSelectedActionId: 'play-single-spade-A-copy2',
            afterSelectedActionId: 'play-single-spade-A-copy2',
            actionChanged: false,
            primaryReasonChanged: false,
            labelStatuses: {
              publicHistoryConsistent: { before: 'fail', after: 'fail' },
            },
            beforeIssues: ['UNKNOWN_PUBLIC_EVIDENCE'],
            afterIssues: ['UNKNOWN_PUBLIC_EVIDENCE'],
          },
          {
            caseType: 'parse_failure_outside_revision',
            decisionId: 'pilot-e1-000-turn-1-player-0',
            beforeSelectedActionId: null,
            afterSelectedActionId: null,
            actionChanged: null,
            primaryReasonChanged: null,
            labelStatuses: {},
            beforeIssues: [],
            afterIssues: [],
            parseFailureMessage: 'Parsed JSON does not match the required reasoning trace shape.',
            rawOutputFile: 'raw/pilot-e1-000-turn-1-player-0.txt',
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
      expect(report.qualitativeCasePackSvgPath).toBe(join(outDir, 'figure-5-qualitative-case-pack.svg'))
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
        'figure-5-qualitative-case-pack.svg',
        'figure-5-qualitative-case-pack.md',
      ]
      for (const file of expectedFiles) {
        expect(existsSync(join(outDir, file))).toBe(true)
      }

      for (const file of staleFiles) {
        expect(existsSync(join(outDir, file))).toBe(false)
      }

      expect(readFileSync(join(outDir, 'figure-2-revision-architecture.md'), 'utf8'))
        .toContain('# Figure 2: Trace-Contract Verifier Architecture')
      expect(readFileSync(join(outDir, 'figure-3-tom-schema-repair-flow.md'), 'utf8'))
        .toContain('# Figure 3: ToM Schema-Repair Flow')
      expect(readFileSync(join(outDir, 'figure-4-main-pilot-results.md'), 'utf8'))
        .toContain('# Figure 4: Main Pilot Results')
      expect(readFileSync(join(outDir, 'figure-5-qualitative-case-pack.md'), 'utf8'))
        .toContain('# Figure 5: Qualitative Verifier-Attribution Case Pack')
      const pipelineMarkdown = readFileSync(join(outDir, 'figure-1-verifier-pipeline.md'), 'utf8')
      expect(pipelineMarkdown).toContain('| A | Cooperation contrast |')
      expect(pipelineMarkdown).toContain('| B | Hidden team play |')
      expect(pipelineMarkdown).toContain('| C | Trace contract and verifier |')
      expect(pipelineMarkdown).toContain('| D | Paired evidence accounting |')
      const pipelineSvg = readFileSync(join(outDir, 'figure-1-verifier-pipeline.svg'), 'utf8')
      expect(pipelineSvg).toContain('Verifiable Reasoning When Teammates Cannot Talk')
      expect(pipelineSvg).toContain('A. Explicit communication')
      expect(pipelineSvg).toContain('B. Zero-communication play')
      expect(pipelineSvg).toContain('no chat')
      expect(pipelineSvg).toContain('C. Decision packet')
      expect(pipelineSvg).toContain('D. Structured trace')
      expect(pipelineSvg).toContain('E. Rule-grounded checks')
      expect(pipelineSvg).toContain('F. Same-id paired revision')
      expect(pipelineSvg).toContain('V(d_t, r_t, a_t)')
      expect(pipelineSvg).toContain('labels y_t + issues e_t')
      expect(pipelineSvg).toContain('public history')
      expect(pipelineSvg).toContain('hidden-info')
      expect(pipelineSvg).toContain('hard failures')
      const mainResultsSvg = readFileSync(join(outDir, 'figure-4-main-pilot-results.svg'), 'utf8')
      expect(mainResultsSvg).toContain('A. End-to-end parse yield')
      expect(mainResultsSvg).toContain('B. Paired verifier revision')
      expect(mainResultsSvg).toContain('C. What failures disappear?')
      const revisionSvg = readFileSync(join(outDir, 'figure-2-revision-architecture.svg'), 'utf8')
      expect(revisionSvg).toContain('<title id="title">Trace-contract verifier architecture</title>')
      expect(revisionSvg).toContain('A. Decision point')
      expect(revisionSvg).toContain('B. Trace contract')
      expect(revisionSvg).toContain('C. Rule-grounded verifier')
      expect(revisionSvg).toContain('D. Same-id revision')
      expect(revisionSvg).toContain('hard failures 35 to 10')
      const qualitativeSvg = readFileSync(join(outDir, 'figure-5-qualitative-case-pack.svg'), 'utf8')
      expect(qualitativeSvg).toContain('Qualitative Case Pack')
      expect(qualitativeSvg).toContain('A. Public-history repair')
      expect(qualitativeSvg).toContain('B. Hidden-information repair')
      expect(qualitativeSvg).toContain('C. Remaining hard failure')
      expect(qualitativeSvg).toContain('D. Parse failure outside paired subset')
      expect(qualitativeSvg).toContain('pilot-e1-000-turn-1-player-0')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
