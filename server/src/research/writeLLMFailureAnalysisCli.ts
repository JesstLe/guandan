import { writeLLMFailureAnalysis } from './llmFailureAnalysis'

interface Args {
  metrics: string
  raw: string
  results: string
  out: string
  basename: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeLLMFailureAnalysis({
  metricsPath: args.metrics,
  rawOutputDir: args.raw,
  resultDir: args.results,
  outputDir: args.out,
  basename: args.basename,
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  conditionId: result.analysis.conditionId,
  parseFailures: result.analysis.parseFailures,
  hardFailures: result.analysis.hardFailures,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    metrics: 'docs/research/experiments/pilot-e7-tom-prompted-results/metrics.json',
    raw: 'docs/research/experiments/pilot-e7-tom-prompted-batch/raw',
    results: 'docs/research/experiments/pilot-e7-tom-prompted-results/results',
    out: 'docs/research/experiments/pilot-e7-tom-failure-analysis',
    basename: 'tom-failure-analysis',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--metrics') {
      parsed.metrics = value
      i++
    } else if (arg === '--raw') {
      parsed.raw = value
      i++
    } else if (arg === '--results') {
      parsed.results = value
      i++
    } else if (arg === '--out') {
      parsed.out = value
      i++
    } else if (arg === '--basename') {
      parsed.basename = value
      i++
    }
  }

  return parsed
}
