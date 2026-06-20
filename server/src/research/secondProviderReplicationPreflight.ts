import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

export type SecondProviderReplicationPreflightStatus =
  | 'ready_to_run'
  | 'blocked_missing_independent_provider_key'
  | 'blocked_missing_inputs'
  | 'replication_complete'
  | 'partial_provider_outputs'

export interface SecondProviderReplicationPreflightOptions {
  researchRoot: string
  outputDir: string
  envFile?: string
}

export interface ProviderKeyCandidate {
  env: string
  present: boolean
  source: 'environment' | 'env_file' | 'missing'
  runner: string
  model: string
  independentFromPrimary: boolean
  recommended: boolean
}

export interface SecondProviderReplicationPreflightReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  status: SecondProviderReplicationPreflightStatus
  facts: {
    primaryRunner: string
    primaryModel: string
    inputJsonlPresent: boolean
    inputJsonlRows: number
    promptPacketCount: number
    secondProviderResultsPresent: boolean
    secondProviderRows: number
    secondProviderRunReportPresent: boolean
    secondProviderMetricsPresent: boolean
    independentKeyPresent: boolean
  }
  keyCandidates: ProviderKeyCandidate[]
  blockers: string[]
  recommendedCommand: string
  smokeCommand: string
  fullCommand: string
  successCriteria: string[]
  requiredAction: string
}

export interface SecondProviderReplicationPreflightResult {
  jsonPath: string
  markdownPath: string
  report: SecondProviderReplicationPreflightReport
}

interface RunReport {
  runner?: string
  model?: string
  expectedCount?: number
  successCount?: number
  errorCount?: number
}

interface Metrics {
  totalDecisionPoints?: number
  totalParsedTraces?: number
}

const fixedPaths = {
  inputJsonl: 'experiments/pilot-e7-tom-prompted-batch/openai/openai-batch-input.jsonl',
  promptPackets: 'experiments/pilot-e7-tom-prompted-prompts/packets',
  primaryRunReport: 'experiments/provider-results/tom-prompted-llm-kimi-merge-report.json',
  secondProviderResults: 'experiments/provider-results/tom-prompted-llm-second-provider.jsonl',
  secondProviderRunReport: 'experiments/provider-results/tom-prompted-llm-second-provider-run-report.json',
  secondProviderMetrics: 'experiments/pilot-replication/second-provider-tom-prompted-results/metrics.json',
}

export function writeSecondProviderReplicationPreflight(
  options: SecondProviderReplicationPreflightOptions,
): SecondProviderReplicationPreflightResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = buildSecondProviderReplicationPreflight(options)
  const jsonPath = join(options.outputDir, 'second-provider-replication-preflight.json')
  const markdownPath = join(options.outputDir, 'second-provider-replication-preflight.md')
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderSecondProviderReplicationPreflight(report), 'utf8')
  return { jsonPath, markdownPath, report }
}

