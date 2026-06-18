import { runLLMSchemaRepair } from './llmSchemaRepair'

interface Args {
  decisions: string
  raw: string
  out: string
  agent: string
}

const args = parseArgs(process.argv.slice(2))
const result = runLLMSchemaRepair({
  decisionsDir: args.decisions,
  rawOutputDir: args.raw,
  outputDir: args.out,
  agentId: args.agent,
})

console.log(JSON.stringify({
  metricsPath: result.metricsPath,
  repairReportPath: result.repairReportPath,
  markdownPath: result.markdownPath,
  repaired: result.records.filter(record => record.status === 'repaired').length,
  passThrough: result.records.filter(record => record.status === 'pass_through').length,
  notRepairable: result.records.filter(record => record.status === 'not_repairable').length,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    decisions: 'docs/research/experiments/pilot-e1/decisions',
    raw: 'docs/research/experiments/pilot-e7-tom-prompted-batch/raw',
    out: 'docs/research/experiments/pilot-e8-tom-schema-repair-results',
    agent: 'tom-schema-repair',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--decisions') {
      parsed.decisions = value
      i++
    } else if (arg === '--raw') {
      parsed.raw = value
      i++
    } else if (arg === '--out') {
      parsed.out = value
      i++
    } else if (arg === '--agent') {
      parsed.agent = value
      i++
    }
  }

  return parsed
}
