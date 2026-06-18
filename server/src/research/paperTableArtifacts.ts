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
  rows: AblationRow[]
}

interface AblationRow {
  title: string
  status: string
  removedComponent: string
  targetFailureBurden: number | string
  targetBurdenDeltaVsFull: number | string
  reasonActionBurdenDeltaVsFull: number | string
}

export interface PaperTableArtifactOptions {
  metricsSummaryPath: string
  revisionComparisonPath: string
  ablationSummaryPath: string
  outputDir: string
}

export interface PaperTableArtifactResult {
  tableZeroPath: string
  tableOnePath: string
  tableTwoPath: string
  tableThreePath: string
}

export function writePaperTableArtifacts(options: PaperTableArtifactOptions): PaperTableArtifactResult {
  mkdirSync(options.outputDir, { recursive: true })
  const metrics = readJson<MetricsSummaryFile>(options.metricsSummaryPath)
  const revision = readJson<RevisionComparisonFile>(options.revisionComparisonPath)
  const ablation = readJson<AblationSummaryFile>(options.ablationSummaryPath)

  const tableZeroPath = join(options.outputDir, 'table-0-related-work-positioning.md')
  const tableOnePath = join(options.outputDir, 'table-1-reasoning-reliability.md')
  const tableTwoPath = join(options.outputDir, 'table-2-verifier-revision-effect.md')
  const tableThreePath = join(options.outputDir, 'table-3-verifier-ablation.md')
  writeFileSync(tableZeroPath, renderRelatedWorkPositioningTable(), 'utf8')
  writeFileSync(tableOnePath, renderReasoningReliabilityTable(metrics), 'utf8')
  writeFileSync(tableTwoPath, renderRevisionEffectTable(revision), 'utf8')
  writeFileSync(tableThreePath, renderAblationTable(ablation), 'utf8')

  return { tableZeroPath, tableOnePath, tableTwoPath, tableThreePath }
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
    'Rows with `missing_raw_outputs` are not model results.',
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
  const lines = [
    '# Table 3: Verifier Ablation',
    '',
    `Status: \`${ablation.status}\``,
    '',
    'Rows marked `[NEED_EXPERIMENT]` are not model results.',
    '',
    '| Variant | Status | Removed Component | Target Burden | Target Delta | Reason-Action Delta |',
    '| --- | --- | --- | ---: | ---: | ---: |',
    ...ablation.rows.map(row => [
      row.title,
      row.status,
      row.removedComponent,
      String(row.targetFailureBurden),
      String(row.targetBurdenDeltaVsFull),
      String(row.reasonActionBurdenDeltaVsFull),
    ].map(escapeMarkdownCell).join(' | ')).map(line => `| ${line} |`),
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
