import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import type {
  LLMReasoningTrace,
  VerifierLabelStatus,
  VerifierResult,
} from '@guandan/shared'
import { verifierLabelNames } from './verifierMetrics'

type LabelName = typeof verifierLabelNames[number]
type CaseType = 'public_history_repaired' | 'hidden_info_repaired' | 'remaining_hard_failure' | 'parse_failure_outside_revision'

interface PostProviderReport {
  ingest?: {
    failures?: ParseFailure[]
  }
}

interface ParseFailure {
  decisionId: string
  rawOutputFile: string
  message: string
}

interface PairedDecision {
  decisionId: string
  beforeResult: VerifierResult
  afterResult: VerifierResult
  beforeTrace?: LLMReasoningTrace
  afterTrace?: LLMReasoningTrace
}

export interface VerifierAttributionInput {
  beforeAgentId: string
  afterAgentId: string
  beforeResultsDir: string
  afterResultsDir: string
  beforeTracesDir?: string
  afterTracesDir?: string
  parseFailureReportPath?: string
  bootstrapIterations?: number
  bootstrapSeed?: number
}

export interface LabelAttributionRow {
  label: LabelName
  beforePass: number
  afterPass: number
  beforeFail: number
  afterFail: number
  beforeUnknown: number
  afterUnknown: number
  beforeFailureBurden: number
  afterFailureBurden: number
  burdenDelta: number
  burdenDeltaBootstrap95Ci: [number, number]
  mcnemar: {
    beforeOnly: number
    afterOnly: number
    both: number
    neither: number
    exactPValue: number | null
  }
}

export interface HardFailureAttribution {
  beforeHardFailureCount: number
  afterHardFailureCount: number
  hardFailureDelta: number
  beforeDecisionsWithHardFailure: number
  afterDecisionsWithHardFailure: number
  decisionLevelDelta: number
  hardFailureDeltaBootstrap95Ci: [number, number]
  decisionLevelMcnemar: {
    beforeOnly: number
    afterOnly: number
    both: number
    neither: number
    exactPValue: number | null
  }
}

export interface HardComponentAttributionRow {
  label: LabelName
  beforeFail: number
  afterFail: number
  failDelta: number
  shareOfHardFailureDrop: number | null
}

export interface QualitativeCase {
  caseType: CaseType
  decisionId: string
  beforeSelectedActionId: string | null
  afterSelectedActionId: string | null
  actionChanged: boolean | null
  primaryReasonChanged: boolean | null
  labelStatuses: Partial<Record<LabelName, { before: VerifierLabelStatus | null; after: VerifierLabelStatus | null }>>
  beforeIssues: string[]
  afterIssues: string[]
  beforeEvidence: string[]
  afterEvidence: string[]
  parseFailureMessage?: string
  rawOutputFile?: string
}

export interface VerifierAttributionReport {
  schemaVersion: '0.1.0'
  status: 'metrics_available' | 'missing_pairs'
  beforeAgentId: string
  afterAgentId: string
  pairedDecisionCount: number
  excludedParseFailureCount: number
  bootstrapIterations: number
  bootstrapSeed: number
  hardFailureAttribution: HardFailureAttribution | null
  labelRows: LabelAttributionRow[]
  hardComponentRows: HardComponentAttributionRow[]
  qualitativeCases: QualitativeCase[]
  notes: string
}

export interface WriteVerifierAttributionOptions {
  outputDir: string
  input: VerifierAttributionInput
}

export interface WriteVerifierAttributionResult {
  jsonPath: string
  markdownPath: string
  report: VerifierAttributionReport
}

const HARD_COMPONENT_LABELS = [
  'legalAction',
  'beatsTable',
  'publicHistoryConsistent',
  'hiddenInfoDisciplined',
] as const satisfies readonly LabelName[]

