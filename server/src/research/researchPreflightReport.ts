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
  | 'research_not_ready'
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
  schemaVersion: '0.3.0'
  generatedAt: string
  status: ResearchPreflightStatus
  localReady: boolean
  aamasFullPaperReadiness: 'missing' | 'not_ready' | 'borderline' | 'ready'
  reviewerResponseStatus: 'missing' | 'ready_for_revision' | 'needs_external_evidence' | 'needs_revision'
  submissionGateStatus: string
  manuscriptReadyForSubmission: boolean | null
  manuscriptWordCount: number | null
  markerCounts: ResearchPreflightMarkerCounts
  externalBlockers: string[]
  localBlockers: string[]
  readinessBlockers: ResearchPreflightReadinessBlocker[]
  reviewerResponseBlockers: ResearchPreflightReviewerResponseBlocker[]
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

interface AAMASReadinessReportFile {
  aamasFullPaperReadiness?: 'not_ready' | 'borderline' | 'ready'
  gates?: Array<{
    id?: string
    title?: string
    status?: string
    finding?: string
    requiredAction?: string
  }>
  nextActions?: string[]
}

interface AAMASReviewerResponseMatrixFile {
  status?: 'ready_for_revision' | 'needs_external_evidence' | 'needs_revision'
  summary?: {
    totalConcerns?: number
    answerableNow?: number
    needsExternalEvidence?: number
    needsRevision?: number
  }
  responses?: Array<{
    id?: string
    reviewerRole?: string
    riskLevel?: string
    status?: string
    likelyConcern?: string
    requiredAction?: string
  }>
  nextActions?: string[]
}

export interface ResearchPreflightReadinessBlocker {
  id: string
  title: string
  status: string
  finding: string
  requiredAction: string
}

export interface ResearchPreflightReviewerResponseBlocker {
  id: string
  reviewerRole: string
  riskLevel: string
  status: string
  likelyConcern: string
  requiredAction: string
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
  const aamasReadiness = readOptionalJson<AAMASReadinessReportFile>(
    join(options.researchRoot, 'submission/aamas-readiness/aamas-readiness-report.json'),
  )
  const reviewerResponse = readOptionalJson<AAMASReviewerResponseMatrixFile>(
    join(options.researchRoot, 'submission/aamas-reviewer-response/aamas-reviewer-response-matrix.json'),
  )
  const blockers = gate?.immediateBlockers ?? ['Missing submission/gate-report/submission-gate-report.json.']
  const externalBlockers = blockers.filter(isProviderBlocker)
  const localBlockers = blockers.filter(blocker => !isProviderBlocker(blocker))
  const readinessBlockers = inspectReadinessBlockers(aamasReadiness)
  const reviewerResponseBlockers = inspectReviewerResponseBlockers(reviewerResponse)
  const rawOutputAudits = (options.rawAudits ?? defaultRawAudits()).map(audit => inspectRawAudit(options.researchRoot, audit))
  const localReady = localBlockers.length === 0
  const aamasFullPaperReadiness = aamasReadiness?.aamasFullPaperReadiness ?? 'missing'
  const reviewerResponseStatus = reviewerResponse?.status ?? 'missing'
  const status = determineStatus(
    gate?.overallStatus,
    localBlockers,
    externalBlockers,
    aamasFullPaperReadiness,
    readinessBlockers,
    reviewerResponseBlockers,
  )
  const markerCounts = {
    ...defaultMarkerCounts,
    ...(gate?.markerCounts ?? {}),
  }

