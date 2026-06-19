import {
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

const VERIFIER_LABEL_FIELDS = [
  'verifierPartnerConsistent',
  'verifierOpponentConsistent',
  'verifierTeamObjectiveValid',
  'verifierHiddenInfoDisciplined',
  'verifierReasonActionConsistent',
] as const

type HumanLabelField = typeof HUMAN_LABEL_FIELDS[number]
type VerifierLabelField = typeof VERIFIER_LABEL_FIELDS[number]
type NormalizedLabel = 'pass' | 'fail' | 'unknown'

interface CsvRow {
  [key: string]: string
}

interface AnswerKeyRow extends CsvRow {
  sampleId: string
}

interface LabelAgreementRow {
  label: HumanLabelField
  verifierLabel: VerifierLabelField
  completed: number
  matched: number
  agreement: number | null
  humanCounts: Record<NormalizedLabel, number>
  verifierCounts: Record<NormalizedLabel, number>
  confusion: Record<NormalizedLabel, Record<NormalizedLabel, number>>
}

export interface HumanAuditAgreementReport {
  schemaVersion: '0.1.1'
  generatedAt: string
  status: 'pending' | 'partial' | 'completed'
  annotationCsv: string
  answerKeyJsonl: string
  sampleCount: number
  annotationRowCount: number
  completedRows: number
  fullyCompletedRows: number
  completedLabels: number
  totalLabels: number
  remainingLabels: number
  readyForPaperEvidence: boolean
  invalidLabels: Array<{ sampleId: string; field: HumanLabelField; value: string }>
  missingAnswerKeys: string[]
  missingAnnotationSampleIds: string[]
  unexpectedAnnotationSampleIds: string[]
  duplicateAnnotationSampleIds: string[]
  labels: LabelAgreementRow[]
  macroAgreement: number | null
}

export interface HumanAuditAgreementOptions {
  annotationCsvPath: string
  answerKeyJsonlPath: string
  outputDir: string
}

export interface HumanAuditAgreementResult {
  jsonPath: string
  markdownPath: string
  report: HumanAuditAgreementReport
}

export function writeHumanAuditAgreement(options: HumanAuditAgreementOptions): HumanAuditAgreementResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = buildHumanAuditAgreementReport(options)
  const jsonPath = join(options.outputDir, 'human-audit-agreement-report.json')
  const markdownPath = join(options.outputDir, 'human-audit-agreement-report.md')
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderHumanAuditAgreementReport(report), 'utf8')
  return { jsonPath, markdownPath, report }
}

export function buildHumanAuditAgreementReport(options: HumanAuditAgreementOptions): HumanAuditAgreementReport {
  const rows = parseCsv(readFileSync(options.annotationCsvPath, 'utf8'))
  const answerKeys = readJsonl<AnswerKeyRow>(options.answerKeyJsonlPath)
  const answerBySampleId = new Map(answerKeys.map(row => [row.sampleId, row]))
  const sampleIssues = compareAnnotationSamples(rows, answerKeys)
  const auditableRows = deduplicateRows(rows)
  const invalidLabels: HumanAuditAgreementReport['invalidLabels'] = []
  const missingAnswerKeys: string[] = []
  const labelRows = HUMAN_LABEL_FIELDS.map((humanField, index) => {
    const verifierField = VERIFIER_LABEL_FIELDS[index]
    return buildLabelAgreementRow(auditableRows, answerBySampleId, humanField, verifierField, invalidLabels, missingAnswerKeys)
  })
  const completedLabels = labelRows.reduce((sum, row) => sum + row.completed, 0)
  const totalLabels = answerKeys.length * HUMAN_LABEL_FIELDS.length
  const remainingLabels = Math.max(totalLabels - completedLabels, 0)
  const completedRows = auditableRows.filter(row => HUMAN_LABEL_FIELDS.some(field => normalizeHumanLabel(row[field]) !== null)).length
  const fullyCompletedRows = auditableRows.filter(row => HUMAN_LABEL_FIELDS.every(field => normalizeHumanLabel(row[field]) !== null)).length
  const macroValues = labelRows
    .map(row => row.agreement)
    .filter((value): value is number => value !== null)
  const macroAgreement = macroValues.length === 0
    ? null
    : macroValues.reduce((sum, value) => sum + value, 0) / macroValues.length
  const status = completedLabels === 0
    ? 'pending'
    : completedLabels === totalLabels
      && invalidLabels.length === 0
      && missingAnswerKeys.length === 0
      && sampleIssues.missingAnnotationSampleIds.length === 0
      && sampleIssues.unexpectedAnnotationSampleIds.length === 0
      && sampleIssues.duplicateAnnotationSampleIds.length === 0
      ? 'completed'
      : 'partial'
  const readyForPaperEvidence = status === 'completed'

  return {
    schemaVersion: '0.1.1',
    generatedAt: new Date().toISOString(),
    status,
    annotationCsv: options.annotationCsvPath,
    answerKeyJsonl: options.answerKeyJsonlPath,
    sampleCount: answerKeys.length,
    annotationRowCount: rows.length,
    completedRows,
    fullyCompletedRows,
    completedLabels,
    totalLabels,
    remainingLabels,
    readyForPaperEvidence,
    invalidLabels,
    missingAnswerKeys: [...new Set(missingAnswerKeys)].sort(),
    missingAnnotationSampleIds: sampleIssues.missingAnnotationSampleIds,
    unexpectedAnnotationSampleIds: sampleIssues.unexpectedAnnotationSampleIds,
    duplicateAnnotationSampleIds: sampleIssues.duplicateAnnotationSampleIds,
    labels: labelRows,
    macroAgreement,
  }
}

