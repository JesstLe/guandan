import { writeVisualEvidenceReport } from './visualEvidenceReport'

interface Args {
  root: string
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeVisualEvidenceReport({
  researchRoot: args.root,
  outputDir: args.out,
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  status: result.report.status,
  figures: result.report.facts.figureCount,
  tables: result.report.facts.tableCount,
  checks: result.report.checks.length,
  pendingExternalEvidence: result.report.checks.filter(check => check.status === 'external_evidence_pending').length,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    root: 'docs/research',
    out: 'docs/research/submission/visual-evidence',
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
