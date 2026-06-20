import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { runOpenAIChatCompletionJsonl } from './openAIChatCompletionRunner'

interface Args {
  input: string
  out: string
  report: string
  apiKeyEnv: string
  envFile?: string
  baseUrl?: string
  requestPath?: string
  model?: string
  runner?: string
  completionTokensField?: 'max_completion_tokens' | 'max_tokens'
  concurrency: number
  limit?: number
  attemptLimit?: number
  resume: boolean
  stopOnError: boolean
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (args.envFile) loadEnvFile(args.envFile)

  const apiKey = process.env[args.apiKeyEnv]
  if (!apiKey) {
    throw new Error(`Missing OpenAI API key in ${args.apiKeyEnv}. Set it in the environment or pass --env-file pointing to a file that defines ${args.apiKeyEnv}.`)
  }

  const result = await runOpenAIChatCompletionJsonl({
    inputJsonlPath: args.input,
    outputJsonlPath: args.out,
    apiKey,
    baseUrl: args.baseUrl ?? process.env.OPENAI_BASE_URL,
    requestPath: args.requestPath,
    model: args.model,
    runner: args.runner,
    completionTokensField: args.completionTokensField,
    concurrency: args.concurrency,
    limit: args.limit,
    attemptLimit: args.attemptLimit,
    resume: args.resume,
    stopOnError: args.stopOnError,
  })

  mkdirSync(dirname(args.report), { recursive: true })
  writeFileSync(args.report, `${JSON.stringify({
    ...result,
    reportPath: args.report,
    apiKeyEnv: args.apiKeyEnv,
    generatedAt: new Date().toISOString(),
  }, null, 2)}\n`, 'utf8')

  console.log(JSON.stringify({
    providerResultsPath: args.out,
    reportPath: args.report,
    expectedCount: result.expectedCount,
    writtenCount: result.writtenCount,
    successCount: result.successCount,
    errorCount: result.errorCount,
    pendingSuccessCount: result.pendingSuccessCount,
    stoppedAfterError: result.stoppedAfterError,
  }, null, 2))
}

function parseArgs(argv: string[]): Args {
  const parsed: Partial<Args> = {
    apiKeyEnv: 'OPENAI_API_KEY',
    concurrency: 4,
    resume: false,
    stopOnError: false,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--resume') {
      parsed.resume = true
      continue
    }
    if (arg === '--stop-on-error') {
      parsed.stopOnError = true
      continue
    }
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--input') {
      parsed.input = value
      i++
    } else if (arg === '--out') {
      parsed.out = value
      i++
    } else if (arg === '--report') {
      parsed.report = value
      i++
    } else if (arg === '--api-key-env') {
      parsed.apiKeyEnv = value
      i++
    } else if (arg === '--env-file') {
      parsed.envFile = value
      i++
    } else if (arg === '--base-url') {
      parsed.baseUrl = value
      i++
    } else if (arg === '--request-path') {
      parsed.requestPath = value
      i++
    } else if (arg === '--model') {
      parsed.model = value
      i++
    } else if (arg === '--runner') {
      parsed.runner = value
      i++
    } else if (arg === '--completion-tokens-field') {
      if (value !== 'max_completion_tokens' && value !== 'max_tokens') {
        throw new Error('--completion-tokens-field must be max_completion_tokens or max_tokens')
      }
      parsed.completionTokensField = value
      i++
    } else if (arg === '--concurrency') {
      parsed.concurrency = Number(value)
      i++
    } else if (arg === '--limit') {
      parsed.limit = Number(value)
      i++
    } else if (arg === '--attempt-limit') {
      parsed.attemptLimit = Number(value)
      i++
    }
  }

  for (const required of ['input', 'out', 'report'] as const) {
    if (!parsed[required]) throw new Error(`Missing required argument --${required}`)
  }
  if (!Number.isFinite(parsed.concurrency) || parsed.concurrency! < 1) {
    throw new Error('--concurrency must be a positive number')
  }
  if (parsed.limit !== undefined && (!Number.isInteger(parsed.limit) || parsed.limit < 1)) {
    throw new Error('--limit must be a positive integer')
  }
  if (parsed.attemptLimit !== undefined && (!Number.isInteger(parsed.attemptLimit) || parsed.attemptLimit < 0)) {
    throw new Error('--attempt-limit must be a non-negative integer')
  }

  return parsed as Args
}

function loadEnvFile(path: string): void {
  if (!existsSync(path)) throw new Error(`Env file does not exist: ${path}`)

  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line)
    if (!match) continue
    const [, key, rawValue] = match
    if (process.env[key] !== undefined) continue
    process.env[key] = unquote(rawValue.trim())
  }
}

function unquote(value: string): string {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  return value
}
