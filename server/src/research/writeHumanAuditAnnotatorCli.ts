import { writeHumanAuditAnnotator } from './humanAuditAnnotator'

interface Args {
  sample: string
  annotations: string
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeHumanAuditAnnotator({
  sampleJsonlPath: args.sample,
  annotationCsvPath: args.annotations,
  outputHtmlPath: args.out,
})

console.log(JSON.stringify({
  htmlPath: result.htmlPath,
  sampleCount: result.sampleCount,
  headerCount: result.headers.length,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    sample: 'docs/research/experiments/human-soft-label-audit/human-audit-blind-sample.jsonl',
    annotations: 'docs/research/experiments/human-soft-label-audit/human-audit-annotation-sheet.csv',
    out: 'docs/research/experiments/human-soft-label-audit/human-audit-annotator.html',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--sample') {
      parsed.sample = value
      i++
    } else if (arg === '--annotations') {
      parsed.annotations = value
      i++
    } else if (arg === '--out') {
      parsed.out = value
      i++
    }
  }

  return parsed
}
