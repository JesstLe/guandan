import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { basename, join } from 'node:path'

const CONTEXT_FIELDS = [
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

type AdjudicationStatus = 'awaiting_returns' | 'needs_attention' | 'ready_for_adjudication' | 'no_adjudication_needed'

interface BlindRow {
  sampleId: string
  decisionId: string
  [key: string]: unknown
}

interface DisagreementRow {
  sampleId: string
  decisionId: string
  label: string
  annotatorA: string
  annotatorB: string
}

interface InterAnnotatorReport {
  status?: string
  disagreementCount?: number
  disagreements?: DisagreementRow[]
  requiresAdjudication?: boolean
}

interface AdjudicationRow extends DisagreementRow {
  context: Record<typeof CONTEXT_FIELDS[number], string>
}

export interface HumanAuditAdjudicationTemplateReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  status: AdjudicationStatus
  interAnnotatorReportPath: string
  blindJsonlPath: string
  templateCsvPath: string
  disagreementCount: number
  templateRows: number
  readyForAdjudication: boolean
  readyForPaperEvidence: false
  checks: Array<{ id: string; status: 'pass' | 'fail'; detail: string }>
}

export interface HumanAuditAdjudicationTemplateOptions {
  interAnnotatorReportPath: string
  blindJsonlPath: string
  outputDir: string
}

export interface HumanAuditAdjudicationTemplateResult {
  jsonPath: string
  markdownPath: string
  templateCsvPath: string
  report: HumanAuditAdjudicationTemplateReport
}

export function writeHumanAuditAdjudicationTemplate(
  options: HumanAuditAdjudicationTemplateOptions,
): HumanAuditAdjudicationTemplateResult {
  mkdirSync(options.outputDir, { recursive: true })
  const result = buildHumanAuditAdjudicationTemplate(options)
  writeFileSync(result.templateCsvPath, renderTemplateCsv(result.rows), 'utf8')
  const jsonPath = join(options.outputDir, 'human-audit-adjudication-template-report.json')
  const markdownPath = join(options.outputDir, 'human-audit-adjudication-template-report.md')
  writeFileSync(jsonPath, `${JSON.stringify(result.report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderTemplateReport(result.report), 'utf8')
  return {
    jsonPath,
    markdownPath,
    templateCsvPath: result.templateCsvPath,
    report: result.report,
  }
}

function buildHumanAuditAdjudicationTemplate(
  options: HumanAuditAdjudicationTemplateOptions,
): { templateCsvPath: string; rows: AdjudicationRow[]; report: HumanAuditAdjudicationTemplateReport } {
  const interReport = readJson<InterAnnotatorReport>(options.interAnnotatorReportPath)
  const blindRows = readJsonl<BlindRow>(options.blindJsonlPath)
  const blindById = new Map(blindRows.map(row => [row.sampleId, row]))
  const disagreements = interReport.disagreements ?? []
  const rows = disagreements.map(disagreement => {
    const blind = blindById.get(disagreement.sampleId)
    return {
      ...disagreement,
      decisionId: disagreement.decisionId || blind?.decisionId || '',
      context: Object.fromEntries(CONTEXT_FIELDS.map(field => [field, String(blind?.[field] ?? '')])) as Record<typeof CONTEXT_FIELDS[number], string>,
    }
  })
  const missingContext = rows.filter(row => !blindById.has(row.sampleId)).map(row => row.sampleId).sort()
  const status = deriveStatus(interReport)
  const checks = [
    check('inter-annotator-completed', interReport.status === 'completed', `inter-annotator status is ${interReport.status ?? 'missing'}`),
    check('blind-context-present', missingContext.length === 0, missingContext.length === 0 ? 'all disagreement rows have blind context' : `missing context for ${missingContext.join(', ')}`),
    check('template-row-count', rows.length === (interReport.disagreementCount ?? rows.length), `${rows.length}/${interReport.disagreementCount ?? rows.length} disagreement rows materialized`),
  ]
  const templateCsvPath = join(options.outputDir, 'human-audit-adjudication-template.csv')
  const report: HumanAuditAdjudicationTemplateReport = {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    status,
    interAnnotatorReportPath: options.interAnnotatorReportPath,
    blindJsonlPath: options.blindJsonlPath,
    templateCsvPath,
    disagreementCount: interReport.disagreementCount ?? rows.length,
    templateRows: rows.length,
    readyForAdjudication: status === 'ready_for_adjudication',
    readyForPaperEvidence: false,
    checks,
  }
  return { templateCsvPath, rows, report }
}

function deriveStatus(report: InterAnnotatorReport): AdjudicationStatus {
  if (report.status === 'awaiting_returns') return 'awaiting_returns'
  if (report.status !== 'completed') return 'needs_attention'
  if ((report.disagreementCount ?? 0) === 0 || report.requiresAdjudication === false) return 'no_adjudication_needed'
  return 'ready_for_adjudication'
}

function renderTemplateCsv(rows: AdjudicationRow[]): string {
  const headers = [
    'sampleId',
    'decisionId',
    'label',
    'annotatorA',
    'annotatorB',
    ...CONTEXT_FIELDS,
    'adjudicatedLabel',
    'adjudicationNotes',
  ]
  return [
    headers.join(','),
    ...rows.map(row => headers.map(header => csvCell(valueForHeader(row, header))).join(',')),
    '',
  ].join('\n')
}

function valueForHeader(row: AdjudicationRow, header: string): string {
  if (header in row.context) return row.context[header as typeof CONTEXT_FIELDS[number]]
  return String((row as unknown as Record<string, unknown>)[header] ?? '')
}

function renderTemplateReport(report: HumanAuditAdjudicationTemplateReport): string {
  return [
    '# Human Audit Adjudication Template Report',
    '',
    `Generated at: \`${report.generatedAt}\``,
    '',
    `Status: \`${report.status}\``,
    '',
    '| Item | Value |',
    '| --- | ---: |',
    `| Inter-annotator report | \`${basename(report.interAnnotatorReportPath)}\` |`,
    `| Blind sample | \`${basename(report.blindJsonlPath)}\` |`,
    `| Template CSV | \`${basename(report.templateCsvPath)}\` |`,
    `| Disagreements | ${report.disagreementCount} |`,
    `| Template rows | ${report.templateRows} |`,
    `| Ready for adjudication | ${report.readyForAdjudication ? 'yes' : 'no'} |`,
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
    report.status === 'ready_for_adjudication'
      ? 'The template contains disagreement rows with public context. Resolve `adjudicatedLabel` without using verifier answer-key labels, then save the reconciled CSV as the adjudicated annotation file.'
      : report.status === 'no_adjudication_needed'
        ? 'The inter-annotator report has no paired disagreements; adjudication is not required.'
        : report.status === 'awaiting_returns'
          ? 'Two annotator CSVs have not been returned yet; this template is a readiness artifact.'
          : 'Resolve inter-annotator structural issues before generating an adjudication-ready template.',
    '',
  ].join('\n')
}

function check(id: string, passed: boolean, detail: string): HumanAuditAdjudicationTemplateReport['checks'][number] {
  return {
    id,
    status: passed ? 'pass' : 'fail',
    detail,
  }
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

function csvCell(value: unknown): string {
  return `"${String(value).replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}
