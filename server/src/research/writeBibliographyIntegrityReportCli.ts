import { writeBibliographyIntegrityReport } from './bibliographyIntegrity'

interface Args {
  bib: string
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeBibliographyIntegrityReport({
  bibPath: args.bib,
  outputDir: args.out,
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  ready: result.report.ready,
  entryCount: result.report.entryCount,
  issueCount: result.report.issues.length,
}, null, 2))

process.exitCode = result.report.ready ? 0 : 1

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    bib: 'docs/research/submission/references.bib',
    out: 'docs/research/submission/citation-integrity',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--bib') {
      parsed.bib = value
      i++
    } else if (arg === '--out') {
      parsed.out = value
      i++
    }
  }

  return parsed
}
