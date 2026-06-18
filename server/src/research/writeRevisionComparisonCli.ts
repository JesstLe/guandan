import { writeRevisionComparison } from './revisionComparison'

interface Args {
  firstPassAgentId: string
  revisionAgentId: string
  firstPassMetrics?: string
  revisionMetrics?: string
  firstPassAudit?: string
  revisionAudit?: string
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeRevisionComparison({
  outputDir: args.out,
  input: {
    firstPassAgentId: args.firstPassAgentId,
    revisionAgentId: args.revisionAgentId,
    firstPassMetricsPath: args.firstPassMetrics,
    revisionMetricsPath: args.revisionMetrics,
    firstPassRawAuditPath: args.firstPassAudit,
    revisionRawAuditPath: args.revisionAudit,
  },
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  status: result.comparison.status,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    firstPassAgentId: 'candidate-constrained-llm',
    revisionAgentId: 'verifier-revision-llm',
    firstPassMetrics: 'docs/research/experiments/pilot-e5-candidate-constrained-results/metrics.json',
    revisionMetrics: 'docs/research/experiments/pilot-e6-verifier-revision-results/metrics.json',
    out: 'docs/research/experiments/pilot-revision-comparison',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--first-pass-agent') {
      parsed.firstPassAgentId = value
      i++
    } else if (arg === '--revision-agent') {
      parsed.revisionAgentId = value
      i++
    } else if (arg === '--first-pass-metrics') {
      parsed.firstPassMetrics = value
      parsed.firstPassAudit = undefined
      i++
    } else if (arg === '--revision-metrics') {
      parsed.revisionMetrics = value
      parsed.revisionAudit = undefined
      i++
    } else if (arg === '--first-pass-audit') {
      parsed.firstPassAudit = value
      parsed.firstPassMetrics = undefined
      i++
    } else if (arg === '--revision-audit') {
      parsed.revisionAudit = value
      parsed.revisionMetrics = undefined
      i++
    } else if (arg === '--out') {
      parsed.out = value
      i++
    }
  }

  return parsed
}
