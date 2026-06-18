import { runLocalResearchPipeline } from './localResearchPipeline'

interface Args {
  cwd: string
  reportDir: string
}

const args = parseArgs(process.argv.slice(2))
const result = runLocalResearchPipeline({
  cwd: args.cwd,
  reportDir: args.reportDir,
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  status: result.status,
  steps: result.steps.length,
  failedStep: result.steps.find(step => step.status === 'failed')?.id ?? null,
}, null, 2))

process.exitCode = result.status === 'completed' ? 0 : 1

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    cwd: process.cwd(),
    reportDir: 'docs/research/submission/local-pipeline',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--cwd') {
      parsed.cwd = value
      i++
    } else if (arg === '--report-dir') {
      parsed.reportDir = value
      i++
    }
  }

  return parsed
}
