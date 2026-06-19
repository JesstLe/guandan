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
]

const VERIFIER_LABEL_FIELDS = [
  'verifierPartnerConsistent',
  'verifierOpponentConsistent',
  'verifierTeamObjectiveValid',
  'verifierHiddenInfoDisciplined',
  'verifierReasonActionConsistent',
]

const BLIND_REQUIRED_FIELDS = [
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
]

interface CsvRow {
  [key: string]: string
}

interface AuditRow {
  sampleId: string
  decisionId?: string
  scenarioTags?: string
  [key: string]: unknown
}

interface Manifest {
  sampleCount?: number
  stratumCounts?: Record<string, number>
  files?: {
    blindJsonl?: string
    answerKeyJsonl?: string
    annotationSheetCsv?: string
    annotatorHtml?: string
    protocolMarkdown?: string
  }
  status?: string
}

export interface HumanAuditPacketQualityReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  status: 'packet_ready' | 'needs_attention'
  manifestPath: string
  blindJsonlPath: string
  answerKeyJsonlPath: string
  annotationCsvPath: string
  annotatorHtmlPath: string
  protocolPath: string
  sampleCount: number
  expectedSampleCount: number | null
  annotationRowCount: number
  answerKeyRowCount: number
  annotatorEmbeddedSampleCount: number | null
  stratumCounts: Record<string, number>
  checks: Array<{ id: string; status: 'pass' | 'fail'; detail: string }>
  warnings: string[]
  readyForAnnotation: boolean
  readyForPaperEvidence: boolean
}

export interface HumanAuditPacketQualityOptions {
  manifestPath: string
  blindJsonlPath: string
  answerKeyJsonlPath: string
  annotationCsvPath: string
  annotatorHtmlPath: string
  protocolPath: string
  outputDir: string
}

export interface HumanAuditPacketQualityResult {
  jsonPath: string
  markdownPath: string
  report: HumanAuditPacketQualityReport
}

export function writeHumanAuditPacketQualityReport(options: HumanAuditPacketQualityOptions): HumanAuditPacketQualityResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = buildHumanAuditPacketQualityReport(options)
  const jsonPath = join(options.outputDir, 'human-audit-packet-quality-report.json')
  const markdownPath = join(options.outputDir, 'human-audit-packet-quality-report.md')
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderHumanAuditPacketQualityReport(report), 'utf8')
  return { jsonPath, markdownPath, report }
}

export function buildHumanAuditPacketQualityReport(options: HumanAuditPacketQualityOptions): HumanAuditPacketQualityReport {
  const manifest = readJson<Manifest>(options.manifestPath)
  const blindRows = readJsonl<AuditRow>(options.blindJsonlPath)
  const answerRows = readJsonl<AuditRow>(options.answerKeyJsonlPath)
  const annotationRows = parseCsv(readFileSync(options.annotationCsvPath, 'utf8'))
  const annotationHeaders = readCsvHeaders(options.annotationCsvPath)
  const annotatorHtml = readFileSync(options.annotatorHtmlPath, 'utf8')
  const protocol = readFileSync(options.protocolPath, 'utf8')
  const embeddedSamples = readEmbeddedSamples(annotatorHtml)
  const expectedSampleCount = manifest.sampleCount ?? null
  const blindIds = blindRows.map(row => row.sampleId)
  const answerIds = answerRows.map(row => row.sampleId)
  const annotationIds = annotationRows.map(row => row.sampleId)
  const stratumCounts = countBy(blindRows.map(row => String(row.scenarioTags || row.phase || 'unknown')))
  const checks = [
    check('manifest-status', manifest.status === 'annotation_packet_prepared_not_human_completed', `manifest status is ${manifest.status ?? 'missing'}`),
    check('manifest-count', expectedSampleCount === null || expectedSampleCount === blindRows.length, `manifest sampleCount=${expectedSampleCount ?? 'missing'}, blind rows=${blindRows.length}`),
    check('nonempty-sample', blindRows.length > 0, `${blindRows.length} blind samples`),
    check('unique-blind-sample-ids', uniqueCount(blindIds) === blindIds.length, `${uniqueCount(blindIds)}/${blindIds.length} unique blind sample ids`),
    check('answer-key-count', answerRows.length === blindRows.length, `${answerRows.length} answer rows for ${blindRows.length} blind rows`),
    check('answer-key-id-match', sameSet(blindIds, answerIds), 'answer-key sample ids match blind sample ids'),
    check('annotation-row-count', annotationRows.length === blindRows.length, `${annotationRows.length} annotation rows for ${blindRows.length} blind rows`),
    check('annotation-id-match', sameSet(blindIds, annotationIds), 'annotation CSV sample ids match blind sample ids'),
    check('annotation-human-fields', HUMAN_LABEL_FIELDS.every(field => annotationHeaders.includes(field)), 'annotation CSV contains all human label fields'),
    check('blind-required-fields', blindRows.every(row => BLIND_REQUIRED_FIELDS.every(field => Object.prototype.hasOwnProperty.call(row, field))), 'blind JSONL contains all public annotation fields'),
    check('blind-hides-verifier-labels', blindRows.every(row => VERIFIER_LABEL_FIELDS.every(field => !Object.prototype.hasOwnProperty.call(row, field))), 'blind JSONL contains no verifier answer fields'),
    check('answer-key-has-verifier-labels', answerRows.every(row => VERIFIER_LABEL_FIELDS.every(field => Object.prototype.hasOwnProperty.call(row, field))), 'answer key contains all verifier fields'),
    check('annotator-embeds-samples', embeddedSamples !== null && embeddedSamples.length === blindRows.length, `${embeddedSamples?.length ?? 'missing'} embedded samples for ${blindRows.length} blind rows`),
    check('annotator-id-match', embeddedSamples !== null && sameSet(blindIds, embeddedSamples.map(row => row.sampleId)), 'annotator embedded sample ids match blind sample ids'),
    check('protocol-rubric', protocol.includes('## Labeling Rubric') && HUMAN_LABEL_FIELDS.every(field => protocol.includes(field)), 'protocol contains rubric and all human label names'),
  ]
  const warnings = [
    annotationRows.some(row => HUMAN_LABEL_FIELDS.some(field => (row[field] ?? '').trim() !== ''))
      ? null
      : 'Annotation CSV contains no human labels yet; agreement remains pending until annotation is completed.',
    Object.keys(stratumCounts).length < 2
      ? 'Blind sample has fewer than two strata; consider a more diverse audit sample.'
      : null,
  ].filter((value): value is string => value !== null)
  const status = checks.every(row => row.status === 'pass') ? 'packet_ready' : 'needs_attention'

  return {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    status,
    manifestPath: options.manifestPath,
    blindJsonlPath: options.blindJsonlPath,
    answerKeyJsonlPath: options.answerKeyJsonlPath,
    annotationCsvPath: options.annotationCsvPath,
    annotatorHtmlPath: options.annotatorHtmlPath,
    protocolPath: options.protocolPath,
    sampleCount: blindRows.length,
    expectedSampleCount,
    annotationRowCount: annotationRows.length,
    answerKeyRowCount: answerRows.length,
    annotatorEmbeddedSampleCount: embeddedSamples?.length ?? null,
    stratumCounts,
    checks,
    warnings,
    readyForAnnotation: status === 'packet_ready',
    readyForPaperEvidence: false,
  }
}

