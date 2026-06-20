import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

export type HumanAuditEvidenceGateStatus =
  | 'needs_attention'
  | 'awaiting_returns'
  | 'ready_for_adjudication'
  | 'needs_adjudication'
  | 'ready_for_agreement'
  | 'paper_evidence_ready'

export interface HumanAuditEvidenceGateOptions {
  researchRoot: string
  outputDir: string
}

export interface HumanAuditEvidenceGateReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  status: HumanAuditEvidenceGateStatus
  facts: {
    launchStatus: string
    sampleCount: number | null
    totalLabels: number | null
    completedLabels: number | null
    annotatorAPresent: boolean
    annotatorBPresent: boolean
    pairedLabels: number | null
    interAnnotatorMacroAgreement: number | null
    disagreementCount: number | null
    adjudicatedStatus: string
    adjudicatedCsvWritten: boolean
    agreementStatus: string
    agreementMacroAgreement: number | null
    readyForPaperEvidence: boolean
  }
  checks: Array<{
    id: string
    status: 'pass' | 'fail' | 'pending'
    finding: string
  }>
  acceptanceCriteria: string[]
  nextActions: string[]
}

export interface HumanAuditEvidenceGateResult {
  jsonPath: string
  markdownPath: string
  report: HumanAuditEvidenceGateReport
}

interface LaunchChecklist {
  status?: string
  facts?: {
    readyForAnnotation?: boolean
    readyForPaperEvidence?: boolean
    sampleCount?: number | null
    totalLabels?: number | null
    completedLabels?: number | null
  }
}

interface InterAnnotatorReport {
  status?: string
  annotatorAPresent?: boolean
  annotatorBPresent?: boolean
  sampleCount?: number
  pairedLabels?: number
  totalLabels?: number
  macroAgreement?: number | null
  disagreementCount?: number
  readyForAdjudication?: boolean
  checks?: Array<{ status?: string }>
}

interface AdjudicatedReport {
  status?: string
  sampleCount?: number
  outputRows?: number
  completedLabels?: number
  totalLabels?: number
  unresolvedDisagreements?: number
  adjudicatedCsvWritten?: boolean
  readyForAgreement?: boolean
  checks?: Array<{ status?: string }>
}

interface AgreementReport {
  status?: string
  sampleCount?: number
  completedLabels?: number
  totalLabels?: number
  remainingLabels?: number
  readyForPaperEvidence?: boolean
  invalidLabels?: unknown[]
  missingAnswerKeys?: unknown[]
  missingAnnotationSampleIds?: unknown[]
  unexpectedAnnotationSampleIds?: unknown[]
  duplicateAnnotationSampleIds?: unknown[]
  macroAgreement?: number | null
}

export function writeHumanAuditEvidenceGate(
  options: HumanAuditEvidenceGateOptions,
): HumanAuditEvidenceGateResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = buildHumanAuditEvidenceGate(options.researchRoot)
  const jsonPath = join(options.outputDir, 'human-audit-evidence-gate.json')
  const markdownPath = join(options.outputDir, 'human-audit-evidence-gate.md')
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderHumanAuditEvidenceGate(report), 'utf8')
  return { jsonPath, markdownPath, report }
}

