import { finalizeAAMASSubmissionReports } from './aamasSubmissionFinalizer'

interface Args {
  cwd: string
  root: string
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = finalizeAAMASSubmissionReports({
  cwd: args.cwd,
  researchRoot: args.root,
  outputDir: args.out,
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  status: result.status,
  steps: result.steps.length,
  failedSteps: result.steps.filter(step => step.status === 'failed').length,
  failedChecks: result.checks.filter(check => check.status === 'fail').length,
}, null, 2))

if (result.status !== 'completed') {
  process.exitCode = 1
}

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    cwd: process.cwd(),
    root: 'docs/research',
    out: 'docs/research/submission/finalizer',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--cwd') {
      parsed.cwd = value
      i++
    } else if (arg === '--root') {
      parsed.root = value
      i++
    } else if (arg === '--out') {
      parsed.out = value
      i++
    }
  }

  return parsed
}
