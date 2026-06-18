import { writeSubmissionMarkerInventory } from './submissionMarkerInventory'

interface Args {
  root: string
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeSubmissionMarkerInventory({
  researchRoot: args.root,
  outputDir: args.out,
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  markerScope: result.inventory.markerScope,
  counts: result.inventory.counts,
  itemCount: result.inventory.items.length,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    root: 'docs/research',
    out: 'docs/research/submission/marker-inventory',
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
