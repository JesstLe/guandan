import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { dirname } from 'node:path'

interface OpenAIChatCompletionBatchLine {
  custom_id: string
  method: 'POST'
  url: '/v1/chat/completions'
  body: Record<string, unknown>
}

export interface OpenAIChatCompletionRunnerOptions {
  inputJsonlPath: string
  outputJsonlPath: string
  apiKey: string
  baseUrl?: string
  concurrency?: number
  request?: OpenAIChatCompletionRequest
}

export interface OpenAIChatCompletionRunReport {
  schemaVersion: '0.1.0'
  inputJsonlPath: string
  outputJsonlPath: string
  expectedCount: number
  writtenCount: number
  successCount: number
  errorCount: number
  baseUrl: string
}

export type OpenAIChatCompletionRequest = (
  line: OpenAIChatCompletionBatchLine,
  context: { apiKey: string; baseUrl: string },
) => Promise<unknown>

export async function runOpenAIChatCompletionJsonl(
  options: OpenAIChatCompletionRunnerOptions,
): Promise<OpenAIChatCompletionRunReport> {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? 'https://api.openai.com')
  const lines = readJsonl<OpenAIChatCompletionBatchLine>(options.inputJsonlPath)
  validateInputLines(lines)
  mkdirSync(dirname(options.outputJsonlPath), { recursive: true })

  const request = options.request ?? defaultRequest
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 4, 16))
  const results = await mapWithConcurrency(lines, concurrency, async line => {
    try {
      const body = await request(line, { apiKey: options.apiKey, baseUrl })
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
  })

  writeFileSync(
    options.outputJsonlPath,
    `${results.map(result => JSON.stringify(result)).join('\n')}\n`,
    'utf8',
  )

  const errorCount = results.filter(result => 'error' in result).length
  return {
    schemaVersion: '0.1.0',
    inputJsonlPath: options.inputJsonlPath,
    outputJsonlPath: options.outputJsonlPath,
    expectedCount: lines.length,
    writtenCount: results.length,
    successCount: results.length - errorCount,
    errorCount,
    baseUrl,
  }
}

async function defaultRequest(
  line: OpenAIChatCompletionBatchLine,
  context: { apiKey: string; baseUrl: string },
): Promise<unknown> {
  const response = await fetch(`${context.baseUrl}${line.url}`, {
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

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '')
}

function readJsonl<T>(path: string): T[] {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line) as T)
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
