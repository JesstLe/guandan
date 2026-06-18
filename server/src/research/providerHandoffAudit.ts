import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'

export type ProviderHandoffConditionStatus =
  | 'ready_for_provider_run'
  | 'waiting_for_provider_results'
  | 'provider_results_present'
  | 'blocked_by_first_pass_results'
  | 'invalid'

export interface ProviderHandoffConditionInput {
  conditionId: string
  title: string
  mappingJsonlPath?: string
  uploadJsonlPath?: string
  expectedProviderResultPath: string
  requiresFirstPassResults?: boolean
}

export interface ProviderHandoffConditionReport {
  conditionId: string
  title: string
  status: ProviderHandoffConditionStatus
  mappingJsonlPath?: string
  uploadJsonlPath?: string
  expectedProviderResultPath: string
  mappingExists: boolean
  uploadExists: boolean
  providerResultExists: boolean
  mappingRequestCount: number
  uploadRequestCount: number
  customIdMismatchCount: number
  missingFromUpload: string[]
  missingFromMapping: string[]
  notes: string[]
}

export interface ProviderHandoffAuditIssue {
  severity: 'error' | 'warning' | 'info'
  conditionId: string
  message: string
}

export interface ProviderHandoffAuditReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  status: 'ready' | 'not_ready'
  conditionCount: number
  conditions: ProviderHandoffConditionReport[]
  issues: ProviderHandoffAuditIssue[]
}

export interface ProviderHandoffAuditOptions {
  conditions?: ProviderHandoffConditionInput[]
}

export interface ProviderHandoffAuditWriteOptions extends ProviderHandoffAuditOptions {
  outputDir: string
}

export interface ProviderHandoffAuditWriteResult {
  jsonPath: string
  markdownPath: string
  report: ProviderHandoffAuditReport
}

interface MappingJsonlLine {
  custom_id?: string
  expected_raw_output_file?: string
}

interface UploadJsonlLine {
  custom_id?: string
  body?: unknown
}

export const defaultProviderHandoffConditions: ProviderHandoffConditionInput[] = [
  {
    conditionId: 'plain-llm',
    title: 'Plain LLM first-pass run',
    mappingJsonlPath: 'docs/research/experiments/pilot-e4-plain-llm-batch/batch-input.jsonl',
    uploadJsonlPath: 'docs/research/experiments/pilot-e4-plain-llm-batch/openai/openai-batch-input.jsonl',
    expectedProviderResultPath: 'docs/research/experiments/provider-results/plain-llm.jsonl',
  },
  {
    conditionId: 'candidate-constrained-llm',
    title: 'Candidate-constrained LLM first-pass run',
    mappingJsonlPath: 'docs/research/experiments/pilot-e5-candidate-constrained-batch/batch-input.jsonl',
    uploadJsonlPath: 'docs/research/experiments/pilot-e5-candidate-constrained-batch/openai/openai-batch-input.jsonl',
    expectedProviderResultPath: 'docs/research/experiments/provider-results/candidate-constrained-llm.jsonl',
  },
  {
    conditionId: 'tom-prompted-llm',
    title: 'ToM-prompted LLM first-pass run',
    mappingJsonlPath: 'docs/research/experiments/pilot-e7-tom-prompted-batch/batch-input.jsonl',
    uploadJsonlPath: 'docs/research/experiments/pilot-e7-tom-prompted-batch/openai/openai-batch-input.jsonl',
    expectedProviderResultPath: 'docs/research/experiments/provider-results/tom-prompted-llm.jsonl',
  },
  {
    conditionId: 'verifier-revision-llm',
    title: 'Verifier-revision LLM run',
    mappingJsonlPath: 'docs/research/experiments/pilot-e6-verifier-revision-batch/batch-input.jsonl',
    uploadJsonlPath: 'docs/research/experiments/pilot-e6-verifier-revision-batch/openai/openai-batch-input.jsonl',
    expectedProviderResultPath: 'docs/research/experiments/provider-results/verifier-revision-llm.jsonl',
    requiresFirstPassResults: true,
  },
]

export function auditProviderHandoff(options: ProviderHandoffAuditOptions = {}): ProviderHandoffAuditReport {
  const conditions = options.conditions ?? defaultProviderHandoffConditions
  const conditionReports = conditions.map(auditCondition)
  const issues = conditionReports.flatMap(conditionToIssues)
  const hasErrors = issues.some(issue => issue.severity === 'error')

  return {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    status: hasErrors ? 'not_ready' : 'ready',
    conditionCount: conditionReports.length,
    conditions: conditionReports,
    issues,
  }
}

export function writeProviderHandoffAudit(options: ProviderHandoffAuditWriteOptions): ProviderHandoffAuditWriteResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = auditProviderHandoff(options)
  const jsonPath = join(options.outputDir, 'provider-handoff-audit.json')
  const markdownPath = join(options.outputDir, 'provider-handoff-audit.md')

  writeJson(jsonPath, report)
  writeFileSync(markdownPath, renderProviderHandoffAudit(report), 'utf8')

  return { jsonPath, markdownPath, report }
}