export function buildVerifierAttributionReport(input: VerifierAttributionInput): VerifierAttributionReport {
  const bootstrapIterations = input.bootstrapIterations ?? 2000
  const bootstrapSeed = input.bootstrapSeed ?? 1729
  const pairs = readPairs(input)
  const parseFailures = readParseFailures(input.parseFailureReportPath)

  if (pairs.length === 0) {
    return {
      schemaVersion: '0.1.0',
      status: 'missing_pairs',
      beforeAgentId: input.beforeAgentId,
      afterAgentId: input.afterAgentId,
      pairedDecisionCount: 0,
      excludedParseFailureCount: parseFailures.length,
      bootstrapIterations,
      bootstrapSeed,
      hardFailureAttribution: null,
      labelRows: [],
      hardComponentRows: [],
      qualitativeCases: parseFailureCaseOnly(parseFailures),
      notes: 'No paired verifier-result files were found; this is not an experimental result.',
    }
  }

  const hardFailureAttribution = summarizeHardFailures(pairs, bootstrapIterations, bootstrapSeed)
  const labelRows = verifierLabelNames.map((label, index) => summarizeLabel(
    pairs,
    label,
    bootstrapIterations,
    bootstrapSeed + index + 1,
  ))
  const hardComponentRows = summarizeHardComponents(pairs, hardFailureAttribution.hardFailureDelta)

  return {
    schemaVersion: '0.1.0',
    status: 'metrics_available',
    beforeAgentId: input.beforeAgentId,
    afterAgentId: input.afterAgentId,
    pairedDecisionCount: pairs.length,
    excludedParseFailureCount: parseFailures.length,
    bootstrapIterations,
    bootstrapSeed,
    hardFailureAttribution,
    labelRows,
    hardComponentRows,
    qualitativeCases: selectQualitativeCases(pairs, parseFailures),
    notes: 'All deltas are after minus before on paired decision ids. Failure burden is fail + unknown. Bootstrap CIs resample paired decisions with replacement and are descriptive pilot uncertainty estimates.',
  }
}

export function writeVerifierAttribution(options: WriteVerifierAttributionOptions): WriteVerifierAttributionResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = buildVerifierAttributionReport(options.input)
  const jsonPath = join(options.outputDir, 'verifier-attribution.json')
  const markdownPath = join(options.outputDir, 'verifier-attribution.md')

  writeJson(jsonPath, report)
  writeFileSync(markdownPath, renderVerifierAttributionMarkdown(report), 'utf8')

  return { jsonPath, markdownPath, report }
}

