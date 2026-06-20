import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { basename, join } from 'node:path'

const HUMAN_LABEL_FIELDS = [
  'humanPartnerConsistent',
  'humanOpponentConsistent',
  'humanTeamObjectiveValid',
  'humanHiddenInfoDisciplined',
  'humanReasonActionConsistent',
] as const

type HumanLabelField = typeof HUMAN_LABEL_FIELDS[number]
type NormalizedLabel = 'pass' | 'fail' | 'unknown'

interface CsvRow {
  [key: string]: string
}

interface BlindRow {
  sampleId: string
  [key: string]: unknown
}

interface FieldAgreementRow {
  label: HumanLabelField
  paired: number
  matched: number
  agreement: number | null
  disagreements: number
}

interface DisagreementRow {
  sampleId: string
  decisionId: string
  label: HumanLabelField
  annotatorA: NormalizedLabel
  annotatorB: NormalizedLabel
}

type InterAnnotatorStatus = 'awaiting_returns' | 'needs_attention' | 'completed'

export interface HumanAuditInterAnnotatorAgreementReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  status: InterAnnotatorStatus
  annotatorAPath: string
  annotatorBPath: string
  blindJsonlPath: string
  annotatorAPresent: boolean
  annotatorBPresent: boolean
  sampleCount: number
  annotatorARowCount: number
  annotatorBRowCount: number
  completedLabelsA: number
  completedLabelsB: number
  totalLabels: number
  pairedLabels: number
  matchedLabels: number
  disagreementCount: number
  macroAgreement: number | null
  requiresAdjudication: boolean
  readyForAdjudication: boolean
  readyForPaperEvidence: false
  checks: Array<{ id: string; status: 'pass' | 'fail'; detail: string }>
  invalidLabelsA: Array<{ sampleId: string; field: HumanLabelField; value: string }>
  invalidLabelsB: Array<{ sampleId: string; field: HumanLabelField; value: string }>
  missingSampleIdsA: string[]
  missingSampleIdsB: string[]
  unexpectedSampleIdsA: string[]
  unexpectedSampleIdsB: string[]
  duplicateSampleIdsA: string[]
  duplicateSampleIdsB: string[]
  labels: FieldAgreementRow[]
  disagreements: DisagreementRow[]
}

export interface HumanAuditInterAnnotatorAgreementOptions {
  annotatorACsvPath: string
  annotatorBCsvPath: string
  blindJsonlPath: string
  outputDir: string
}

export interface HumanAuditInterAnnotatorAgreementResult {
  jsonPath: string
  markdownPath: string
  report: HumanAuditInterAnnotatorAgreementReport
}

export function writeHumanAuditInterAnnotatorAgreement(
  options: HumanAuditInterAnnotatorAgreementOptions,
): HumanAuditInterAnnotatorAgreementResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = buildHumanAuditInterAnnotatorAgreementReport(options)
  const jsonPath = join(options.outputDir, 'human-audit-inter-annotator-agreement-report.json')
  const markdownPath = join(options.outputDir, 'human-audit-inter-annotator-agreement-report.md')
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderHumanAuditInterAnnotatorAgreementReport(report), 'utf8')
  return { jsonPath, markdownPath, report }
}

