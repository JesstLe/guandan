import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import {
  type OpenAIChatCompletionRequest,
  type OpenAIChatCompletionRunReport,
  runOpenAIChatCompletionJsonl,
} from './openAIChatCompletionRunner'
import {
  type PostProviderConditionResult,
  runPostProviderCondition,
} from './postProviderConditionRunner'

export interface SecondProviderPilotReplicationOptions {
  researchRoot: string
  apiKey: string
  apiKeyEnv?: string
  baseUrl: string
  requestPath?: string
  model: string
  runner: string
  completionTokensField?: 'max_completion_tokens' | 'max_tokens'
  concurrency?: number
  limit?: number
  attemptLimit?: number
  resume?: boolean
  stopOnError?: boolean
  request?: OpenAIChatCompletionRequest
}

export interface SecondProviderPilotReplicationResult {
  schemaVersion: '0.1.0'
  status: 'provider_complete_materialized' | 'provider_partial_not_materialized'
  providerRun: OpenAIChatCompletionRunReport
  providerResultsPath: string
  runReportPath: string
  materialization?: PostProviderConditionResult
  materialized: boolean
  blockers: string[]
}

interface PrimaryProviderRunReport {
  runner?: string
  model?: string
}

const fixedPaths = {
  inputJsonl: 'experiments/pilot-e7-tom-prompted-batch/openai/openai-batch-input.jsonl',
  primaryRunReport: 'experiments/provider-results/tom-prompted-llm-kimi-merge-report.json',
  providerResults: 'experiments/provider-results/tom-prompted-llm-second-provider.jsonl',
  runReport: 'experiments/provider-results/tom-prompted-llm-second-provider-run-report.json',
  decisions: 'experiments/pilot-e1/decisions',
  packets: 'experiments/pilot-e7-tom-prompted-prompts/packets',
  providerNeutralBatch: 'experiments/pilot-e7-tom-prompted-batch/batch-input.jsonl',
  raw: 'experiments/pilot-replication/second-provider-tom-prompted-batch/raw',
  out: 'experiments/pilot-replication/second-provider-tom-prompted-results',
}

export async function runSecondProviderPilotReplication(
  options: SecondProviderPilotReplicationOptions,
): Promise<SecondProviderPilotReplicationResult> {
  assertIndependentFromPrimary(options)

  const providerResultsPath = join(options.researchRoot, fixedPaths.providerResults)
  const runReportPath = join(options.researchRoot, fixedPaths.runReport)
  const providerRun = await runOpenAIChatCompletionJsonl({
    inputJsonlPath: join(options.researchRoot, fixedPaths.inputJsonl),
    outputJsonlPath: providerResultsPath,
    apiKey: options.apiKey,
    baseUrl: options.baseUrl,
    requestPath: options.requestPath ?? '/chat/completions',
    model: options.model,
    runner: options.runner,
    completionTokensField: options.completionTokensField,
    concurrency: options.concurrency,
    limit: options.limit,
    attemptLimit: options.attemptLimit,
    resume: options.resume,
    stopOnError: options.stopOnError,
    request: options.request,
  })

  writeJson(runReportPath, {
    ...providerRun,
    reportPath: runReportPath,
    apiKeyEnv: options.apiKeyEnv,
    generatedAt: new Date().toISOString(),
  })

  const blockers: string[] = []
  const providerComplete = providerRun.expectedCount === 50
    && providerRun.successCount === 50
    && providerRun.errorCount === 0

  if (!providerComplete) {
    blockers.push([
      'Provider run is not complete enough for replication materialization:',
      `${providerRun.successCount}/${providerRun.expectedCount} successful outputs,`,
      `${providerRun.errorCount} errors,`,
      `${providerRun.pendingSuccessCount} pending.`,
    ].join(' '))
    return {
      schemaVersion: '0.1.0',
      status: 'provider_partial_not_materialized',
      providerRun,
      providerResultsPath,
      runReportPath,
      materialized: false,
      blockers,
    }
  }

  const materialization = runPostProviderCondition({
    decisionsDir: join(options.researchRoot, fixedPaths.decisions),
    promptPacketDir: join(options.researchRoot, fixedPaths.packets),
    batchJsonlPath: join(options.researchRoot, fixedPaths.providerNeutralBatch),
    providerResultJsonlPath: providerResultsPath,
    rawOutputDir: join(options.researchRoot, fixedPaths.raw),
    outputDir: join(options.researchRoot, fixedPaths.out),
    conditionId: 'tom-prompted-llm',
    provenance: {
      modelProvider: options.runner,
      modelName: options.model,
      temperature: 0,
      notes: 'Second-provider/model ToM pilot replication.',
    },
  })

  if (materialization.status !== 'ingested') {
    blockers.push(...materialization.blockers)
  }

  return {
    schemaVersion: '0.1.0',
    status: materialization.status === 'ingested'
      ? 'provider_complete_materialized'
      : 'provider_partial_not_materialized',
    providerRun,
    providerResultsPath,
    runReportPath,
    materialization,
    materialized: materialization.status === 'ingested',
    blockers,
  }
}

function assertIndependentFromPrimary(options: SecondProviderPilotReplicationOptions): void {
  const primary = readJsonOptional<PrimaryProviderRunReport>(
    options.researchRoot,
    fixedPaths.primaryRunReport,
  )
  const primaryRunner = primary?.runner ?? 'kimi-cli'
  const primaryModel = primary?.model ?? 'kimi-code/kimi-for-coding'
  if (options.runner === primaryRunner && options.model === primaryModel) {
    throw new Error([
      'Refusing to run second-provider replication with the same provider/model as the primary ToM pilot.',
      `primary=${primaryRunner}/${primaryModel}; requested=${options.runner}/${options.model}.`,
      'Use an independent provider or model such as zhipu-openai-compatible/glm-5.1.',
    ].join(' '))
  }
}

function readJsonOptional<T>(root: string, path: string): T | null {
  const absolutePath = join(root, path)
  if (!existsSync(absolutePath)) return null
  return JSON.parse(readFileSync(absolutePath, 'utf8')) as T
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
