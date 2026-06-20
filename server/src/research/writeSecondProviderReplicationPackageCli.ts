import { writeSecondProviderReplicationPackage } from './secondProviderReplicationPackage'

interface Args {
  root: string
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeSecondProviderReplicationPackage({
  researchRoot: args.root,
  outputDir: args.out,
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  status: result.report.status,
  packageDir: result.report.packageDir,
  inputRows: result.report.inputRows,
  promptPacketCount: result.report.promptPacketCount,
  files: result.report.files.length,
  readyForExternalRun: result.report.readyForExternalRun,
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
    }
  }

  return parsed
}
