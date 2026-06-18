import { writeProviderHandoffAudit } from './providerHandoffAudit'

interface Args {
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeProviderHandoffAudit({
  outputDir: args.out,
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  status: result.report.status,
  conditionCount: result.report.conditionCount,
  issueCount: result.report.issues.length,
}, null, 2))

process.exitCode = result.report.status === 'ready' ? 0 : 1

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    out: 'docs/research/submission/provider-handoff-audit',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--out') {
      parsed.out = value
      i++
    }
  }

  return parsed
}
