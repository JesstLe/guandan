import {
  readRevisionPromptInputsFromDirectories,
  writeRevisionPromptPackets,
} from './verifierRevisionPackets'

interface CliOptions {
  decisionDir: string
  traceDir: string
  resultDir: string
  outputDir: string
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    decisionDir: 'docs/research/experiments/pilot-e1/decisions',
    traceDir: 'docs/research/experiments/pilot-e3-strategic-heuristic/traces',
    resultDir: 'docs/research/experiments/pilot-e3-strategic-heuristic/results',
    outputDir: 'docs/research/experiments/pilot-e6-verifier-revision-fixture-prompts',
  }

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--decisions') {
      options.decisionDir = readValue(args, ++index, '--decisions')
    } else if (arg === '--traces') {
      options.traceDir = readValue(args, ++index, '--traces')
    } else if (arg === '--results') {
      options.resultDir = readValue(args, ++index, '--results')
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
const inputs = readRevisionPromptInputsFromDirectories({
  decisionDir: options.decisionDir,
  traceDir: options.traceDir,
  resultDir: options.resultDir,
})
const result = writeRevisionPromptPackets({
  inputs,
  outputDir: options.outputDir,
})

console.log(JSON.stringify({
  manifestPath: result.manifestPath,
  packetCount: result.packetPaths.length,
  conditionId: 'verifier-revision-llm',
}, null, 2))
