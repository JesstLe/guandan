import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { verifierLabelNames } from './verifierMetrics'

type StatusCounts = Record<'pass' | 'fail' | 'unknown' | 'not_applicable', number>
type ComparableNumber = number | '[NEED_EXPERIMENT]'

interface MetricsFile {
  totalDecisionPoints?: number
  totalParsedTraces?: number
  parseFailureCount?: number
  hardFailureCount?: number
  labelStatusCounts?: Record<string, StatusCounts>
}

interface RawAuditFile {
  expectedCount: number
  presentCount: number
  missingCount: number
  emptyCount: number
  unexpectedCount: number
  readyForIngest: boolean
}

export interface RevisionComparisonInput {
  firstPassAgentId: string
  revisionAgentId: string
  firstPassMetricsPath?: string
  revisionMetricsPath?: string
  firstPassRawAuditPath?: string
  revisionRawAuditPath?: string
}

export interface RevisionComparisonRow {
  label: string
  beforePass: ComparableNumber
  afterPass: ComparableNumber
  beforeFailureBurden: ComparableNumber
  afterFailureBurden: ComparableNumber
  burdenDelta: ComparableNumber
}

export interface RevisionComparison {
  schemaVersion: '0.1.0'
  status: 'metrics_available' | 'missing_raw_outputs' | 'missing_metrics'
  firstPassAgentId: string
  revisionAgentId: string
  totalDecisionPoints: number | null
  parsedBefore: number | null
  parsedAfter: number | null
  hardFailuresBefore: number | null
  hardFailuresAfter: number | null
  hardFailureDelta: number | null
  rows: RevisionComparisonRow[]
  notes: string
}

export interface WriteRevisionComparisonOptions {
  outputDir: string
  input: RevisionComparisonInput
}

export interface WriteRevisionComparisonResult {
  jsonPath: string
  markdownPath: string
  comparison: RevisionComparison
}

export function compareRevisionMetrics(input: RevisionComparisonInput): RevisionComparison {
  if (input.firstPassMetricsPath && input.revisionMetricsPath) {
    const before = readJson<MetricsFile>(input.firstPassMetricsPath)
    const after = readJson<MetricsFile>(input.revisionMetricsPath)

    return {
      schemaVersion: '0.1.0',
      status: 'metrics_available',
      firstPassAgentId: input.firstPassAgentId,
      revisionAgentId: input.revisionAgentId,
      totalDecisionPoints: before.totalDecisionPoints ?? after.totalDecisionPoints ?? null,
      parsedBefore: before.totalParsedTraces ?? before.totalDecisionPoints ?? null,
      parsedAfter: after.totalParsedTraces ?? after.totalDecisionPoints ?? null,
      hardFailuresBefore: before.hardFailureCount ?? null,
      hardFailuresAfter: after.hardFailureCount ?? null,
      hardFailureDelta: numericDelta(before.hardFailureCount, after.hardFailureCount),
      rows: verifierLabelNames.map(label => compareLabel(label, before, after)),
      notes: 'Failure burden is fail + unknown; lower after-revision values indicate fewer verifier-visible reasoning problems.',
    }
  }

  const audits = [
    input.firstPassRawAuditPath ? readJson<RawAuditFile>(input.firstPassRawAuditPath) : null,
    input.revisionRawAuditPath ? readJson<RawAuditFile>(input.revisionRawAuditPath) : null,
  ].filter((audit): audit is RawAuditFile => audit !== null)
  const hasMissingRawOutputs = audits.some(audit => !audit.readyForIngest || audit.missingCount > 0)

  return {
    schemaVersion: '0.1.0',
    status: hasMissingRawOutputs ? 'missing_raw_outputs' : 'missing_metrics',
    firstPassAgentId: input.firstPassAgentId,
    revisionAgentId: input.revisionAgentId,
    totalDecisionPoints: audits[0]?.expectedCount ?? null,
    parsedBefore: audits[0]?.presentCount ?? null,
    parsedAfter: audits[1]?.presentCount ?? null,
    hardFailuresBefore: null,
    hardFailuresAfter: null,
    hardFailureDelta: null,
    rows: verifierLabelNames.map(label => ({
      label,
      beforePass: '[NEED_EXPERIMENT]',
      afterPass: '[NEED_EXPERIMENT]',
      beforeFailureBurden: '[NEED_EXPERIMENT]',
      afterFailureBurden: '[NEED_EXPERIMENT]',
      burdenDelta: '[NEED_EXPERIMENT]',
    })),
    notes: hasMissingRawOutputs
      ? 'Raw outputs are missing; this file is a readiness artifact, not an experimental result.'
      : 'Metrics are missing; run ingest and verifier metrics before interpreting revision effects.',
  }
}

