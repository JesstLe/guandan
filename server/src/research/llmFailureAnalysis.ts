import {
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, join } from 'node:path'

type FailureCategory =
  | 'nested_reasoning_wrong_schema'
  | 'field_alias_wrong_schema'
  | 'tool_call_like_output'
  | 'missing_required_trace_fields'
  | 'non_json_output'

interface MetricsFailure {
  decisionId: string
  rawOutputFile: string
  message: string
}

interface MetricsFile {
  conditionId: string
  totalDecisionPoints: number
  totalParsedTraces: number
  parseFailureCount: number
  hardFailureCount: number
  failures: MetricsFailure[]
}

interface VerifierResultFile {
  decisionId: string
  hardFailures?: Array<{ code: string; message: string; path?: string }>
}

export interface LLMFailureAnalysisOptions {
  metricsPath: string
  rawOutputDir: string
  resultDir: string
  outputDir: string
  basename?: string
}

export interface ParseFailureRow {
  decisionId: string
  category: FailureCategory
  message: string
  missingRequiredFields: string[]
  observedTopLevelKeys: string[]
  rawOutputFile: string
  snippet: string
}

export interface VerifierHardFailureRow {
  decisionId: string
  code: string
  message: string
  path?: string
}

export interface LLMFailureAnalysis {
  schemaVersion: '0.1.0'
  conditionId: string
  totalDecisionPoints: number
  parsedTraces: number
  parseFailures: number
  hardFailures: number
  parseFailureCategoryCounts: Record<FailureCategory, number>
  verifierHardFailureCodeCounts: Record<string, number>
  parseFailureRows: ParseFailureRow[]
  verifierHardFailureRows: VerifierHardFailureRow[]
}

export interface LLMFailureAnalysisWriteResult {
  jsonPath: string
  markdownPath: string
  analysis: LLMFailureAnalysis
}

const requiredTraceFields = [
  'schemaVersion',
  'decisionId',
  'agentId',
  'selectedActionId',
  'teamObjective',
  'partnerBelief',
  'opponentBelief',
  'actionRationale',
  'riskAssessment',
  'confidence',
]

const emptyCategoryCounts: Record<FailureCategory, number> = {
  nested_reasoning_wrong_schema: 0,
  field_alias_wrong_schema: 0,
  tool_call_like_output: 0,
  missing_required_trace_fields: 0,
  non_json_output: 0,
}

export function writeLLMFailureAnalysis(options: LLMFailureAnalysisOptions): LLMFailureAnalysisWriteResult {
  mkdirSync(options.outputDir, { recursive: true })
  const analysis = analyzeLLMFailures(options)
  const base = options.basename ?? 'llm-failure-analysis'
  const jsonPath = join(options.outputDir, `${base}.json`)
  const markdownPath = join(options.outputDir, `${base}.md`)

  writeJson(jsonPath, analysis)
  writeFileSync(markdownPath, renderLLMFailureAnalysisMarkdown(analysis), 'utf8')

  return { jsonPath, markdownPath, analysis }
}

export function analyzeLLMFailures(options: LLMFailureAnalysisOptions): LLMFailureAnalysis {
  const metrics = readJson<MetricsFile>(options.metricsPath)
  const parseFailureRows = metrics.failures.map(failure => classifyParseFailure(failure, options.rawOutputDir))
  const verifierHardFailureRows = readVerifierHardFailures(options.resultDir)
  const parseFailureCategoryCounts = { ...emptyCategoryCounts }
  const verifierHardFailureCodeCounts: Record<string, number> = {}

  for (const row of parseFailureRows) {
    parseFailureCategoryCounts[row.category]++
  }
  for (const row of verifierHardFailureRows) {
    verifierHardFailureCodeCounts[row.code] = (verifierHardFailureCodeCounts[row.code] ?? 0) + 1
  }

  return {
    schemaVersion: '0.1.0',
    conditionId: metrics.conditionId,
    totalDecisionPoints: metrics.totalDecisionPoints,
    parsedTraces: metrics.totalParsedTraces,
    parseFailures: metrics.parseFailureCount,
    hardFailures: metrics.hardFailureCount,
    parseFailureCategoryCounts,
    verifierHardFailureCodeCounts,
    parseFailureRows,
    verifierHardFailureRows,
  }
}

