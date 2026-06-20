import { writeHumanAuditLaunchChecklist } from './humanAuditLaunchChecklist'

interface Args {
  root: string
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeHumanAuditLaunchChecklist({
  researchRoot: args.root,
  outputDir: args.out,
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  status: result.report.status,
  readyForAnnotation: result.report.facts.readyForAnnotation,
  readyForPaperEvidence: result.report.facts.readyForPaperEvidence,
  sampleCount: result.report.facts.sampleCount,
  failedChecks: result.report.checks.filter(check => check.status === 'fail').map(check => check.id),
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    root: 'docs/research',
    out: 'docs/research/submission/human-audit-launch',
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
