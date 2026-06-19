import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'

interface MetricsSummaryFile {
  rows: MetricsRow[]
}

interface MetricsRow {
  agentId: string
  status: string
  parsedTraces: number | null
  totalDecisionPoints: number | null
  hardFailures: number | null
  legalAction: string
  hiddenInfoDisciplined: string
  reasonActionConsistent: string
  teamObjectiveValid: string
}

interface RevisionComparisonFile {
  status: string
  rows: RevisionRow[]
}

interface RevisionRow {
  label: string
  beforeFailureBurden: number | string
  afterFailureBurden: number | string
  burdenDelta: number | string
}

interface AblationSummaryFile {
  status: string
  analysisMode?: string
  pairedDecisionCount?: number | null
  fullObservedBurdenDelta?: number | string
  rows: AblationRow[]
}

interface AblationRow {
  title: string
  status: string
  removedComponent: string
  targetFailureBurden: number | string
  targetBurdenDeltaVsFull: number | string
  reasonActionBurdenDeltaVsFull: number | string
  targetBeforeBurden?: number | string
  targetAfterBurden?: number | string
  residualBurdenDeltaWithoutTarget?: number | string
  shareOfObservedReduction?: number | string
}

interface HumanAuditAgreementFile {
  status: 'pending' | 'partial' | 'completed'
  sampleCount: number
  completedRows: number
  fullyCompletedRows: number
  completedLabels: number
  totalLabels: number
  remainingLabels?: number
  readyForPaperEvidence?: boolean
  macroAgreement: number | null
  labels: Array<{
    label: string
    verifierLabel: string
    completed: number
    matched: number
    agreement: number | null
  }>
}

interface HumanAuditPacketQualityFile {
  status: 'packet_ready' | 'needs_attention'
  sampleCount: number
  readyForAnnotation: boolean
  readyForPaperEvidence: boolean
  checks: Array<{ id: string; status: 'pass' | 'fail'; detail: string }>
  warnings?: string[]
}

export interface PaperTableArtifactOptions {
  metricsSummaryPath: string
  revisionComparisonPath: string
  ablationSummaryPath: string
  humanAuditAgreementPath: string
  humanAuditPacketQualityPath?: string
  outputDir: string
}

export interface PaperTableArtifactResult {
  tableZeroPath: string
  tableOnePath: string
  tableTwoPath: string
  tableThreePath: string
  tableFourPath: string
}

export function writePaperTableArtifacts(options: PaperTableArtifactOptions): PaperTableArtifactResult {
  mkdirSync(options.outputDir, { recursive: true })
  const metrics = readJson<MetricsSummaryFile>(options.metricsSummaryPath)
  const revision = readJson<RevisionComparisonFile>(options.revisionComparisonPath)
  const ablation = readJson<AblationSummaryFile>(options.ablationSummaryPath)
  const humanAudit = readJson<HumanAuditAgreementFile>(options.humanAuditAgreementPath)
  const humanAuditPacketQuality = options.humanAuditPacketQualityPath
    ? readJson<HumanAuditPacketQualityFile>(options.humanAuditPacketQualityPath)
    : null

  const tableZeroPath = join(options.outputDir, 'table-0-related-work-positioning.md')
  const tableOnePath = join(options.outputDir, 'table-1-reasoning-reliability.md')
  const tableTwoPath = join(options.outputDir, 'table-2-verifier-revision-effect.md')
  const tableThreePath = join(options.outputDir, 'table-3-verifier-ablation.md')
  const tableFourPath = join(options.outputDir, 'table-4-human-audit-agreement.md')
  writeFileSync(tableZeroPath, renderRelatedWorkPositioningTable(), 'utf8')
  writeFileSync(tableOnePath, renderReasoningReliabilityTable(metrics), 'utf8')
  writeFileSync(tableTwoPath, renderRevisionEffectTable(revision), 'utf8')
  writeFileSync(tableThreePath, renderAblationTable(ablation), 'utf8')
  writeFileSync(tableFourPath, renderHumanAuditAgreementTable(humanAudit, humanAuditPacketQuality), 'utf8')

  return { tableZeroPath, tableOnePath, tableTwoPath, tableThreePath, tableFourPath }
}

