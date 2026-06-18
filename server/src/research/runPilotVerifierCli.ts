import { readDecisionPointsFromDirectory, writePilotVerifierArtifacts } from './pilotVerifierRunner'
import type { BaselineTraceAgentId } from './baselineTraceAgents'

interface CliOptions {
  inputDir: string
  outputDir: string
  agentId: BaselineTraceAgentId
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    inputDir: 'docs/research/experiments/pilot-e1/decisions',
    outputDir: 'docs/research/experiments/pilot-e2-heuristic-verifier',
    agentId: 'heuristic-legal-first',
  }

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--input') {
      options.inputDir = readValue(args, ++index, '--input')
    } else if (arg === '--out') {
      options.outputDir = readValue(args, ++index, '--out')
    } else if (arg === '--agent') {
      options.agentId = parseAgentId(readValue(args, ++index, '--agent'))
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return options
}

function parseAgentId(value: string): BaselineTraceAgentId {
  if (value === 'heuristic-legal-first' || value === 'strategic-heuristic') return value
  throw new Error(`Unknown agent: ${value}`)
}

function readValue(args: string[], index: number, flag: string): string {
  const value = args[index]
  if (!value) throw new Error(`${flag} requires a value`)
  return value
}

const options = parseArgs(process.argv.slice(2))
const decisions = readDecisionPointsFromDirectory(options.inputDir)
const result = writePilotVerifierArtifacts({
  decisions,
  outputDir: options.outputDir,
  agentId: options.agentId,
})

console.log(JSON.stringify({
  metricsPath: result.metricsPath,
  resultCount: result.report.results.length,
  hardFailureCount: result.report.metrics.hardFailureCount,
}, null, 2))
