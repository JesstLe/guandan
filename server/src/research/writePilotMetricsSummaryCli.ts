import { writeMetricsSummary, type MetricsSummarySource } from './experimentMetricsSummary'

interface CliOptions {
  outputDir: string
  sources: MetricsSummarySource[]
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    outputDir: 'docs/research/experiments/pilot-metrics-summary',
    sources: defaultSources(),
  }

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--out') {
      options.outputDir = readValue(args, ++index, '--out')
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
      rawAuditPath: 'docs/research/experiments/pilot-e4-plain-llm-batch/raw-output-audit.json',
      notes: 'waiting for real model raw outputs',
    },
    {
      agentId: 'candidate-constrained-llm',
      rawAuditPath: 'docs/research/experiments/pilot-e5-candidate-constrained-batch/raw-output-audit.json',
      notes: 'waiting for real model raw outputs',
    },
    {
      agentId: 'verifier-revision-llm',
      rawAuditPath: 'docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/raw-output-audit.json',
      notes: 'fixture revision prompts exported; waiting for real revision raw outputs',
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
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  rowCount: result.summary.rows.length,
}, null, 2))
