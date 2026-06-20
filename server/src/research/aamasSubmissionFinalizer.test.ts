import { describe, expect, it } from 'vitest'
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { finalizeAAMASSubmissionReports } from './aamasSubmissionFinalizer'

describe('aamasSubmissionFinalizer', () => {
  it('refreshes final reports and verifies readiness counts against current files', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-aamas-finalizer-'))
    const calls: string[] = []

    try {
      writeJson(join(rootDir, 'docs/research/submission/local-pipeline/local-research-pipeline-report.json'), {
        steps: [{ id: 'one' }, { id: 'two' }],
      })
      writeJson(join(rootDir, 'docs/research/submission/preflight/research-preflight-report.json'), {
        status: 'ready_for_submission',
        aamasFullPaperReadiness: 'ready',
        reviewerResponseStatus: 'ready_for_revision',
        readinessBlockers: [],
        reviewerResponseBlockers: [],
      })

      const result = finalizeAAMASSubmissionReports({
        cwd: rootDir,
        researchRoot: join(rootDir, 'docs/research'),
        outputDir: join(rootDir, 'docs/research/submission/finalizer'),
        runner: command => {
          calls.push(command.join(' '))
          const commandText = command.join(' ')
          if (commandText.includes('writeReproducibilityManifestCli.ts')) {
            writeJson(join(rootDir, 'docs/research/submission/reproducibility-manifest.json'), {
              entries: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
            })
          } else if (commandText.includes('writeAAMASReadinessReportCli.ts')) {
            writeJson(join(rootDir, 'docs/research/submission/aamas-readiness/aamas-readiness-report.json'), {
              facts: {
                manifestEntries: 3,
                localPipelineSteps: 2,
              },
            })
          }
          return { exitCode: 0, stdout: 'ok', stderr: '' }
        },
      })

      expect(result.status).toBe('completed')
      expect(result.submissionReadiness).toMatchObject({
        status: 'ready_for_submission',
        preflightStatus: 'ready_for_submission',
        aamasFullPaperReadiness: 'ready',
        reviewerResponseStatus: 'ready_for_revision',
        readinessBlockerCount: 0,
        reviewerResponseBlockerCount: 0,
      })
      expect(result.steps.map(step => step.id)).toEqual([
        'human-audit-launch-checklist',
        'human-audit-evidence-gate',
        'manifest-before-readiness',
        'aamas-readiness',
        'aamas-self-review',
        'aamas-reviewer-response',
        'preflight',
        'manifest-final',
      ])
      expect(calls[0]).toContain('writeHumanAuditLaunchChecklistCli.ts')
      expect(calls[1]).toContain('writeHumanAuditEvidenceGateCli.ts')
      expect(calls[2]).toContain('writeReproducibilityManifestCli.ts')
      expect(calls[3]).toContain('writeAAMASReadinessReportCli.ts')
      expect(calls[5]).toContain('writeAAMASReviewerResponseMatrixCli.ts')
      expect(result.checks.every(check => check.status === 'pass')).toBe(true)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('marks the finalizer as needing revision when refreshed preflight is not submission-ready', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-aamas-finalizer-preflight-blocked-'))

    try {
      writeJson(join(rootDir, 'docs/research/submission/local-pipeline/local-research-pipeline-report.json'), {
        steps: [{ id: 'one' }, { id: 'two' }],
      })

      const result = finalizeAAMASSubmissionReports({
        cwd: rootDir,
        researchRoot: join(rootDir, 'docs/research'),
        outputDir: join(rootDir, 'docs/research/submission/finalizer'),
        runner: command => {
          const commandText = command.join(' ')
          if (commandText.includes('writeReproducibilityManifestCli.ts')) {
            writeJson(join(rootDir, 'docs/research/submission/reproducibility-manifest.json'), {
              entries: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
            })
          } else if (commandText.includes('writeAAMASReadinessReportCli.ts')) {
            writeJson(join(rootDir, 'docs/research/submission/aamas-readiness/aamas-readiness-report.json'), {
              facts: {
                manifestEntries: 3,
                localPipelineSteps: 2,
              },
            })
          } else if (commandText.includes('writeResearchPreflightReportCli.ts')) {
            writeJson(join(rootDir, 'docs/research/submission/preflight/research-preflight-report.json'), {
              status: 'research_not_ready',
              aamasFullPaperReadiness: 'borderline',
              reviewerResponseStatus: 'needs_external_evidence',
              readinessBlockers: [{ id: 'replication-and-human-audit' }],
              reviewerResponseBlockers: [{ id: 'single-provider-robustness' }],
            })
          }
          return { exitCode: 0, stdout: 'ok', stderr: '' }
        },
      })

      expect(result.status).toBe('needs_revision')
      expect(result.submissionReadiness).toMatchObject({
        status: 'not_ready',
        preflightStatus: 'research_not_ready',
        aamasFullPaperReadiness: 'borderline',
        reviewerResponseStatus: 'needs_external_evidence',
        readinessBlockerCount: 1,
        reviewerResponseBlockerCount: 1,
      })
      expect(result.steps.every(step => step.status === 'passed')).toBe(true)
      expect(result.checks).toContainEqual({
        id: 'preflight-submission-ready-current',
        status: 'fail',
        finding: 'Preflight status=research_not_ready. AAMAS readiness=borderline. Reviewer-response status=needs_external_evidence. Readiness blockers=1. Reviewer-response blockers=1.',
      })
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('fails when a refresh command fails', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-aamas-finalizer-fail-'))

    try {
      const result = finalizeAAMASSubmissionReports({
        cwd: rootDir,
        researchRoot: join(rootDir, 'docs/research'),
        outputDir: join(rootDir, 'docs/research/submission/finalizer'),
        runner: command => ({
          exitCode: command.join(' ').includes('writeAAMASReadinessReportCli.ts') ? 1 : 0,
          stdout: '',
          stderr: 'boom',
        }),
      })

      expect(result.status).toBe('failed')
      expect(result.steps.some(step => step.status === 'failed')).toBe(true)
      expect(result.checks[0]).toMatchObject({
        id: 'commands-completed',
        status: 'fail',
      })
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function writeJson(path: string, value: unknown): void {
  mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