export function renderProviderHandoffAudit(report: ProviderHandoffAuditReport): string {
  const lines = [
    '# Provider Handoff Audit',
    '',
    `Status: \`${report.status}\``,
    `Generated at: \`${report.generatedAt}\``,
    '',
    'This audit checks local handoff package consistency. Missing provider-result files are expected until external model runs are downloaded.',
    '',
    '| Condition | Status | Mapping rows | Upload rows | Mismatches | Provider result |',
    '| --- | --- | ---: | ---: | ---: | --- |',
    ...report.conditions.map(condition => [
      condition.conditionId,
      `\`${condition.status}\``,
      String(condition.mappingRequestCount),
      String(condition.uploadRequestCount),
      String(condition.customIdMismatchCount),
      condition.providerResultExists ? '`present`' : '`missing`',
    ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
    '',
  ]

  if (report.issues.length > 0) {
    lines.push('## Issues', '')
    lines.push('| Severity | Condition | Message |')
    lines.push('| --- | --- | --- |')
    for (const issue of report.issues) {
      lines.push(`| \`${issue.severity}\` | \`${issue.conditionId}\` | ${escapeMarkdownCell(issue.message)} |`)
    }
    lines.push('')
  }

  for (const condition of report.conditions) {
    if (condition.notes.length === 0) continue
    lines.push(`## ${condition.conditionId}`, '')
    for (const note of condition.notes) {
      lines.push(`- ${note}`)
    }
    lines.push('')
  }

  return `${lines.join('\n')}\n`
}

function auditCondition(input: ProviderHandoffConditionInput): ProviderHandoffConditionReport {
  const mappingExists = input.mappingJsonlPath ? existsSync(input.mappingJsonlPath) : false
  const uploadExists = input.uploadJsonlPath ? existsSync(input.uploadJsonlPath) : false
  const providerResultExists = existsSync(input.expectedProviderResultPath)
  const mappingLines = mappingExists ? readJsonl<MappingJsonlLine>(input.mappingJsonlPath as string) : []
  const uploadLines = uploadExists ? readJsonl<UploadJsonlLine>(input.uploadJsonlPath as string) : []
  const mappingCustomIds = new Set(mappingLines.map(line => line.custom_id).filter(isNonEmptyString))
  const uploadCustomIds = new Set(uploadLines.map(line => line.custom_id).filter(isNonEmptyString))
  const missingFromUpload = [...mappingCustomIds].filter(id => !uploadCustomIds.has(id)).sort()
  const missingFromMapping = [...uploadCustomIds].filter(id => !mappingCustomIds.has(id)).sort()
  const customIdMismatchCount = missingFromUpload.length + missingFromMapping.length
  const notes: string[] = []

  if (input.requiresFirstPassResults && (!mappingExists || !uploadExists)) {
    notes.push('Real verifier-revision package is expected to be generated only after first-pass LLM traces and verifier results exist.')
  }
  if (!providerResultExists) {
    notes.push(`Provider result should be saved to ${input.expectedProviderResultPath} after the external run completes.`)
  }

  return {
    conditionId: input.conditionId,
    title: input.title,
    status: conditionStatus(input, {
      mappingExists,
      uploadExists,
      providerResultExists,
      customIdMismatchCount,
    }),
    mappingJsonlPath: input.mappingJsonlPath,
    uploadJsonlPath: input.uploadJsonlPath,
    expectedProviderResultPath: input.expectedProviderResultPath,
    mappingExists,
    uploadExists,
    providerResultExists,
    mappingRequestCount: mappingLines.length,
    uploadRequestCount: uploadLines.length,
    customIdMismatchCount,
    missingFromUpload,
    missingFromMapping,
    notes,
  }
}

function conditionStatus(
  input: ProviderHandoffConditionInput,
  state: {
    mappingExists: boolean
    uploadExists: boolean
    providerResultExists: boolean
    customIdMismatchCount: number
  },
): ProviderHandoffConditionStatus {
  if (input.requiresFirstPassResults && (!state.mappingExists || !state.uploadExists)) {
    return 'blocked_by_first_pass_results'
  }
  if (!state.mappingExists || !state.uploadExists || state.customIdMismatchCount > 0) {
    return 'invalid'
  }
  if (state.providerResultExists) return 'provider_results_present'
  return 'waiting_for_provider_results'
}

function conditionToIssues(condition: ProviderHandoffConditionReport): ProviderHandoffAuditIssue[] {
  const issues: ProviderHandoffAuditIssue[] = []

  if (condition.status === 'blocked_by_first_pass_results') {
    issues.push({
      severity: 'info',
      conditionId: condition.conditionId,
      message: 'Real verifier-revision package is intentionally blocked until first-pass LLM results exist.',
    })
    return issues
  }

  if (!condition.mappingExists) {
    issues.push({
      severity: 'error',
      conditionId: condition.conditionId,
      message: `Missing provider-neutral mapping JSONL: ${condition.mappingJsonlPath}.`,
    })
  }
  if (!condition.uploadExists) {
    issues.push({
      severity: 'error',
      conditionId: condition.conditionId,
      message: `Missing OpenAI upload JSONL: ${condition.uploadJsonlPath}.`,
    })
  }
  if (condition.mappingExists && condition.uploadExists && condition.customIdMismatchCount > 0) {
    issues.push({
      severity: 'error',
      conditionId: condition.conditionId,
      message: `Mapping/upload custom_id sets differ by ${condition.customIdMismatchCount} ids.`,
    })
  }
  if (!condition.providerResultExists) {
    issues.push({
      severity: 'info',
      conditionId: condition.conditionId,
      message: `Provider result not present yet: ${condition.expectedProviderResultPath}.`,
    })
  }

  return issues
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|')
}