function compareAnnotationSamples(
  rows: CsvRow[],
  answerKeys: AnswerKeyRow[],
): Pick<HumanAuditAgreementReport, 'missingAnnotationSampleIds' | 'unexpectedAnnotationSampleIds' | 'duplicateAnnotationSampleIds'> {
  const answerIds = new Set(answerKeys.map(row => row.sampleId))
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  const annotationIds = new Set<string>()

  for (const row of rows) {
    const sampleId = row.sampleId?.trim()
    if (!sampleId) continue
    if (seen.has(sampleId)) duplicates.add(sampleId)
    seen.add(sampleId)
    annotationIds.add(sampleId)
  }

  return {
    missingAnnotationSampleIds: answerKeys
      .map(row => row.sampleId)
      .filter(sampleId => !annotationIds.has(sampleId))
      .sort(),
    unexpectedAnnotationSampleIds: [...annotationIds]
      .filter(sampleId => !answerIds.has(sampleId))
      .sort(),
    duplicateAnnotationSampleIds: [...duplicates].sort(),
  }
}

function deduplicateRows(rows: CsvRow[]): CsvRow[] {
  const seen = new Set<string>()
  const deduplicated: CsvRow[] = []
  for (const row of rows) {
    const sampleId = row.sampleId?.trim()
    if (sampleId && seen.has(sampleId)) continue
    if (sampleId) seen.add(sampleId)
    deduplicated.push(row)
  }
  return deduplicated
}

function buildLabelAgreementRow(
  rows: CsvRow[],
  answerBySampleId: Map<string, AnswerKeyRow>,
  humanField: HumanLabelField,
  verifierField: VerifierLabelField,
  invalidLabels: HumanAuditAgreementReport['invalidLabels'],
  missingAnswerKeys: string[],
): LabelAgreementRow {
  const humanCounts = emptyCounts()
  const verifierCounts = emptyCounts()
  const confusion = emptyConfusion()
  let completed = 0
  let matched = 0

  for (const row of rows) {
    const sampleId = row.sampleId
    const human = normalizeHumanLabel(row[humanField])
    if (human === null) {
      if ((row[humanField] ?? '').trim()) {
        invalidLabels.push({ sampleId, field: humanField, value: row[humanField] })
      }
      continue
    }
    const answer = answerBySampleId.get(sampleId)
    if (!answer) {
      missingAnswerKeys.push(sampleId)
      continue
    }
    const verifier = normalizeVerifierLabel(answer[verifierField])
    if (!verifier) continue

    completed += 1
    humanCounts[human] += 1
    verifierCounts[verifier] += 1
    confusion[human][verifier] += 1
    if (human === verifier) matched += 1
  }

  return {
    label: humanField,
    verifierLabel: verifierField,
    completed,
    matched,
    agreement: completed === 0 ? null : matched / completed,
    humanCounts,
    verifierCounts,
    confusion,
  }
}

