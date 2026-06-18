import { writeMetricsSummary, type MetricsSummarySource } from './experimentMetricsSummary'

interface CliOptions {
  outputDir: string
  basename: string
  title: string
  description?: string
  sources: MetricsSummarySource[]
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    outputDir: 'docs/research/experiments/pilot-metrics-summary',
    basename: 'pilot-metrics-summary',
    title: 'Pilot Metrics Summary',
    sources: defaultSources(),
  }

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--out') {
      options.outputDir = readValue(args, ++index, '--out')
    } else if (arg === '--basename') {
      options.basename = readValue(args, ++index, '--basename')
    } else if (arg === '--title') {
      options.title = readValue(args, ++index, '--title')
    } else if (arg === '--description') {
      options.description = readValue(args, ++index, '--description')
    } else if (arg === '--source') {
      options.sources.push(parseSource(readValue(args, ++index, '--source')))
    } else if (arg === '--no-defaults') {
      options.sources = []
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return options
}

function parseSource(value: string): MetricsSummarySource {
  const parts = Object.fromEntries(
    value.split(',').map(part => {
      const [key, ...rest] = part.split('=')
      return [key, rest.join('=')]
    }),
  )
  if (!parts.agentId) throw new Error('--source requires agentId=<id>')
  return {
    agentId: parts.agentId,
    metricsPath: parts.metricsPath || undefined,
    rawAuditPath: parts.rawAuditPath || undefined,
    notes: parts.notes || undefined,
  }
}

function defaultSources(): MetricsSummarySource[] {
  return [
    {
      agentId: 'heuristic-legal-first',
      metricsPath: 'docs/research/experiments/pilot-e2-heuristic-verifier/metrics.json',
      notes: 'deterministic baseline; pipeline validation only',
    },
    {
      agentId: 'strategic-heuristic',
      metricsPath: 'docs/research/experiments/pilot-e3-strategic-heuristic/metrics.json',
      notes: 'deterministic strategic baseline',
    },
    {
      agentId: 'plain-llm',
      metricsPath: 'docs/research/experiments/pilot-e4-plain-llm-results/metrics.json',
      notes: 'Kimi Code CLI plain LLM baseline',
    },
    {
      agentId: 'candidate-constrained-llm',
      metricsPath: 'docs/research/experiments/pilot-e5-candidate-constrained-results/metrics.json',
      notes: 'Kimi Code CLI with verifier-provided legal candidates',
    },
    {
      agentId: 'tom-prompted-llm',
      metricsPath: 'docs/research/experiments/pilot-e7-tom-prompted-results/metrics.json',
      notes: 'Kimi Code CLI with explicit theory-of-mind reasoning checklist',
    },
    {
      agentId: 'verifier-revision-llm',
      metricsPath: 'docs/research/experiments/pilot-e6-verifier-revision-results/metrics.json',
      notes: 'Kimi Code CLI revision on parsed candidate traces',
    },
  ]
}

function readValue(args: string[], index: number, flag: string): string {
  const value = args[index]
  if (!value) throw new Error(`${flag} requires a value`)
  return value
}

const options = parseArgs(process.argv.slice(2))
const result = writeMetricsSummary({
  sources: options.sources,
  outputDir: options.outputDir,
  basename: options.basename,
  title: options.title,
  description: options.description,
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  rowCount: result.summary.rows.length,
}, null, 2))
