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
import { writeAAMASReviewerResponseMatrix } from './aamasReviewerResponseMatrix'

describe('aamasReviewerResponseMatrix', () => {
  it('marks single-provider and human-audit concerns as external-evidence gaps', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-reviewer-matrix-'))
    try {
      writeFixture(rootDir, { replicationStatus: 'needs_experiment' })

      const result = writeAAMASReviewerResponseMatrix({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission/aamas-reviewer-response'),
      })

      expect(result.report.status).toBe('needs_external_evidence')
      expect(result.report.summary.needsExternalEvidence).toBe(2)
      expect(result.report.summary.needsRevision).toBe(0)
      expect(result.report.responses.find(row => row.id === 'single-provider-robustness')).toMatchObject({
        status: 'needs_external_evidence',
        reviewerRole: 'experiment-reviewer',
      })
      expect(result.report.responses.find(row => row.id === 'human-soft-label-subjectivity')).toMatchObject({
        status: 'needs_external_evidence',
      })
      expect(result.report.responses.find(row => row.id === 'not-a-guandan-bot')).toMatchObject({
        status: 'answerable_now',
      })
      expect(result.report.responses.find(row => row.id === 'schema-vs-reasoning')).toMatchObject({
        status: 'answerable_now',
      })
      expect(readFileSync(result.markdownPath, 'utf8')).toContain('# AAMAS Reviewer-Response Matrix')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('is ready for revision when all reviewer concerns are answerable', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-reviewer-matrix-ready-'))
    try {
      writeFixture(rootDir, { replicationStatus: 'pass' })

      const result = writeAAMASReviewerResponseMatrix({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission/aamas-reviewer-response'),
      })

      expect(result.report.status).toBe('ready_for_revision')
      expect(result.report.summary.answerableNow).toBe(result.report.summary.totalConcerns)
      expect(result.report.summary.needsExternalEvidence).toBe(0)
      expect(result.report.summary.needsRevision).toBe(0)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('writes report artifacts through the CLI', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-reviewer-matrix-cli-'))
    const outDir = join(rootDir, 'submission/aamas-reviewer-response')
    try {
      writeFixture(rootDir, { replicationStatus: 'needs_experiment' })

      const stdout = execFileSync('npx', [
        'tsx',
        'server/src/research/writeAAMASReviewerResponseMatrixCli.ts',
        '--root',
        rootDir,
        '--out',
        outDir,
      ], {
        cwd: process.cwd(),
        encoding: 'utf8',
      })
      const report = JSON.parse(stdout)

      expect(report.status).toBe('needs_external_evidence')
      expect(report.totalConcerns).toBeGreaterThan(0)
      expect(existsSync(join(outDir, 'aamas-reviewer-response-matrix.json'))).toBe(true)
      expect(existsSync(join(outDir, 'aamas-reviewer-response-matrix.md'))).toBe(true)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function writeFixture(rootDir: string, options: { replicationStatus: 'pass' | 'needs_experiment' }): void {
  const passGate = (id: string, title = id) => ({
    id,
    title,
    status: 'pass',
    evidence: [`evidence/${id}.json`],
    finding: `${id} passes.`,
    requiredAction: `Keep ${id} current.`,
  })
  const replicationGate = {
    id: 'replication-and-human-audit',
    title: 'Replication and Human Audit',
    status: options.replicationStatus,
    evidence: [
      'experiments/pilot-replication/second-provider-replication-package-report.json',
      'experiments/human-soft-label-audit/human-audit-agreement-report.json',
    ],
    finding: options.replicationStatus === 'pass'
      ? 'Second-provider and human-audit evidence are complete.'
      : 'Second-provider output and human agreement are pending.',
    requiredAction: 'Complete the prepared human soft-label audit, or add a second model/provider pilot replication.',
  }

  writeJson(rootDir, 'submission/aamas-readiness/aamas-readiness-report.json', {
    aamasFullPaperReadiness: options.replicationStatus === 'pass' ? 'ready' : 'borderline',
    gates: [
      passGate('local-artifact-hygiene'),
      passGate('pilot-evidence'),
      passGate('schema-vs-reasoning-attribution'),
      passGate('full-split-llm-evidence'),
      replicationGate,
      passGate('visual-evidence-package'),
      passGate('page-budget'),
    ],
    nextActions: ['Complete external validation if still pending.'],
  })
  writeJson(rootDir, 'submission/aamas-self-review/aamas-self-review-report.json', {
    status: options.replicationStatus === 'pass' ? 'submission_ready' : 'needs_experiment',
    items: [
      selfItem('contribution', 'pass'),
      selfItem('method_design_soundness', 'pass'),
      selfItem('experimental_strength', options.replicationStatus === 'pass' ? 'pass' : 'needs_experiment'),
      selfItem('evaluation_completeness', options.replicationStatus === 'pass' ? 'pass' : 'needs_experiment'),
    ],
  })
  writeJson(rootDir, 'submission/claim-evidence/claim-evidence-report.json', { status: 'pass' })
  writeJson(rootDir, 'submission/method-reproducibility/method-reproducibility-report.json', { status: 'pass' })
  writeJson(rootDir, 'submission/visual-evidence/visual-evidence-report.json', { status: 'ready_with_external_evidence_pending' })
  writeText(rootDir, 'submission/aamas-latex/main.tex', [
    'Reviewer-Relevant Boundaries',
    'diagnostic evidence rather than proof of strategic optimality',
    'not be framed as introducing Guandan',
  ].join('\n'))
}

function selfItem(dimension: string, status: string): unknown {
  return {
    dimension,
    status,
    reviewerRisk: `${dimension} risk`,
    evidence: [`${dimension} evidence`],
    requiredAction: `${dimension} action`,
  }
}

function writeJson(rootDir: string, relativePath: string, value: unknown): void {
  writeText(rootDir, relativePath, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(rootDir: string, relativePath: string, value: string): void {
  const path = join(rootDir, relativePath)
  mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true })
  writeFileSync(path, value, 'utf8')
}