function renderHumanAuditAgreementReport(report: HumanAuditAgreementReport): string {
  return [
    '# Human Soft-Label Audit Agreement Report',
    '',
    `Generated at: \`${report.generatedAt}\``,
    '',
    `Status: \`${report.status}\``,
    '',
    '| Item | Value |',
    '| --- | ---: |',
    `| Annotation CSV | \`${basename(report.annotationCsv)}\` |`,
    `| Answer key | \`${basename(report.answerKeyJsonl)}\` |`,
    `| Expected samples | ${report.sampleCount} |`,
    `| Annotation rows | ${report.annotationRowCount} |`,
    `| Completed rows | ${report.completedRows} |`,
    `| Fully completed rows | ${report.fullyCompletedRows} |`,
    `| Completed labels | ${report.completedLabels}/${report.totalLabels} |`,
    `| Remaining labels | ${report.remainingLabels} |`,
    `| Ready for paper evidence | ${report.readyForPaperEvidence ? 'yes' : 'no'} |`,
    `| Invalid labels | ${report.invalidLabels.length} |`,
    `| Missing answer keys | ${report.missingAnswerKeys.length} |`,
    `| Missing annotation samples | ${report.missingAnnotationSampleIds.length} |`,
    `| Unexpected annotation samples | ${report.unexpectedAnnotationSampleIds.length} |`,
    `| Duplicate annotation samples | ${report.duplicateAnnotationSampleIds.length} |`,
    `| Macro agreement | ${report.macroAgreement === null ? 'n/a' : formatPercent(report.macroAgreement)} |`,
    '',
    '## Label Agreement',
    '',
    '| Human label | Verifier label | Completed | Matched | Agreement |',
    '| --- | --- | ---: | ---: | ---: |',
    ...report.labels.map(row => `| ${row.label} | ${row.verifierLabel} | ${row.completed} | ${row.matched} | ${row.agreement === null ? 'n/a' : formatPercent(row.agreement)} |`),
    '',
    '## Interpretation',
    '',
    report.status === 'pending'
      ? 'No human labels have been filled yet. This report is a readiness artifact, not human-audit evidence.'
      : report.status === 'partial'
        ? 'The annotation file is partially completed or contains invalid/missing labels. Do not report agreement until the status is completed.'
        : 'The annotation file is complete and can be summarized as human agreement with verifier soft labels.',
    '',
    'Accepted human labels: `pass`, `fail`, `unknown`, or `uncertain`; `uncertain` is normalized to verifier `unknown`.',
    '',
  ].join('\n')
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
  if (cell || record.length > 0) {
    record.push(cell)
    records.push(record)
  }

  const [headers, ...rows] = records.filter(row => row.some(cellValue => cellValue.trim()))
  if (!headers) return []
  return rows.map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])))
}

function readJsonl<T>(path: string): T[] {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter(line => line.trim())
    .map(line => JSON.parse(line) as T)
}

function normalizeHumanLabel(value?: string): NormalizedLabel | null {
  const normalized = (value ?? '').trim().toLowerCase()
  if (!normalized) return null
  if (normalized === 'pass') return 'pass'
  if (normalized === 'fail') return 'fail'
  if (normalized === 'unknown' || normalized === 'uncertain') return 'unknown'
  return null
}

function normalizeVerifierLabel(value?: string): NormalizedLabel | null {
  const normalized = (value ?? '').trim().toLowerCase()
  if (normalized === 'pass') return 'pass'
  if (normalized === 'fail') return 'fail'
  if (normalized === 'unknown' || normalized === 'missing') return 'unknown'
  return null
}

function emptyCounts(): Record<NormalizedLabel, number> {
  return { pass: 0, fail: 0, unknown: 0 }
}

function emptyConfusion(): Record<NormalizedLabel, Record<NormalizedLabel, number>> {
  return {
    pass: emptyCounts(),
    fail: emptyCounts(),
    unknown: emptyCounts(),
  }
}

function formatPercent(value: number): string {
  return `${Math.round(value * 1000) / 10}%`
}
