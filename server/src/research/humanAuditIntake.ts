import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { basename, join } from 'node:path'

const EXPECTED_RETURNED_CSV_NAME = 'human-audit-completed-annotations.csv'

const HUMAN_LABEL_FIELDS = [
  'humanPartnerConsistent',
  'humanOpponentConsistent',
  'humanTeamObjectiveValid',
  'humanHiddenInfoDisciplined',
  'humanReasonActionConsistent',
] as const

const REQUIRED_COLUMNS = [
  'sampleId',
  'decisionId',
  ...HUMAN_LABEL_FIELDS,
] as const

const FORBIDDEN_RETURNED_COLUMNS = [
  /^verifier/i,
  /answer[-_]?key/i,
]

type HumanLabelField = typeof HUMAN_LABEL_FIELDS[number]
type IntakeStatus = 'awaiting_return' | 'ready_for_agreement' | 'needs_attention'

interface CsvRow {
  [key: string]: string
}

interface BlindRow {
  sampleId: string
  [key: string]: unknown
}

interface PackageManifest {
  status?: string
  sampleCount?: number
  instructions?: {
    completedCsvName?: string
    referenceFileIncluded?: boolean
    referenceLabelsIncluded?: boolean
  }
  checks?: Array<{ status?: string }>
}

export interface HumanAuditIntakeReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  status: IntakeStatus
  returnedCsvPath: string
  returnedCsvPresent: boolean
  expectedReturnedCsvName: string
  packageManifestPath: string
  blindJsonlPath: string
  sampleCount: number
  returnedRowCount: number
  completedLabels: number
  totalLabels: number
  checks: Array<{ id: string; status: 'pass' | 'fail'; detail: string }>
  readyForAgreement: boolean
  readyForPaperEvidence: false
}

export interface HumanAuditIntakeOptions {
  returnedCsvPath: string
  packageManifestPath: string
  blindJsonlPath: string
  outputDir: string
}

export interface HumanAuditIntakeResult {
  jsonPath: string
  markdownPath: string
  report: HumanAuditIntakeReport
}

export function writeHumanAuditIntakeReport(options: HumanAuditIntakeOptions): HumanAuditIntakeResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = buildHumanAuditIntakeReport(options)
  const jsonPath = join(options.outputDir, 'human-audit-intake-report.json')
  const markdownPath = join(options.outputDir, 'human-audit-intake-report.md')
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderHumanAuditIntakeReport(report), 'utf8')
  return { jsonPath, markdownPath, report }
}

export function buildHumanAuditIntakeReport(options: HumanAuditIntakeOptions): HumanAuditIntakeReport {
  const blindRows = readJsonl<BlindRow>(options.blindJsonlPath)
  const manifest = readJson<PackageManifest>(options.packageManifestPath)
  const returnedCsvPresent = existsSync(options.returnedCsvPath)
  const returnedRows = returnedCsvPresent ? parseCsv(readFileSync(options.returnedCsvPath, 'utf8')) : []
  const returnedHeaders = returnedCsvPresent ? readCsvHeaders(options.returnedCsvPath) : []
  const blindIds = blindRows.map(row => row.sampleId)
  const returnedIds = returnedRows.map(row => row.sampleId?.trim()).filter(Boolean)
  const duplicateReturnedIds = findDuplicates(returnedIds)
  const missingReturnedIds = blindIds.filter(sampleId => !returnedIds.includes(sampleId)).sort()
  const unexpectedReturnedIds = returnedIds.filter(sampleId => !blindIds.includes(sampleId)).sort()
  const invalidLabels = collectInvalidLabels(returnedRows)
  const forbiddenColumns = returnedHeaders.filter(header => FORBIDDEN_RETURNED_COLUMNS.some(pattern => pattern.test(header)))
  const completedLabels = returnedRows.reduce((sum, row) => {
    return sum + HUMAN_LABEL_FIELDS.filter(field => normalizeHumanLabel(row[field]) !== null).length
  }, 0)
  const totalLabels = blindRows.length * HUMAN_LABEL_FIELDS.length
  const expectedReturnedName = manifest.instructions?.completedCsvName ?? EXPECTED_RETURNED_CSV_NAME

  const checks = [
    check('package-ready', manifest.status === 'package_ready', `package status is ${manifest.status ?? 'missing'}`),
    check('package-excludes-reference-file', manifest.instructions?.referenceFileIncluded === false, 'package manifest excludes private reference files'),
    check('package-excludes-reference-labels', manifest.instructions?.referenceLabelsIncluded === false, 'package manifest excludes reference labels'),
    check('returned-file-present', returnedCsvPresent, returnedCsvPresent ? 'returned annotation CSV is present' : 'returned annotation CSV is not present yet'),
    check('returned-filename', basename(options.returnedCsvPath) === expectedReturnedName, `expected ${expectedReturnedName}, got ${basename(options.returnedCsvPath)}`),
    check('required-columns', !returnedCsvPresent || REQUIRED_COLUMNS.every(column => returnedHeaders.includes(column)), returnedCsvPresent ? `required columns present: ${REQUIRED_COLUMNS.filter(column => returnedHeaders.includes(column)).length}/${REQUIRED_COLUMNS.length}` : 'not evaluated until returned CSV is present'),
    check('no-reference-columns', forbiddenColumns.length === 0, forbiddenColumns.length === 0 ? 'no private reference columns in returned CSV' : `forbidden columns: ${forbiddenColumns.join(', ')}`),
    check('row-count', !returnedCsvPresent || returnedRows.length === blindRows.length, returnedCsvPresent ? `${returnedRows.length}/${blindRows.length} returned rows` : 'not evaluated until returned CSV is present'),
    check('sample-id-match', !returnedCsvPresent || (missingReturnedIds.length === 0 && unexpectedReturnedIds.length === 0), !returnedCsvPresent ? 'not evaluated until returned CSV is present' : missingReturnedIds.length === 0 && unexpectedReturnedIds.length === 0 ? 'returned sample ids match blind sample ids' : `missing=${missingReturnedIds.length}, unexpected=${unexpectedReturnedIds.length}`),
    check('unique-sample-ids', duplicateReturnedIds.length === 0, duplicateReturnedIds.length === 0 ? 'no duplicate returned sample ids' : `duplicates: ${duplicateReturnedIds.join(', ')}`),
    check('label-values', invalidLabels.length === 0, invalidLabels.length === 0 ? 'all filled labels are pass/fail/uncertain/unknown' : `${invalidLabels.length} invalid label values`),
  ]

  const structuralChecks = checks.filter(row => row.id !== 'returned-file-present')
  const readyForAgreement = returnedCsvPresent && checks.every(row => row.status === 'pass')
  const status: IntakeStatus = !returnedCsvPresent
    ? 'awaiting_return'
    : structuralChecks.every(row => row.status === 'pass')
      ? 'ready_for_agreement'
      : 'needs_attention'

  return {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    status,
    returnedCsvPath: options.returnedCsvPath,
    returnedCsvPresent,
    expectedReturnedCsvName: expectedReturnedName,
    packageManifestPath: options.packageManifestPath,
    blindJsonlPath: options.blindJsonlPath,
    sampleCount: blindRows.length,
    returnedRowCount: returnedRows.length,
    completedLabels,
    totalLabels,
    checks,
    readyForAgreement,
    readyForPaperEvidence: false,
  }
}

