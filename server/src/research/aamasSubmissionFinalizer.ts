import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

export type AAMASSubmissionFinalizerStatus = 'completed' | 'needs_revision' | 'failed'

export interface AAMASSubmissionFinalizerOptions {
  cwd: string
  researchRoot: string
  outputDir: string
  runner?: AAMASSubmissionFinalizerRunner
}

export interface AAMASSubmissionFinalizerCommandResult {
  exitCode: number
  stdout: string
  stderr: string
}

export type AAMASSubmissionFinalizerRunner = (
  command: string[],
  cwd: string,
) => AAMASSubmissionFinalizerCommandResult

export interface AAMASSubmissionFinalizerStep {
  id: string
  title: string
  command: string[]
  status: 'passed' | 'failed'
  exitCode: number
  stdout: string
  stderr: string
}

export interface AAMASSubmissionFinalizerCheck {
  id: string
  status: 'pass' | 'fail'
  finding: string
}

export interface AAMASSubmissionReadinessSummary {
  status: 'ready_for_submission' | 'not_ready' | 'missing'
  preflightStatus: string
  aamasFullPaperReadiness: string
  reviewerResponseStatus: string
  readinessBlockerCount: number | null
  reviewerResponseBlockerCount: number | null
  nextActions: string[]
}

export interface AAMASSubmissionFinalizerReport {
  schemaVersion: '0.2.0'
  generatedAt: string
  status: AAMASSubmissionFinalizerStatus
  submissionReadiness: AAMASSubmissionReadinessSummary
  steps: AAMASSubmissionFinalizerStep[]
  checks: AAMASSubmissionFinalizerCheck[]
}

export interface AAMASSubmissionFinalizerResult extends AAMASSubmissionFinalizerReport {
  jsonPath: string
  markdownPath: string
}

interface Manifest {
  entries?: unknown[]
}

interface PipelineReport {
  steps?: unknown[]
}

interface ReadinessReport {
  facts?: {
    manifestEntries?: number
    localPipelineSteps?: number
  }
}

interface PreflightReport {
  status?: string
  aamasFullPaperReadiness?: string
  reviewerResponseStatus?: string
  readinessBlockers?: unknown[]
  reviewerResponseBlockers?: unknown[]
  nextActions?: string[]
}

const finalizerSteps = [
  {
    id: 'human-audit-launch-checklist',
    title: 'Refresh Human Audit Launch Checklist',
    command: ['npx', 'tsx', 'server/src/research/writeHumanAuditLaunchChecklistCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission/human-audit-launch'],
  },
  {
    id: 'human-audit-evidence-gate',
    title: 'Refresh Human Audit Evidence Gate',
    command: ['npx', 'tsx', 'server/src/research/writeHumanAuditEvidenceGateCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission/human-audit-evidence-gate'],
  },
  {
    id: 'manifest-before-readiness',
    title: 'Refresh Manifest Before Readiness',
    command: ['npx', 'tsx', 'server/src/research/writeReproducibilityManifestCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission'],
  },
  {
    id: 'aamas-readiness',
    title: 'Refresh AAMAS Readiness',
    command: ['npx', 'tsx', 'server/src/research/writeAAMASReadinessReportCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission/aamas-readiness'],
  },
  {
    id: 'aamas-self-review',
    title: 'Refresh AAMAS Self-Review',
    command: ['npx', 'tsx', 'server/src/research/writeAAMASSelfReviewReportCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission/aamas-self-review'],
  },
  {
    id: 'aamas-reviewer-response',
    title: 'Refresh AAMAS Reviewer-Response Matrix',
    command: ['npx', 'tsx', 'server/src/research/writeAAMASReviewerResponseMatrixCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission/aamas-reviewer-response'],
  },
  {
    id: 'preflight',
    title: 'Refresh Research Preflight',
    command: ['npx', 'tsx', 'server/src/research/writeResearchPreflightReportCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission/preflight'],
  },
  {
    id: 'manifest-final',
    title: 'Refresh Final Manifest',
    command: ['npx', 'tsx', 'server/src/research/writeReproducibilityManifestCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission'],
  },
] as const

export function finalizeAAMASSubmissionReports(
  options: AAMASSubmissionFinalizerOptions,
): AAMASSubmissionFinalizerResult {
  mkdirSync(options.outputDir, { recursive: true })
  const runner = options.runner ?? defaultRunner
  const steps: AAMASSubmissionFinalizerStep[] = []

  for (const step of finalizerSteps) {
    const result = runner([...step.command], options.cwd)
    steps.push({
      ...step,
      command: [...step.command],
      status: result.exitCode === 0 ? 'passed' : 'failed',
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
    })
    if (result.exitCode !== 0) break
  }

  const checks = steps.every(step => step.status === 'passed')
    ? runConsistencyChecks(options.researchRoot)
    : [{
        id: 'commands-completed',
        status: 'fail' as const,
        finding: 'At least one finalizer command failed; consistency checks were not run.',
      }]
  const status: AAMASSubmissionFinalizerStatus = steps.some(step => step.status === 'failed')
    ? 'failed'
    : checks.some(check => check.status === 'fail')
      ? 'needs_revision'
      : 'completed'
  const submissionReadiness = buildSubmissionReadinessSummary(options.researchRoot)

  const report: AAMASSubmissionFinalizerReport = {
    schemaVersion: '0.2.0',
    generatedAt: new Date().toISOString(),
    status,
    submissionReadiness,
    steps,
    checks,
  }
  const jsonPath = join(options.outputDir, 'aamas-submission-finalizer-report.json')
  const markdownPath = join(options.outputDir, 'aamas-submission-finalizer-report.md')
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderAAMASSubmissionFinalizerReport(report), 'utf8')
  return { ...report, jsonPath, markdownPath }
}

