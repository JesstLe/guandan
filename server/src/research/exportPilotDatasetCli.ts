import { writePilotDecisionDataset } from './pilotDatasetExporter'

interface CliOptions {
  outputDir: string
  targetCount: number
  gameIdPrefix: string
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    outputDir: 'docs/research/experiments/pilot-e1',
    targetCount: 50,
    gameIdPrefix: 'pilot-e1',
  }

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--out') {
      options.outputDir = readValue(args, ++index, '--out')
    } else if (arg === '--count') {
      options.targetCount = Number(readValue(args, ++index, '--count'))
    } else if (arg === '--prefix') {
      options.gameIdPrefix = readValue(args, ++index, '--prefix')
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  if (!Number.isInteger(options.targetCount) || options.targetCount <= 0) {
    throw new Error('--count must be a positive integer')
  }

  return options
}

function readValue(args: string[], index: number, flag: string): string {
  const value = args[index]
  if (!value) {
    throw new Error(`${flag} requires a value`)
  }
  return value
}

const options = parseArgs(process.argv.slice(2))
const result = writePilotDecisionDataset({
  outputDir: options.outputDir,
  targetCount: options.targetCount,
  gameIdPrefix: options.gameIdPrefix,
})

console.log(JSON.stringify({
  manifestPath: result.manifestPath,
  decisionCount: result.dataset.decisions.length,
  scenarioTags: result.dataset.coverage.scenarioTags,
}, null, 2))