export function renderRelatedWorkPositioningTable(): string {
  const rows = [
    ['LLM-Coordination', 'coordination games', 'varies', 'coordination/ToM reasoning', 'LLM verification + scores', 'no'],
    ['Hanabi LLM agents', 'fully cooperative Hanabi', 'game-defined clues', 'reasoning traces + utilities', 'game scoring + annotations', 'game-specific'],
    ['M3-BENCH', 'mixed-motive games', 'mixed', 'BTA/RPA/CCA processes', 'process metrics', 'no Guandan-style verifier'],
    ['ToM-Guandan', 'Guandan', 'zero explicit communication', 'ToM planning + performance', 'action recommender + scores', 'yes'],
    ['OpenGuanDan', 'Guandan benchmark', 'agent API', 'agent performance', 'simulator metrics', 'yes'],
    ['Strat-Reasoner', 'multi-agent games', 'game interaction', 'reasoning trace + action', 'RL reward + CoT comparison', 'not Guandan-specific'],
    ['ToolPoker', 'poker', 'opponent modeling', 'reasoning traces', 'solver / reasoning metrics', 'poker actions'],
    ['This project', 'Guandan decision points', 'zero explicit communication', 'structured LLM trace labels', 'rule-grounded verifier', 'yes'],
  ]

  const lines = [
    '# Table 0: Related-Work Positioning',
    '',
    'This table is a paper-ready compact version of `notes/related_work_comparison.md`.',
    '',
    '| Work | Setting | Communication | Reasoning Signal | Verifier / Metric Grounding | Dynamic Legal Actions |',
    '| --- | --- | --- | --- | --- | --- |',
    ...rows.map(row => `| ${row.map(escapeMarkdownCell).join(' | ')} |`),
    '',
  ]

  return lines.join('\n')
}

export function renderReasoningReliabilityTable(metrics: MetricsSummaryFile): string {
  const lines = [
    '# Table 1: Reasoning Reliability',
    '',
    'Rows with `missing_raw_outputs` are not model results; rows with `partial_metrics_available` are exploratory partial evidence and must not be reported as final full-split results.',
    '',
    '| Agent | Status | Parsed | Hard Failures | Legal P/F/U | Hidden P/F/U | Reason-Action P/F/U | Objective P/F/U |',
    '| --- | --- | ---: | ---: | --- | --- | --- | --- |',
    ...metrics.rows.map(row => [
      row.agentId,
      row.status,
      formatParsed(row),
      formatNullable(row.hardFailures),
      compactStatus(row.legalAction),
      compactStatus(row.hiddenInfoDisciplined),
      compactStatus(row.reasonActionConsistent),
      compactStatus(row.teamObjectiveValid),
    ].map(escapeMarkdownCell).join(' | ')).map(line => `| ${line} |`),
    '',
  ]

  return lines.join('\n')
}

export function renderRevisionEffectTable(revision: RevisionComparisonFile): string {
  const lines = [
    '# Table 2: Verifier-Revision Effect',
    '',
    `Status: \`${revision.status}\``,
    '',
    'Failure burden is `fail + unknown`. Rows marked `[NEED_EXPERIMENT]` are not model results.',
    '',
    '| Label | Before Burden | After Burden | Delta |',
    '| --- | ---: | ---: | ---: |',
    ...revision.rows.map(row => [
      row.label,
      String(row.beforeFailureBurden),
      String(row.afterFailureBurden),
      String(row.burdenDelta),
    ].map(escapeMarkdownCell).join(' | ')).map(line => `| ${line} |`),
    '',
  ]

  return lines.join('\n')
}

export function renderAblationTable(ablation: AblationSummaryFile): string {
  const postHoc = ablation.analysisMode === 'post_hoc_label_ablation'
  const lines = [
    '# Table 3: Verifier Label Ablation',
    '',
    `Status: \`${ablation.status}\``,
    ablation.analysisMode ? `Analysis mode: \`${ablation.analysisMode}\`` : '',
    ablation.pairedDecisionCount === undefined || ablation.pairedDecisionCount === null
      ? ''
      : `Paired decisions: ${ablation.pairedDecisionCount}`,
    '',
    postHoc
      ? 'Rows remove one label group from paired label-burden accounting over existing before/after traces; this is not a rerun with modified feedback prompts.'
      : 'Rows marked `[NEED_EXPERIMENT]` are not model results.',
    '',
    '| Variant | Status | Removed Component | Target Before | Target After | Target Delta | Residual Delta Without Target | Share of Observed Reduction |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |',
    ...ablation.rows.map(row => [
      row.title,
      row.status,
      row.removedComponent,
      String(row.targetBeforeBurden ?? '[NEED_EXPERIMENT]'),
      String(row.targetAfterBurden ?? row.targetFailureBurden),
      String(row.targetBurdenDeltaVsFull),
      String(row.residualBurdenDeltaWithoutTarget ?? '[NEED_EXPERIMENT]'),
      formatAblationShare(row.shareOfObservedReduction),
    ].map(escapeMarkdownCell).join(' | ')).map(line => `| ${line} |`),
    '',
  ]

  return lines.join('\n')
}

