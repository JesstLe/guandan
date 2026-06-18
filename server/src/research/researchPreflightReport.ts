import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

export type ResearchPreflightStatus =
  | 'ready_for_submission'
  | 'waiting_for_provider_results'
  | 'local_blockers'

export interface ResearchPreflightRawAuditInput {
  id: string
  title: string
  path: string
}

export interface ResearchPreflightRawAudit {
  id: string
  title: string
  path: string
  status: 'present' | 'missing'
  expectedCount: number | null
  presentCount: number | null
  missingCount: number | null
  readyForIngest: boolean | null
}

export interface ResearchPreflightMarkerCounts {
  NEED_SOURCE: number
  UNCERTAIN: number
  NEED_EXPERIMENT: number
  DO_NOT_SUBMIT: number
  AUTHOR_DECISION: number
}

export interface ResearchPreflightReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  status: ResearchPreflightStatus
  localReady: boolean
  submissionGateStatus: string
  manuscriptReadyForSubmission: boolean | null
  manuscriptWordCount: number | null
  markerCounts: ResearchPreflightMarkerCounts
  externalBlockers: string[]
  localBlockers: string[]
  rawOutputAudits: ResearchPreflightRawAudit[]
  nextActions: string[]
}

export interface ResearchPreflightReportOptions {
  researchRoot: string
  outputDir: string
  rawAudits?: ResearchPreflightRawAuditInput[]
}

export interface ResearchPreflightReportResult {
  jsonPath: string
  markdownPath: string
  report: ResearchPreflightReport
}

interface SubmissionGateReportFile {
  overallStatus?: string
  markerCounts?: Partial<ResearchPreflightMarkerCounts>
  immediateBlockers?: string[]
}

interface ManuscriptStatusFile {
  readyForSubmission?: boolean
  wordCount?: number
}

interface RawOutputAuditFile {
  expectedCount?: number
  presentCount?: number
  missingCount?: number
  readyForIngest?: boolean
}

const defaultMarkerCounts: ResearchPreflightMarkerCounts = {
  NEED_SOURCE: 0,
  UNCERTAIN: 0,
  NEED_EXPERIMENT: 0,
  DO_NOT_SUBMIT: 0,
  AUTHOR_DECISION: 0,
}

const providerBlockerPatterns = [
  'missing_raw_outputs',
  'Provider Results',
  'provider-result',
  'provider result',
  'raw model outputs',
]

export function writeResearchPreflightReport(options: ResearchPreflightReportOptions): ResearchPreflightReportResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = buildResearchPreflightReport(options)
  const jsonPath = join(options.outputDir, 'research-preflight-report.json')
  const markdownPath = join(options.outputDir, 'research-preflight-report.md')

  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderResearchPreflightReport(report), 'utf8')

  return { jsonPath, markdownPath, report }
}

export function buildResearchPreflightReport(options: ResearchPreflightReportOptions): ResearchPreflightReport {
  const gate = readOptionalJson<SubmissionGateReportFile>(
    join(options.researchRoot, 'submission/gate-report/submission-gate-report.json'),
  )
  const manuscript = readOptionalJson<ManuscriptStatusFile>(
    join(options.researchRoot, 'submission/manuscript/manuscript-status.json'),
  )
  const blockers = gate?.immediateBlockers ?? ['Missing submission/gate-report/submission-gate-report.json.']
  const externalBlockers = blockers.filter(isProviderBlocker)
  const localBlockers = blockers.filter(blocker => !isProviderBlocker(blocker))
  const rawOutputAudits = (options.rawAudits ?? defaultRawAudits()).map(audit => inspectRawAudit(options.researchRoot, audit))
  const localReady = localBlockers.length === 0
  const status = determineStatus(gate?.overallStatus, localBlockers, externalBlockers)
  const markerCounts = {
    ...defaultMarkerCounts,
    ...(gate?.markerCounts ?? {}),
  }

  return {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    status,
    localReady,
    submissionGateStatus: gate?.overallStatus ?? 'missing',
    manuscriptReadyForSubmission: manuscript?.readyForSubmission ?? null,
    manuscriptWordCount: manuscript?.wordCount ?? null,
    markerCounts,
    externalBlockers,
    localBlockers,
    rawOutputAudits,
    nextActions: buildNextActions(localBlockers, externalBlockers, rawOutputAudits),
  }
}

