import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'

type StatusCounts = Record<'pass' | 'fail' | 'unknown' | 'not_applicable', number>
type ComparableNumber = number | '[NEED_EXPERIMENT]' | 'n/a'

interface MetricsFile {
  hardFailureCount?: number
  labelStatusCounts?: Record<string, StatusCounts>
}

interface AttributionLabelRow {
  label: string
  beforeFailureBurden: number
  afterFailureBurden: number
  burdenDelta: number
}

interface VerifierAttributionFile {
  status: string
  pairedDecisionCount?: number
  labelRows?: AttributionLabelRow[]
  hardFailureAttribution?: {
    beforeHardFailureCount: number
    afterHardFailureCount: number
    hardFailureDelta: number
  } | null
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
  attributionPath?: string
  variants: AblationVariantInput[]
}

export interface AblationSummaryRow {
  variantId: string
  title: string
  status: 'metrics_available' | 'missing_metrics'
  removedComponent: string
  targetLabel: string
  metricsPath: string | null
  attributionPath?: string | null
  hardFailures: ComparableNumber
  hardFailureDeltaVsFull: ComparableNumber
  targetBeforeBurden?: ComparableNumber
  targetAfterBurden?: ComparableNumber
  observedBurdenReduction?: ComparableNumber
  residualBurdenDeltaWithoutTarget?: ComparableNumber
  shareOfObservedReduction?: ComparableNumber
  targetFailureBurden: ComparableNumber
  targetBurdenDeltaVsFull: ComparableNumber
  reasonActionFailureBurden: ComparableNumber
  reasonActionBurdenDeltaVsFull: ComparableNumber
}

