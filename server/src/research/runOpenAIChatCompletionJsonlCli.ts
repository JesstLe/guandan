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
  concurrency: number
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
    concurrency: args.concurrency,
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
  }, null, 2))
}

function parseArgs(argv: string[]): Args {
  const parsed: Partial<Args> = {
    apiKeyEnv: 'OPENAI_API_KEY',
    concurrency: 4,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
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
    } else if (arg === '--concurrency') {
      parsed.concurrency = Number(value)
      i++
    }
  }

  for (const required of ['input', 'out', 'report'] as const) {
    if (!parsed[required]) throw new Error(`Missing required argument --${required}`)
  }
  if (!Number.isFinite(parsed.concurrency) || parsed.concurrency! < 1) {
    throw new Error('--concurrency must be a positive number')
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
