import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { buildSubmissionMarkerInventory } from './submissionMarkerInventory'

export type SubmissionGateStatus = 'pass' | 'fail'
export type SubmissionOverallStatus = 'ready' | 'not_ready'

export interface SubmissionGate {
  id: string
  title: string
  status: SubmissionGateStatus
  evidence: string[]
  blockers: string[]
}

export interface SubmissionMarkerCounts {
  NEED_SOURCE: number
  UNCERTAIN: number
  NEED_EXPERIMENT: number
  DO_NOT_SUBMIT: number
  AUTHOR_DECISION: number
}

export interface SubmissionGateReport {
  schemaVersion: '0.1.0'
  overallStatus: SubmissionOverallStatus
  markerCounts: SubmissionMarkerCounts
  gates: SubmissionGate[]
  immediateBlockers: string[]
}

export interface WriteSubmissionGateReportOptions {
  researchRoot: string
  outputDir: string
}

export interface WriteSubmissionGateReportResult {
  jsonPath: string
  markdownPath: string
  report: SubmissionGateReport
}

interface MetricsSummaryFile {
  rows?: Array<{ agentId?: string; status?: string }>
}

interface RevisionComparisonFile {
  status?: string
}

const requiredDraftFiles = [
  '00_claims.md',
  '01_introduction.md',
  '02_related_work.md',
  '03_method.md',
  '04_experiments.md',
  '05_discussion_limitations.md',
  '06_abstract.md',
]

const requiredLLMConditions = [
  'plain-llm',
  'candidate-constrained-llm',
  'verifier-revision-llm',
]

const requiredFirstPassProvenance: Array<{ condition: string; path: string }> = [
  {
    condition: 'plain-llm',
    path: 'experiments/pilot-e4-plain-llm-results/provenance.json',
  },
  {
    condition: 'candidate-constrained-llm',
    path: 'experiments/pilot-e5-candidate-constrained-results/provenance.json',
  },
]

export function writeSubmissionGateReport(options: WriteSubmissionGateReportOptions): WriteSubmissionGateReportResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = buildSubmissionGateReport(options.researchRoot)
  const jsonPath = join(options.outputDir, 'submission-gate-report.json')
  const markdownPath = join(options.outputDir, 'submission-gate-report.md')

  writeJson(jsonPath, report)
  writeFileSync(markdownPath, renderSubmissionGateReportMarkdown(report), 'utf8')

  return { jsonPath, markdownPath, report }
}

export function buildSubmissionGateReport(researchRoot: string): SubmissionGateReport {
  const markerCounts = countMarkers(researchRoot)
  const gates = [
    questionQualityGate(researchRoot),
    relatedWorkGate(researchRoot),
    experimentSufficiencyGate(researchRoot),
    writingReadinessGate(researchRoot, markerCounts),
    submissionReadinessGate(researchRoot, markerCounts),
  ]
  const immediateBlockers = gates.flatMap(gate => gate.blockers)

  return {
    schemaVersion: '0.1.0',
    overallStatus: immediateBlockers.length === 0 ? 'ready' : 'not_ready',
    markerCounts,
    gates,
    immediateBlockers,
  }
}

export function renderSubmissionGateReportMarkdown(report: SubmissionGateReport): string {
  const lines = [
    '# Submission Gate Report',
    '',
    `Overall status: \`${report.overallStatus}\``,
    '',
    '## Marker Counts',
    '',
    '| Marker | Count |',
    '| --- | ---: |',
    ...Object.entries(report.markerCounts).map(([marker, count]) => `| ${marker} | ${count} |`),
    '',
    '## Gates',
    '',
    '| Gate | Status | Blockers |',
    '| --- | --- | --- |',
    ...report.gates.map(gate => `| ${gate.title} | ${gate.status} | ${gate.blockers.length} |`),
    '',
    '## Immediate Blockers',
    '',
    ...(report.immediateBlockers.length > 0
      ? report.immediateBlockers.map(blocker => `- ${blocker}`)
      : ['None.']),
    '',
    '## Evidence',
    '',
    ...report.gates.flatMap(gate => [
      `### ${gate.title}`,
      '',
      ...gate.evidence.map(item => `- ${item}`),
      '',
    ]),
  ]

  return lines.join('\n')
}

function questionQualityGate(researchRoot: string): SubmissionGate {
  const required = ['PROJECT.md', 'idea/research_plan.md', 'drafts/paper-as-code/00_claims.md']
  return fileExistenceGate({
    id: 'question_quality',
    title: 'Gate 1: Question Quality',
    researchRoot,
    required,
  })
}

function relatedWorkGate(researchRoot: string): SubmissionGate {
  const matrixPath = join(researchRoot, 'notes/literature_matrix.csv')
  const gapMapPath = join(researchRoot, 'notes/gap_map.md')
  const blockers: string[] = []
  const evidence: string[] = []

  if (!existsSync(matrixPath)) {
    blockers.push('Missing notes/literature_matrix.csv.')
  } else {
    const matrix = readFileSync(matrixPath, 'utf8')
    const entries = matrix.split(/\r?\n/).filter(line => line.trim()).length - 1
    evidence.push(`Literature matrix has ${Math.max(entries, 0)} entries.`)
    if (matrix.includes('abstract_only')) blockers.push('Literature matrix still contains abstract_only entries.')
  }

  if (!existsSync(gapMapPath)) {
    blockers.push('Missing notes/gap_map.md.')
  } else {
    evidence.push('Gap map exists.')
  }

  return gate('related_work_integrity', 'Gate 2: Related Work Integrity', evidence, blockers)
}

