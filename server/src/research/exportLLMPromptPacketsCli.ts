import { readDecisionPointsFromDirectory } from './pilotVerifierRunner'
import { type LLMConditionId, writePromptPackets } from './llmPromptPackets'

interface CliOptions {
  inputDir: string
  outputDir: string
  conditionId: LLMConditionId
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    inputDir: 'docs/research/experiments/pilot-e1/decisions',
    outputDir: 'docs/research/experiments/pilot-e4-plain-llm-prompts',
    conditionId: 'plain-llm',
  }

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--input') {
      options.inputDir = readValue(args, ++index, '--input')
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
const result = writePromptPackets({
  decisions,
  conditionId: options.conditionId,
  outputDir: options.outputDir,
})

console.log(JSON.stringify({
  manifestPath: result.manifestPath,
  packetCount: result.packetPaths.length,
  conditionId: options.conditionId,
}, null, 2))
