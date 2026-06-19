import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { spawn } from 'node:child_process'

interface KimiCliBatchLine {
  custom_id: string
  body?: {
    messages: Array<{ role: string; content: string }>
  }
  messages?: Array<{ role: string; content: string }>
}

export interface KimiCliBatchRunnerOptions {
  inputJsonlPath: string
  outputJsonlPath: string
  kimiBin?: string
  model?: string
  maxStepsPerTurn?: number
  concurrency?: number
  limit?: number
  attemptLimit?: number
  timeoutMs?: number
  resume?: boolean
  stopOnError?: boolean
}

export interface KimiCliBatchRunReport {
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
  kimiBin: string
  model?: string
}

export async function runKimiCliBatchJsonl(
  options: KimiCliBatchRunnerOptions,
): Promise<KimiCliBatchRunReport> {
  const kimiBin = options.kimiBin ?? 'kimi'
  const maxStepsPerTurn = options.maxStepsPerTurn ?? 1
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 1, 8))
  const timeoutMs = options.timeoutMs ?? 120_000
  const allLines = readJsonl<KimiCliBatchLine>(options.inputJsonlPath)
  const selectedLines = options.limit === undefined ? allLines : allLines.slice(0, options.limit)
  mkdirSync(dirname(options.outputJsonlPath), { recursive: true })
  const existingSuccessfulRows = options.resume
    ? readExistingSuccessfulRows(options.outputJsonlPath)
    : []
  const existingSuccessfulIds = new Set(existingSuccessfulRows.map(row => row.custom_id))
  const pendingLines = selectedLines.filter(line => !existingSuccessfulIds.has(line.custom_id))
  const lines = options.attemptLimit === undefined
    ? pendingLines
    : pendingLines.slice(0, options.attemptLimit)
  writeFileSync(
    options.outputJsonlPath,
    existingSuccessfulRows.length > 0
      ? `${existingSuccessfulRows.map(row => JSON.stringify(row)).join('\n')}\n`
      : '',
    'utf8',
  )

  const runLine = async (line: KimiCliBatchLine): Promise<Record<string, any> & { custom_id: string }> => {
    try {
      const content = await runKimiCli({
        kimiBin,
        model: options.model,
        maxStepsPerTurn,
        timeoutMs,
        prompt: formatPrompt(line),
      })
      const result = openAiCompatibleResult(line.custom_id, content)
      appendFileSync(options.outputJsonlPath, `${JSON.stringify(result)}\n`, 'utf8')
      return result
    } catch (error) {
      const result = {
        custom_id: line.custom_id,
        error: {
          message: error instanceof Error ? error.message : String(error),
        },
      }
      appendFileSync(options.outputJsonlPath, `${JSON.stringify(result)}\n`, 'utf8')
      return result
    }
  }

  const results = options.stopOnError
    ? await runUntilFirstError(lines, runLine)
    : await mapWithConcurrency(lines, concurrency, runLine)

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
    kimiBin,
    model: options.model,
  }
}

function formatPrompt(line: KimiCliBatchLine): string {
  const messages = messagesForLine(line)
    .map(message => `${message.role.toUpperCase()} MESSAGE:\n${message.content}`)
    .join('\n\n')
  return [
    'Execute the following chat-completion request for a research benchmark.',
    'Return only the requested JSON object. Do not include markdown, commentary, or tool calls.',
    '',
    messages,
  ].join('\n')
}

function messagesForLine(line: KimiCliBatchLine): Array<{ role: string; content: string }> {
  const messages = line.body?.messages ?? line.messages
  if (!Array.isArray(messages)) {
    throw new Error(`Batch line ${line.custom_id} is missing chat messages`)
  }
  return messages
}

