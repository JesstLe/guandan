import { writeSecondProviderReplicationPreflight } from './secondProviderReplicationPreflight'

interface Args {
  root: string
  out: string
  envFile?: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeSecondProviderReplicationPreflight({
  researchRoot: args.root,
  outputDir: args.out,
  envFile: args.envFile,
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  status: result.report.status,
  independentKeyPresent: result.report.facts.independentKeyPresent,
  blockerCount: result.report.blockers.length,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    root: 'docs/research',
    out: 'docs/research/experiments/pilot-replication',
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
    } else if (arg === '--env-file') {
      parsed.envFile = value
      i++
    }
  }

  return parsed
}
