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

const OUTPUT_CONTEXT_FIELDS = [
  'sampleId',
  'decisionId',
  'phase',
  'scenarioTags',
  'handCounts',
  'selectedActionId',
  'legalActionCount',
  'publicEventSummary',
  'teamObjective',
  'partnerBelief',
  'opponentBelief',
  'actionRationale',
  'riskSummary',
] as const

type HumanLabelField = typeof HUMAN_LABEL_FIELDS[number]
type NormalizedLabel = 'pass' | 'fail' | 'unknown'
type BuildStatus = 'awaiting_returns' | 'needs_adjudication' | 'ready'

interface CsvRow {
  [key: string]: string
}

interface BlindRow {
  sampleId: string
  decisionId: string
  [key: string]: unknown
}

interface BuildIssue {
  sampleId: string
  label: HumanLabelField
  annotatorA: string
  annotatorB: string
  reason: string
}

export interface HumanAuditAdjudicatedAnnotationsReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  status: BuildStatus
  annotatorAPath: string
  annotatorBPath: string
  adjudicationTemplatePath: string
  blindJsonlPath: string
  adjudicatedCsvPath: string
  annotatorAPresent: boolean
  annotatorBPresent: boolean
  adjudicationTemplatePresent: boolean
  sampleCount: number
  outputRows: number
  adjudicatedCsvWritten: boolean
  completedLabels: number
  totalLabels: number
  unresolvedDisagreements: number
  invalidLabels: BuildIssue[]
  checks: Array<{ id: string; status: 'pass' | 'fail'; detail: string }>
  readyForAgreement: boolean
  readyForPaperEvidence: false
}

export interface HumanAuditAdjudicatedAnnotationsOptions {
  annotatorACsvPath: string
  annotatorBCsvPath: string
  adjudicationTemplateCsvPath: string
  blindJsonlPath: string
  adjudicatedCsvPath: string
  outputDir: string
}

export interface HumanAuditAdjudicatedAnnotationsResult {
  jsonPath: string
  markdownPath: string
  adjudicatedCsvPath: string
  report: HumanAuditAdjudicatedAnnotationsReport
}

export function writeHumanAuditAdjudicatedAnnotations(
  options: HumanAuditAdjudicatedAnnotationsOptions,
): HumanAuditAdjudicatedAnnotationsResult {
  mkdirSync(options.outputDir, { recursive: true })
  const { report, rows } = buildHumanAuditAdjudicatedAnnotations(options)
  if (report.status === 'ready') {
    writeFileSync(options.adjudicatedCsvPath, renderOutputCsv(rows), 'utf8')
  }
  const jsonPath = join(options.outputDir, 'human-audit-adjudicated-annotations-report.json')
  const markdownPath = join(options.outputDir, 'human-audit-adjudicated-annotations-report.md')
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderReport(report), 'utf8')
  return {
    jsonPath,
    markdownPath,
    adjudicatedCsvPath: options.adjudicatedCsvPath,
    report,
  }
}

function buildHumanAuditAdjudicatedAnnotations(
  options: HumanAuditAdjudicatedAnnotationsOptions,
): { report: HumanAuditAdjudicatedAnnotationsReport; rows: CsvRow[] } {
  const annotatorAPresent = existsSync(options.annotatorACsvPath)
  const annotatorBPresent = existsSync(options.annotatorBCsvPath)
  const adjudicationTemplatePresent = existsSync(options.adjudicationTemplateCsvPath)
  const blindRows = readJsonl<BlindRow>(options.blindJsonlPath)
  const rowsA = annotatorAPresent ? parseCsv(readFileSync(options.annotatorACsvPath, 'utf8')) : []
  const rowsB = annotatorBPresent ? parseCsv(readFileSync(options.annotatorBCsvPath, 'utf8')) : []
  const adjudicationRows = adjudicationTemplatePresent ? parseCsv(readFileSync(options.adjudicationTemplateCsvPath, 'utf8')) : []
  const byIdA = new Map(rowsA.map(row => [row.sampleId, row]))
  const byIdB = new Map(rowsB.map(row => [row.sampleId, row]))
  const adjudicatedByKey = new Map(adjudicationRows.map(row => [`${row.sampleId}::${row.label}`, normalizeHumanLabel(row.adjudicatedLabel)]))
  const issues: BuildIssue[] = []
  const outputRows: CsvRow[] = []
  let disagreementCount = 0

  for (const blind of blindRows) {
    const rowA = byIdA.get(blind.sampleId)
    const rowB = byIdB.get(blind.sampleId)
    const output: CsvRow = Object.fromEntries(OUTPUT_CONTEXT_FIELDS.map(field => [field, String(blind[field] ?? '')]))
    for (const field of HUMAN_LABEL_FIELDS) {
      const a = normalizeHumanLabel(rowA?.[field])
      const b = normalizeHumanLabel(rowB?.[field])
      if (!a || !b) {
        issues.push({ sampleId: blind.sampleId, label: field, annotatorA: rowA?.[field] ?? '', annotatorB: rowB?.[field] ?? '', reason: 'missing_or_invalid_annotator_label' })
        output[field] = ''
      } else if (a === b) {
        output[field] = a
      } else {
        disagreementCount += 1
        const adjudicated = adjudicatedByKey.get(`${blind.sampleId}::${field}`) ?? null
        if (!adjudicated) {
          issues.push({ sampleId: blind.sampleId, label: field, annotatorA: a, annotatorB: b, reason: 'missing_adjudicated_label' })
          output[field] = ''
        } else {
          output[field] = adjudicated
        }
      }
    }
    output.humanNotes = ''
    outputRows.push(output)
  }

  const totalLabels = blindRows.length * HUMAN_LABEL_FIELDS.length
  const completedLabels = outputRows.reduce((sum, row) => sum + HUMAN_LABEL_FIELDS.filter(field => normalizeHumanLabel(row[field]) !== null).length, 0)
  const unresolvedDisagreements = issues.filter(issue => issue.reason === 'missing_adjudicated_label').length
  const basicInputsPresent = annotatorAPresent && annotatorBPresent
  const status: BuildStatus = !basicInputsPresent
    ? 'awaiting_returns'
    : issues.length > 0
      ? 'needs_adjudication'
      : 'ready'
  const checks = [
    check('annotator-a-present', annotatorAPresent, annotatorAPresent ? 'annotator A CSV is present' : 'annotator A CSV is not present yet'),
    check('annotator-b-present', annotatorBPresent, annotatorBPresent ? 'annotator B CSV is present' : 'annotator B CSV is not present yet'),
    check(
      'adjudication-template-present',
      !basicInputsPresent || disagreementCount === 0 || adjudicationTemplatePresent,
      !basicInputsPresent
        ? 'not evaluated until annotator CSVs are present'
        : disagreementCount === 0
          ? 'no paired disagreements require an adjudication template'
          : adjudicationTemplatePresent
            ? 'adjudication template CSV is present'
            : 'adjudication template CSV is not present yet',
    ),
    check('all-labels-resolved', basicInputsPresent && issues.length === 0, basicInputsPresent ? `${totalLabels - issues.length}/${totalLabels} labels resolved` : 'not evaluated until annotator CSVs are present'),
  ]
  const report: HumanAuditAdjudicatedAnnotationsReport = {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    status,
    annotatorAPath: options.annotatorACsvPath,
    annotatorBPath: options.annotatorBCsvPath,
    adjudicationTemplatePath: options.adjudicationTemplateCsvPath,
    blindJsonlPath: options.blindJsonlPath,
    adjudicatedCsvPath: options.adjudicatedCsvPath,
    annotatorAPresent,
    annotatorBPresent,
    adjudicationTemplatePresent,
    sampleCount: blindRows.length,
    outputRows: status === 'ready' ? outputRows.length : 0,
    adjudicatedCsvWritten: status === 'ready',
    completedLabels,
    totalLabels,
    unresolvedDisagreements,
    invalidLabels: issues,
    checks,
    readyForAgreement: status === 'ready',
    readyForPaperEvidence: false,
  }
  return { report, rows: outputRows }
}

