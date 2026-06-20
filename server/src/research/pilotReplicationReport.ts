import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

export type PilotReplicationStatus = 'pending_missing_replication' | 'partial' | 'completed'

export interface PilotReplicationReportOptions {
  researchRoot: string
  outputDir: string
}

export interface PilotReplicationCondition {
  id: string
  role: 'primary' | 'replication'
  status: 'missing' | 'partial' | 'completed'
  providerResultsPath: string
  runReportPath: string
  metricsPath: string
  provider: string
  model: string
  expectedCount: number | null
  successCount: number | null
  errorCount: number | null
  parsedCount: number | null
  hardFailureCount: number | null
  parseFailureCount: number | null
  independentFromPrimary: boolean | null
  finding: string
}

export interface PilotReplicationReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  status: PilotReplicationStatus
  completedReplicationCount: number
  primary: PilotReplicationCondition
  replications: PilotReplicationCondition[]
  requiredAction: string
}

export interface PilotReplicationReportResult {
  jsonPath: string
  markdownPath: string
  report: PilotReplicationReport
}

interface Metrics {
  totalDecisionPoints?: number
  totalParsedTraces?: number
  parseFailureCount?: number
  hardFailureCount?: number
}

interface RunReport {
  expectedCount?: number
  successCount?: number
  errorCount?: number
  runner?: string
  model?: string
  baseUrl?: string
}

const primarySpec = {
  id: 'primary-kimi-tom-pilot',
  providerResultsPath: 'experiments/provider-results/tom-prompted-llm.jsonl',
  runReportPath: 'experiments/provider-results/tom-prompted-llm-kimi-merge-report.json',
  metricsPath: 'experiments/pilot-e7-tom-prompted-results/metrics.json',
  provider: 'kimi-cli',
  model: 'kimi-code/kimi-for-coding',
}

const replicationSpecs = [
  {
    id: 'second-provider-tom-pilot',
    providerResultsPath: 'experiments/provider-results/tom-prompted-llm-second-provider.jsonl',
    runReportPath: 'experiments/provider-results/tom-prompted-llm-second-provider-run-report.json',
    metricsPath: 'experiments/pilot-replication/second-provider-tom-prompted-results/metrics.json',
    provider: 'second-provider',
    model: 'second-model',
  },
]

export function writePilotReplicationReport(options: PilotReplicationReportOptions): PilotReplicationReportResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = buildPilotReplicationReport(options.researchRoot)
  const jsonPath = join(options.outputDir, 'pilot-replication-report.json')
  const markdownPath = join(options.outputDir, 'pilot-replication-report.md')

  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderPilotReplicationReport(report), 'utf8')

  return { jsonPath, markdownPath, report }
}

export function buildPilotReplicationReport(researchRoot: string): PilotReplicationReport {
  const primary = inspectCondition(researchRoot, primarySpec, 'primary')
  const replications = replicationSpecs.map(spec => inspectCondition(researchRoot, spec, 'replication', primary))
  const completedReplicationCount = replications.filter(replication => replication.status === 'completed').length
  const anyPartial = replications.some(replication => replication.status === 'partial')
  const status: PilotReplicationStatus = completedReplicationCount > 0
    ? 'completed'
    : anyPartial
      ? 'partial'
      : 'pending_missing_replication'

  return {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    status,
    completedReplicationCount,
    primary,
    replications,
    requiredAction: completedReplicationCount > 0
      ? 'Use the completed second-provider/model pilot replication as robustness evidence, while still treating human soft-label audit as desirable additional evidence.'
      : 'Materialize one second-provider or second-model ToM pilot replication at the fixed replication paths, then rerun the local pipeline.',
  }
}