export function renderResearchPreflightReport(report: ResearchPreflightReport): string {
  const lines = [
    '# Research Preflight Report',
    '',
    `Status: \`${report.status}\``,
    `Generated at: \`${report.generatedAt}\``,
    '',
    `Submission gate: \`${report.submissionGateStatus}\``,
    `Local ready: \`${report.localReady}\``,
    `Manuscript ready: \`${report.manuscriptReadyForSubmission}\``,
    `Manuscript words: \`${report.manuscriptWordCount ?? 'unknown'}\``,
    '',
    '## Marker Counts',
    '',
    '| Marker | Count |',
    '| --- | ---: |',
    ...Object.entries(report.markerCounts).map(([marker, count]) => `| ${marker} | ${count} |`),
    '',
    '## Raw Output Audits',
    '',
    '| Condition | Present | Missing | Ready for Ingest |',
    '| --- | ---: | ---: | --- |',
    ...report.rawOutputAudits.map(audit => [
      audit.title,
      String(audit.presentCount ?? 'missing'),
      String(audit.missingCount ?? 'missing'),
      String(audit.readyForIngest ?? false),
    ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
    '',
    '## External Blockers',
    '',
    ...(report.externalBlockers.length > 0 ? report.externalBlockers.map(blocker => `- ${blocker}`) : ['None.']),
    '',
    '## Local Blockers',
    '',
    ...(report.localBlockers.length > 0 ? report.localBlockers.map(blocker => `- ${blocker}`) : ['None.']),
    '',
    '## Next Actions',
    '',
    ...report.nextActions.map((action, index) => `${index + 1}. ${action}`),
    '',
  ]

  return lines.join('\n')
}

function defaultRawAudits(): ResearchPreflightRawAuditInput[] {
  return [
    {
      id: 'plain-llm',
      title: 'Plain LLM',
      path: 'experiments/pilot-e4-plain-llm-results/raw-output-audit.json',
    },
    {
      id: 'candidate-constrained-llm',
      title: 'Candidate-Constrained LLM',
      path: 'experiments/pilot-e5-candidate-constrained-results/raw-output-audit.json',
    },
    {
      id: 'verifier-revision-llm',
      title: 'Verifier Revision LLM',
      path: 'experiments/pilot-e6-verifier-revision-results/raw-output-audit.json',
    },
  ]
}

function inspectRawAudit(researchRoot: string, input: ResearchPreflightRawAuditInput): ResearchPreflightRawAudit {
  const path = join(researchRoot, input.path)
  if (!existsSync(path)) {
    return {
      ...input,
      status: 'missing',
      expectedCount: null,
      presentCount: null,
      missingCount: null,
      readyForIngest: null,
    }
  }

  const audit = readJson<RawOutputAuditFile>(path)
  return {
    ...input,
    status: 'present',
    expectedCount: audit.expectedCount ?? null,
    presentCount: audit.presentCount ?? null,
    missingCount: audit.missingCount ?? null,
    readyForIngest: audit.readyForIngest ?? null,
  }
}

function determineStatus(
  gateStatus: string | undefined,
  localBlockers: string[],
  externalBlockers: string[],
): ResearchPreflightStatus {
  if (gateStatus === 'ready' && localBlockers.length === 0 && externalBlockers.length === 0) return 'ready_for_submission'
  if (externalBlockers.length > 0) return 'waiting_for_provider_results'
  return 'local_blockers'
}

function buildNextActions(
  localBlockers: string[],
  externalBlockers: string[],
  rawOutputAudits: ResearchPreflightRawAudit[],
): string[] {
  const actions: string[] = []

  if (externalBlockers.length > 0) {
    const missingConditions = rawOutputAudits
      .filter(audit => audit.readyForIngest !== true)
      .map(audit => audit.id)
      .join(', ')
    actions.push(`Materialize real provider outputs for: ${missingConditions || 'none'}.`)
  }

  if (localBlockers.length > 0) {
    actions.push('Resolve local blockers after provider outputs are ingested, then regenerate metrics, manuscript, gate, and preflight reports.')
  }

  if (actions.length === 0) actions.push('Run final submission formatting and venue-specific policy checks.')
  return actions
}

function isProviderBlocker(blocker: string): boolean {
  return providerBlockerPatterns.some(pattern => blocker.includes(pattern))
}

function readOptionalJson<T>(path: string): T | null {
  if (!existsSync(path)) return null
  return readJson<T>(path)
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|')
}
