import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { dirname } from 'node:path'

interface OpenAIChatCompletionBatchLine {
  custom_id: string
  method: 'POST'
  url: string
  body: Record<string, unknown>
}

export interface OpenAIChatCompletionRunnerOptions {
  inputJsonlPath: string
  outputJsonlPath: string
  apiKey: string
  baseUrl?: string
  requestPath?: string
  model?: string
  runner?: string
  completionTokensField?: 'max_completion_tokens' | 'max_tokens'
  concurrency?: number
  limit?: number
  attemptLimit?: number
  resume?: boolean
  stopOnError?: boolean
  request?: OpenAIChatCompletionRequest
}

export interface OpenAIChatCompletionRunReport {
  schemaVersion: '0.1.0'
  inputJsonlPath: string
  outputJsonlPath: string
  expectedCount: number
  attemptedCount: number
  skippedCount: number
  writtenCount: number
  successCount: number
  errorCount: number
  pendingSuccessCount: number
  stoppedAfterError: boolean
  baseUrl: string
  requestPath: string
  runner: string
  model: string | null
  completionTokensField: 'max_completion_tokens' | 'max_tokens' | null
}

export type OpenAIChatCompletionRequest = (
  line: OpenAIChatCompletionBatchLine,
  context: { apiKey: string; baseUrl: string; requestPath: string },
) => Promise<unknown>

export async function runOpenAIChatCompletionJsonl(
  options: OpenAIChatCompletionRunnerOptions,
): Promise<OpenAIChatCompletionRunReport> {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? 'https://api.openai.com')
  const requestPath = normalizeRequestPath(options.requestPath ?? '/v1/chat/completions')
  const allLines = readJsonl<OpenAIChatCompletionBatchLine>(options.inputJsonlPath)
  validateInputLines(allLines)
  const selectedLines = options.limit === undefined ? allLines : allLines.slice(0, options.limit)
  const existingSuccessfulRows = options.resume
    ? readExistingSuccessfulRows(options.outputJsonlPath)
    : []
  const existingSuccessfulIds = new Set(existingSuccessfulRows.map(row => row.custom_id))
  const pendingLines = selectedLines.filter(line => !existingSuccessfulIds.has(line.custom_id))
  const attemptedLines = options.attemptLimit === undefined
    ? pendingLines
    : pendingLines.slice(0, options.attemptLimit)
  const requestLines = attemptedLines.map(line => rewriteRequestLine(line, {
    requestPath,
    model: options.model,
    completionTokensField: options.completionTokensField,
  }))
  mkdirSync(dirname(options.outputJsonlPath), { recursive: true })

  const request = options.request ?? defaultRequest
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 4, 16))
  const runLine = async (line: OpenAIChatCompletionBatchLine): Promise<ProviderResultRow> => {
    try {
      const body = await request(line, { apiKey: options.apiKey, baseUrl, requestPath })
      return {
        custom_id: line.custom_id,
        response: {
          status_code: 200,
          body,
        },
      }
    } catch (error) {
      return {
        custom_id: line.custom_id,
        error: {
          message: error instanceof Error ? error.message : String(error),
        },
      }
    }
  }

  const results = options.stopOnError
    ? await runUntilFirstError(requestLines, runLine)
    : await mapWithConcurrency(requestLines, concurrency, runLine)

  writeFileSync(
    options.outputJsonlPath,
    [...existingSuccessfulRows, ...results].length > 0
      ? `${[...existingSuccessfulRows, ...results].map(result => JSON.stringify(result)).join('\n')}\n`
      : '',
    'utf8',
  )

  const errorCount = results.filter(result => 'error' in result).length
  const successCount = existingSuccessfulRows.length + results.length - errorCount
  return {
    schemaVersion: '0.1.0',
    inputJsonlPath: options.inputJsonlPath,
    outputJsonlPath: options.outputJsonlPath,
    expectedCount: selectedLines.length,
    attemptedCount: results.length,
    skippedCount: existingSuccessfulRows.length,
    writtenCount: existingSuccessfulRows.length + results.length,
    successCount,
    errorCount,
    pendingSuccessCount: selectedLines.length - successCount,
    stoppedAfterError: Boolean(options.stopOnError && errorCount > 0),
    baseUrl,
    requestPath,
    runner: options.runner ?? 'openai-compatible',
    model: options.model ?? inferSingleModel(allLines),
    completionTokensField: options.completionTokensField ?? null,
  }
}