function renderOutputCsv(rows: CsvRow[]): string {
  const headers = [...OUTPUT_CONTEXT_FIELDS, ...HUMAN_LABEL_FIELDS, 'humanNotes']
  return [
    headers.join(','),
    ...rows.map(row => headers.map(header => csvCell(row[header] ?? '')).join(',')),
    '',
  ].join('\n')
}

function renderReport(report: HumanAuditAdjudicatedAnnotationsReport): string {
  return [
    '# Human Audit Adjudicated Annotations Report',
    '',
    `Generated at: \`${report.generatedAt}\``,
    '',
    `Status: \`${report.status}\``,
    '',
    '| Item | Value |',
    '| --- | ---: |',
    `| Annotator A CSV | \`${basename(report.annotatorAPath)}\` |`,
    `| Annotator B CSV | \`${basename(report.annotatorBPath)}\` |`,
    `| Adjudication template | \`${basename(report.adjudicationTemplatePath)}\` |`,
    `| Adjudicated CSV | \`${basename(report.adjudicatedCsvPath)}\` |`,
    `| Samples | ${report.sampleCount} |`,
    `| Output rows | ${report.outputRows} |`,
    `| Adjudicated CSV written | ${report.adjudicatedCsvWritten ? 'yes' : 'no'} |`,
    `| Completed labels | ${report.completedLabels}/${report.totalLabels} |`,
    `| Unresolved disagreements | ${report.unresolvedDisagreements} |`,
    `| Ready for agreement | ${report.readyForAgreement ? 'yes' : 'no'} |`,
    `| Ready for paper evidence | ${report.readyForPaperEvidence ? 'yes' : 'no'} |`,
    '',
    '## Checks',
    '',
    '| Check | Status | Detail |',
    '| --- | --- | --- |',
    ...report.checks.map(row => `| ${row.id} | \`${row.status}\` | ${escapeMarkdownCell(row.detail)} |`),
    '',
    '## Interpretation',
    '',
    report.status === 'ready'
      ? 'The adjudicated annotation CSV is complete and can be used as input to the human-verifier agreement evaluator.'
      : report.status === 'needs_adjudication'
        ? 'Resolve every missing adjudicated label before using the output as paper evidence.'
        : 'Two annotator CSVs have not been returned yet; this report is a readiness artifact.',
    '',
  ].join('\n')
}

function normalizeHumanLabel(value: string | undefined): NormalizedLabel | null {
  const normalized = (value ?? '').trim().toLowerCase()
  if (!normalized) return null
  if (normalized === 'pass' || normalized === 'yes' || normalized === 'true') return 'pass'
  if (normalized === 'fail' || normalized === 'no' || normalized === 'false') return 'fail'
  if (normalized === 'unknown' || normalized === 'uncertain' || normalized === 'unsure') return 'unknown'
  return null
}

function check(id: string, passed: boolean, detail: string): HumanAuditAdjudicatedAnnotationsReport['checks'][number] {
  return { id, status: passed ? 'pass' : 'fail', detail }
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

function readJsonl<T>(path: string): T[] {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter(line => line.trim())
    .map(line => JSON.parse(line) as T)
}

function csvCell(value: unknown): string {
  return `"${String(value).replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}
