import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, join } from 'node:path'

type ResponseFormat = 'json_object' | 'none'

interface GenericChatBatchLine {
  custom_id: string
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
}

export interface OpenAIChatBatchExportOptions {
  sourceBatchJsonlPath: string
  outputDir: string
  model: string
  temperature?: number
  maxCompletionTokens?: number
  responseFormat?: ResponseFormat
}

export interface OpenAIChatBatchExportResult {
  openAIJsonlPath: string
  manifestPath: string
  requestCount: number
}

export function writeOpenAIChatBatchFile(options: OpenAIChatBatchExportOptions): OpenAIChatBatchExportResult {
  const sourceLines = readJsonl<GenericChatBatchLine>(options.sourceBatchJsonlPath)
  mkdirSync(options.outputDir, { recursive: true })

  const openAIJsonlPath = join(options.outputDir, 'openai-batch-input.jsonl')
  const requests = sourceLines.map(line => ({
    custom_id: line.custom_id,
    method: 'POST',
    url: '/v1/chat/completions',
    body: requestBody(line, options),
  }))
  writeFileSync(openAIJsonlPath, `${requests.map(request => JSON.stringify(request)).join('\n')}\n`, 'utf8')

  const manifestPath = join(options.outputDir, 'openai-batch-manifest.json')
  writeJson(manifestPath, {
    schemaVersion: '0.1.0',
    providerFormat: 'openai-batch-chat-completions-jsonl',
    sourceBatchJsonl: options.sourceBatchJsonlPath,
    endpoint: '/v1/chat/completions',
    model: options.model,
    temperature: options.temperature ?? null,
    maxCompletionTokens: options.maxCompletionTokens ?? null,
    responseFormat: options.responseFormat ?? 'json_object',
    requestCount: requests.length,
    openAIJsonlFile: basename(openAIJsonlPath),
    note: 'Prepared offline. Upload only after author approval and record provider provenance after completion.',
  })

  return { openAIJsonlPath, manifestPath, requestCount: requests.length }
}

function requestBody(line: GenericChatBatchLine, options: OpenAIChatBatchExportOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: options.model,
    messages: line.messages,
  }

  if (options.temperature !== undefined) body.temperature = options.temperature
  if (options.maxCompletionTokens !== undefined) body.max_completion_tokens = options.maxCompletionTokens
  if ((options.responseFormat ?? 'json_object') === 'json_object') {
    body.response_format = { type: 'json_object' }
  }

  return body
}

function readJsonl<T>(path: string): T[] {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line) as T)
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
