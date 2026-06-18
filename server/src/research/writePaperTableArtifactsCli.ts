import { writePaperTableArtifacts } from './paperTableArtifacts'

interface Args {
  metrics: string
  revision: string
  ablation: string
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = writePaperTableArtifacts({
  metricsSummaryPath: args.metrics,
  revisionComparisonPath: args.revision,
  ablationSummaryPath: args.ablation,
  outputDir: args.out,
})

console.log(JSON.stringify(result, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    metrics: 'docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json',
    revision: 'docs/research/experiments/pilot-revision-comparison/revision-comparison.json',
    ablation: 'docs/research/experiments/pilot-ablation-summary/ablation-summary.json',
    out: 'docs/research/tables',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--metrics') {
      parsed.metrics = value
      i++
    } else if (arg === '--revision') {
      parsed.revision = value
      i++
    } else if (arg === '--ablation') {
      parsed.ablation = value
      i++
    } else if (arg === '--out') {
      parsed.out = value
      i++
    }
  }

  return parsed
}