function renderHumanAuditPacketQualityReport(report: HumanAuditPacketQualityReport): string {
  return [
    '# Human Audit Packet Quality Report',
    '',
    `Generated at: \`${report.generatedAt}\``,
    '',
    `Status: \`${report.status}\``,
    '',
    '| Item | Value |',
    '| --- | ---: |',
    `| Manifest | \`${basename(report.manifestPath)}\` |`,
    `| Blind sample | \`${basename(report.blindJsonlPath)}\` |`,
    `| Answer key | \`${basename(report.answerKeyJsonlPath)}\` |`,
    `| Annotation CSV | \`${basename(report.annotationCsvPath)}\` |`,
    `| Annotator HTML | \`${basename(report.annotatorHtmlPath)}\` |`,
    `| Samples | ${report.sampleCount} |`,
    `| Expected samples | ${report.expectedSampleCount ?? 'n/a'} |`,
    `| Annotation rows | ${report.annotationRowCount} |`,
    `| Answer-key rows | ${report.answerKeyRowCount} |`,
    `| Embedded annotator samples | ${report.annotatorEmbeddedSampleCount ?? 'n/a'} |`,
    `| Ready for annotation | ${report.readyForAnnotation ? 'yes' : 'no'} |`,
    `| Ready for paper evidence | ${report.readyForPaperEvidence ? 'yes' : 'no'} |`,
    '',
    '## Strata',
    '',
    '| Stratum | Samples |',
    '| --- | ---: |',
    ...Object.entries(report.stratumCounts)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([stratum, count]) => `| ${escapeMarkdownCell(stratum)} | ${count} |`),
    '',
    '## Checks',
    '',
    '| Check | Status | Detail |',
    '| --- | --- | --- |',
    ...report.checks.map(row => `| ${row.id} | \`${row.status}\` | ${escapeMarkdownCell(row.detail)} |`),
    '',
    '## Warnings',
    '',
    ...(report.warnings.length > 0 ? report.warnings.map(warning => `- ${warning}`) : ['- none']),
    '',
    '## Interpretation',
    '',
    report.status === 'packet_ready'
      ? 'The packet is ready for human annotation, but it is not human-audit evidence until human labels are completed and the agreement report reaches `completed`.'
      : 'The packet needs attention before annotation because at least one structural check failed.',
    '',
  ].join('\n')
}

function check(id: string, passed: boolean, detail: string): { id: string; status: 'pass' | 'fail'; detail: string } {
  return { id, status: passed ? 'pass' : 'fail', detail }
}

function readCsvHeaders(path: string): string[] {
  const text = readFileSync(path, 'utf8')
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  return firstLine.split(',').map(header => header.trim()).filter(Boolean)
}

function readEmbeddedSamples(html: string): AuditRow[] | null {
  const match = html.match(/<script id="samples-data" type="application\/json">([\s\S]*?)<\/script>/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1]) as unknown
    return Array.isArray(parsed) ? parsed as AuditRow[] : null
  } catch {
    return null
  }
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1
    return counts
  }, {})
}

function uniqueCount(values: string[]): number {
  return new Set(values).size
}

function sameSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false
  const rightSet = new Set(right)
  return left.every(value => rightSet.has(value))
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

  const [headers, ...rows] = records
  if (!headers) return []
  return rows
    .filter(row => row.some(cellValue => cellValue.trim() !== ''))
    .map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])))
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|')
}