export function buildHumanAuditInterAnnotatorAgreementReport(
  options: HumanAuditInterAnnotatorAgreementOptions,
): HumanAuditInterAnnotatorAgreementReport {
  const blindRows = readJsonl<BlindRow>(options.blindJsonlPath)
  const blindIds = blindRows.map(row => row.sampleId)
  const annotatorAPresent = existsSync(options.annotatorACsvPath)
  const annotatorBPresent = existsSync(options.annotatorBCsvPath)
  const rowsA = annotatorAPresent ? parseCsv(readFileSync(options.annotatorACsvPath, 'utf8')) : []
  const rowsB = annotatorBPresent ? parseCsv(readFileSync(options.annotatorBCsvPath, 'utf8')) : []
  const byIdA = deduplicateRows(rowsA)
  const byIdB = deduplicateRows(rowsB)
  const idsA = rowsA.map(row => row.sampleId?.trim()).filter(Boolean)
  const idsB = rowsB.map(row => row.sampleId?.trim()).filter(Boolean)
  const invalidLabelsA = collectInvalidLabels(rowsA)
  const invalidLabelsB = collectInvalidLabels(rowsB)
  const missingSampleIdsA = annotatorAPresent ? blindIds.filter(id => !byIdA.has(id)).sort() : blindIds
  const missingSampleIdsB = annotatorBPresent ? blindIds.filter(id => !byIdB.has(id)).sort() : blindIds
  const unexpectedSampleIdsA = idsA.filter(id => !blindIds.includes(id)).sort()
  const unexpectedSampleIdsB = idsB.filter(id => !blindIds.includes(id)).sort()
  const duplicateSampleIdsA = findDuplicates(idsA)
  const duplicateSampleIdsB = findDuplicates(idsB)
  const completedLabelsA = countCompletedLabels(rowsA)
  const completedLabelsB = countCompletedLabels(rowsB)
  const totalLabels = blindRows.length * HUMAN_LABEL_FIELDS.length
  const labels = HUMAN_LABEL_FIELDS.map(field => buildFieldAgreement(field, blindIds, byIdA, byIdB))
  const pairedLabels = labels.reduce((sum, row) => sum + row.paired, 0)
  const matchedLabels = labels.reduce((sum, row) => sum + row.matched, 0)
  const disagreements = collectDisagreements(blindIds, byIdA, byIdB)
  const agreementValues = labels
    .map(row => row.agreement)
    .filter((value): value is number => value !== null)
  const macroAgreement = agreementValues.length === 0
    ? null
    : agreementValues.reduce((sum, value) => sum + value, 0) / agreementValues.length
  const checks = [
    check('annotator-a-present', annotatorAPresent, annotatorAPresent ? 'annotator A CSV is present' : 'annotator A CSV is not present yet'),
    check('annotator-b-present', annotatorBPresent, annotatorBPresent ? 'annotator B CSV is present' : 'annotator B CSV is not present yet'),
    check('annotator-a-row-count', !annotatorAPresent || rowsA.length === blindRows.length, annotatorAPresent ? `${rowsA.length}/${blindRows.length} rows` : 'not evaluated until annotator A CSV is present'),
    check('annotator-b-row-count', !annotatorBPresent || rowsB.length === blindRows.length, annotatorBPresent ? `${rowsB.length}/${blindRows.length} rows` : 'not evaluated until annotator B CSV is present'),
    check('annotator-a-sample-ids', !annotatorAPresent || (missingSampleIdsA.length === 0 && unexpectedSampleIdsA.length === 0), annotatorAPresent ? formatSampleIdCheck(missingSampleIdsA, unexpectedSampleIdsA) : 'not evaluated until annotator A CSV is present'),
    check('annotator-b-sample-ids', !annotatorBPresent || (missingSampleIdsB.length === 0 && unexpectedSampleIdsB.length === 0), annotatorBPresent ? formatSampleIdCheck(missingSampleIdsB, unexpectedSampleIdsB) : 'not evaluated until annotator B CSV is present'),
    check('annotator-a-unique-sample-ids', duplicateSampleIdsA.length === 0, duplicateSampleIdsA.length === 0 ? 'no duplicate sample ids' : `duplicates: ${duplicateSampleIdsA.join(', ')}`),
    check('annotator-b-unique-sample-ids', duplicateSampleIdsB.length === 0, duplicateSampleIdsB.length === 0 ? 'no duplicate sample ids' : `duplicates: ${duplicateSampleIdsB.join(', ')}`),
    check('annotator-a-label-values', invalidLabelsA.length === 0, invalidLabelsA.length === 0 ? 'all filled labels are pass/fail/uncertain/unknown' : `${invalidLabelsA.length} invalid label values`),
    check('annotator-b-label-values', invalidLabelsB.length === 0, invalidLabelsB.length === 0 ? 'all filled labels are pass/fail/uncertain/unknown' : `${invalidLabelsB.length} invalid label values`),
  ]
  const structuralChecks = checks.filter(row => row.id !== 'annotator-a-present' && row.id !== 'annotator-b-present')
  const bothPresent = annotatorAPresent && annotatorBPresent
  const structuralPass = structuralChecks.every(row => row.status === 'pass')
  const status: InterAnnotatorStatus = !bothPresent
    ? 'awaiting_returns'
    : structuralPass
      ? 'completed'
      : 'needs_attention'
  const requiresAdjudication = status === 'completed' && disagreements.length > 0

  return {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    status,
    annotatorAPath: options.annotatorACsvPath,
    annotatorBPath: options.annotatorBCsvPath,
    blindJsonlPath: options.blindJsonlPath,
    annotatorAPresent,
    annotatorBPresent,
    sampleCount: blindRows.length,
    annotatorARowCount: rowsA.length,
    annotatorBRowCount: rowsB.length,
    completedLabelsA,
    completedLabelsB,
    totalLabels,
    pairedLabels,
    matchedLabels,
    disagreementCount: disagreements.length,
    macroAgreement,
    requiresAdjudication,
    readyForAdjudication: status === 'completed',
    readyForPaperEvidence: false,
    checks,
    invalidLabelsA,
    invalidLabelsB,
    missingSampleIdsA,
    missingSampleIdsB,
    unexpectedSampleIdsA,
    unexpectedSampleIdsB,
    duplicateSampleIdsA,
    duplicateSampleIdsB,
    labels,
    disagreements,
  }
}

