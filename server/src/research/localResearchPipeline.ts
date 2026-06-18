import { spawnSync } from 'node:child_process'
import {
  mkdirSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

export type LocalResearchPipelineStatus = 'completed' | 'failed'
export type LocalResearchPipelineStepStatus = 'passed' | 'failed'

export interface LocalResearchPipelineCommandResult {
  exitCode: number
  stdout: string
  stderr: string
}

export type LocalResearchPipelineRunner = (command: string[], cwd: string) => LocalResearchPipelineCommandResult

export interface LocalResearchPipelineOptions {
  cwd: string
  reportDir: string
  runner?: LocalResearchPipelineRunner
}

export interface LocalResearchPipelineStepDefinition {
  id: string
  title: string
  command: string[]
}

export interface LocalResearchPipelineStepReport extends LocalResearchPipelineStepDefinition {
  status: LocalResearchPipelineStepStatus
  exitCode: number
  stdout: string
  stderr: string
}

export interface LocalResearchPipelineReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  status: LocalResearchPipelineStatus
  steps: LocalResearchPipelineStepReport[]
}

export interface LocalResearchPipelineResult extends LocalResearchPipelineReport {
  jsonPath: string
  markdownPath: string
}

const localPipelineSteps: LocalResearchPipelineStepDefinition[] = [
  {
    id: 'pilot-metrics-summary',
    title: 'Pilot Metrics Summary',
    command: ['npx', 'tsx', 'server/src/research/writePilotMetricsSummaryCli.ts', '--out', 'docs/research/experiments/pilot-metrics-summary'],
  },
  {
    id: 'revision-comparison',
    title: 'Revision Comparison',
    command: ['npx', 'tsx', 'server/src/research/writeRevisionComparisonCli.ts', '--out', 'docs/research/experiments/pilot-revision-comparison'],
  },
  {
    id: 'ablation-summary',
    title: 'Ablation Summary',
    command: ['npx', 'tsx', 'server/src/research/writeAblationSummaryCli.ts', '--out', 'docs/research/experiments/pilot-ablation-summary'],
  },
  {
    id: 'paper-tables',
    title: 'Paper Tables',
    command: ['npx', 'tsx', 'server/src/research/writePaperTableArtifactsCli.ts', '--out', 'docs/research/tables'],
  },
  {
    id: 'manuscript',
    title: 'Manuscript Assembly',
    command: ['npx', 'tsx', 'server/src/research/assembleManuscriptCli.ts'],
  },
  {
    id: 'marker-inventory',
    title: 'Submission Marker Inventory',
    command: ['npx', 'tsx', 'server/src/research/writeSubmissionMarkerInventoryCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission/marker-inventory'],
  },
  {
    id: 'experiment-resolution-ledger',
    title: 'Experiment Resolution Ledger',
    command: ['npx', 'tsx', 'server/src/research/writeExperimentResolutionLedgerCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission/experiment-resolution-ledger'],
  },
  {
    id: 'submission-gate',
    title: 'Submission Gate',
    command: ['npx', 'tsx', 'server/src/research/writeSubmissionGateReportCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission/gate-report'],
  },
  {
    id: 'preflight',
    title: 'Research Preflight',
    command: ['npx', 'tsx', 'server/src/research/writeResearchPreflightReportCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission/preflight'],
  },
  {
    id: 'provider-handoff-audit',
    title: 'Provider Handoff Audit',
    command: ['npx', 'tsx', 'server/src/research/writeProviderHandoffAuditCli.ts', '--out', 'docs/research/submission/provider-handoff-audit'],
  },
  {
    id: 'bibliography-integrity',
    title: 'Bibliography Integrity',
    command: ['npx', 'tsx', 'server/src/research/writeBibliographyIntegrityReportCli.ts', '--bib', 'docs/research/submission/references.bib', '--out', 'docs/research/submission/citation-integrity'],
  },
  {
    id: 'reproducibility-manifest',
    title: 'Reproducibility Manifest',
    command: ['npx', 'tsx', 'server/src/research/writeReproducibilityManifestCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission'],
  },
]

export function runLocalResearchPipeline(options: LocalResearchPipelineOptions): LocalResearchPipelineResult {
  mkdirSync(options.reportDir, { recursive: true })
  const runner = options.runner ?? defaultRunner
  const steps: LocalResearchPipelineStepReport[] = []

  for (const step of localPipelineSteps) {
    const result = runner(step.command, options.cwd)
    steps.push({
      ...step,
      status: result.exitCode === 0 ? 'passed' : 'failed',
      exitCode: result.exitCode,
      stdout: trimOutput(result.stdout),
      stderr: trimOutput(result.stderr),
    })
    if (result.exitCode !== 0) break
  }

  const status: LocalResearchPipelineStatus = steps.every(step => step.status === 'passed')
    && steps.length === localPipelineSteps.length
    ? 'completed'
    : 'failed'
  const report: LocalResearchPipelineReport = {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    status,
    steps,
  }
  const jsonPath = join(options.reportDir, 'local-research-pipeline-report.json')
  const markdownPath = join(options.reportDir, 'local-research-pipeline-report.md')

  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderLocalResearchPipelineReport(report), 'utf8')

  return {
    ...report,
    jsonPath,
    markdownPath,
  }
}

export function renderLocalResearchPipelineReport(report: LocalResearchPipelineReport): string {
  const lines = [
    '# Local Research Pipeline Report',
    '',
    `Status: \`${report.status}\``,
    `Generated at: \`${report.generatedAt}\``,
    '',
    'This pipeline only regenerates local downstream artifacts. It does not call external model providers.',
    '',
    '| Step | Status | Exit |',
    '| --- | --- | ---: |',
    ...report.steps.map(step => `| ${escapeMarkdownCell(step.title)} | \`${step.status}\` | ${step.exitCode} |`),
    '',
    '## Step Logs',
    '',
    ...report.steps.flatMap(step => [
      `### ${step.title}`,
      '',
      `Command: \`${step.command.join(' ')}\``,
      '',
      'Stdout:',
      '',
      '```text',
      step.stdout,
      '```',
      '',
      'Stderr:',
      '',
      '```text',
      step.stderr,
      '```',
      '',
    ]),
  ]

  return lines.join('\n')
}

function defaultRunner(command: string[], cwd: string): LocalResearchPipelineCommandResult {
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

function trimOutput(output: string): string {
  const maxLength = 6000
  if (output.length <= maxLength) return output.trim()
  return `${output.slice(0, maxLength).trim()}\n[truncated]`
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|')
}