function formatAblationShare(value: number | string | undefined): string {
  if (typeof value === 'number') return `${Math.round(value * 100)}%`
  return String(value ?? '[NEED_EXPERIMENT]')
}

export function renderHumanAuditAgreementTable(humanAudit: HumanAuditAgreementFile, packetQuality: HumanAuditPacketQualityFile | null = null): string {
  const remainingLabels = humanAudit.remainingLabels ?? Math.max(0, humanAudit.totalLabels - humanAudit.completedLabels)
  const readyForPaperEvidence = humanAudit.readyForPaperEvidence === true
  const failedPacketChecks = packetQuality?.checks.filter(check => check.status === 'fail').length ?? null
  const lines = [
    '# Table 4: Human Soft-Label Audit Readiness',
    '',
    `Agreement status: \`${humanAudit.status}\``,
    packetQuality ? `Packet status: \`${packetQuality.status}\`` : 'Packet status: `missing`',
    '',
    readyForPaperEvidence
      ? 'This table can be reported as human agreement with verifier soft-label decisions.'
      : 'This table is a readiness artifact only; do not report it as human-audit evidence until agreement status is `completed`.',
    '',
    '| Packet Check | Value |',
    '| --- | ---: |',
    packetQuality
      ? `| Blind samples | ${packetQuality.sampleCount} |`
      : '| Blind samples | missing |',
    packetQuality
      ? `| Failed packet checks | ${failedPacketChecks} |`
      : '| Failed packet checks | missing |',
    packetQuality
      ? `| Ready for annotation | ${packetQuality.readyForAnnotation ? 'yes' : 'no'} |`
      : '| Ready for annotation | no |',
    packetQuality
      ? `| Packet ready for paper evidence | ${packetQuality.readyForPaperEvidence ? 'yes' : 'no'} |`
      : '| Packet ready for paper evidence | no |',
    '',
    '| Label | Completed | Matched | Agreement |',
    '| --- | ---: | ---: | ---: |',
    ...humanAudit.labels.map(row => [
      row.label,
      String(row.completed),
      String(row.matched),
      formatAgreement(row.agreement),
    ].map(escapeMarkdownCell).join(' | ')).map(line => `| ${line} |`),
    '',
    '| Summary | Value |',
    '| --- | ---: |',
    `| Samples | ${humanAudit.sampleCount} |`,
    `| Completed rows | ${humanAudit.completedRows} |`,
    `| Fully completed rows | ${humanAudit.fullyCompletedRows} |`,
    `| Completed labels | ${humanAudit.completedLabels} / ${humanAudit.totalLabels} |`,
    `| Remaining labels | ${remainingLabels} |`,
    `| Ready for paper evidence | ${readyForPaperEvidence ? 'yes' : 'no'} |`,
    `| Macro agreement | ${formatAgreement(humanAudit.macroAgreement)} |`,
    '',
  ]

  return lines.join('\n')
}

function compactStatus(value: string): string {
  if (value.includes('[NEED_EXPERIMENT]')) return '[NEED_EXPERIMENT]'
  const match = value.match(/(\d+) pass \/ (\d+) fail \/ (\d+) unknown/)
  if (!match) return value
  return `${match[1]}/${match[2]}/${match[3]}`
}

function formatParsed(row: MetricsRow): string {
  if (row.parsedTraces === null || row.totalDecisionPoints === null) return '[NEED_EXPERIMENT]'
  return `${row.parsedTraces} / ${row.totalDecisionPoints}`
}

function formatNullable(value: number | null): string {
  return value === null ? '[NEED_EXPERIMENT]' : String(value)
}

function formatAgreement(value: number | null): string {
  if (value === null) return 'n/a'
  return `${Math.round(value * 1000) / 10}%`
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