function experimentSufficiencyGate(researchRoot: string): SubmissionGate {
  const evidence: string[] = []
  const blockers: string[] = []
  const metricsPath = join(researchRoot, 'experiments/pilot-metrics-summary/pilot-metrics-summary.json')
  const revisionPath = join(researchRoot, 'experiments/pilot-revision-comparison/revision-comparison.json')

  if (!existsSync(metricsPath)) {
    blockers.push('Missing pilot metrics summary JSON.')
  } else {
    const metrics = readJson<MetricsSummaryFile>(metricsPath)
    const rows = metrics.rows ?? []
    evidence.push(`Pilot metrics summary has ${rows.length} rows.`)
    for (const condition of requiredLLMConditions) {
      const row = rows.find(candidate => candidate.agentId === condition)
      if (!row) {
        blockers.push(`Missing LLM condition ${condition} in metrics summary.`)
      } else if (row.status !== 'metrics_available') {
        blockers.push(`LLM condition ${condition} has status ${row.status}.`)
      }
    }
  }

  if (!existsSync(revisionPath)) {
    blockers.push('Missing verifier-revision comparison JSON.')
  } else {
    const revision = readJson<RevisionComparisonFile>(revisionPath)
    evidence.push(`Verifier-revision comparison status is ${revision.status ?? 'missing'}.`)
    if (revision.status !== 'metrics_available') {
      blockers.push(`Verifier-revision comparison status is ${revision.status ?? 'missing'}.`)
    }
  }

  return gate('experiment_sufficiency', 'Gate 3: Experiment Sufficiency', evidence, blockers)
}

function writingReadinessGate(researchRoot: string, markerCounts: SubmissionMarkerCounts): SubmissionGate {
  const blockers: string[] = []
  const evidence: string[] = []

  for (const file of requiredDraftFiles) {
    const path = join(researchRoot, 'drafts/paper-as-code', file)
    if (existsSync(path)) evidence.push(`${file} exists.`)
    else blockers.push(`Missing drafts/paper-as-code/${file}.`)
  }
  if (markerCounts.NEED_EXPERIMENT > 0) blockers.push(`Submission-relevant files still have ${markerCounts.NEED_EXPERIMENT} NEED_EXPERIMENT markers.`)
  if (markerCounts.NEED_SOURCE > 0) blockers.push(`Submission-relevant files still have ${markerCounts.NEED_SOURCE} NEED_SOURCE markers.`)
  if (markerCounts.UNCERTAIN > 0) blockers.push(`Submission-relevant files still have ${markerCounts.UNCERTAIN} UNCERTAIN markers.`)

  return gate('writing_readiness', 'Gate 4: Writing Readiness', evidence, blockers)
}

function submissionReadinessGate(researchRoot: string, markerCounts: SubmissionMarkerCounts): SubmissionGate {
  const blockers: string[] = []
  const evidence: string[] = []

  if (markerCounts.DO_NOT_SUBMIT > 0) blockers.push(`Submission-relevant files still have ${markerCounts.DO_NOT_SUBMIT} DO_NOT_SUBMIT markers.`)
  if (markerCounts.AUTHOR_DECISION > 0) blockers.push(`Submission-relevant files still have ${markerCounts.AUTHOR_DECISION} AUTHOR_DECISION markers.`)

  for (const provenance of requiredFirstPassProvenance) {
    const status = llmConditionStatus(researchRoot, provenance.condition)
    if (status !== 'metrics_available') {
      evidence.push(`${provenance.path} pending because ${provenance.condition} status is ${status ?? 'missing'}.`)
      continue
    }

    if (existsSync(join(researchRoot, provenance.path))) evidence.push(`${provenance.path} exists.`)
    else blockers.push(`Missing ${provenance.path}.`)
  }

  const disclosurePath = join(researchRoot, 'submission/ai-use-disclosure.md')
  if (existsSync(disclosurePath)) evidence.push('AI-use disclosure draft exists.')
  else blockers.push('Missing submission/ai-use-disclosure.md.')

  return gate('submission_readiness', 'Gate 5: Submission Readiness', evidence, blockers)
}

function fileExistenceGate(options: {
  id: string
  title: string
  researchRoot: string
  required: string[]
}): SubmissionGate {
  const evidence: string[] = []
  const blockers: string[] = []

  for (const file of options.required) {
    if (existsSync(join(options.researchRoot, file))) evidence.push(`${file} exists.`)
    else blockers.push(`Missing ${file}.`)
  }

  return gate(options.id, options.title, evidence, blockers)
}

function gate(id: string, title: string, evidence: string[], blockers: string[]): SubmissionGate {
  return {
    id,
    title,
    status: blockers.length === 0 ? 'pass' : 'fail',
    evidence,
    blockers,
  }
}

function countMarkers(researchRoot: string): SubmissionMarkerCounts {
  return buildSubmissionMarkerInventory(researchRoot).blockingCounts
}

function llmConditionStatus(researchRoot: string, condition: string): string | undefined {
  const metricsPath = join(researchRoot, 'experiments/pilot-metrics-summary/pilot-metrics-summary.json')
  if (!existsSync(metricsPath)) return undefined

  const metrics = readJson<MetricsSummaryFile>(metricsPath)
  return metrics.rows?.find(candidate => candidate.agentId === condition)?.status
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export function relativeToResearchRoot(researchRoot: string, path: string): string {
  return relative(researchRoot, path)
}
