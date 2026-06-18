import { writeHumanAuditPacket } from './humanAuditPacket'

interface Args {
  decisions: string
  traces: string
  results: string
  out: string
  sampleSize: number
}

const args = parseArgs(process.argv.slice(2))
const result = writeHumanAuditPacket({
  decisionsDir: args.decisions,
  tracesDir: args.traces,
  resultsDir: args.results,
  outputDir: args.out,
  sampleSize: args.sampleSize,
})

console.log(JSON.stringify(result, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    decisions: 'docs/research/experiments/full-e1/decisions',
    traces: 'docs/research/experiments/full-e5-tom-schema-repair-results/traces',
    results: 'docs/research/experiments/full-e5-tom-schema-repair-results/results',
    out: 'docs/research/experiments/human-soft-label-audit',
    sampleSize: 40,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--decisions') {
      parsed.decisions = value
      i++
    } else if (arg === '--traces') {
      parsed.traces = value
      i++
    } else if (arg === '--results') {
      parsed.results = value
      i++
    } else if (arg === '--out') {
      parsed.out = value
      i++
    } else if (arg === '--sample-size') {
      parsed.sampleSize = Number(value)
      i++
    }
  }

  if (!Number.isInteger(parsed.sampleSize) || parsed.sampleSize <= 0) {
    throw new Error(`Invalid --sample-size: ${parsed.sampleSize}`)
  }

  return parsed
}