function runConsistencyChecks(researchRoot: string): AAMASSubmissionFinalizerCheck[] {
  const manifest = readJsonOptional<Manifest>(researchRoot, 'submission/reproducibility-manifest.json')
  const pipeline = readJsonOptional<PipelineReport>(researchRoot, 'submission/local-pipeline/local-research-pipeline-report.json')
  const readiness = readJsonOptional<ReadinessReport>(researchRoot, 'submission/aamas-readiness/aamas-readiness-report.json')
  const preflight = readJsonOptional<PreflightReport>(researchRoot, 'submission/preflight/research-preflight-report.json')
  const actualManifestEntries = manifest?.entries?.length ?? null
  const actualPipelineSteps = pipeline?.steps?.length ?? null
  const readinessManifestEntries = readiness?.facts?.manifestEntries ?? null
  const readinessPipelineSteps = readiness?.facts?.localPipelineSteps ?? null
  const preflightStatus = preflight?.status ?? 'missing'
  const readinessBlockerCount = preflight?.readinessBlockers?.length ?? null
  const reviewerResponseBlockerCount = preflight?.reviewerResponseBlockers?.length ?? null

  return [
    {
      id: 'readiness-manifest-count-current',
      status: actualManifestEntries !== null && readinessManifestEntries === actualManifestEntries ? 'pass' : 'fail',
      finding: `Readiness reports manifestEntries=${formatNullable(readinessManifestEntries)}; current manifest has ${formatNullable(actualManifestEntries)} entries.`,
    },
    {
      id: 'readiness-pipeline-step-count-current',
      status: actualPipelineSteps !== null && readinessPipelineSteps === actualPipelineSteps ? 'pass' : 'fail',
      finding: `Readiness reports localPipelineSteps=${formatNullable(readinessPipelineSteps)}; current local pipeline report has ${formatNullable(actualPipelineSteps)} steps.`,
    },
    {
      id: 'preflight-submission-ready-current',
      status: preflightStatus === 'ready_for_submission' ? 'pass' : 'fail',
      finding: [
        `Preflight status=${preflightStatus}.`,
        `AAMAS readiness=${preflight?.aamasFullPaperReadiness ?? 'missing'}.`,
        `Reviewer-response status=${preflight?.reviewerResponseStatus ?? 'missing'}.`,
        `Readiness blockers=${formatNullable(readinessBlockerCount)}.`,
        `Reviewer-response blockers=${formatNullable(reviewerResponseBlockerCount)}.`,
      ].join(' '),
    },
  ]
}

function buildSubmissionReadinessSummary(researchRoot: string): AAMASSubmissionReadinessSummary {
  const preflight = readJsonOptional<PreflightReport>(researchRoot, 'submission/preflight/research-preflight-report.json')
  const preflightStatus = preflight?.status ?? 'missing'
  const readinessBlockerCount = preflight?.readinessBlockers?.length ?? null
  const reviewerResponseBlockerCount = preflight?.reviewerResponseBlockers?.length ?? null
  return {
    status: preflightStatus === 'ready_for_submission'
      ? 'ready_for_submission'
      : preflight
        ? 'not_ready'
        : 'missing',
    preflightStatus,
    aamasFullPaperReadiness: preflight?.aamasFullPaperReadiness ?? 'missing',
    reviewerResponseStatus: preflight?.reviewerResponseStatus ?? 'missing',
    readinessBlockerCount,
    reviewerResponseBlockerCount,
    nextActions: preflight?.nextActions ?? [],
  }
}

function renderAAMASSubmissionFinalizerReport(report: AAMASSubmissionFinalizerReport): string {
  return [
    '# AAMAS Submission Finalizer Report',
    '',
    `Generated at: \`${report.generatedAt}\``,
    '',
    `Status: \`${report.status}\``,
    `Submission readiness: \`${report.submissionReadiness.status}\``,
    `Preflight status: \`${report.submissionReadiness.preflightStatus}\``,
    `AAMAS readiness: \`${report.submissionReadiness.aamasFullPaperReadiness}\``,
    `Reviewer-response status: \`${report.submissionReadiness.reviewerResponseStatus}\``,
    `Readiness blockers: \`${formatNullable(report.submissionReadiness.readinessBlockerCount)}\``,
    `Reviewer-response blockers: \`${formatNullable(report.submissionReadiness.reviewerResponseBlockerCount)}\``,
    '',
    '## Steps',
    '',
    '| Step | Status | Exit Code |',
    '| --- | --- | ---: |',
    ...report.steps.map(step => `| ${step.title} | \`${step.status}\` | ${step.exitCode} |`),
    '',
    '## Consistency Checks',
    '',
    '| Check | Status | Finding |',
    '| --- | --- | --- |',
    ...report.checks.map(check => `| ${check.id} | \`${check.status}\` | ${escapeMarkdownCell(check.finding)} |`),
    '',
    '## Next Actions',
    '',
    ...(report.submissionReadiness.nextActions.length > 0
      ? report.submissionReadiness.nextActions.map((action, index) => `${index + 1}. ${action}`)
      : ['None.']),
    '',
  ].join('\n')
}

function defaultRunner(command: string[], cwd: string): AAMASSubmissionFinalizerCommandResult {
  const result = spawnSync(command[0], command.slice(1), {
    cwd,
    encoding: 'utf8',
  })
  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

function readJsonOptional<T>(root: string, path: string): T | null {
  const absolutePath = join(root, path)
  if (!existsSync(absolutePath)) return null
  return JSON.parse(readFileSync(absolutePath, 'utf8')) as T
}

function formatNullable(value: number | null): string {
  return value === null ? 'missing' : String(value)
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|')
}