export function buildHumanAuditEvidenceGate(researchRoot: string): HumanAuditEvidenceGateReport {
  const launch = readJsonOptional<LaunchChecklist>(researchRoot, 'submission/human-audit-launch/human-audit-launch-checklist.json')
  const interAnnotator = readJsonOptional<InterAnnotatorReport>(researchRoot, 'experiments/human-soft-label-audit/human-audit-inter-annotator-agreement-report.json')
  const adjudicated = readJsonOptional<AdjudicatedReport>(researchRoot, 'experiments/human-soft-label-audit/human-audit-adjudicated-annotations-report.json')
  const agreement = readJsonOptional<AgreementReport>(researchRoot, 'experiments/human-soft-label-audit/human-audit-agreement-report.json')

  const sampleCount = launch?.facts?.sampleCount ?? agreement?.sampleCount ?? interAnnotator?.sampleCount ?? adjudicated?.sampleCount ?? null
  const totalLabels = agreement?.totalLabels ?? interAnnotator?.totalLabels ?? adjudicated?.totalLabels ?? launch?.facts?.totalLabels ?? null
  const completedLabels = agreement?.completedLabels ?? adjudicated?.completedLabels ?? launch?.facts?.completedLabels ?? null
  const paperEvidenceReady = agreement?.status === 'completed'
    && agreement.readyForPaperEvidence === true
    && agreement.completedLabels === agreement.totalLabels
    && countAgreementStructuralIssues(agreement) === 0
  const launchReady = launch?.status === 'ready_to_send' || launch?.status === 'evidence_ready'
  const interAnnotatorReturned = interAnnotator?.status === 'completed'
  const adjudicationReady = interAnnotatorReturned && interAnnotator?.readyForAdjudication === true
  const adjudicatedReady = adjudicated?.readyForAgreement === true && adjudicated?.status === 'ready'

  const anyAnnotatorReturnPresent = interAnnotator?.annotatorAPresent === true || interAnnotator?.annotatorBPresent === true
  const checks: HumanAuditEvidenceGateReport['checks'] = [
    check('launch-ready', launchReady, `launch status=${launch?.status ?? 'missing'}`),
    check('two-annotator-returns-present', interAnnotator?.annotatorAPresent === true && interAnnotator?.annotatorBPresent === true, `annotator A present=${String(interAnnotator?.annotatorAPresent ?? false)}, annotator B present=${String(interAnnotator?.annotatorBPresent ?? false)}`, anyAnnotatorReturnPresent),
    check('inter-annotator-structural-complete', interAnnotatorReturned && failedChecks(interAnnotator?.checks) === 0, `inter-annotator status=${interAnnotator?.status ?? 'missing'}, failed checks=${failedChecks(interAnnotator?.checks)}`, interAnnotator?.annotatorAPresent === true && interAnnotator?.annotatorBPresent === true),
    check('all-paired-labels-complete', typeof totalLabels === 'number' && interAnnotator?.pairedLabels === totalLabels, `paired labels=${interAnnotator?.pairedLabels ?? 0}/${totalLabels ?? 'unknown'}`, interAnnotatorReturned),
    check('adjudicated-csv-complete', adjudicatedReady && adjudicated?.completedLabels === adjudicated?.totalLabels && adjudicated.adjudicatedCsvWritten === true, `adjudicated status=${adjudicated?.status ?? 'missing'}, completed=${adjudicated?.completedLabels ?? 0}/${adjudicated?.totalLabels ?? 'unknown'}, written=${String(adjudicated?.adjudicatedCsvWritten ?? false)}`, adjudicationReady || adjudicatedReady),
    check('agreement-complete', paperEvidenceReady, `agreement status=${agreement?.status ?? 'missing'}, completed=${agreement?.completedLabels ?? 0}/${agreement?.totalLabels ?? 'unknown'}, structural issues=${agreement ? countAgreementStructuralIssues(agreement) : 'unknown'}`, adjudicatedReady || paperEvidenceReady),
  ]
  const status = deriveStatus({
    launchReady,
    paperEvidenceReady,
    interAnnotatorReturned,
    adjudicationReady,
    adjudicatedReady,
    adjudicatedStatus: adjudicated?.status,
    hasFailedActiveCheck: checks.some(row => row.status === 'fail'),
  })

  return {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    status,
    facts: {
      launchStatus: launch?.status ?? 'missing',
      sampleCount,
      totalLabels,
      completedLabels,
      annotatorAPresent: interAnnotator?.annotatorAPresent ?? false,
      annotatorBPresent: interAnnotator?.annotatorBPresent ?? false,
      pairedLabels: interAnnotator?.pairedLabels ?? null,
      interAnnotatorMacroAgreement: interAnnotator?.macroAgreement ?? null,
      disagreementCount: interAnnotator?.disagreementCount ?? null,
      adjudicatedStatus: adjudicated?.status ?? 'missing',
      adjudicatedCsvWritten: adjudicated?.adjudicatedCsvWritten ?? false,
      agreementStatus: agreement?.status ?? 'missing',
      agreementMacroAgreement: agreement?.macroAgreement ?? null,
      readyForPaperEvidence: paperEvidenceReady,
    },
    checks,
    acceptanceCriteria: [
      'The blind package launch checklist is ready_to_send or evidence_ready.',
      'Two independent annotator CSVs are returned with the expected sample ids and accepted label values.',
      'Inter-annotator report reaches completed with all paired labels present.',
      'All disagreements, if any, are adjudicated without exposing the verifier answer key to annotators.',
      'The adjudicated CSV is written with all expected labels resolved.',
      'The human-verifier agreement evaluator reaches completed and readyForPaperEvidence=true.',
    ],
    nextActions: deriveNextActions(status),
  }
}