export function renderLLMFailureAnalysisMarkdown(analysis: LLMFailureAnalysis): string {
  const lines = [
    '# LLM Failure Analysis',
    '',
    `Condition: \`${analysis.conditionId}\``,
    '',
    '| Metric | Value |',
    '| --- | ---: |',
    `| Decision points | ${analysis.totalDecisionPoints} |`,
    `| Parsed traces | ${analysis.parsedTraces} |`,
    `| Parse failures | ${analysis.parseFailures} |`,
    `| Hard verifier failures | ${analysis.hardFailures} |`,
    '',
    '## Parse-Failure Taxonomy',
    '',
    '| Category | Count |',
    '| --- | ---: |',
    ...Object.entries(analysis.parseFailureCategoryCounts)
      .filter(([, count]) => count > 0)
      .map(([category, count]) => `| \`${category}\` | ${count} |`),
    '',
    '## Verifier Hard-Failure Taxonomy',
    '',
    '| Code | Count |',
    '| --- | ---: |',
    ...Object.entries(analysis.verifierHardFailureCodeCounts)
      .map(([code, count]) => `| \`${escapeMarkdownCell(code)}\` | ${count} |`),
    '',
    '## Parse-Failure Examples',
    '',
    '| Decision | Category | Missing Fields | Observed Keys |',
    '| --- | --- | --- | --- |',
    ...analysis.parseFailureRows.map(row => [
      row.decisionId,
      `\`${row.category}\``,
      row.missingRequiredFields.join(', ') || 'none',
      row.observedTopLevelKeys.join(', ') || 'none',
    ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
    '',
  ]

  if (analysis.verifierHardFailureRows.length > 0) {
    lines.push('## Hard-Failure Examples', '')
    lines.push('| Decision | Code | Message |')
    lines.push('| --- | --- | --- |')
    for (const row of analysis.verifierHardFailureRows) {
      lines.push(`| ${escapeMarkdownCell(row.decisionId)} | \`${escapeMarkdownCell(row.code)}\` | ${escapeMarkdownCell(row.message)} |`)
    }
    lines.push('')
  }

  return `${lines.join('\n')}\n`
}

function classifyParseFailure(failure: MetricsFailure, rawOutputDir: string): ParseFailureRow {
  const rawOutputFile = normalizeRawPath(failure.rawOutputFile, rawOutputDir)
  const raw = readFileSync(rawOutputFile, 'utf8')
  const parsed = parseJson(raw)

  if (!parsed.ok) {
    return {
      decisionId: failure.decisionId,
      category: 'non_json_output',
      message: failure.message,
      missingRequiredFields: requiredTraceFields,
      observedTopLevelKeys: [],
      rawOutputFile,
      snippet: snippet(raw),
    }
  }

  const value = parsed.value
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const observedTopLevelKeys = Object.keys(record).sort()
  const missingRequiredFields = requiredTraceFields.filter(field => !(field in record))

  return {
    decisionId: failure.decisionId,
    category: classifyParsedObject(record, missingRequiredFields),
    message: failure.message,
    missingRequiredFields,
    observedTopLevelKeys,
    rawOutputFile,
    snippet: snippet(raw),
  }
}

function classifyParsedObject(record: Record<string, unknown>, missingRequiredFields: string[]): FailureCategory {
  if (typeof record.action === 'string' && (typeof record.path === 'string' || typeof record.pattern === 'string')) {
    return 'tool_call_like_output'
  }
  if ('reasoning' in record && missingRequiredFields.some(field => ['teamObjective', 'partnerBelief', 'opponentBelief', 'actionRationale', 'riskAssessment'].includes(field))) {
    return 'nested_reasoning_wrong_schema'
  }
  if ('partnerBeliefs' in record || 'opponentBeliefs' in record || 'counterfactuals' in record || 'hiddenInformationNote' in record) {
    return 'field_alias_wrong_schema'
  }
  return 'missing_required_trace_fields'
}

function readVerifierHardFailures(resultDir: string): VerifierHardFailureRow[] {
  if (!existsDir(resultDir)) return []
  return readdirSync(resultDir)
    .filter(filename => filename.endsWith('.json'))
    .sort()
    .flatMap(filename => {
      const result = readJson<VerifierResultFile>(join(resultDir, filename))
      return (result.hardFailures ?? []).map(failure => ({
        decisionId: result.decisionId,
        code: failure.code,
        message: failure.message,
        path: failure.path,
      }))
    })
}

function normalizeRawPath(rawOutputFile: string, rawOutputDir: string): string {
  if (rawOutputFile.startsWith(rawOutputDir)) return rawOutputFile
  return join(rawOutputDir, basename(rawOutputFile))
}

function parseJson(raw: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(stripMarkdownFence(raw)) }
  } catch {
    return { ok: false }
  }
}

function stripMarkdownFence(raw: string): string {
  const trimmed = raw.trim()
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  return match ? match[1].trim() : trimmed
}

function snippet(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, 240)
}

function existsDir(path: string): boolean {
  try {
    return readdirSync(path).length >= 0
  } catch {
    return false
  }
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|')
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
