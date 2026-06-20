import { describe, expect, it } from 'vitest'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { writeAAMASSelfReviewReport } from './aamasSelfReviewReport'

describe('aamasSelfReviewReport', () => {
  it('keeps reviewer self-review at needs_experiment when replication and human audit are pending', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-self-review-pending-'))

    try {
      writeCurrentState(rootDir, {
        replicationGateStatus: 'needs_experiment',
        aamasReadiness: 'borderline',
        preflightStatus: 'research_not_ready',
      })

      const result = writeAAMASSelfReviewReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'aamas-self-review'),
      })

      expect(result.report.status).toBe('needs_experiment')
      expect(result.report.items.find(item => item.dimension === 'experimental_strength')?.status).toBe('needs_experiment')
      expect(result.report.items.find(item => item.dimension === 'evaluation_completeness')?.status).toBe('needs_experiment')
      expect(result.report.items.find(item => item.dimension === 'writing_clarity')?.status).toBe('pass')
      expect(result.report.claimEvidenceMap.find(item => item.claim.includes('single-provider'))?.status).toBe('needs_experiment')

      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('# AAMAS Adversarial Self-Review Report')
      expect(markdown).toContain('needs_experiment')
      expect(markdown).toContain('Complete second-provider/model replication or human soft-label audit.')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('marks the self-review submission ready when all reviewer-risk dimensions pass', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-self-review-ready-'))

    try {
      writeCurrentState(rootDir, {
        replicationGateStatus: 'pass',
        aamasReadiness: 'ready',
        preflightStatus: 'research_ready',
      })

      const result = writeAAMASSelfReviewReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'aamas-self-review'),
      })

      expect(result.report.status).toBe('submission_ready')
      expect(result.report.items.every(item => item.status === 'pass')).toBe(true)
      expect(result.report.claimEvidenceMap.every(item => item.status === 'pass')).toBe(true)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function writeCurrentState(
  rootDir: string,
  options: {
    replicationGateStatus: 'pass' | 'needs_experiment'
    aamasReadiness: string
    preflightStatus: string
  },
): void {
  writeJson(rootDir, 'submission/aamas-readiness/aamas-readiness-report.json', {
    aamasFullPaperReadiness: options.aamasReadiness,
    gates: [
      { id: 'local-artifact-hygiene', status: 'pass' },
      { id: 'pilot-evidence', status: 'pass' },
      { id: 'schema-vs-reasoning-attribution', status: 'pass' },
      { id: 'full-split-llm-evidence', status: 'pass' },
      {
        id: 'replication-and-human-audit',
        status: options.replicationGateStatus,
        finding: options.replicationGateStatus === 'pass'
          ? 'Completed second-provider replication is present.'
          : 'Second-provider/model pilot replication is pending_missing_replication with 0 completed replication row(s).',
        requiredAction: 'Complete second-provider/model replication or human soft-label audit.',
      },
      { id: 'visual-evidence-package', status: 'pass' },
      { id: 'page-budget', status: 'pass' },
    ],
    nextActions: ['Complete second-provider/model replication or human soft-label audit.'],
  })
  writeJson(rootDir, 'submission/preflight/research-preflight-report.json', {
    status: options.preflightStatus,
  })
  writeJson(rootDir, 'submission/visual-evidence/visual-evidence-report.json', {
    status: 'ready_with_external_evidence_pending',
    facts: {
      figureCount: 5,
      tableCount: 9,
      requiredFigureRolesPresent: 5,
      requiredFigureRolesTotal: 5,
      requiredTableRolesPresent: 9,
      requiredTableRolesTotal: 9,
    },
  })
  writeJson(rootDir, 'submission/claim-evidence/claim-evidence-report.json', {
    status: 'pass',
    facts: {
      claimCount: 8,
      supportedCount: 2,
      scopeLimitedCount: 6,
      needsEvidenceCount: 0,
    },
  })
  writeJson(rootDir, 'submission/method-reproducibility/method-reproducibility-report.json', {
    status: 'pass',
    facts: {
      modulesPassing: 6,
      modulesTotal: 6,
      termsPresent: 28,
      termsTotal: 28,
      artifactsPresent: 15,
      artifactsTotal: 15,
      commandsPresent: 7,
      commandsTotal: 7,
    },
  })
  writeText(rootDir, 'submission/aamas-latex/main.tex', [
    '\\section{Discussion and Limitations}',
    'Verifier-grounded reasoning should be interpreted as diagnostic evidence rather than proof of strategic optimality.',
    '\\subsection{Threats to Validity}',
    'The paper does not claim cross-game transfer.',
    '\\subsection{Reviewer-Relevant Boundaries}',
    'The verifier is diagnostic rather than an action oracle.',
  ].join('\n'))
}

function writeJson(rootDir: string, relativePath: string, value: unknown): void {
  writeText(rootDir, relativePath, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(rootDir: string, relativePath: string, value: string): void {
  const path = join(rootDir, relativePath)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, value, 'utf8')
}