export function renderVerifierAttributionMarkdown(report: VerifierAttributionReport): string {
  const lines = [
    '# Paired Verifier Attribution',
    '',
    `Status: \`${report.status}\``,
    '',
    `Before: \`${report.beforeAgentId}\``,
    '',
    `After: \`${report.afterAgentId}\``,
    '',
    `Paired decisions: ${report.pairedDecisionCount}`,
    '',
    `Excluded parse failures outside revision subset: ${report.excludedParseFailureCount}`,
    '',
  ]

  if (report.hardFailureAttribution) {
    const hard = report.hardFailureAttribution
    lines.push(
      '## Hard-Failure Attribution',
      '',
      `Hard failures: ${hard.beforeHardFailureCount} -> ${hard.afterHardFailureCount} (${formatDelta(hard.hardFailureDelta)})`,
      '',
      `Decision-level hard failures: ${hard.beforeDecisionsWithHardFailure} -> ${hard.afterDecisionsWithHardFailure} (${formatDelta(hard.decisionLevelDelta)})`,
      '',
      `Bootstrap 95% CI for hard-failure-count delta: [${hard.hardFailureDeltaBootstrap95Ci[0]}, ${hard.hardFailureDeltaBootstrap95Ci[1]}]`,
      '',
      `Decision-level McNemar exact p-value: ${formatPValue(hard.decisionLevelMcnemar.exactPValue)}`,
      '',
    )
  }

  lines.push(
    '## Label Burden Deltas',
    '',
    '| Label | Before Burden | After Burden | Delta | 95% CI | McNemar before-only/after-only | p |',
    '| --- | ---: | ---: | ---: | --- | --- | ---: |',
    ...report.labelRows.map(row => [
      row.label,
      String(row.beforeFailureBurden),
      String(row.afterFailureBurden),
      formatDelta(row.burdenDelta),
      `[${row.burdenDeltaBootstrap95Ci[0]}, ${row.burdenDeltaBootstrap95Ci[1]}]`,
      `${row.mcnemar.beforeOnly}/${row.mcnemar.afterOnly}`,
      formatPValue(row.mcnemar.exactPValue),
    ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
    '',
    '## Hard-Component Attribution',
    '',
    '| Component Label | Before Fail | After Fail | Fail Delta | Share of Hard-Failure Drop |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...report.hardComponentRows.map(row => [
      row.label,
      String(row.beforeFail),
      String(row.afterFail),
      formatDelta(row.failDelta),
      row.shareOfHardFailureDrop === null ? 'n/a' : `${Math.round(row.shareOfHardFailureDrop * 100)}%`,
    ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
    '',
    '## Qualitative Case Pack',
    '',
    '| Case | Decision | Action Changed | Primary Reason Changed | Key Statuses | Issues |',
    '| --- | --- | --- | --- | --- | --- |',
    ...report.qualitativeCases.map(renderCaseRow),
    '',
    `Notes: ${report.notes}`,
    '',
  )

  return lines.join('\n')
}

function readPairs(input: VerifierAttributionInput): PairedDecision[] {
  const beforeFiles = resultFileMap(input.beforeResultsDir)
  const afterFiles = resultFileMap(input.afterResultsDir)
  return [...beforeFiles.keys()]
    .filter(decisionId => afterFiles.has(decisionId))
    .sort()
    .map(decisionId => ({
      decisionId,
      beforeResult: readJson<VerifierResult>(beforeFiles.get(decisionId)!),
      afterResult: readJson<VerifierResult>(afterFiles.get(decisionId)!),
      beforeTrace: readOptionalJson<LLMReasoningTrace>(input.beforeTracesDir, decisionId),
      afterTrace: readOptionalJson<LLMReasoningTrace>(input.afterTracesDir, decisionId),
    }))
}

function resultFileMap(dir: string): Map<string, string> {
  if (!existsSync(dir)) return new Map()
  return new Map(readdirSync(dir)
    .filter(filename => filename.endsWith('.json'))
    .sort()
    .map(filename => {
      const path = join(dir, filename)
      const result = readJson<VerifierResult>(path)
      return [result.decisionId, path]
    }))
}

function summarizeHardFailures(
  pairs: PairedDecision[],
  bootstrapIterations: number,
  bootstrapSeed: number,
): HardFailureAttribution {
  const beforeHardCounts = pairs.map(pair => pair.beforeResult.hardFailures.length)
  const afterHardCounts = pairs.map(pair => pair.afterResult.hardFailures.length)
  const beforePresence = beforeHardCounts.map(count => count > 0)
  const afterPresence = afterHardCounts.map(count => count > 0)
  const mcnemar = mcnemarCounts(beforePresence, afterPresence)

  return {
    beforeHardFailureCount: sum(beforeHardCounts),
    afterHardFailureCount: sum(afterHardCounts),
    hardFailureDelta: sum(afterHardCounts) - sum(beforeHardCounts),
    beforeDecisionsWithHardFailure: beforePresence.filter(Boolean).length,
    afterDecisionsWithHardFailure: afterPresence.filter(Boolean).length,
    decisionLevelDelta: afterPresence.filter(Boolean).length - beforePresence.filter(Boolean).length,
    hardFailureDeltaBootstrap95Ci: bootstrapDeltaCi(beforeHardCounts, afterHardCounts, bootstrapIterations, bootstrapSeed),
    decisionLevelMcnemar: mcnemar,
  }
}

function summarizeLabel(
  pairs: PairedDecision[],
  label: LabelName,
  bootstrapIterations: number,
  bootstrapSeed: number,
): LabelAttributionRow {
  const beforeStatuses = pairs.map(pair => pair.beforeResult.labels[label].status)
  const afterStatuses = pairs.map(pair => pair.afterResult.labels[label].status)
  const beforeBurden = beforeStatuses.map(isFailureBurden)
  const afterBurden = afterStatuses.map(isFailureBurden)
  const mcnemar = mcnemarCounts(
    beforeBurden.map(Boolean),
    afterBurden.map(Boolean),
  )

  return {
    label,
    beforePass: countStatus(beforeStatuses, 'pass'),
    afterPass: countStatus(afterStatuses, 'pass'),
    beforeFail: countStatus(beforeStatuses, 'fail'),
    afterFail: countStatus(afterStatuses, 'fail'),
    beforeUnknown: countStatus(beforeStatuses, 'unknown'),
    afterUnknown: countStatus(afterStatuses, 'unknown'),
    beforeFailureBurden: sum(beforeBurden),
    afterFailureBurden: sum(afterBurden),
    burdenDelta: sum(afterBurden) - sum(beforeBurden),
    burdenDeltaBootstrap95Ci: bootstrapDeltaCi(beforeBurden, afterBurden, bootstrapIterations, bootstrapSeed),
    mcnemar,
  }
}

function summarizeHardComponents(
  pairs: PairedDecision[],
  hardFailureDelta: number,
): HardComponentAttributionRow[] {
  const drop = hardFailureDelta < 0 ? -hardFailureDelta : 0
  return HARD_COMPONENT_LABELS.map(label => {
    const beforeFail = pairs.filter(pair => pair.beforeResult.labels[label].status === 'fail').length
    const afterFail = pairs.filter(pair => pair.afterResult.labels[label].status === 'fail').length
    const failDelta = afterFail - beforeFail
    return {
      label,
      beforeFail,
      afterFail,
      failDelta,
      shareOfHardFailureDrop: drop > 0 && failDelta < 0 ? -failDelta / drop : null,
    }
  })
}

function selectQualitativeCases(pairs: PairedDecision[], parseFailures: ParseFailure[]): QualitativeCase[] {
  const cases: QualitativeCase[] = []
  const addPairCase = (caseType: CaseType, predicate: (pair: PairedDecision) => boolean) => {
    const pair = pairs.find(candidate => predicate(candidate))
    if (pair) cases.push(pairCase(caseType, pair))
  }

  addPairCase('public_history_repaired', pair =>
    pair.beforeResult.labels.publicHistoryConsistent.status === 'fail'
    && pair.afterResult.labels.publicHistoryConsistent.status === 'pass')
  addPairCase('hidden_info_repaired', pair =>
    pair.beforeResult.labels.hiddenInfoDisciplined.status === 'fail'
    && pair.afterResult.labels.hiddenInfoDisciplined.status === 'pass')
  addPairCase('remaining_hard_failure', pair => pair.afterResult.hardFailures.length > 0)

  const pairedIds = new Set(pairs.map(pair => pair.decisionId))
  const parseFailure = parseFailures.find(failure => !pairedIds.has(failure.decisionId)) ?? parseFailures[0]
  if (parseFailure) cases.push(parseFailureCase(parseFailure))

  return cases
}

function pairCase(caseType: CaseType, pair: PairedDecision): QualitativeCase {
  return {
    caseType,
    decisionId: pair.decisionId,
    beforeSelectedActionId: pair.beforeTrace?.selectedActionId ?? pair.beforeResult.selectedActionId ?? null,
    afterSelectedActionId: pair.afterTrace?.selectedActionId ?? pair.afterResult.selectedActionId ?? null,
    actionChanged: pair.beforeTrace && pair.afterTrace
      ? pair.beforeTrace.selectedActionId !== pair.afterTrace.selectedActionId
      : null,
    primaryReasonChanged: pair.beforeTrace && pair.afterTrace
      ? pair.beforeTrace.actionRationale.primaryReason !== pair.afterTrace.actionRationale.primaryReason
      : null,
    labelStatuses: Object.fromEntries(verifierLabelNames.map(label => [
      label,
      {
        before: pair.beforeResult.labels[label].status,
        after: pair.afterResult.labels[label].status,
      },
    ])),
    beforeIssues: issueCodes(pair.beforeResult),
    afterIssues: issueCodes(pair.afterResult),
    beforeEvidence: compactEvidence(pair.beforeResult),
    afterEvidence: compactEvidence(pair.afterResult),
  }
}

function parseFailureCase(failure: ParseFailure): QualitativeCase {
  return {
    caseType: 'parse_failure_outside_revision',
    decisionId: failure.decisionId,
    beforeSelectedActionId: null,
    afterSelectedActionId: null,
    actionChanged: null,
    primaryReasonChanged: null,
    labelStatuses: {},
    beforeIssues: [],
    afterIssues: [],
    beforeEvidence: [],
    afterEvidence: [],
    parseFailureMessage: failure.message,
    rawOutputFile: failure.rawOutputFile,
  }
}

function parseFailureCaseOnly(parseFailures: ParseFailure[]): QualitativeCase[] {
  return parseFailures[0] ? [parseFailureCase(parseFailures[0])] : []
}

function readParseFailures(path: string | undefined): ParseFailure[] {
  if (!path || !existsSync(path)) return []
  return readJson<PostProviderReport>(path).ingest?.failures ?? []
}

function mcnemarCounts(before: boolean[], after: boolean[]) {
  let beforeOnly = 0
  let afterOnly = 0
  let both = 0
  let neither = 0
  for (let i = 0; i < before.length; i++) {
    if (before[i] && after[i]) both++
    else if (before[i]) beforeOnly++
    else if (after[i]) afterOnly++
    else neither++
  }

  return {
    beforeOnly,
    afterOnly,
    both,
    neither,
    exactPValue: exactMcNemarPValue(beforeOnly, afterOnly),
  }
}

function exactMcNemarPValue(beforeOnly: number, afterOnly: number): number | null {
  const discordant = beforeOnly + afterOnly
  if (discordant === 0) return null
  const smaller = Math.min(beforeOnly, afterOnly)
  let cumulative = 0
  for (let i = 0; i <= smaller; i++) {
    cumulative += binomialCoefficient(discordant, i) * (0.5 ** discordant)
  }
  return Math.min(1, 2 * cumulative)
}

function binomialCoefficient(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  const effectiveK = Math.min(k, n - k)
  let result = 1
  for (let i = 1; i <= effectiveK; i++) {
    result = (result * (n - effectiveK + i)) / i
  }
  return result
}

function bootstrapDeltaCi(
  beforeValues: number[],
  afterValues: number[],
  iterations: number,
  seed: number,
): [number, number] {
  if (beforeValues.length === 0 || afterValues.length !== beforeValues.length) return [0, 0]
  const deltas = beforeValues.map((before, index) => afterValues[index] - before)
  const random = mulberry32(seed)
  const samples: number[] = []

  for (let i = 0; i < iterations; i++) {
    let total = 0
    for (let j = 0; j < deltas.length; j++) {
      total += deltas[Math.floor(random() * deltas.length)]
    }
    samples.push(total)
  }

  samples.sort((a, b) => a - b)
  return [
    samples[Math.floor(0.025 * (samples.length - 1))],
    samples[Math.floor(0.975 * (samples.length - 1))],
  ]
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state += 0x6D2B79F5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function countStatus(statuses: VerifierLabelStatus[], status: VerifierLabelStatus): number {
  return statuses.filter(value => value === status).length
}

function isFailureBurden(status: VerifierLabelStatus): number {
  return status === 'fail' || status === 'unknown' ? 1 : 0
}

function issueCodes(result: VerifierResult): string[] {
  return [...result.hardFailures, ...result.softWarnings].map(issue => issue.code)
}

function compactEvidence(result: VerifierResult): string[] {
  return verifierLabelNames.flatMap(label => result.labels[label].evidence.slice(0, 1))
}

function renderCaseRow(entry: QualitativeCase): string {
  const statuses = Object.entries(entry.labelStatuses)
    .filter(([, status]) => status.before !== status.after)
    .map(([label, status]) => `${label}: ${status.before}->${status.after}`)
    .join('; ') || 'n/a'
  const issues = [
    entry.beforeIssues.length ? `before ${entry.beforeIssues.join(',')}` : '',
    entry.afterIssues.length ? `after ${entry.afterIssues.join(',')}` : '',
    entry.parseFailureMessage ?? '',
  ].filter(Boolean).join('; ') || 'n/a'

  return `| ${[
    entry.caseType,
    entry.decisionId,
    formatNullableBoolean(entry.actionChanged),
    formatNullableBoolean(entry.primaryReasonChanged),
    statuses,
    issues,
  ].map(escapeMarkdownCell).join(' | ')} |`
}

function formatNullableBoolean(value: boolean | null): string {
  if (value === null) return 'n/a'
  return value ? 'yes' : 'no'
}

function formatDelta(value: number): string {
  return value > 0 ? `+${value}` : String(value)
}

function formatPValue(value: number | null): string {
  if (value === null) return 'n/a'
  if (value < 0.001) return '<0.001'
  return value.toFixed(3)
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

function readOptionalJson<T>(dir: string | undefined, decisionId: string): T | undefined {
  if (!dir) return undefined
  const path = join(dir, `${decisionId}.json`)
  if (!existsSync(path)) return undefined
  return readJson<T>(path)
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
