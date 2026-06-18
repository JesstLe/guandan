import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { spawn } from 'node:child_process'

interface KimiCliBatchLine {
  custom_id: string
  body: {
    messages: Array<{ role: string; content: string }>
  }
}

export interface KimiCliBatchRunnerOptions {
  inputJsonlPath: string
  outputJsonlPath: string
  kimiBin?: string
  model?: string
  maxStepsPerTurn?: number
  concurrency?: number
  limit?: number
}

export interface KimiCliBatchRunReport {
  schemaVersion: '0.1.0'
  inputJsonlPath: string
  outputJsonlPath: string
  expectedCount: number
  writtenCount: number
  successCount: number
  errorCount: number
  kimiBin: string
  model?: string
}

export async function runKimiCliBatchJsonl(
  options: KimiCliBatchRunnerOptions,
): Promise<KimiCliBatchRunReport> {
  const kimiBin = options.kimiBin ?? 'kimi'
  const maxStepsPerTurn = options.maxStepsPerTurn ?? 1
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 1, 8))
  const allLines = readJsonl<KimiCliBatchLine>(options.inputJsonlPath)
  const lines = options.limit === undefined ? allLines : allLines.slice(0, options.limit)
  mkdirSync(dirname(options.outputJsonlPath), { recursive: true })

  const results = await mapWithConcurrency(lines, concurrency, async line => {
    try {
      const content = await runKimiCli({
        kimiBin,
        model: options.model,
        maxStepsPerTurn,
        prompt: formatPrompt(line),
      })
      return openAiCompatibleResult(line.custom_id, content)
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
    kimiBin,
    model: options.model,
  }
}

function formatPrompt(line: KimiCliBatchLine): string {
  const messages = line.body.messages
    .map(message => `${message.role.toUpperCase()} MESSAGE:\n${message.content}`)
    .join('\n\n')
  return [
    'Execute the following chat-completion request for a research benchmark.',
    'Return only the requested JSON object. Do not include markdown, commentary, or tool calls.',
    '',
    messages,
  ].join('\n')
}

async function runKimiCli(options: {
  kimiBin: string
  model?: string
  maxStepsPerTurn: number
  prompt: string
}): Promise<string> {
  const args = [
    '--print',
    '--output-format',
    'stream-json',
    '--max-steps-per-turn',
    String(options.maxStepsPerTurn),
  ]
  if (options.model) args.push('--model', options.model)
  args.push('--prompt', options.prompt)

  const { stdout, stderr, code } = await spawnAndCollect(options.kimiBin, args)
  const text = extractAssistantText(stdout)
  if (text) return extractFirstJsonObject(text) ?? text.trim()

  if (code !== 0) {
    throw new Error(stderr.trim() || `kimi exited with code ${code}`)
  }

  throw new Error('kimi output did not contain an assistant text block')
}

function spawnAndCollect(command: string, args: string[]): Promise<{
  stdout: string
  stderr: string
  code: number | null
}> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', chunk => {
      stdout += chunk
    })
    child.stderr.on('data', chunk => {
      stderr += chunk
    })
    child.on('error', reject)
    child.on('close', code => {
      resolve({ stdout, stderr, code })
    })
  })
}

function extractAssistantText(stdout: string): string | null {
  const texts: string[] = []
  for (const rawLine of stdout.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line.startsWith('{')) continue
    try {
      const event = JSON.parse(line) as Record<string, unknown>
      if (event.role !== 'assistant') continue
      const content = event.content
      if (!Array.isArray(content)) continue
      for (const part of content) {
        if (!part || typeof part !== 'object') continue
        const record = part as Record<string, unknown>
        if (record.type === 'text' && typeof record.text === 'string') {
          texts.push(record.text)
        }
      }
    } catch {
      continue
    }
  }
  return texts.length === 0 ? null : texts.join('\n').trim()
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

function openAiCompatibleResult(customId: string, content: string): Record<string, unknown> {
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

function readJsonl<T>(path: string): T[] {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line) as T)
}
