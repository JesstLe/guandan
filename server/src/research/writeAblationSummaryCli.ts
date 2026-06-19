import {
  writeAblationSummary,
  type AblationVariantInput,
} from './ablationSummary'

interface Args {
  out: string
  fullMetrics?: string
  attribution?: string
  variants: AblationVariantInput[]
}

const args = parseArgs(process.argv.slice(2))
const result = writeAblationSummary({
  outputDir: args.out,
  input: {
    fullVerifierMetricsPath: args.fullMetrics,
    attributionPath: args.attribution,
    variants: args.variants,
  },
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  status: result.summary.status,
  rowCount: result.summary.rows.length,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    out: 'docs/research/experiments/pilot-ablation-summary',
    fullMetrics: 'docs/research/experiments/pilot-e6-verifier-revision-results/metrics.json',
    attribution: 'docs/research/experiments/pilot-verifier-attribution/verifier-attribution.json',
    variants: defaultVariants(),
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (arg === '--no-defaults') {
      parsed.variants = []
      continue
    }
    if (value === undefined) continue

    if (arg === '--out') {
      parsed.out = value
      i++
    } else if (arg === '--full-metrics') {
      parsed.fullMetrics = value
      i++
    } else if (arg === '--attribution') {
      parsed.attribution = value
      i++
    } else if (arg === '--variant') {
      parsed.variants.push(parseVariant(value))
      i++
    }
  }

  return parsed
}

function parseVariant(value: string): AblationVariantInput {
  const parts = Object.fromEntries(
    value.split(',').map(part => {
      const [key, ...rest] = part.split('=')
      return [key, rest.join('=')]
    }),
  )
  for (const key of ['variantId', 'title', 'removedComponent', 'targetLabel'] as const) {
    if (!parts[key]) throw new Error(`--variant requires ${key}=...`)
  }
  return {
    variantId: parts.variantId,
    title: parts.title,
    removedComponent: parts.removedComponent,
    targetLabel: parts.targetLabel,
    metricsPath: parts.metricsPath || undefined,
  }
}

function defaultVariants(): AblationVariantInput[] {
  return [
    {
      variantId: 'no-public-history-check',
      title: 'No Public-History Check',
      removedComponent: 'public-history consistency',
      targetLabel: 'publicHistoryConsistent',
    },
    {
      variantId: 'no-hidden-info-check',
      title: 'No Hidden-Info Check',
      removedComponent: 'hidden-information discipline',
      targetLabel: 'hiddenInfoDisciplined',
    },
    {
      variantId: 'no-partner-check',
      title: 'No Partner Check',
      removedComponent: 'partner consistency',
      targetLabel: 'partnerConsistent',
    },
    {
      variantId: 'no-opponent-check',
      title: 'No Opponent Check',
      removedComponent: 'opponent consistency',
      targetLabel: 'opponentConsistent',
    },
    {
      variantId: 'no-reason-action-check',
      title: 'No Reason-Action Check',
      removedComponent: 'reason-action consistency',
      targetLabel: 'reasonActionConsistent',
    },
    {
      variantId: 'no-team-objective-check',
      title: 'No Team-Objective Check',
      removedComponent: 'team-objective validity',
      targetLabel: 'teamObjectiveValid',
    },
  ]
}
