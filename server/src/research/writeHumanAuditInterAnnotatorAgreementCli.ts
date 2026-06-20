import { writeHumanAuditInterAnnotatorAgreement } from './humanAuditInterAnnotatorAgreement'

interface Args {
  annotatorA: string
  annotatorB: string
  blind: string
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeHumanAuditInterAnnotatorAgreement({
  annotatorACsvPath: args.annotatorA,
  annotatorBCsvPath: args.annotatorB,
  blindJsonlPath: args.blind,
  outputDir: args.out,
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  status: result.report.status,
  pairedLabels: result.report.pairedLabels,
  totalLabels: result.report.totalLabels,
  disagreementCount: result.report.disagreementCount,
  macroAgreement: result.report.macroAgreement,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    annotatorA: 'docs/research/experiments/human-soft-label-audit/human-audit-completed-annotations-annotator-a.csv',
    annotatorB: 'docs/research/experiments/human-soft-label-audit/human-audit-completed-annotations-annotator-b.csv',
    blind: 'docs/research/experiments/human-soft-label-audit/human-audit-blind-sample.jsonl',
    out: 'docs/research/experiments/human-soft-label-audit',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--annotator-a') {
      parsed.annotatorA = value
      i++
    } else if (arg === '--annotator-b') {
      parsed.annotatorB = value
      i++
    } else if (arg === '--blind') {
      parsed.blind = value
      i++
    } else if (arg === '--out') {
      parsed.out = value
      i++
    }
  }

  return parsed
}