export function buildSecondProviderReplicationPreflight(
  options: SecondProviderReplicationPreflightOptions,
): SecondProviderReplicationPreflightReport {
  const envFileVars = readEnvFileVarNames(options.envFile)
  const primaryRun = readJsonOptional<RunReport>(options.researchRoot, fixedPaths.primaryRunReport)
  const primaryRunner = primaryRun?.runner ?? 'kimi-cli'
  const primaryModel = primaryRun?.model ?? 'kimi-code/kimi-for-coding'
  const inputJsonlPath = join(options.researchRoot, fixedPaths.inputJsonl)
  const inputJsonlPresent = existsSync(inputJsonlPath)
  const inputJsonlRows = inputJsonlPresent ? countJsonlRows(inputJsonlPath) : 0
  const promptPacketDir = join(options.researchRoot, fixedPaths.promptPackets)
  const promptPacketCount = existsSync(promptPacketDir)
    ? readdirSync(promptPacketDir).filter(name => name.endsWith('.json')).length
    : 0
  const secondProviderResultsPath = join(options.researchRoot, fixedPaths.secondProviderResults)
  const secondProviderResultsPresent = existsSync(secondProviderResultsPath)
  const secondProviderRows = secondProviderResultsPresent ? countJsonlRows(secondProviderResultsPath) : 0
  const secondProviderRunReport = readJsonOptional<RunReport>(options.researchRoot, fixedPaths.secondProviderRunReport)
  const secondProviderMetrics = readJsonOptional<Metrics>(options.researchRoot, fixedPaths.secondProviderMetrics)
  const secondProviderRunReportPresent = secondProviderRunReport !== null
  const secondProviderMetricsPresent = secondProviderMetrics !== null

  const keyCandidates = buildKeyCandidates(envFileVars, primaryRunner, primaryModel)
  const independentKeyPresent = keyCandidates.some(candidate => candidate.present && candidate.independentFromPrimary)
  const inputsReady = inputJsonlPresent && inputJsonlRows === 50 && promptPacketCount === 50
  const replicationComplete = secondProviderRunReport?.expectedCount === 50
    && secondProviderRunReport.successCount === 50
    && (secondProviderRunReport.errorCount ?? 0) === 0
    && secondProviderMetrics?.totalDecisionPoints === 50
    && typeof secondProviderMetrics.totalParsedTraces === 'number'

  const blockers: string[] = []
  if (!inputsReady) {
    blockers.push(`Fixed ToM pilot replication inputs are incomplete: input rows ${inputJsonlRows}/50, prompt packets ${promptPacketCount}/50.`)
  }
  if (!independentKeyPresent && !replicationComplete) {
    blockers.push('No independent second-provider/model API key is available in the environment or configured env file. Kimi credentials do not count because the primary run already uses Kimi.')
  }
  if (secondProviderResultsPresent && !replicationComplete) {
    blockers.push(`Second-provider output is partial or not materialized: ${secondProviderRows} raw provider row(s), run report present=${secondProviderRunReportPresent}, metrics present=${secondProviderMetricsPresent}.`)
  }

  const status: SecondProviderReplicationPreflightStatus = replicationComplete
    ? 'replication_complete'
    : !inputsReady
      ? 'blocked_missing_inputs'
      : secondProviderResultsPresent
        ? 'partial_provider_outputs'
        : independentKeyPresent
          ? 'ready_to_run'
          : 'blocked_missing_independent_provider_key'

  const fullCommand = 'npm run research:second-provider:run'
  const smokeCommand = 'npm run research:second-provider:smoke'

  return {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    status,
    facts: {
      primaryRunner,
      primaryModel,
      inputJsonlPresent,
      inputJsonlRows,
      promptPacketCount,
      secondProviderResultsPresent,
      secondProviderRows,
      secondProviderRunReportPresent,
      secondProviderMetricsPresent,
      independentKeyPresent,
    },
    keyCandidates,
    blockers,
    recommendedCommand: fullCommand,
    smokeCommand,
    fullCommand,
    successCriteria: [
      'Provider run report has expectedCount=50, successCount=50, errorCount=0.',
      'Provider JSONL is materialized at experiments/provider-results/tom-prompted-llm-second-provider.jsonl.',
      'Replication metrics are materialized at experiments/pilot-replication/second-provider-tom-prompted-results/metrics.json.',
      'Pilot replication report status becomes completed with completedReplicationCount > 0.',
      'AAMAS readiness replication-and-human-audit gate becomes pass, or reports only human-audit as remaining desirable validation.',
    ],
    requiredAction: status === 'replication_complete'
      ? 'Rerun the local research pipeline so readiness can consume the completed second-provider/model replication evidence.'
      : status === 'ready_to_run'
        ? 'Run the recommended second-provider replication command. Start with the smoke script if the provider has not been used in this repo before.'
        : 'Add an independent provider/model key such as ZHIPU_API_KEY or OPENAI_API_KEY to an uncommitted env file, then run the fixed replication command.',
  }
}