  return {
    schemaVersion: '0.3.0',
    generatedAt: new Date().toISOString(),
    status,
    localReady,
    aamasFullPaperReadiness,
    reviewerResponseStatus,
    submissionGateStatus: gate?.overallStatus ?? 'missing',
    manuscriptReadyForSubmission: manuscript?.readyForSubmission ?? null,
    manuscriptWordCount: manuscript?.wordCount ?? null,
    markerCounts,
    externalBlockers,
    localBlockers,
    readinessBlockers,
    reviewerResponseBlockers,
    rawOutputAudits,
    nextActions: buildNextActions(localBlockers, externalBlockers, rawOutputAudits, aamasReadiness, reviewerResponse, reviewerResponseBlockers),
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
    `AAMAS full-paper readiness: \`${report.aamasFullPaperReadiness}\``,
    `Reviewer-response matrix: \`${report.reviewerResponseStatus}\``,
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
    '## AAMAS Readiness Blockers',
    '',
    ...(report.readinessBlockers.length > 0
      ? [
          '| Gate | Status | Finding | Required Action |',
          '| --- | --- | --- | --- |',
          ...report.readinessBlockers.map(blocker => [
            blocker.title,
            `\`${blocker.status}\``,
            blocker.finding,
            blocker.requiredAction,
          ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
        ]
      : ['None.']),
    '',
    '## Reviewer-Response Blockers',
    '',
    ...(report.reviewerResponseBlockers.length > 0
      ? [
          '| Concern | Role | Risk | Status | Required Action |',
          '| --- | --- | --- | --- | --- |',
          ...report.reviewerResponseBlockers.map(blocker => [
            blocker.likelyConcern,
            blocker.reviewerRole,
            blocker.riskLevel,
            `\`${blocker.status}\``,
            blocker.requiredAction,
          ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
        ]
      : ['None.']),
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
  aamasFullPaperReadiness: ResearchPreflightReport['aamasFullPaperReadiness'],
  readinessBlockers: ResearchPreflightReadinessBlocker[],
  reviewerResponseBlockers: ResearchPreflightReviewerResponseBlocker[],
): ResearchPreflightStatus {
  if (externalBlockers.length > 0) return 'waiting_for_provider_results'
  if (gateStatus !== 'ready' || localBlockers.length > 0) return 'local_blockers'
  if (aamasFullPaperReadiness !== 'ready' || readinessBlockers.length > 0 || reviewerResponseBlockers.length > 0) return 'research_not_ready'
  return 'ready_for_submission'
}

function buildNextActions(
  localBlockers: string[],
  externalBlockers: string[],
  rawOutputAudits: ResearchPreflightRawAudit[],
  aamasReadiness: AAMASReadinessReportFile | null,
  reviewerResponse: AAMASReviewerResponseMatrixFile | null,
  reviewerResponseBlockers: ResearchPreflightReviewerResponseBlocker[],
): string[] {
  const actions: string[] = []

  if ((aamasReadiness?.aamasFullPaperReadiness ?? 'missing') !== 'ready') {
    actions.push(...(aamasReadiness?.nextActions ?? ['Generate the AAMAS full-paper readiness report before treating preflight as submission-ready.']))
  }

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

  if (reviewerResponseBlockers.length > 0) {
    actions.push(...(reviewerResponse?.nextActions ?? reviewerResponseBlockers.map(blocker => blocker.requiredAction)))
  }

  if (actions.length === 0) actions.push('Run final submission formatting and venue-specific policy checks.')
  return unique(actions)
}

function inspectReadinessBlockers(aamasReadiness: AAMASReadinessReportFile | null): ResearchPreflightReadinessBlocker[] {
  if (!aamasReadiness) {
    return [{
      id: 'aamas-readiness-report',
      title: 'AAMAS Full-Paper Readiness Report',
      status: 'missing',
      finding: 'The preflight report could not find submission/aamas-readiness/aamas-readiness-report.json.',
      requiredAction: 'Generate the AAMAS readiness report before treating preflight as submission-ready.',
    }]
  }

  return (aamasReadiness.gates ?? [])
    .filter(gate => gate.status !== 'pass')
    .map((gate, index) => ({
      id: gate.id ?? `readiness-gate-${index + 1}`,
      title: gate.title ?? gate.id ?? `Readiness gate ${index + 1}`,
      status: gate.status ?? 'unknown',
      finding: gate.finding ?? 'No finding recorded.',
      requiredAction: gate.requiredAction ?? 'Resolve this readiness gate before submission.',
    }))
}

function inspectReviewerResponseBlockers(
  reviewerResponse: AAMASReviewerResponseMatrixFile | null,
): ResearchPreflightReviewerResponseBlocker[] {
  if (!reviewerResponse) {
    return [{
      id: 'aamas-reviewer-response-matrix',
      reviewerRole: 'area-chair',
      riskLevel: 'high',
      status: 'missing',
      likelyConcern: 'The preflight report could not find submission/aamas-reviewer-response/aamas-reviewer-response-matrix.json.',
      requiredAction: 'Generate the reviewer-response matrix before treating preflight as submission-ready.',
    }]
  }

  if (reviewerResponse.status === 'ready_for_revision') return []

  const unresolvedResponses = (reviewerResponse.responses ?? [])
    .filter(response => response.status !== 'answerable_now')
    .map((response, index) => ({
      id: response.id ?? `reviewer-response-${index + 1}`,
      reviewerRole: response.reviewerRole ?? 'unknown',
      riskLevel: response.riskLevel ?? 'unknown',
      status: response.status ?? reviewerResponse.status ?? 'unknown',
      likelyConcern: response.likelyConcern ?? 'No likely concern recorded.',
      requiredAction: response.requiredAction ?? 'Resolve this reviewer-response concern before treating preflight as submission-ready.',
    }))

  if (unresolvedResponses.length > 0) return unresolvedResponses

  return [{
    id: 'aamas-reviewer-response-matrix',
    reviewerRole: 'area-chair',
    riskLevel: 'high',
    status: reviewerResponse.status ?? 'unknown',
    likelyConcern: 'The reviewer-response matrix is not ready but did not list unresolved responses.',
    requiredAction: 'Regenerate the reviewer-response matrix and resolve any non-answerable concerns.',
  }]
}

function isProviderBlocker(blocker: string): boolean {
  return providerBlockerPatterns.some(pattern => blocker.includes(pattern))
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
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