export interface AblationSummary {
  schemaVersion: '0.1.0'
  status: 'metrics_available' | 'missing_metrics'
  analysisMode: 'post_hoc_label_ablation' | 'variant_metrics' | 'readiness_artifact'
  fullVerifierMetricsPath: string | null
  attributionPath: string | null
  pairedDecisionCount: number | null
  fullObservedBurdenDelta: ComparableNumber
  fullObservedBurdenReduction: ComparableNumber
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
  const attribution = input.attributionPath && existsSync(input.attributionPath)
    ? readJson<VerifierAttributionFile>(input.attributionPath)
    : null
  if (attribution?.status === 'metrics_available' && attribution.labelRows?.length) {
    return summarizePostHocLabelAblations(input, attribution)
  }

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
    analysisMode: status === 'metrics_available' ? 'variant_metrics' : 'readiness_artifact',
    fullVerifierMetricsPath: input.fullVerifierMetricsPath ?? null,
    attributionPath: input.attributionPath ?? null,
    pairedDecisionCount: null,
    fullObservedBurdenDelta: '[NEED_EXPERIMENT]',
    fullObservedBurdenReduction: '[NEED_EXPERIMENT]',
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
    `Analysis mode: \`${summary.analysisMode}\``,
    '',
    summary.pairedDecisionCount === null ? '' : `Paired decisions: ${summary.pairedDecisionCount}`,
    summary.pairedDecisionCount === null ? '' : '',
    typeof summary.fullObservedBurdenDelta === 'number'
      ? `Full paired label-burden delta: ${formatSigned(summary.fullObservedBurdenDelta)}`
      : '',
    typeof summary.fullObservedBurdenDelta === 'number' ? '' : '',
    '',
    summary.analysisMode === 'post_hoc_label_ablation'
      ? 'Rows remove one label group from the paired label-burden accounting. This is a post-hoc diagnostic over existing traces, not a rerun with different feedback prompts.'
      : 'Rows marked `[NEED_EXPERIMENT]` are not experimental results.',
    '',
    '| Variant | Status | Removed Component | Target Label | Target Before | Target After | Target Delta | Residual Delta Without Target | Share of Observed Reduction |',
    '| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |',
    ...summary.rows.map(row => [
      row.title,
      row.status,
      row.removedComponent,
      row.targetLabel,
      String(row.targetBeforeBurden ?? '[NEED_EXPERIMENT]'),
      String(row.targetAfterBurden ?? row.targetFailureBurden),
      String(row.targetBurdenDeltaVsFull),
      String(row.residualBurdenDeltaWithoutTarget ?? '[NEED_EXPERIMENT]'),
      formatShare(row.shareOfObservedReduction),
    ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
    '',
    `Notes: ${summary.notes}`,
    '',
  ]

  return lines.join('\n')
}

function summarizePostHocLabelAblations(
  input: AblationSummaryInput,
  attribution: VerifierAttributionFile,
): AblationSummary {
  const labelRows = attribution.labelRows ?? []
  const fullBurdenDelta = sum(labelRows.map(row => row.burdenDelta))
  const fullBurdenReduction = fullBurdenDelta < 0 ? -fullBurdenDelta : 0
  const rows = input.variants.map(variant => summarizePostHocVariant(
    attribution,
    variant,
    fullBurdenDelta,
    fullBurdenReduction,
    input.attributionPath ?? null,
  ))

  return {
    schemaVersion: '0.1.0',
    status: rows.every(row => row.status === 'metrics_available') ? 'metrics_available' : 'missing_metrics',
    analysisMode: 'post_hoc_label_ablation',
    fullVerifierMetricsPath: input.fullVerifierMetricsPath ?? null,
    attributionPath: input.attributionPath ?? null,
    pairedDecisionCount: attribution.pairedDecisionCount ?? null,
    fullObservedBurdenDelta: fullBurdenDelta,
    fullObservedBurdenReduction: fullBurdenReduction,
    rows,
    notes: 'Post-hoc label ablations remove one verifier label from paired burden accounting over the same before/after traces. They attribute observed verifier-label burden reductions but do not replace a future rerun that removes feedback components from the prompt.',
  }
}

function summarizePostHocVariant(
  attribution: VerifierAttributionFile,
  variant: AblationVariantInput,
  fullBurdenDelta: number,
  fullBurdenReduction: number,
  attributionPath: string | null,
): AblationSummaryRow {
  const target = attribution.labelRows?.find(row => row.label === variant.targetLabel)
  if (!target) {
    return {
      variantId: variant.variantId,
      title: variant.title,
      status: 'missing_metrics',
      removedComponent: variant.removedComponent,
      targetLabel: variant.targetLabel,
      metricsPath: variant.metricsPath ?? null,
      attributionPath,
      hardFailures: '[NEED_EXPERIMENT]',
      hardFailureDeltaVsFull: '[NEED_EXPERIMENT]',
      targetBeforeBurden: '[NEED_EXPERIMENT]',
      targetAfterBurden: '[NEED_EXPERIMENT]',
      observedBurdenReduction: '[NEED_EXPERIMENT]',
      residualBurdenDeltaWithoutTarget: '[NEED_EXPERIMENT]',
      shareOfObservedReduction: '[NEED_EXPERIMENT]',
      targetFailureBurden: '[NEED_EXPERIMENT]',
      targetBurdenDeltaVsFull: '[NEED_EXPERIMENT]',
      reasonActionFailureBurden: '[NEED_EXPERIMENT]',
      reasonActionBurdenDeltaVsFull: '[NEED_EXPERIMENT]',
    }
  }

  const observedReduction = target.burdenDelta < 0 ? -target.burdenDelta : 0
  const reasonAction = attribution.labelRows?.find(row => row.label === 'reasonActionConsistent')
  return {
    variantId: variant.variantId,
    title: variant.title,
    status: 'metrics_available',
    removedComponent: variant.removedComponent,
    targetLabel: variant.targetLabel,
    metricsPath: variant.metricsPath ?? null,
    attributionPath,
    hardFailures: attribution.hardFailureAttribution?.afterHardFailureCount ?? 'n/a',
    hardFailureDeltaVsFull: attribution.hardFailureAttribution?.hardFailureDelta ?? 'n/a',
    targetBeforeBurden: target.beforeFailureBurden,
    targetAfterBurden: target.afterFailureBurden,
    observedBurdenReduction: observedReduction,
    residualBurdenDeltaWithoutTarget: fullBurdenDelta - target.burdenDelta,
    shareOfObservedReduction: fullBurdenReduction > 0 ? observedReduction / fullBurdenReduction : 'n/a',
    targetFailureBurden: target.afterFailureBurden,
    targetBurdenDeltaVsFull: target.burdenDelta,
    reasonActionFailureBurden: reasonAction?.afterFailureBurden ?? '[NEED_EXPERIMENT]',
    reasonActionBurdenDeltaVsFull: variant.targetLabel === 'reasonActionConsistent'
      ? 0
      : reasonAction?.burdenDelta ?? '[NEED_EXPERIMENT]',
  }
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

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

function formatShare(value: ComparableNumber | undefined): string {
  if (typeof value !== 'number') return String(value ?? '[NEED_EXPERIMENT]')
  return `${Math.round(value * 100)}%`
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : String(value)
}