function inspectCondition(
  researchRoot: string,
  spec: typeof primarySpec,
  role: 'primary' | 'replication',
  primary?: PilotReplicationCondition,
): PilotReplicationCondition {
  const providerResultsPresent = existsSync(join(researchRoot, spec.providerResultsPath))
  const metrics = readJsonOptional<Metrics>(researchRoot, spec.metricsPath)
  const runReport = readJsonOptional<RunReport>(researchRoot, spec.runReportPath)
  const expectedCount = runReport?.expectedCount ?? metrics?.totalDecisionPoints ?? null
  const successCount = runReport?.successCount ?? (providerResultsPresent && metrics?.totalDecisionPoints ? metrics.totalDecisionPoints : null)
  const errorCount = runReport?.errorCount ?? null
  const parsedCount = metrics?.totalParsedTraces ?? null
  const hardFailureCount = metrics?.hardFailureCount ?? null
  const parseFailureCount = metrics?.parseFailureCount ?? null
  const completeProvider = expectedCount === 50 && successCount === 50 && (errorCount ?? 0) === 0
  const completeMetrics = metrics?.totalDecisionPoints === 50 && typeof parsedCount === 'number'
  const provider = runReport?.runner ?? (runReport?.baseUrl ? `openai-compatible:${runReport.baseUrl}` : spec.provider)
  const model = runReport?.model ?? spec.model
  const independentFromPrimary = role === 'replication' && primary
    ? provider !== primary.provider || model !== primary.model
    : role === 'replication'
      ? null
      : true
  const completeIndependentReplication = role !== 'replication'
    || independentFromPrimary === true
  const status = completeProvider && completeMetrics && completeIndependentReplication
    ? 'completed'
    : providerResultsPresent || metrics || runReport
      ? 'partial'
      : 'missing'
  const nonIndependentFinding = role === 'replication'
    && completeProvider
    && completeMetrics
    && independentFromPrimary === false
    ? `${spec.id} has complete artifacts but is not an independent second-provider/model replication because it uses the same provider and model as the primary run (${provider}, ${model}).`
    : null

  return {
    id: spec.id,
    role,
    status,
    providerResultsPath: spec.providerResultsPath,
    runReportPath: spec.runReportPath,
    metricsPath: spec.metricsPath,
    provider,
    model,
    expectedCount,
    successCount,
    errorCount,
    parsedCount,
    hardFailureCount,
    parseFailureCount,
    independentFromPrimary,
    finding: nonIndependentFinding
      ?? (status === 'completed'
        ? `${spec.id} is complete: ${successCount}/${expectedCount} provider outputs, ${parsedCount}/50 parsed traces, and ${hardFailureCount} hard verifier failures.`
        : status === 'partial'
          ? `${spec.id} is partial: provider=${formatNullable(successCount)}/${formatNullable(expectedCount)}, parsed=${formatNullable(parsedCount)}/50, hardFailures=${formatNullable(hardFailureCount)}.`
          : `${spec.id} is missing: expected provider results at ${spec.providerResultsPath} and metrics at ${spec.metricsPath}.`),
  }
}

export function renderPilotReplicationReport(report: PilotReplicationReport): string {
  return [
    '# Pilot Replication Report',
    '',
    `Status: \`${report.status}\``,
    `Generated at: \`${report.generatedAt}\``,
    '',
    `Completed replication count: ${report.completedReplicationCount}`,
    '',
    '## Conditions',
    '',
    '| Condition | Role | Status | Independent? | Provider | Model | Provider Outputs | Parsed | Hard Failures |',
    '| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: |',
    ...[report.primary, ...report.replications].map(condition => [
      condition.id,
      condition.role,
      `\`${condition.status}\``,
      condition.independentFromPrimary === null ? 'n/a' : condition.independentFromPrimary ? 'yes' : 'no',
      condition.provider,
      condition.model,
      `${formatNullable(condition.successCount)}/${formatNullable(condition.expectedCount)}`,
      `${formatNullable(condition.parsedCount)}/50`,
      formatNullable(condition.hardFailureCount),
    ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
    '',
    '## Findings',
    '',
    ...[report.primary, ...report.replications].map(condition => `- ${condition.finding}`),
    '',
    '## Required Action',
    '',
    report.requiredAction,
    '',
  ].join('\n')
}

function readJsonOptional<T>(root: string, relativePath: string): T | null {
  const path = join(root, relativePath)
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function formatNullable(value: number | string | null | undefined): string {
  return value === null || value === undefined ? 'missing' : String(value)
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|')
}
