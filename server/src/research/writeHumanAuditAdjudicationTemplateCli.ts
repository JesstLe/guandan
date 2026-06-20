import { writeHumanAuditAdjudicationTemplate } from './humanAuditAdjudicationTemplate'

interface Args {
  interAnnotator: string
  blind: string
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeHumanAuditAdjudicationTemplate({
  interAnnotatorReportPath: args.interAnnotator,
  blindJsonlPath: args.blind,
  outputDir: args.out,
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  templateCsvPath: result.templateCsvPath,
  status: result.report.status,
  disagreementCount: result.report.disagreementCount,
  templateRows: result.report.templateRows,
  readyForAdjudication: result.report.readyForAdjudication,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    interAnnotator: 'docs/research/experiments/human-soft-label-audit/human-audit-inter-annotator-agreement-report.json',
    blind: 'docs/research/experiments/human-soft-label-audit/human-audit-blind-sample.jsonl',
    out: 'docs/research/experiments/human-soft-label-audit',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--inter-annotator') {
      parsed.interAnnotator = value
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
