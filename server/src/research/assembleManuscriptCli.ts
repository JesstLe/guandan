import { assembleManuscript } from './manuscriptAssembler'

interface Args {
  sections: string
  out: string
  title: string
  tables: string
}

const args = parseArgs(process.argv.slice(2))
const result = assembleManuscript({
  sectionsDir: args.sections,
  outputDir: args.out,
  title: args.title,
  tablesDir: args.tables,
})

console.log(JSON.stringify({
  manuscriptPath: result.manuscriptPath,
  statusPath: result.statusPath,
  wordCount: result.status.wordCount,
  readyForSubmission: result.status.readyForSubmission,
  markerCounts: result.status.markerCounts,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    sections: 'docs/research/drafts/paper-as-code',
    out: 'docs/research/submission/manuscript',
    title: 'Verifiable Multi-Agent Reasoning for LLM Agents in Zero-Communication Mixed-Motive Games',
    tables: 'docs/research/tables',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--sections') {
      parsed.sections = value
      i++
    } else if (arg === '--out') {
      parsed.out = value
      i++
    } else if (arg === '--title') {
      parsed.title = value
      i++
    } else if (arg === '--tables') {
      parsed.tables = value
      i++
    }
  }

  return parsed
}
