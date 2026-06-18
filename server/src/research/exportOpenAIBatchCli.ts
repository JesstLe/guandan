import { writeOpenAIChatBatchFile } from './openAIBatchExport'

interface Args {
  source: string
  out: string
  model: string
  temperature?: number
  maxCompletionTokens?: number
  responseFormat: 'json_object' | 'none'
}

const args = parseArgs(process.argv.slice(2))
const result = writeOpenAIChatBatchFile({
  sourceBatchJsonlPath: args.source,
  outputDir: args.out,
  model: args.model,
  temperature: args.temperature,
  maxCompletionTokens: args.maxCompletionTokens,
  responseFormat: args.responseFormat,
})

console.log(JSON.stringify({
  openAIJsonlPath: result.openAIJsonlPath,
  manifestPath: result.manifestPath,
  requestCount: result.requestCount,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Partial<Args> = {
    responseFormat: 'json_object',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--source') {
      parsed.source = value
      i++
    } else if (arg === '--out') {
      parsed.out = value
      i++
    } else if (arg === '--model') {
      parsed.model = value
      i++
    } else if (arg === '--temperature') {
      parsed.temperature = Number(value)
      i++
    } else if (arg === '--max-completion-tokens') {
      parsed.maxCompletionTokens = Number(value)
      i++
    } else if (arg === '--response-format') {
      if (value !== 'json_object' && value !== 'none') {
        throw new Error('--response-format must be json_object or none')
      }
      parsed.responseFormat = value
      i++
    }
  }

  for (const required of ['source', 'out', 'model'] as const) {
    if (!parsed[required]) throw new Error(`Missing required argument --${required}`)
  }

  return parsed as Args
}
