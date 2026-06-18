import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { verifierLabelNames } from './verifierMetrics'

type StatusCounts = Record<'pass' | 'fail' | 'unknown' | 'not_applicable', number>

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

export interface MetricsSummarySource {
  agentId: string
  metricsPath?: string
  rawAuditPath?: string
  notes?: string
}

export interface MetricsSummaryRow {
  agentId: string
  status: 'metrics_available' | 'missing_raw_outputs' | 'missing_metrics'
  totalDecisionPoints: number | null
  parsedTraces: number | null
  parseFailures: number | null
  hardFailures: number | null
  legalAction: string
  publicHistoryConsistent: string
  hiddenInfoDisciplined: string
  partnerOpponentTagConsistency: string
  reasonActionConsistent: string
  teamObjectiveValid: string
  notes: string
}

export interface MetricsSummary {
  schemaVersion: '0.1.0'
  rows: MetricsSummaryRow[]
}

export interface WriteMetricsSummaryOptions {
  sources: MetricsSummarySource[]
  outputDir: string
  basename?: string
  title?: string
  description?: string
}

export interface WriteMetricsSummaryResult {
  jsonPath: string
  markdownPath: string
  summary: MetricsSummary
}

export function summarizeExperimentMetrics(sources: MetricsSummarySource[]): MetricsSummary {
  return {
    schemaVersion: '0.1.0',
    rows: sources.map(source => summarizeSource(source)),
  }
}

export function writeMetricsSummary(options: WriteMetricsSummaryOptions): WriteMetricsSummaryResult {
  mkdirSync(options.outputDir, { recursive: true })
  const summary = summarizeExperimentMetrics(options.sources)
  const basename = options.basename ?? 'pilot-metrics-summary'
  const jsonPath = join(options.outputDir, `${basename}.json`)
  const markdownPath = join(options.outputDir, `${basename}.md`)

  writeJson(jsonPath, summary)
  writeFileSync(markdownPath, renderMetricsSummaryMarkdown(summary, {
    title: options.title,
    description: options.description,
  }), 'utf8')

  return { jsonPath, markdownPath, summary }
}

export function renderMetricsSummaryMarkdown(
  summary: MetricsSummary,
  options: { title?: string; description?: string } = {},
): string {
  const lines = [
    `# ${options.title ?? 'Pilot Metrics Summary'}`,
    '',
    options.description
      ?? 'This table is generated from current experiment artifacts. Rows marked `missing_raw_outputs` are not model results.',
    '',
    '| Agent | Status | Parsed / Total | Parse Failures | Hard Failures | Legal | Public | Hidden Info | Partner/Opponent Tags | Reason-Action | Objective | Notes |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...summary.rows.map(row => [
      row.agentId,
      row.status,
      formatParsedTotal(row),
      formatNullable(row.parseFailures),
      formatNullable(row.hardFailures),
      row.legalAction,
      row.publicHistoryConsistent,
      row.hiddenInfoDisciplined,
      row.partnerOpponentTagConsistency,
      row.reasonActionConsistent,
      row.teamObjectiveValid,
      row.notes,
    ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
    '',
  ]

  return lines.join('\n')
}

function summarizeSource(source: MetricsSummarySource): MetricsSummaryRow {
  if (source.metricsPath && existsSync(source.metricsPath)) {
    const metrics = readJson<MetricsFile>(source.metricsPath)
    const total = metrics.totalDecisionPoints ?? 0
    const parsed = metrics.totalParsedTraces ?? total

    return {
      agentId: source.agentId,
      status: 'metrics_available',
      totalDecisionPoints: total,
      parsedTraces: parsed,
      parseFailures: metrics.parseFailureCount ?? 0,
      hardFailures: metrics.hardFailureCount ?? 0,
      legalAction: formatLabel(metrics, 'legalAction'),
      publicHistoryConsistent: formatLabel(metrics, 'publicHistoryConsistent'),
      hiddenInfoDisciplined: formatLabel(metrics, 'hiddenInfoDisciplined'),
      partnerOpponentTagConsistency: formatPartnerOpponent(metrics),
      reasonActionConsistent: formatLabel(metrics, 'reasonActionConsistent'),
      teamObjectiveValid: formatLabel(metrics, 'teamObjectiveValid'),
      notes: source.notes ?? '',
    }
  }

  if (source.rawAuditPath && existsSync(source.rawAuditPath)) {
    const audit = readJson<RawAuditFile>(source.rawAuditPath)
    return {
      agentId: source.agentId,
      status: audit.readyForIngest ? 'missing_metrics' : 'missing_raw_outputs',
      totalDecisionPoints: audit.expectedCount,
      parsedTraces: audit.presentCount,
      parseFailures: null,
      hardFailures: null,
      legalAction: '[NEED_EXPERIMENT]',
      publicHistoryConsistent: '[NEED_EXPERIMENT]',
      hiddenInfoDisciplined: '[NEED_EXPERIMENT]',
      partnerOpponentTagConsistency: '[NEED_EXPERIMENT]',
      reasonActionConsistent: '[NEED_EXPERIMENT]',
      teamObjectiveValid: '[NEED_EXPERIMENT]',
      notes: source.notes ?? `raw present ${audit.presentCount}/${audit.expectedCount}; missing ${audit.missingCount}`,
    }
  }

  return {
    agentId: source.agentId,
    status: 'missing_metrics',
    totalDecisionPoints: null,
    parsedTraces: null,
    parseFailures: null,
    hardFailures: null,
    legalAction: '[NEED_EXPERIMENT]',
    publicHistoryConsistent: '[NEED_EXPERIMENT]',
    hiddenInfoDisciplined: '[NEED_EXPERIMENT]',
    partnerOpponentTagConsistency: '[NEED_EXPERIMENT]',
    reasonActionConsistent: '[NEED_EXPERIMENT]',
    teamObjectiveValid: '[NEED_EXPERIMENT]',
    notes: source.notes ?? '',
  }
}

function formatLabel(metrics: MetricsFile, label: typeof verifierLabelNames[number]): string {
  const counts = metrics.labelStatusCounts?.[label]
  if (!counts) return '[NEED_EXPERIMENT]'
  return `${counts.pass} pass / ${counts.fail} fail / ${counts.unknown} unknown / ${counts.not_applicable} n/a`
}

function formatPartnerOpponent(metrics: MetricsFile): string {
  const partner = metrics.labelStatusCounts?.partnerConsistent
  const opponent = metrics.labelStatusCounts?.opponentConsistent
  if (!partner || !opponent) return '[NEED_EXPERIMENT]'
  return [
    `partner ${partner.pass} pass / ${partner.fail} fail / ${partner.unknown} unknown`,
    `opponent ${opponent.pass} pass / ${opponent.fail} fail / ${opponent.unknown} unknown`,
  ].join('; ')
}

function formatParsedTotal(row: MetricsSummaryRow): string {
  if (row.totalDecisionPoints === null || row.parsedTraces === null) return '[NEED_EXPERIMENT]'
  return `${row.parsedTraces} / ${row.totalDecisionPoints}`
}

function formatNullable(value: number | null): string {
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
