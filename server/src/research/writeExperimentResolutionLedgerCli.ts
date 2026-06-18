import { writeExperimentResolutionLedger } from './experimentResolutionLedger'

interface Args {
  root: string
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeExperimentResolutionLedger({
  researchRoot: args.root,
  outputDir: args.out,
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  totalItems: result.ledger.counts.totalItems,
  byStatus: result.ledger.counts.byStatus,
  byEvidenceFamily: result.ledger.counts.byEvidenceFamily,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    root: 'docs/research',
    out: 'docs/research/submission/experiment-resolution-ledger',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--root') {
      parsed.root = value
      i++
    } else if (arg === '--out') {
      parsed.out = value
      i++
    }
  }

  return parsed
}
