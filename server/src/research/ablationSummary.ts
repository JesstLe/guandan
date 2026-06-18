import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'

type StatusCounts = Record<'pass' | 'fail' | 'unknown' | 'not_applicable', number>
type ComparableNumber = number | '[NEED_EXPERIMENT]'

interface MetricsFile {
  hardFailureCount?: number
  labelStatusCounts?: Record<string, StatusCounts>
}

export interface AblationVariantInput {
  variantId: string
  title: string
  removedComponent: string
  targetLabel: string
  metricsPath?: string
}

export interface AblationSummaryInput {
  fullVerifierMetricsPath?: string
  variants: AblationVariantInput[]
}

export interface AblationSummaryRow {
  variantId: string
  title: string
  status: 'metrics_available' | 'missing_metrics'
  removedComponent: string
  targetLabel: string
  metricsPath: string | null
  hardFailures: ComparableNumber
  hardFailureDeltaVsFull: ComparableNumber
  targetFailureBurden: ComparableNumber
  targetBurdenDeltaVsFull: ComparableNumber
  reasonActionFailureBurden: ComparableNumber
  reasonActionBurdenDeltaVsFull: ComparableNumber
}

export interface AblationSummary {
  schemaVersion: '0.1.0'
  status: 'metrics_available' | 'missing_metrics'
  fullVerifierMetricsPath: string | null
  rows: AblationSummaryRow[]
  notes: string
}

export interface WriteAblationSummaryOptions {
  outputDir: string
  input: AblationSummaryInput
}

export interface WriteAblationSummaryResult {
  jsonPath: string
  markdownPath: string
  summary: AblationSummary
}

export function summarizeAblations(input: AblationSummaryInput): AblationSummary {
  const fullMetrics = input.fullVerifierMetricsPath && existsSync(input.fullVerifierMetricsPath)
    ? readJson<MetricsFile>(input.fullVerifierMetricsPath)
    : null
  const rows = input.variants.map(variant => summarizeVariant(fullMetrics, variant))
  const status = fullMetrics !== null && rows.every(row => row.status === 'metrics_available')
    ? 'metrics_available'
    : 'missing_metrics'

  return {
    schemaVersion: '0.1.0',
    status,
    fullVerifierMetricsPath: input.fullVerifierMetricsPath ?? null,
    rows,
    notes: status === 'metrics_available'
      ? 'Deltas are variant minus full verifier; positive burden deltas indicate worse verifier-visible reliability.'
      : 'Ablation metrics are missing; this file is a readiness artifact, not an experimental result.',
  }
}

export function writeAblationSummary(options: WriteAblationSummaryOptions): WriteAblationSummaryResult {
  mkdirSync(options.outputDir, { recursive: true })
  const summary = summarizeAblations(options.input)
  const jsonPath = join(options.outputDir, 'ablation-summary.json')
  const markdownPath = join(options.outputDir, 'ablation-summary.md')

  writeJson(jsonPath, summary)
  writeFileSync(markdownPath, renderAblationSummaryMarkdown(summary), 'utf8')

  return { jsonPath, markdownPath, summary }
}

export function renderAblationSummaryMarkdown(summary: AblationSummary): string {
  const lines = [
    '# Verifier Ablation Summary',
    '',
    `Status: \`${summary.status}\``,
    '',
    'Rows marked `[NEED_EXPERIMENT]` are not experimental results.',
    '',
    '| Variant | Status | Removed Component | Target Label | Hard Failures | Hard Delta | Target Burden | Target Delta | Reason-Action Burden | Reason-Action Delta |',
    '| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...summary.rows.map(row => [
      row.title,
      row.status,
      row.removedComponent,
      row.targetLabel,
      String(row.hardFailures),
      String(row.hardFailureDeltaVsFull),
      String(row.targetFailureBurden),
      String(row.targetBurdenDeltaVsFull),
      String(row.reasonActionFailureBurden),
      String(row.reasonActionBurdenDeltaVsFull),
    ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
    '',
    `Notes: ${summary.notes}`,
    '',
  ]

  return lines.join('\n')
}

function summarizeVariant(
  fullMetrics: MetricsFile | null,
  variant: AblationVariantInput,
): AblationSummaryRow {
  if (fullMetrics === null || !variant.metricsPath || !existsSync(variant.metricsPath)) {
    return {
      variantId: variant.variantId,
      title: variant.title,
      status: 'missing_metrics',
      removedComponent: variant.removedComponent,
      targetLabel: variant.targetLabel,
      metricsPath: variant.metricsPath ?? null,
      hardFailures: '[NEED_EXPERIMENT]',
      hardFailureDeltaVsFull: '[NEED_EXPERIMENT]',
      targetFailureBurden: '[NEED_EXPERIMENT]',
      targetBurdenDeltaVsFull: '[NEED_EXPERIMENT]',
      reasonActionFailureBurden: '[NEED_EXPERIMENT]',
      reasonActionBurdenDeltaVsFull: '[NEED_EXPERIMENT]',
    }
  }

  const variantMetrics = readJson<MetricsFile>(variant.metricsPath)
  const fullTargetBurden = failureBurdenForLabel(fullMetrics, variant.targetLabel)
  const variantTargetBurden = failureBurdenForLabel(variantMetrics, variant.targetLabel)
  const fullReasonActionBurden = failureBurdenForLabel(fullMetrics, 'reasonActionConsistent')
  const variantReasonActionBurden = failureBurdenForLabel(variantMetrics, 'reasonActionConsistent')

  return {
    variantId: variant.variantId,
    title: variant.title,
    status: 'metrics_available',
    removedComponent: variant.removedComponent,
    targetLabel: variant.targetLabel,
    metricsPath: variant.metricsPath,
    hardFailures: variantMetrics.hardFailureCount ?? '[NEED_EXPERIMENT]',
    hardFailureDeltaVsFull: numericDelta(fullMetrics.hardFailureCount, variantMetrics.hardFailureCount),
    targetFailureBurden: variantTargetBurden,
    targetBurdenDeltaVsFull: comparableDelta(fullTargetBurden, variantTargetBurden),
    reasonActionFailureBurden: variantReasonActionBurden,
    reasonActionBurdenDeltaVsFull: comparableDelta(fullReasonActionBurden, variantReasonActionBurden),
  }
}

function failureBurdenForLabel(metrics: MetricsFile, label: string): ComparableNumber {
  const counts = metrics.labelStatusCounts?.[label]
  if (!counts) return '[NEED_EXPERIMENT]'
  return counts.fail + counts.unknown
}

function numericDelta(before: number | undefined, after: number | undefined): ComparableNumber {
  if (before === undefined || after === undefined) return '[NEED_EXPERIMENT]'
  return after - before
}

function comparableDelta(before: ComparableNumber, after: ComparableNumber): ComparableNumber {
  if (typeof before !== 'number' || typeof after !== 'number') return '[NEED_EXPERIMENT]'
  return after - before
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|')
}