function buildKeyCandidates(
  envFileVars: Set<string>,
  primaryRunner: string,
  primaryModel: string,
): ProviderKeyCandidate[] {
  const candidates = [
    {
      env: 'ZHIPU_API_KEY',
      runner: 'zhipu-openai-compatible',
      model: 'glm-5.1',
    },
    {
      env: 'OPENAI_API_KEY',
      runner: 'openai-compatible',
      model: 'gpt-4.1-mini',
    },
    {
      env: 'KIMI_API_KEY',
      runner: 'kimi-cli',
      model: 'kimi-code/kimi-for-coding',
    },
  ]

  return candidates.map(candidate => {
    const inEnvironment = process.env[candidate.env] !== undefined
    const inEnvFile = envFileVars.has(candidate.env)
    const present = inEnvironment || inEnvFile
    const independentFromPrimary = candidate.runner !== primaryRunner || candidate.model !== primaryModel
    return {
      ...candidate,
      present,
      source: inEnvironment ? 'environment' : inEnvFile ? 'env_file' : 'missing',
      independentFromPrimary,
      recommended: present && independentFromPrimary,
    }
  })
}

function readEnvFileVarNames(path: string | undefined): Set<string> {
  if (!path || !existsSync(path)) return new Set()
  const names = new Set<string>()
  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=/.exec(line)
    if (match) names.add(match[1])
  }
  return names
}

function countJsonlRows(path: string): number {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0)
    .length
}

function readJsonOptional<T>(root: string, path: string): T | null {
  const absolutePath = join(root, path)
  if (!existsSync(absolutePath)) return null
  return JSON.parse(readFileSync(absolutePath, 'utf8')) as T
}

export function renderSecondProviderReplicationPreflight(report: SecondProviderReplicationPreflightReport): string {
  return [
    '# Second-Provider Replication Preflight',
    '',
    `Generated at: \`${report.generatedAt}\``,
    '',
    `Status: \`${report.status}\``,
    '',
    '## Facts',
    '',
    `- Primary run: \`${report.facts.primaryRunner}\` / \`${report.facts.primaryModel}\``,
    `- Fixed ToM pilot input rows: ${report.facts.inputJsonlRows}/50`,
    `- Prompt packets: ${report.facts.promptPacketCount}/50`,
    `- Second-provider rows present: ${report.facts.secondProviderRows}`,
    `- Second-provider run report present: ${report.facts.secondProviderRunReportPresent ? 'yes' : 'no'}`,
    `- Second-provider metrics present: ${report.facts.secondProviderMetricsPresent ? 'yes' : 'no'}`,
    `- Independent provider/model key present: ${report.facts.independentKeyPresent ? 'yes' : 'no'}`,
    '',
    '## Key Candidates',
    '',
    '| Env | Present | Source | Runner | Model | Independent? | Recommended? |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...report.keyCandidates.map(candidate => [
      candidate.env,
      candidate.present ? 'yes' : 'no',
      candidate.source,
      candidate.runner,
      candidate.model,
      candidate.independentFromPrimary ? 'yes' : 'no',
      candidate.recommended ? 'yes' : 'no',
    ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
    '',
    '## Blockers',
    '',
    ...(report.blockers.length > 0 ? report.blockers.map(blocker => `- ${blocker}`) : ['- none']),
    '',
    '## Smoke Command',
    '',
    '```bash',
    report.smokeCommand,
    '```',
    '',
    '## Full Resume Command',
    '',
    '```bash',
    report.fullCommand,
    '```',
    '',
    '## Success Criteria',
    '',
    ...report.successCriteria.map(item => `- ${item}`),
    '',
    '## Required Action',
    '',
    report.requiredAction,
    '',
  ].join('\n')
}

function escapeMarkdownCell(value: unknown): string {
  return String(value).replace(/\|/g, '\\|')
}
