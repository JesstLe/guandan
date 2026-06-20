import { writeHumanAuditEvidenceGate } from './humanAuditEvidenceGate'

interface Args {
  root: string
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeHumanAuditEvidenceGate({
  researchRoot: args.root,
  outputDir: args.out,
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  status: result.report.status,
  readyForPaperEvidence: result.report.facts.readyForPaperEvidence,
  completedLabels: result.report.facts.completedLabels,
  totalLabels: result.report.facts.totalLabels,
  failedChecks: result.report.checks.filter(check => check.status === 'fail').length,
  pendingChecks: result.report.checks.filter(check => check.status === 'pending').length,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    root: 'docs/research',
    out: 'docs/research/submission/human-audit-evidence-gate',
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