function renderHumanAuditIntakeReport(report: HumanAuditIntakeReport): string {
  return [
    '# Human Audit Returned-Annotation Intake Report',
    '',
    `Generated at: \`${report.generatedAt}\``,
    '',
    `Status: \`${report.status}\``,
    '',
    '| Item | Value |',
    '| --- | ---: |',
    `| Returned CSV | \`${basename(report.returnedCsvPath)}\` |`,
    `| Returned CSV present | ${report.returnedCsvPresent ? 'yes' : 'no'} |`,
    `| Expected returned CSV name | \`${report.expectedReturnedCsvName}\` |`,
    `| Blind samples | ${report.sampleCount} |`,
    `| Returned rows | ${report.returnedRowCount} |`,
    `| Completed labels | ${report.completedLabels}/${report.totalLabels} |`,
    `| Ready for agreement | ${report.readyForAgreement ? 'yes' : 'no'} |`,
    `| Ready for paper evidence | ${report.readyForPaperEvidence ? 'yes' : 'no'} |`,
    '',
    '## Checks',
    '',
    '| Check | Status | Detail |',
    '| --- | --- | --- |',
    ...report.checks.map(row => `| ${row.id} | \`${row.status}\` | ${escapeMarkdownCell(row.detail)} |`),
    '',
    report.status === 'awaiting_return'
      ? 'The annotator package is prepared, but the completed CSV has not been returned yet.'
      : report.status === 'ready_for_agreement'
        ? 'The returned CSV is structurally ready for agreement evaluation; it is still not paper evidence until agreement is completed.'
        : 'Resolve failed intake checks before running or reporting agreement.',
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

function normalizeHumanLabel(value: string | undefined): 'pass' | 'fail' | 'unknown' | null {
  const normalized = (value ?? '').trim().toLowerCase()
  if (!normalized) return null
  if (normalized === 'pass' || normalized === 'yes' || normalized === 'true') return 'pass'
  if (normalized === 'fail' || normalized === 'no' || normalized === 'false') return 'fail'
  if (normalized === 'unknown' || normalized === 'uncertain' || normalized === 'unsure') return 'unknown'
  return null
}

function check(id: string, passed: boolean, detail: string): HumanAuditIntakeReport['checks'][number] {
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

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim())
  if (lines.length === 0) return []
  const headers = parseCsvLine(lines[0])
  return lines.slice(1).map(line => {
    const values = parseCsvLine(line)
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
  })
}

function readCsvHeaders(path: string): string[] {
  const firstLine = readFileSync(path, 'utf8').split(/\r?\n/)[0] ?? ''
  return parseCsvLine(firstLine)
}

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index++) {
    const char = line[index]
    const next = line[index + 1]
    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      index++
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }
  values.push(current)
  return values.map(value => value.trim())
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function readJsonl<T>(path: string): T[] {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter(line => line.trim())
    .map(line => JSON.parse(line) as T)
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|')
}
