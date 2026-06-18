import { auditLLMRawOutputs } from './llmBatchFiles'

interface CliOptions {
  promptPacketDir: string
  rawOutputDir: string
  outputPath: string
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    promptPacketDir: 'docs/research/experiments/pilot-e4-plain-llm-prompts/packets',
    rawOutputDir: 'docs/research/experiments/pilot-e4-plain-llm-batch/raw',
    outputPath: 'docs/research/experiments/pilot-e4-plain-llm-batch/raw-output-audit.json',
  }

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--packets') {
      options.promptPacketDir = readValue(args, ++index, '--packets')
    } else if (arg === '--raw') {
      options.rawOutputDir = readValue(args, ++index, '--raw')
    } else if (arg === '--out') {
      options.outputPath = readValue(args, ++index, '--out')
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return options
}

function readValue(args: string[], index: number, flag: string): string {
  const value = args[index]
  if (!value) throw new Error(`${flag} requires a value`)
  return value
}

const options = parseArgs(process.argv.slice(2))
const result = auditLLMRawOutputs({
  promptPacketDir: options.promptPacketDir,
  rawOutputDir: options.rawOutputDir,
  outputPath: options.outputPath,
})

console.log(JSON.stringify({
  outputPath: options.outputPath,
  expectedCount: result.expectedCount,
  presentCount: result.presentCount,
  missingCount: result.missingCount,
  emptyCount: result.emptyCount,
  unexpectedCount: result.unexpectedCount,
  readyForIngest: result.readyForIngest,
}, null, 2))
