import type { LLMConditionId } from './llmPromptPackets'
import { runPostProviderCondition } from './postProviderConditionRunner'

interface Args {
  decisions: string
  packets: string
  batchJsonl: string
  providerResults: string
  raw: string
  out: string
  condition: LLMConditionId
  modelProvider: string
  modelName: string
  runId?: string
  temperature?: number
  notes?: string
}

const args = parseArgs(process.argv.slice(2))
const result = runPostProviderCondition({
  decisionsDir: args.decisions,
  promptPacketDir: args.packets,
  batchJsonlPath: args.batchJsonl,
  providerResultJsonlPath: args.providerResults,
  rawOutputDir: args.raw,
  outputDir: args.out,
  conditionId: args.condition,
  provenance: {
    modelProvider: args.modelProvider,
    modelName: args.modelName,
    runId: args.runId,
    temperature: args.temperature,
    notes: args.notes,
  },
})

console.log(JSON.stringify({
  status: result.status,
  conditionId: result.conditionId,
  reportPath: result.reportPath,
  metricsPath: result.metricsPath,
  blockerCount: result.blockers.length,
  blockers: result.blockers,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Partial<Args> = {
    decisions: 'docs/research/experiments/pilot-e1/decisions',
    modelProvider: 'unknown',
    modelName: 'unknown',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--decisions') {
      parsed.decisions = value
      i++
    } else if (arg === '--packets') {
      parsed.packets = value
      i++
    } else if (arg === '--batch-jsonl') {
      parsed.batchJsonl = value
      i++
    } else if (arg === '--provider-results') {
      parsed.providerResults = value
      i++
    } else if (arg === '--raw') {
      parsed.raw = value
      i++
    } else if (arg === '--out') {
      parsed.out = value
      i++
    } else if (arg === '--condition') {
      parsed.condition = parseCondition(value)
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

  for (const required of ['packets', 'batchJsonl', 'providerResults', 'raw', 'out', 'condition'] as const) {
    if (!parsed[required]) throw new Error(`Missing required argument for ${required}`)
  }

  return parsed as Args
}

function parseCondition(value: string): LLMConditionId {
  if (
    value === 'plain-llm'
    || value === 'candidate-constrained-llm'
    || value === 'tom-prompted-llm'
    || value === 'verifier-revision-llm'
  ) {
    return value
  }
  throw new Error(`Unknown condition: ${value}`)
}
