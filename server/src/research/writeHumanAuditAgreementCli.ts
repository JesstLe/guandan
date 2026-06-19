import { writeHumanAuditAgreement } from './humanAuditAgreement'
import { existsSync } from 'node:fs'

interface Args {
  annotations: string
  answerKey: string
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeHumanAuditAgreement({
  annotationCsvPath: args.annotations,
  answerKeyJsonlPath: args.answerKey,
  outputDir: args.out,
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  status: result.report.status,
  completedLabels: result.report.completedLabels,
  totalLabels: result.report.totalLabels,
  macroAgreement: result.report.macroAgreement,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const completedAnnotations = 'docs/research/experiments/human-soft-label-audit/human-audit-completed-annotations.csv'
  const parsed: Args = {
    annotations: 'docs/research/experiments/human-soft-label-audit/human-audit-annotation-sheet.csv',
    answerKey: 'docs/research/experiments/human-soft-label-audit/human-audit-answer-key.jsonl',
    out: 'docs/research/experiments/human-soft-label-audit',
  }
  let annotationsProvided = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--annotations') {
      parsed.annotations = value
      annotationsProvided = true
      i++
    } else if (arg === '--answer-key') {
      parsed.answerKey = value
      i++
    } else if (arg === '--out') {
      parsed.out = value
      i++
    }
  }

  if (!annotationsProvided && existsSync(completedAnnotations)) {
    parsed.annotations = completedAnnotations
  }

  return parsed
}
