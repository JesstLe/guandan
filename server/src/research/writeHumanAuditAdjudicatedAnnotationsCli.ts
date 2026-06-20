import { writeHumanAuditAdjudicatedAnnotations } from './humanAuditAdjudicatedAnnotations'

interface Args {
  annotatorA: string
  annotatorB: string
  adjudicationTemplate: string
  blind: string
  adjudicated: string
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeHumanAuditAdjudicatedAnnotations({
  annotatorACsvPath: args.annotatorA,
  annotatorBCsvPath: args.annotatorB,
  adjudicationTemplateCsvPath: args.adjudicationTemplate,
  blindJsonlPath: args.blind,
  adjudicatedCsvPath: args.adjudicated,
  outputDir: args.out,
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  adjudicatedCsvPath: result.adjudicatedCsvPath,
  status: result.report.status,
  outputRows: result.report.outputRows,
  completedLabels: result.report.completedLabels,
  totalLabels: result.report.totalLabels,
  readyForAgreement: result.report.readyForAgreement,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const base = 'docs/research/experiments/human-soft-label-audit'
  const parsed: Args = {
    annotatorA: `${base}/human-audit-completed-annotations-annotator-a.csv`,
    annotatorB: `${base}/human-audit-completed-annotations-annotator-b.csv`,
    adjudicationTemplate: `${base}/human-audit-adjudication-template.csv`,
    blind: `${base}/human-audit-blind-sample.jsonl`,
    adjudicated: `${base}/human-audit-adjudicated-annotations.csv`,
    out: base,
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
    } else if (arg === '--adjudication-template') {
      parsed.adjudicationTemplate = value
      i++
    } else if (arg === '--blind') {
      parsed.blind = value
      i++
    } else if (arg === '--adjudicated') {
      parsed.adjudicated = value
      i++
    } else if (arg === '--out') {
      parsed.out = value
      i++
    }
  }

  return parsed
}
