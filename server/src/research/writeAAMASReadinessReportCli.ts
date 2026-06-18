import { writeAAMASReadinessReport } from './aamasReadinessReport'

interface Args {
  root: string
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeAAMASReadinessReport({
  researchRoot: args.root,
  outputDir: args.out,
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  localSubmissionHygiene: result.report.localSubmissionHygiene,
  aamasFullPaperReadiness: result.report.aamasFullPaperReadiness,
  gates: result.report.gates.length,
  needsExperiment: result.report.gates.filter(gate => gate.status === 'needs_experiment').length,
  needsRevision: result.report.gates.filter(gate => gate.status === 'needs_revision').length,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    root: 'docs/research',
    out: 'docs/research/submission/aamas-readiness',
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
