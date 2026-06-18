import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { runKimiCliBatchJsonl } from './kimiCliBatchRunner'

interface Args {
  input: string
  out: string
  report: string
  kimiBin?: string
  model?: string
  maxStepsPerTurn: number
  concurrency: number
  limit?: number
  attemptLimit?: number
  timeoutMs?: number
  resume: boolean
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const result = await runKimiCliBatchJsonl({
    inputJsonlPath: args.input,
    outputJsonlPath: args.out,
    kimiBin: args.kimiBin,
    model: args.model,
    maxStepsPerTurn: args.maxStepsPerTurn,
    concurrency: args.concurrency,
    limit: args.limit,
    attemptLimit: args.attemptLimit,
    timeoutMs: args.timeoutMs,
    resume: args.resume,
  })

  mkdirSync(dirname(args.report), { recursive: true })
  writeFileSync(args.report, `${JSON.stringify({
    ...result,
    reportPath: args.report,
    generatedAt: new Date().toISOString(),
    runner: 'kimi-cli',
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
    maxStepsPerTurn: 1,
    concurrency: 1,
    resume: false,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--resume') {
      parsed.resume = true
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
    } else if (arg === '--kimi-bin') {
      parsed.kimiBin = value
      i++
    } else if (arg === '--model') {
      parsed.model = value
      i++
    } else if (arg === '--max-steps-per-turn') {
      parsed.maxStepsPerTurn = Number(value)
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
    } else if (arg === '--timeout-ms') {
      parsed.timeoutMs = Number(value)
      i++
    }
  }

  for (const required of ['input', 'out', 'report'] as const) {
    if (!parsed[required]) throw new Error(`Missing required argument --${required}`)
  }
  if (!Number.isFinite(parsed.maxStepsPerTurn) || parsed.maxStepsPerTurn! < 1) {
    throw new Error('--max-steps-per-turn must be a positive number')
  }
  if (!Number.isFinite(parsed.concurrency) || parsed.concurrency! < 1) {
    throw new Error('--concurrency must be a positive number')
  }
  if (parsed.limit !== undefined && (!Number.isInteger(parsed.limit) || parsed.limit < 1)) {
    throw new Error('--limit must be a positive integer')
  }
  if (parsed.attemptLimit !== undefined && (!Number.isInteger(parsed.attemptLimit) || parsed.attemptLimit < 1)) {
    throw new Error('--attempt-limit must be a positive integer')
  }
  if (parsed.timeoutMs !== undefined && (!Number.isInteger(parsed.timeoutMs) || parsed.timeoutMs < 1)) {
    throw new Error('--timeout-ms must be a positive integer')
  }

  return parsed as Args
}
