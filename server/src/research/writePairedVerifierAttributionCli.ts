import { writeVerifierAttribution } from './pairedVerifierAttribution'

interface Args {
  out: string
  beforeAgentId: string
  afterAgentId: string
  beforeResultsDir: string
  afterResultsDir: string
  beforeTracesDir: string
  afterTracesDir: string
  parseFailureReportPath: string
  bootstrapIterations: number
  bootstrapSeed: number
}

const args = parseArgs(process.argv.slice(2))
const result = writeVerifierAttribution({
  outputDir: args.out,
  input: {
    beforeAgentId: args.beforeAgentId,
    afterAgentId: args.afterAgentId,
    beforeResultsDir: args.beforeResultsDir,
    afterResultsDir: args.afterResultsDir,
    beforeTracesDir: args.beforeTracesDir,
    afterTracesDir: args.afterTracesDir,
    parseFailureReportPath: args.parseFailureReportPath,
    bootstrapIterations: args.bootstrapIterations,
    bootstrapSeed: args.bootstrapSeed,
  },
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  status: result.report.status,
  pairedDecisionCount: result.report.pairedDecisionCount,
  excludedParseFailureCount: result.report.excludedParseFailureCount,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    out: 'docs/research/experiments/pilot-verifier-attribution',
    beforeAgentId: 'candidate-constrained-llm',
    afterAgentId: 'verifier-revision-llm',
    beforeResultsDir: 'docs/research/experiments/pilot-e5-candidate-constrained-results/results',
    afterResultsDir: 'docs/research/experiments/pilot-e6-verifier-revision-results/results',
    beforeTracesDir: 'docs/research/experiments/pilot-e5-candidate-constrained-results/traces',
    afterTracesDir: 'docs/research/experiments/pilot-e6-verifier-revision-results/traces',
    parseFailureReportPath: 'docs/research/experiments/pilot-e5-candidate-constrained-results/post-provider-report.json',
    bootstrapIterations: 2000,
    bootstrapSeed: 1729,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--out') {
      parsed.out = value
      i++
    } else if (arg === '--before-agent') {
      parsed.beforeAgentId = value
      i++
    } else if (arg === '--after-agent') {
      parsed.afterAgentId = value
      i++
    } else if (arg === '--before-results-dir') {
      parsed.beforeResultsDir = value
      i++
    } else if (arg === '--after-results-dir') {
      parsed.afterResultsDir = value
      i++
    } else if (arg === '--before-traces-dir') {
      parsed.beforeTracesDir = value
      i++
    } else if (arg === '--after-traces-dir') {
      parsed.afterTracesDir = value
      i++
    } else if (arg === '--parse-failure-report') {
      parsed.parseFailureReportPath = value
      i++
    } else if (arg === '--bootstrap-iterations') {
      parsed.bootstrapIterations = Number(value)
      i++
    } else if (arg === '--bootstrap-seed') {
      parsed.bootstrapSeed = Number(value)
      i++
    }
  }

  return parsed
}