function buildFieldAgreement(
  field: HumanLabelField,
  sampleIds: string[],
  byIdA: Map<string, CsvRow>,
  byIdB: Map<string, CsvRow>,
): FieldAgreementRow {
  let paired = 0
  let matched = 0
  for (const sampleId of sampleIds) {
    const a = normalizeHumanLabel(byIdA.get(sampleId)?.[field])
    const b = normalizeHumanLabel(byIdB.get(sampleId)?.[field])
    if (a === null || b === null) continue
    paired += 1
    if (a === b) matched += 1
  }
  return {
    label: field,
    paired,
    matched,
    agreement: paired === 0 ? null : matched / paired,
    disagreements: paired - matched,
  }
}

function collectDisagreements(
  sampleIds: string[],
  byIdA: Map<string, CsvRow>,
  byIdB: Map<string, CsvRow>,
): DisagreementRow[] {
  return sampleIds.flatMap(sampleId => {
    const rowA = byIdA.get(sampleId)
    const rowB = byIdB.get(sampleId)
    if (!rowA || !rowB) return []
    return HUMAN_LABEL_FIELDS.flatMap(field => {
      const a = normalizeHumanLabel(rowA[field])
      const b = normalizeHumanLabel(rowB[field])
      if (a === null || b === null || a === b) return []
      return [{
        sampleId,
        decisionId: rowA.decisionId || rowB.decisionId || '',
        label: field,
        annotatorA: a,
        annotatorB: b,
      }]
    })
  })
}

function renderHumanAuditInterAnnotatorAgreementReport(report: HumanAuditInterAnnotatorAgreementReport): string {
  return [
    '# Human Audit Inter-Annotator Agreement Report',
    '',
    `Generated at: \`${report.generatedAt}\``,
    '',
    `Status: \`${report.status}\``,
    '',
    '| Item | Value |',
    '| --- | ---: |',
    `| Annotator A CSV | \`${basename(report.annotatorAPath)}\` |`,
    `| Annotator B CSV | \`${basename(report.annotatorBPath)}\` |`,
    `| Annotator A present | ${report.annotatorAPresent ? 'yes' : 'no'} |`,
    `| Annotator B present | ${report.annotatorBPresent ? 'yes' : 'no'} |`,
    `| Blind samples | ${report.sampleCount} |`,
    `| Annotator A rows | ${report.annotatorARowCount} |`,
    `| Annotator B rows | ${report.annotatorBRowCount} |`,
    `| Annotator A completed labels | ${report.completedLabelsA}/${report.totalLabels} |`,
    `| Annotator B completed labels | ${report.completedLabelsB}/${report.totalLabels} |`,
    `| Paired labels | ${report.pairedLabels}/${report.totalLabels} |`,
    `| Matched labels | ${report.matchedLabels} |`,
    `| Disagreements | ${report.disagreementCount} |`,
    `| Macro agreement | ${report.macroAgreement === null ? 'n/a' : formatPercent(report.macroAgreement)} |`,
    `| Requires adjudication | ${report.requiresAdjudication ? 'yes' : 'no'} |`,
    `| Ready for adjudication | ${report.readyForAdjudication ? 'yes' : 'no'} |`,
    `| Ready for paper evidence | ${report.readyForPaperEvidence ? 'yes' : 'no'} |`,
    '',
    '## Checks',
    '',
    '| Check | Status | Detail |',
    '| --- | --- | --- |',
    ...report.checks.map(row => `| ${row.id} | \`${row.status}\` | ${escapeMarkdownCell(row.detail)} |`),
    '',
    '## Field Agreement',
    '',
    '| Label | Paired | Matched | Disagreements | Agreement |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...report.labels.map(row => `| ${row.label} | ${row.paired} | ${row.matched} | ${row.disagreements} | ${row.agreement === null ? 'n/a' : formatPercent(row.agreement)} |`),
    '',
    '## Disagreements',
    '',
    report.disagreements.length === 0
      ? 'No paired label disagreements are available.'
      : [
        '| Sample | Decision | Label | Annotator A | Annotator B |',
        '| --- | --- | --- | --- | --- |',
        ...report.disagreements.map(row => `| ${row.sampleId} | ${row.decisionId} | ${row.label} | ${row.annotatorA} | ${row.annotatorB} |`),
      ].join('\n'),
    '',
    '## Interpretation',
    '',
    report.status === 'awaiting_returns'
      ? 'Two completed annotator CSVs have not been returned yet. This report is a readiness artifact, not human-audit evidence.'
      : report.status === 'needs_attention'
        ? 'Resolve failed structural checks before using this report for adjudication or paper evidence.'
        : report.requiresAdjudication
          ? 'Both annotator CSVs are structurally valid. Resolve disagreements without the verifier answer key, then run human-verifier agreement on the adjudicated CSV.'
          : 'Both annotator CSVs are structurally valid and have no paired label disagreements; either file can be used as the adjudicated annotation CSV.',
    '',
    'Accepted labels: `pass`, `fail`, `unknown`, or `uncertain`; `uncertain` is normalized to `unknown`.',
    '',
  ].join('\n')
}