type ProviderResultRow = Record<string, any> & { custom_id: string }

async function defaultRequest(
  line: OpenAIChatCompletionBatchLine,
  context: { apiKey: string; baseUrl: string; requestPath: string },
): Promise<unknown> {
  const response = await fetch(`${context.baseUrl}${context.requestPath}`, {
    method: line.method,
    headers: {
      Authorization: `Bearer ${context.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(line.body),
  })
  const text = await response.text()
  const body = text.trim() ? JSON.parse(text) as unknown : null

  if (!response.ok) {
    const message = extractErrorMessage(body) ?? `OpenAI API HTTP ${response.status}`
    throw new Error(message)
  }

  return body
}

function validateInputLines(lines: OpenAIChatCompletionBatchLine[]): void {
  const invalid = lines.filter(line => line.custom_id === undefined
    || line.method !== 'POST'
    || line.url !== '/v1/chat/completions'
    || !line.body)
  if (invalid.length > 0) {
    throw new Error(`Invalid OpenAI chat-completions JSONL rows: ${invalid.length}`)
  }
}

function rewriteRequestLine(
  line: OpenAIChatCompletionBatchLine,
  options: {
    requestPath: string
    model?: string
    completionTokensField?: 'max_completion_tokens' | 'max_tokens'
  },
): OpenAIChatCompletionBatchLine {
  const body = { ...line.body }
  if (options.model) body.model = options.model
  if (options.completionTokensField) rewriteCompletionTokenField(body, options.completionTokensField)
  return {
    ...line,
    url: options.requestPath,
    body,
  }
}

function rewriteCompletionTokenField(
  body: Record<string, unknown>,
  field: 'max_completion_tokens' | 'max_tokens',
): void {
  const current = typeof body.max_completion_tokens === 'number'
    ? body.max_completion_tokens
    : typeof body.max_tokens === 'number'
      ? body.max_tokens
      : undefined
  delete body.max_completion_tokens
  delete body.max_tokens
  if (current !== undefined) body[field] = current
}

function inferSingleModel(lines: OpenAIChatCompletionBatchLine[]): string | null {
  const models = new Set<string>()
  for (const line of lines) {
    const model = line.body.model
    if (typeof model === 'string') models.add(model)
  }
  return models.size === 1 ? [...models][0] : null
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  fn: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length)
  let next = 0

  async function worker(): Promise<void> {
    while (next < values.length) {
      const index = next++
      results[index] = await fn(values[index])
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()))
  return results
}

async function runUntilFirstError<T extends OpenAIChatCompletionBatchLine>(
  values: T[],
  fn: (value: T) => Promise<ProviderResultRow>,
): Promise<ProviderResultRow[]> {
  const results: ProviderResultRow[] = []
  for (const value of values) {
    const result = await fn(value)
    results.push(result)
    if ('error' in result) break
  }
  return results
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '')
}

function normalizeRequestPath(value: string): string {
  return value.startsWith('/') ? value : `/${value}`
}

function readJsonl<T>(path: string): T[] {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line) as T)
}

function readExistingSuccessfulRows(path: string): ProviderResultRow[] {
  if (!existsSync(path)) return []
  return readJsonl<ProviderResultRow>(path).filter(row => {
    const status = row.response?.status_code
    return typeof status === 'number' && status >= 200 && status < 300
  })
}

function extractErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const error = record.error
  if (error && typeof error === 'object') {
    const message = (error as Record<string, unknown>).message
    if (typeof message === 'string') return message
  }
  return null
}
