import { writeHumanAuditIntakeReport } from './humanAuditIntake'

interface Args {
  returned: string
  packageManifest: string
  blind: string
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeHumanAuditIntakeReport({
  returnedCsvPath: args.returned,
  packageManifestPath: args.packageManifest,
  blindJsonlPath: args.blind,
  outputDir: args.out,
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  status: result.report.status,
  returnedCsvPresent: result.report.returnedCsvPresent,
  completedLabels: result.report.completedLabels,
  totalLabels: result.report.totalLabels,
  readyForAgreement: result.report.readyForAgreement,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    returned: 'docs/research/experiments/human-soft-label-audit/human-audit-completed-annotations.csv',
    packageManifest: 'docs/research/experiments/human-soft-label-audit/annotator-package/human-audit-annotator-package-manifest.json',
    blind: 'docs/research/experiments/human-soft-label-audit/human-audit-blind-sample.jsonl',
    out: 'docs/research/experiments/human-soft-label-audit',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--returned') {
      parsed.returned = value
      i++
    } else if (arg === '--package-manifest') {
      parsed.packageManifest = value
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