function collectInvalidLabels(rows: CsvRow[]): Array<{ sampleId: string; field: HumanLabelField; value: string }> {
  return rows.flatMap(row => {
    return HUMAN_LABEL_FIELDS.flatMap(field => {
      const value = row[field] ?? ''
      if (!value.trim() || normalizeHumanLabel(value) !== null) return []
      return [{ sampleId: row.sampleId, field, value }]
    })
  })
}

function countCompletedLabels(rows: CsvRow[]): number {
  return rows.reduce((sum, row) => {
    return sum + HUMAN_LABEL_FIELDS.filter(field => normalizeHumanLabel(row[field]) !== null).length
  }, 0)
}

function normalizeHumanLabel(value: string | undefined): NormalizedLabel | null {
  const normalized = (value ?? '').trim().toLowerCase()
  if (!normalized) return null
  if (normalized === 'pass' || normalized === 'yes' || normalized === 'true') return 'pass'
  if (normalized === 'fail' || normalized === 'no' || normalized === 'false') return 'fail'
  if (normalized === 'unknown' || normalized === 'uncertain' || normalized === 'unsure') return 'unknown'
  return null
}

function deduplicateRows(rows: CsvRow[]): Map<string, CsvRow> {
  const byId = new Map<string, CsvRow>()
  for (const row of rows) {
    const sampleId = row.sampleId?.trim()
    if (!sampleId || byId.has(sampleId)) continue
    byId.set(sampleId, row)
  }
  return byId
}

function check(id: string, passed: boolean, detail: string): HumanAuditInterAnnotatorAgreementReport['checks'][number] {
  return {
    id,
    status: passed ? 'pass' : 'fail',
    detail,
  }
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return [...duplicates].sort()
}

function formatSampleIdCheck(missing: string[], unexpected: string[]): string {
  if (missing.length === 0 && unexpected.length === 0) return 'sample ids match blind sample ids'
  return `missing=${missing.length}, unexpected=${unexpected.length}`
}

function parseCsv(text: string): CsvRow[] {
  const records: string[][] = []
  let record: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]
    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      record.push(cell)
      cell = ''
    } else if (char === '\n') {
      record.push(cell)
      records.push(record)
      record = []
      cell = ''
    } else if (char !== '\r') {
      cell += char
    }
  }
  if (cell.length > 0 || record.length > 0) {
    record.push(cell)
    records.push(record)
  }

  if (records.length === 0) return []
  const headers = records[0]
  return records
    .slice(1)
    .filter(record => record.some(cell => cell.trim()))
    .map(record => Object.fromEntries(headers.map((header, index) => [header.trim(), record[index] ?? ''])))
}

function readJsonl<T>(path: string): T[] {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter(line => line.trim())
    .map(line => JSON.parse(line) as T)
}

function formatPercent(value: number): string {
  return `${Math.round(value * 1000) / 10}%`
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}
