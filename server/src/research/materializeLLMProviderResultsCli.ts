import { materializeProviderResults } from './llmProviderResults'

interface Args {
  batchJsonl: string
  providerResults: string
  raw: string
  report: string
  provenanceOut?: string
  modelProvider: string
  modelName: string
  runId?: string
  temperature?: number
  notes?: string
}

const args = parseArgs(process.argv.slice(2))
const result = materializeProviderResults({
  batchJsonlPath: args.batchJsonl,
  providerResultJsonlPath: args.providerResults,
  rawOutputDir: args.raw,
  reportPath: args.report,
  provenancePath: args.provenanceOut,
  provenance: {
    modelProvider: args.modelProvider,
    modelName: args.modelName,
    runId: args.runId,
    temperature: args.temperature,
    notes: args.notes,
  },
})

console.log(JSON.stringify({
  reportPath: args.report,
  provenancePath: args.provenanceOut,
  expectedCount: result.expectedCount,
  writtenCount: result.writtenCount,
  readyForAudit: result.readyForAudit,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Partial<Args> = {
    modelProvider: 'unknown',
    modelName: 'unknown',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--batch-jsonl') {
      parsed.batchJsonl = value
      i++
    } else if (arg === '--provider-results') {
      parsed.providerResults = value
      i++
    } else if (arg === '--raw') {
      parsed.raw = value
      i++
    } else if (arg === '--report') {
      parsed.report = value
      i++
    } else if (arg === '--provenance-out') {
      parsed.provenanceOut = value
      i++
    } else if (arg === '--model-provider') {
      parsed.modelProvider = value
      i++
    } else if (arg === '--model-name') {
      parsed.modelName = value
      i++
    } else if (arg === '--run-id') {
      parsed.runId = value
      i++
    } else if (arg === '--temperature') {
      parsed.temperature = Number(value)
      i++
    } else if (arg === '--notes') {
      parsed.notes = value
      i++
    }
  }

  for (const required of ['batchJsonl', 'providerResults', 'raw', 'report'] as const) {
    if (!parsed[required]) {
      throw new Error(`Missing required argument --${toKebab(required)}`)
    }
  }

  return parsed as Args
}

function toKebab(value: string): string {
  return value.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
}
