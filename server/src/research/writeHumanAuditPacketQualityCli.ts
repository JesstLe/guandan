import { writeHumanAuditPacketQualityReport } from './humanAuditPacketQuality'

interface Args {
  manifest: string
  blind: string
  answerKey: string
  annotations: string
  annotator: string
  protocol: string
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeHumanAuditPacketQualityReport({
  manifestPath: args.manifest,
  blindJsonlPath: args.blind,
  answerKeyJsonlPath: args.answerKey,
  annotationCsvPath: args.annotations,
  annotatorHtmlPath: args.annotator,
  protocolPath: args.protocol,
  outputDir: args.out,
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  status: result.report.status,
  sampleCount: result.report.sampleCount,
  readyForAnnotation: result.report.readyForAnnotation,
  readyForPaperEvidence: result.report.readyForPaperEvidence,
  failedChecks: result.report.checks.filter(check => check.status === 'fail').map(check => check.id),
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    manifest: 'docs/research/experiments/human-soft-label-audit/human-audit-manifest.json',
    blind: 'docs/research/experiments/human-soft-label-audit/human-audit-blind-sample.jsonl',
    answerKey: 'docs/research/experiments/human-soft-label-audit/human-audit-answer-key.jsonl',
    annotations: 'docs/research/experiments/human-soft-label-audit/human-audit-annotation-sheet.csv',
    annotator: 'docs/research/experiments/human-soft-label-audit/human-audit-annotator.html',
    protocol: 'docs/research/experiments/human-soft-label-audit/human-audit-protocol.md',
    out: 'docs/research/experiments/human-soft-label-audit',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--manifest') {
      parsed.manifest = value
      i++
    } else if (arg === '--blind') {
      parsed.blind = value
      i++
    } else if (arg === '--answer-key') {
      parsed.answerKey = value
      i++
    } else if (arg === '--annotations') {
      parsed.annotations = value
      i++
    } else if (arg === '--annotator') {
      parsed.annotator = value
      i++
    } else if (arg === '--protocol') {
      parsed.protocol = value
      i++
    } else if (arg === '--out') {
      parsed.out = value
      i++
    }
  }

  return parsed
}
