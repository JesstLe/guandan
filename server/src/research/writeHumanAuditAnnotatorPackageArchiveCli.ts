import { writeHumanAuditAnnotatorPackageArchive } from './humanAuditAnnotatorPackageArchive'

interface Args {
  packageDir: string
  packageManifest: string
  archive: string
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeHumanAuditAnnotatorPackageArchive({
  packageDir: args.packageDir,
  packageManifestPath: args.packageManifest,
  archivePath: args.archive,
  outputDir: args.out,
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  status: result.report.status,
  archivePath: result.report.archivePath,
  bytes: result.report.bytes,
  sha256: result.report.sha256,
  sampleCount: result.report.sampleCount,
  failedChecks: result.report.checks.filter(check => check.status === 'fail').map(check => check.id),
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    packageDir: 'docs/research/experiments/human-soft-label-audit/annotator-package',
    packageManifest: 'docs/research/experiments/human-soft-label-audit/annotator-package/human-audit-annotator-package-manifest.json',
    archive: 'docs/research/experiments/human-soft-label-audit/human-audit-annotator-package.tar.gz',
    out: 'docs/research/experiments/human-soft-label-audit',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--package-dir') {
      parsed.packageDir = value
      i++
    } else if (arg === '--package-manifest') {
      parsed.packageManifest = value
      i++
    } else if (arg === '--archive') {
      parsed.archive = value
      i++
    } else if (arg === '--out') {
      parsed.out = value
      i++
    }
  }

  return parsed
}