export function writeRevisionComparison(options: WriteRevisionComparisonOptions): WriteRevisionComparisonResult {
  mkdirSync(options.outputDir, { recursive: true })
  const comparison = compareRevisionMetrics(options.input)
  const jsonPath = join(options.outputDir, 'revision-comparison.json')
  const markdownPath = join(options.outputDir, 'revision-comparison.md')

  writeJson(jsonPath, comparison)
  writeFileSync(markdownPath, renderRevisionComparisonMarkdown(comparison), 'utf8')

  return { jsonPath, markdownPath, comparison }
}

export function renderRevisionComparisonMarkdown(comparison: RevisionComparison): string {
  const lines = [
    '# Verifier Revision Comparison',
    '',
    'Rows marked `[NEED_EXPERIMENT]` are not model results.',
    '',
    `Status: \`${comparison.status}\``,
    '',
    `First pass: \`${comparison.firstPassAgentId}\``,
    '',
    `Revision: \`${comparison.revisionAgentId}\``,
    '',
    `Hard failures: ${formatNullable(comparison.hardFailuresBefore)} -> ${formatNullable(comparison.hardFailuresAfter)} (${formatDelta(comparison.hardFailureDelta)})`,
    '',
    '| Label | Before Burden | After Burden | Delta | Before Pass | After Pass |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    ...comparison.rows.map(row => [
      row.label,
      String(row.beforeFailureBurden),
      String(row.afterFailureBurden),
      String(row.burdenDelta),
      String(row.beforePass),
      String(row.afterPass),
    ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
    '',
    `Notes: ${comparison.notes}`,
    '',
  ]

  return lines.join('\n')
}

function compareLabel(label: typeof verifierLabelNames[number], before: MetricsFile, after: MetricsFile): RevisionComparisonRow {
  const beforeCounts = before.labelStatusCounts?.[label]
  const afterCounts = after.labelStatusCounts?.[label]

  if (!beforeCounts || !afterCounts) {
    return {
      label,
      beforePass: '[NEED_EXPERIMENT]',
      afterPass: '[NEED_EXPERIMENT]',
      beforeFailureBurden: '[NEED_EXPERIMENT]',
      afterFailureBurden: '[NEED_EXPERIMENT]',
      burdenDelta: '[NEED_EXPERIMENT]',
    }
  }

  const beforeBurden = failureBurden(beforeCounts)
  const afterBurden = failureBurden(afterCounts)
  return {
    label,
    beforePass: beforeCounts.pass,
    afterPass: afterCounts.pass,
    beforeFailureBurden: beforeBurden,
    afterFailureBurden: afterBurden,
    burdenDelta: afterBurden - beforeBurden,
  }
}

function failureBurden(counts: StatusCounts): number {
  return counts.fail + counts.unknown
}

function numericDelta(before: number | undefined, after: number | undefined): number | null {
  if (before === undefined || after === undefined) return null
  return after - before
}

function formatNullable(value: number | null): string {
  return value === null ? '[NEED_EXPERIMENT]' : String(value)
}

function formatDelta(value: number | null): string {
  return value === null ? '[NEED_EXPERIMENT]' : String(value)
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