export function renderHumanAuditEvidenceGate(report: HumanAuditEvidenceGateReport): string {
  return [
    '# Human Audit Evidence Gate',
    '',
    `Generated at: \`${report.generatedAt}\``,
    '',
    `Status: \`${report.status}\``,
    '',
    '## Facts',
    '',
    '| Item | Value |',
    '| --- | ---: |',
    `| Launch status | \`${report.facts.launchStatus}\` |`,
    `| Samples | ${report.facts.sampleCount ?? 'unknown'} |`,
    `| Completed labels | ${report.facts.completedLabels ?? 0}/${report.facts.totalLabels ?? 'unknown'} |`,
    `| Annotator A present | ${report.facts.annotatorAPresent ? 'yes' : 'no'} |`,
    `| Annotator B present | ${report.facts.annotatorBPresent ? 'yes' : 'no'} |`,
    `| Paired labels | ${report.facts.pairedLabels ?? 0}/${report.facts.totalLabels ?? 'unknown'} |`,
    `| Inter-annotator macro agreement | ${formatPercentOrNA(report.facts.interAnnotatorMacroAgreement)} |`,
    `| Disagreements | ${report.facts.disagreementCount ?? 'unknown'} |`,
    `| Adjudicated status | \`${report.facts.adjudicatedStatus}\` |`,
    `| Adjudicated CSV written | ${report.facts.adjudicatedCsvWritten ? 'yes' : 'no'} |`,
    `| Human-verifier agreement status | \`${report.facts.agreementStatus}\` |`,
    `| Human-verifier macro agreement | ${formatPercentOrNA(report.facts.agreementMacroAgreement)} |`,
    `| Ready for paper evidence | ${report.facts.readyForPaperEvidence ? 'yes' : 'no'} |`,
    '',
    '## Checks',
    '',
    '| Check | Status | Finding |',
    '| --- | --- | --- |',
    ...report.checks.map(row => `| ${row.id} | \`${row.status}\` | ${escapeMarkdownCell(row.finding)} |`),
    '',
    '## Acceptance Criteria',
    '',
    ...report.acceptanceCriteria.map((criterion, index) => `${index + 1}. ${criterion}`),
    '',
    '## Next Actions',
    '',
    ...report.nextActions.map((action, index) => `${index + 1}. ${action}`),
    '',
  ].join('\n')
}

function deriveStatus(input: {
  launchReady: boolean
  paperEvidenceReady: boolean
  interAnnotatorReturned: boolean
  adjudicationReady: boolean
  adjudicatedReady: boolean
  adjudicatedStatus?: string
  hasFailedActiveCheck: boolean
}): HumanAuditEvidenceGateStatus {
  if (input.paperEvidenceReady) return 'paper_evidence_ready'
  if (!input.launchReady) return 'needs_attention'
  if (input.hasFailedActiveCheck && input.interAnnotatorReturned) return 'needs_attention'
  if (input.adjudicatedReady) return 'ready_for_agreement'
  if (input.adjudicatedStatus === 'needs_adjudication') return 'needs_adjudication'
  if (input.adjudicationReady) return 'ready_for_adjudication'
  return 'awaiting_returns'
}

function deriveNextActions(status: HumanAuditEvidenceGateStatus): string[] {
  if (status === 'paper_evidence_ready') {
    return ['Refresh AAMAS readiness, reviewer-response, preflight, and finalizer reports, then add the human-audit agreement result to the paper evidence package.']
  }
  if (status === 'ready_for_agreement') {
    return ['Run `npm run research:human-audit:agreement` to produce the paper-facing human-verifier agreement report.']
  }
  if (status === 'needs_adjudication') {
    return ['Complete every missing adjudicated label in the adjudication template, then run `npm run research:human-audit:build-adjudicated`.']
  }
  if (status === 'ready_for_adjudication') {
    return ['Run `npm run research:human-audit:adjudication-template`, adjudicate disagreements without the verifier answer key, then run `npm run research:human-audit:build-adjudicated`.']
  }
  if (status === 'awaiting_returns') {
    return ['Send the blind archive to two independent annotators, save their returned CSVs under the expected filenames, then run the inter-annotator and adjudication commands.']
  }
  return ['Regenerate the launch checklist, blind annotator package, archive report, and upstream human-audit reports before sending anything externally.']
}

function check(
  id: string,
  passed: boolean,
  finding: string,
  active = true,
): HumanAuditEvidenceGateReport['checks'][number] {
  return {
    id,
    status: !active ? 'pending' : passed ? 'pass' : 'fail',
    finding,
  }
}

function failedChecks(checks: Array<{ status?: string }> | undefined): number {
  return checks?.filter(row => row.status === 'fail').length ?? 0
}

function countAgreementStructuralIssues(report: AgreementReport): number {
  return [
    report.invalidLabels?.length ?? 0,
    report.missingAnswerKeys?.length ?? 0,
    report.missingAnnotationSampleIds?.length ?? 0,
    report.unexpectedAnnotationSampleIds?.length ?? 0,
    report.duplicateAnnotationSampleIds?.length ?? 0,
  ].reduce((sum, count) => sum + count, 0)
}

function readJsonOptional<T>(root: string, relativePath: string): T | null {
  try {
    return JSON.parse(readFileSync(join(root, relativePath), 'utf8')) as T
  } catch {
    return null
  }
}

function formatPercentOrNA(value: number | null): string {
  if (value === null) return 'n/a'
  return `${(value * 100).toFixed(1)}%`
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|')
}