async function runKimiCli(options: {
  kimiBin: string
  model?: string
  maxStepsPerTurn: number
  timeoutMs: number
  prompt: string
}): Promise<string> {
  const args = [
    '--quiet',
    '--max-steps-per-turn',
    String(options.maxStepsPerTurn),
  ]
  if (options.model) args.push('--model', options.model)
  args.push('--prompt', options.prompt)

  const { stdout, stderr, code, timedOut } = await spawnAndCollect(options.kimiBin, args, options.timeoutMs)
  if (timedOut) {
    throw new Error(`kimi timed out after ${options.timeoutMs} ms`)
  }
  const text = stdout.trim()
  if (text) {
    const jsonObject = extractFirstJsonObject(text)
    if (jsonObject) {
      const providerError = parseProviderErrorMessage(jsonObject)
      if (providerError) throw new Error(providerError)
      return jsonObject
    }
    throw new Error(`kimi output did not contain a JSON object: ${text.slice(0, 200)}`)
  }

  if (code !== 0) {
    throw new Error(stderr.trim() || `kimi exited with code ${code}`)
  }

  throw new Error('kimi output did not contain assistant text')
}

function spawnAndCollect(command: string, args: string[], timeoutMs: number): Promise<{
  stdout: string
  stderr: string
  code: number | null
  timedOut: boolean
}> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let timedOut = false
    let settled = false
    const finish = (value: {
      stdout: string
      stderr: string
      code: number | null
      timedOut: boolean
    }): void => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      resolve(value)
    }
    const timeout = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
      setTimeout(() => {
        if (!settled) child.kill('SIGKILL')
      }, 2_000).unref()
      setTimeout(() => {
        finish({ stdout, stderr, code: null, timedOut })
      }, 3_000).unref()
    }, timeoutMs)
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', chunk => {
      stdout += chunk
    })
    child.stderr.on('data', chunk => {
      stderr += chunk
    })
    child.on('error', error => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      reject(error)
    })
    child.on('close', code => {
      finish({ stdout, stderr, code, timedOut })
    })
  })
}

function extractFirstJsonObject(value: string): string | null {
  const start = value.indexOf('{')
  if (start < 0) return null
  let depth = 0
  let inString = false
  let escaped = false
  for (let index = start; index < value.length; index++) {
    const char = value[index]
    if (escaped) {
      escaped = false
      continue
    }
    if (char === '\\') {
      escaped = true
      continue
    }
    if (char === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (char === '{') depth++
    if (char === '}') {
      depth--
      if (depth === 0) return value.slice(start, index + 1)
    }
  }
  return null
}

function openAiCompatibleResult(customId: string, content: string): Record<string, any> & { custom_id: string } {
  return {
    custom_id: customId,
    response: {
      body: {
        choices: [
          {
            message: { content },
          },
        ],
      },
    },
  }
}

function parseProviderErrorMessage(content: string): string | null {
  if (content.includes('usage limit') && content.includes('quota')) {
    return content.slice(0, 300)
  }
  if (content.trimStart().startsWith("{'error':")) {
    return content.slice(0, 300)
  }
  try {
    const value = JSON.parse(content) as unknown
    if (!value || typeof value !== 'object') return null
    const error = (value as Record<string, unknown>).error
    if (!error || typeof error !== 'object') return null
    const message = (error as Record<string, unknown>).message
    return typeof message === 'string' ? message : 'Provider returned an error object.'
  } catch {
    return null
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

async function runUntilFirstError<T, R extends Record<string, any>>(
  values: T[],
  fn: (value: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  for (const value of values) {
    const result = await fn(value)
    results.push(result)
    if ('error' in result) break
  }
  return results
}

function readJsonl<T>(path: string): T[] {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line) as T)
}

function readExistingSuccessfulRows(path: string): Array<Record<string, any> & { custom_id: string }> {
  if (!existsSync(path)) return []
  const seen = new Set<string>()
  const rows: Array<Record<string, any> & { custom_id: string }> = []
  for (const row of readJsonl<Record<string, any>>(path)) {
    if (typeof row.custom_id !== 'string') continue
    if ('error' in row) continue
    if (rowContainsProviderErrorContent(row)) continue
    if (seen.has(row.custom_id)) continue
    seen.add(row.custom_id)
    rows.push(row as Record<string, any> & { custom_id: string })
  }
  return rows
}

function rowContainsProviderErrorContent(row: Record<string, any>): boolean {
  const content = row.response?.body?.choices?.[0]?.message?.content
  return typeof content === 'string' && parseProviderErrorMessage(content) !== null
}
