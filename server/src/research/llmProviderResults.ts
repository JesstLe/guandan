import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'

interface BatchInputLine {
  custom_id: string
  expected_raw_output_file: string
}

export interface LLMRunProvenanceInput {
  modelProvider: string
  modelName: string
  runId?: string
  temperature?: number
  samplingParameters?: Record<string, unknown>
  notes?: string
}

export interface MaterializeProviderResultsOptions {
  batchJsonlPath: string
  providerResultJsonlPath: string
  rawOutputDir: string
  reportPath: string
  provenancePath?: string
  provenance: LLMRunProvenanceInput
}

export interface MaterializeFailure {
  customId: string
  message: string
}

export interface MaterializeProviderResultsReport {
  schemaVersion: '0.1.0'
  sourceBatchJsonl: string
  providerResultJsonl: string
  rawOutputDir: string
  expectedCount: number
  writtenCount: number
  missingResultCount: number
  failedResultCount: number
  unexpectedResultCount: number
  emptyContentCount: number
  readyForAudit: boolean
  missingCustomIds: string[]
  unexpectedCustomIds: string[]
  emptyCustomIds: string[]
  failures: MaterializeFailure[]
}

export interface LLMRunProvenance extends LLMRunProvenanceInput {
  schemaVersion: '0.1.0'
  sourceBatchJsonl: string
  providerResultJsonl: string
  rawOutputDir: string
  materializationReport: string
}

interface ProviderResultLine {
  customId: string
  content: string | null
  errorMessage: string | null
}

export function materializeProviderResults(options: MaterializeProviderResultsOptions): MaterializeProviderResultsReport {
  const batchLines = readJsonl<BatchInputLine>(options.batchJsonlPath)
  assertBatchLinesHaveRawOutputFiles(batchLines, options.batchJsonlPath)
  const expectedByCustomId = new Map(batchLines.map(line => [line.custom_id, line.expected_raw_output_file]))
  const providerResults = readJsonl<unknown>(options.providerResultJsonlPath).map(parseProviderResultLine)
  const providerByCustomId = new Map(providerResults.map(result => [result.customId, result]))

  mkdirSync(options.rawOutputDir, { recursive: true })

  const missingCustomIds: string[] = []
  const emptyCustomIds: string[] = []
  const failures: MaterializeFailure[] = []
  let writtenCount = 0

  for (const [customId, outputFile] of expectedByCustomId) {
    const rawOutputPath = join(options.rawOutputDir, outputFile)
    if (existsSync(rawOutputPath)) unlinkSync(rawOutputPath)
    const result = providerByCustomId.get(customId)
    if (!result) {
      missingCustomIds.push(customId)
      continue
    }
    if (result.errorMessage) {
      failures.push({ customId, message: result.errorMessage })
      continue
    }
    if (result.content === null || result.content.trim() === '') {
      emptyCustomIds.push(customId)
      continue
    }

    writeFileSync(rawOutputPath, result.content, 'utf8')
    writtenCount++
  }

  const unexpectedCustomIds = providerResults
    .map(result => result.customId)
    .filter(customId => !expectedByCustomId.has(customId))
    .sort()

  const report: MaterializeProviderResultsReport = {
    schemaVersion: '0.1.0',
    sourceBatchJsonl: options.batchJsonlPath,
    providerResultJsonl: options.providerResultJsonlPath,
    rawOutputDir: options.rawOutputDir,
    expectedCount: expectedByCustomId.size,
    writtenCount,
    missingResultCount: missingCustomIds.length,
    failedResultCount: failures.length,
    unexpectedResultCount: unexpectedCustomIds.length,
    emptyContentCount: emptyCustomIds.length,
    readyForAudit: writtenCount === expectedByCustomId.size
      && failures.length === 0
      && missingCustomIds.length === 0
      && emptyCustomIds.length === 0,
    missingCustomIds: missingCustomIds.sort(),
    unexpectedCustomIds,
    emptyCustomIds: emptyCustomIds.sort(),
    failures,
  }

  writeJson(options.reportPath, report)
  if (options.provenancePath) {
    writeJson(options.provenancePath, {
      schemaVersion: '0.1.0',
      ...options.provenance,
      sourceBatchJsonl: options.batchJsonlPath,
      providerResultJsonl: options.providerResultJsonlPath,
      rawOutputDir: options.rawOutputDir,
      materializationReport: options.reportPath,
    } satisfies LLMRunProvenance)
  }

  return report
}

function assertBatchLinesHaveRawOutputFiles(batchLines: BatchInputLine[], path: string): void {
  const invalid = batchLines
    .filter(line => typeof line.custom_id !== 'string'
      || line.custom_id.trim() === ''
      || typeof line.expected_raw_output_file !== 'string'
      || line.expected_raw_output_file.trim() === '')
    .map(line => line.custom_id || '<missing custom_id>')

  if (invalid.length > 0) {
    throw new Error([
      `Batch JSONL ${path} is missing expected_raw_output_file for ${invalid.length} rows.`,
      'Pass the provider-neutral batch-input.jsonl file, not the OpenAI upload JSONL.',
      `Invalid custom_id values: ${invalid.slice(0, 5).join(', ')}`,
    ].join(' '))
  }
}

function parseProviderResultLine(value: unknown): ProviderResultLine {
  if (!value || typeof value !== 'object') {
    return { customId: '', content: null, errorMessage: 'Provider result line is not an object.' }
  }

  const record = value as Record<string, unknown>
  const customId = typeof record.custom_id === 'string'
    ? record.custom_id
    : typeof record.customId === 'string'
      ? record.customId
      : ''
  const errorMessage = extractErrorMessage(record)
  if (errorMessage) return { customId, content: null, errorMessage }

  return { customId, content: extractContent(record), errorMessage: null }
}

function extractContent(record: Record<string, unknown>): string | null {
  if (typeof record.content === 'string') return record.content
  if (typeof record.output_text === 'string') return record.output_text

  const response = asRecord(record.response)
  const body = asRecord(response?.body)
  if (typeof body?.output_text === 'string') return body.output_text

  const choices = Array.isArray(body?.choices) ? body.choices : null
  const firstChoice = asRecord(choices?.[0])
  const message = asRecord(firstChoice?.message)
  if (typeof message?.content === 'string') return message.content

  return null
}

function extractErrorMessage(record: Record<string, unknown>): string | null {
  const directError = asRecord(record.error)
  if (typeof directError?.message === 'string') return directError.message

  const response = asRecord(record.response)
  const responseError = asRecord(response?.error)
  if (typeof responseError?.message === 'string') return responseError.message

  return null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null
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
