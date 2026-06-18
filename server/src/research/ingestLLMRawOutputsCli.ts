import { readDecisionPointsFromDirectory } from './pilotVerifierRunner'
import { ingestLLMRawOutputs } from './llmOutputIngest'
import type { LLMConditionId } from './llmPromptPackets'

interface CliOptions {
  inputDir: string
  rawOutputDir: string
  outputDir: string
  conditionId: LLMConditionId
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    inputDir: 'docs/research/experiments/pilot-e1/decisions',
    rawOutputDir: 'docs/research/experiments/pilot-e4-plain-llm-batch/raw',
    outputDir: 'docs/research/experiments/pilot-e4-plain-llm-results',
    conditionId: 'plain-llm',
  }

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--input') {
      options.inputDir = readValue(args, ++index, '--input')
    } else if (arg === '--raw') {
      options.rawOutputDir = readValue(args, ++index, '--raw')
    } else if (arg === '--out') {
      options.outputDir = readValue(args, ++index, '--out')
    } else if (arg === '--condition') {
      options.conditionId = parseCondition(readValue(args, ++index, '--condition'))
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return options
}

function parseCondition(value: string): LLMConditionId {
  if (
    value === 'plain-llm'
    || value === 'candidate-constrained-llm'
    || value === 'tom-prompted-llm'
    || value === 'verifier-revision-llm'
  ) return value
  throw new Error(`Unknown condition: ${value}`)
}

function readValue(args: string[], index: number, flag: string): string {
  const value = args[index]
  if (!value) throw new Error(`${flag} requires a value`)
  return value
}

const options = parseArgs(process.argv.slice(2))
const decisions = readDecisionPointsFromDirectory(options.inputDir)
const result = ingestLLMRawOutputs({
  decisions,
  rawOutputDir: options.rawOutputDir,
  outputDir: options.outputDir,
  conditionId: options.conditionId,
})

console.log(JSON.stringify({
  metricsPath: result.metricsPath,
  traceCount: result.tracePaths.length,
  resultCount: result.resultPaths.length,
  parseFailureCount: result.failures.length,
  conditionId: options.conditionId,
}, null, 2))
