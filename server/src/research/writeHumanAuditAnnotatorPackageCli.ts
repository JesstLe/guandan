import { writeHumanAuditAnnotatorPackage } from './humanAuditAnnotatorPackage'

interface Args {
  blind: string
  annotations: string
  annotator: string
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeHumanAuditAnnotatorPackage({
  blindJsonlPath: args.blind,
  annotationCsvPath: args.annotations,
  annotatorHtmlPath: args.annotator,
  outputDir: args.out,
})

console.log(JSON.stringify({
  packageDir: result.packageDir,
  manifestPath: result.manifestPath,
  status: result.manifest.status,
  sampleCount: result.manifest.sampleCount,
  files: Object.keys(result.manifest.files),
  failedChecks: result.manifest.checks.filter(check => check.status === 'fail').map(check => check.id),
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    blind: 'docs/research/experiments/human-soft-label-audit/human-audit-blind-sample.jsonl',
    annotations: 'docs/research/experiments/human-soft-label-audit/human-audit-annotation-sheet.csv',
    annotator: 'docs/research/experiments/human-soft-label-audit/human-audit-annotator.html',
    out: 'docs/research/experiments/human-soft-label-audit/annotator-package',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--blind') {
      parsed.blind = value
      i++
    } else if (arg === '--annotations') {
      parsed.annotations = value
      i++
    } else if (arg === '--annotator') {
      parsed.annotator = value
      i++
    } else if (arg === '--out') {
      parsed.out = value
      i++
    }
  }

  return parsed
}
