import { writeLLMBatchFiles } from './llmBatchFiles'

interface CliOptions {
  promptPacketDir: string
  outputDir: string
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    promptPacketDir: 'docs/research/experiments/pilot-e4-plain-llm-prompts/packets',
    outputDir: 'docs/research/experiments/pilot-e4-plain-llm-batch',
  }

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--packets') {
      options.promptPacketDir = readValue(args, ++index, '--packets')
    } else if (arg === '--out') {
      options.outputDir = readValue(args, ++index, '--out')
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
const result = writeLLMBatchFiles({
  promptPacketDir: options.promptPacketDir,
  outputDir: options.outputDir,
})

console.log(JSON.stringify(result, null, 2))
