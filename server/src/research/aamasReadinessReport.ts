import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

export type AAMASReadinessStatus = 'pass' | 'needs_experiment' | 'needs_revision'

export interface AAMASReadinessOptions {
  researchRoot: string
  outputDir: string
}

export interface AAMASReadinessGate {
  id: string
  title: string
  status: AAMASReadinessStatus
  evidence: string[]
  finding: string
  requiredAction: string
}

export interface AAMASReadinessReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  paper: string
  localSubmissionHygiene: 'ready' | 'not_ready'
  aamasFullPaperReadiness: 'not_ready' | 'borderline' | 'ready'
  headline: string
  facts: {
    gateStatus: string
    manifestEntries: number
    manifestMissing: number
    localPipelineStatus: string
    localPipelineSteps: number
    aamasPageCount: number | null
    pilot: {
      plainParsed: string
      candidateParsed: string
      tomParsed: string
      tomRepairParsed: string
      verifierRevisionParsed: string
      verifierRevisionHardFailures: string
    }
    fullSplit: {
      decisionPoints: number | null
      deterministicBaselinesHardFailures: number | null
      plainRawPresent: string
      candidateRawPresent: string
      tomRawPresent: string
      tomParsed: string
      tomRepairParsed: string
    }
  }
  gates: AAMASReadinessGate[]
  nextActions: string[]
}

export interface AAMASReadinessResult {
  jsonPath: string
  markdownPath: string
  report: AAMASReadinessReport
}

interface Metrics {
  totalDecisionPoints?: number
  totalParsedTraces?: number
  totalParsedOutputs?: number
  hardFailureCount?: number
  parseFailureCount?: number
  resultFiles?: string[]
  traceFiles?: string[]
  repairStatusCounts?: {
    passThrough: number
    repaired: number
    notRepairable: number
  }
}

interface GateReport {
  overallStatus?: string
  immediateBlockers?: unknown[]
}

interface Manifest {
  entries?: Array<{ status?: string }>
}

interface PipelineReport {
  status?: string
  steps?: unknown[]
}

interface RawAudit {
  expectedCount?: number
  presentCount?: number
  missingCount?: number
  readyForIngest?: boolean
}

export function writeAAMASReadinessReport(options: AAMASReadinessOptions): AAMASReadinessResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = buildAAMASReadinessReport(options.researchRoot)
  const jsonPath = join(options.outputDir, 'aamas-readiness-report.json')
  const markdownPath = join(options.outputDir, 'aamas-readiness-report.md')
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderAAMASReadinessReport(report), 'utf8')
  return { jsonPath, markdownPath, report }
}

export function buildAAMASReadinessReport(researchRoot: string): AAMASReadinessReport {
  const gate = readJsonOptional<GateReport>(researchRoot, 'submission/gate-report/submission-gate-report.json')
  const manifest = readJsonOptional<Manifest>(researchRoot, 'submission/reproducibility-manifest.json')
  const pipeline = readJsonOptional<PipelineReport>(researchRoot, 'submission/local-pipeline/local-research-pipeline-report.json')
  const plain = readJsonOptional<Metrics>(researchRoot, 'experiments/pilot-e4-plain-llm-results/metrics.json')
  const candidate = readJsonOptional<Metrics>(researchRoot, 'experiments/pilot-e5-candidate-constrained-results/metrics.json')
  const tom = readJsonOptional<Metrics>(researchRoot, 'experiments/pilot-e7-tom-prompted-results/metrics.json')
  const tomRepair = readJsonOptional<Metrics>(researchRoot, 'experiments/pilot-e8-tom-schema-repair-results/metrics.json')
  const revision = readJsonOptional<Metrics>(researchRoot, 'experiments/pilot-e6-verifier-revision-results/metrics.json')
  const fullLegal = readJsonOptional<Metrics>(researchRoot, 'experiments/full-e2-heuristic-verifier/metrics.json')
  const fullStrategic = readJsonOptional<Metrics>(researchRoot, 'experiments/full-e3-strategic-heuristic/metrics.json')
  const fullPlainAudit = readJsonOptional<RawAudit>(researchRoot, 'experiments/full-e2-plain-llm-batch/raw-output-audit.json')
  const fullCandidateAudit = readJsonOptional<RawAudit>(researchRoot, 'experiments/full-e3-candidate-constrained-batch/raw-output-audit.json')
  const fullTomAudit = readJsonOptional<RawAudit>(researchRoot, 'experiments/full-e4-tom-prompted-batch/raw-output-audit.json')
  const fullTom = readJsonOptional<Metrics>(researchRoot, 'experiments/full-e4-tom-prompted-results/metrics.json')
  const fullTomRepair = readJsonOptional<Metrics>(researchRoot, 'experiments/full-e5-tom-schema-repair-results/metrics.json')
  const pageCount = readPageCountFromBuildStatus(researchRoot)
  const manifestEntries = manifest?.entries?.length ?? 0
  const manifestMissing = manifest?.entries?.filter(entry => entry.status === 'missing').length ?? 0
  const localSubmissionHygiene = gate?.overallStatus === 'ready'
    && manifestMissing === 0
    && pipeline?.status === 'completed'
    ? 'ready'
    : 'not_ready'
  const fullBaselineHardFailures = sumNullable(fullLegal?.hardFailureCount, fullStrategic?.hardFailureCount)
  const fullTomReady = fullTom?.totalDecisionPoints === 500
    || Boolean(fullTomAudit?.readyForIngest && fullTomAudit.expectedCount === 500)
  const gates: AAMASReadinessGate[] = [
    {
      id: 'local-artifact-hygiene',
      title: 'Local Artifact Hygiene',
      status: localSubmissionHygiene === 'ready' ? 'pass' : 'needs_revision',
      evidence: [
        'submission/gate-report/submission-gate-report.json',
        'submission/reproducibility-manifest.json',
        'submission/local-pipeline/local-research-pipeline-report.json',
      ],
      finding: localSubmissionHygiene === 'ready'
        ? `Local gate is ${gate?.overallStatus ?? 'unknown'}, manifest has ${manifestEntries} entries with ${manifestMissing} missing, and the local pipeline status is ${pipeline?.status ?? 'unknown'}.`
        : 'Local artifact hygiene is not clean enough to support a submission package.',
      requiredAction: localSubmissionHygiene === 'ready'
        ? 'Keep regenerating this report after every experiment or manuscript edit.'
        : 'Fix local blockers before interpreting research readiness.',
    },
    {
      id: 'pilot-evidence',
      title: 'Pilot Evidence and Denominator Accounting',
      status: hasPilotEvidence(plain, candidate, tom, tomRepair, revision) ? 'pass' : 'needs_experiment',
      evidence: [
        'experiments/pilot-metrics-summary/pilot-metrics-summary.json',
        'experiments/pilot-e8-tom-schema-repair-results/metrics.json',
        'figures/figure-2-tom-schema-repair-flow.md',
      ],
      finding: `The pilot now separates provider completion, raw parse yield, schema repair, and verifier failures: ToM raw parse is ${formatParsed(tom)}, schema repair yields ${formatParsed(tomRepair)}, and verifier revision reports ${formatParsed(revision)}.`,
      requiredAction: 'Keep the paper wording scoped to a 50-decision diagnostic pilot unless larger LLM evidence is added.',
    },
    {
      id: 'schema-vs-reasoning-attribution',
      title: 'Schema vs. Reasoning Attribution',
      status: tomRepair?.repairStatusCounts ? 'pass' : 'needs_experiment',
      evidence: [
        'experiments/pilot-e7-tom-failure-analysis/tom-failure-analysis.json',
        'experiments/pilot-e8-tom-schema-repair-results/schema-repair-report.json',
        'experiments/pilot-verifier-attribution/verifier-attribution.json',
      ],
      finding: tomRepair?.repairStatusCounts
        ? `Schema repair passes through ${tomRepair.repairStatusCounts.passThrough}, repairs ${tomRepair.repairStatusCounts.repaired}, leaves ${tomRepair.repairStatusCounts.notRepairable} unrepaired, and preserves the remaining hard verifier failure count at ${tomRepair.hardFailureCount ?? 'unknown'}.`
        : 'The report cannot yet separate schema-interface failures from verifier-visible reasoning failures.',
      requiredAction: 'Use this as a reviewer-facing defense against the claim that all gains are formatting gains.',
    },
    {
      id: 'full-split-substrate',
      title: '500-Decision Substrate',
      status: fullLegal?.totalDecisionPoints === 500 && fullStrategic?.totalDecisionPoints === 500 && fullBaselineHardFailures === 0
        ? 'pass'
        : 'needs_revision',
      evidence: [
        'experiments/full-e1/manifest.json',
        'experiments/full-e2-heuristic-verifier/metrics.json',
        'experiments/full-e3-strategic-heuristic/metrics.json',
      ],
      finding: `The 500-decision substrate is locally executable for deterministic baselines: legal-first hard failures ${fullLegal?.hardFailureCount ?? 'unknown'}, strategic hard failures ${fullStrategic?.hardFailureCount ?? 'unknown'}.`,
      requiredAction: 'Treat these rows as infrastructure validation only; do not use them as LLM evidence.',
    },
    {
      id: 'full-split-llm-evidence',
      title: '500-Decision LLM Evidence',
      status: fullTomReady ? 'pass' : 'needs_experiment',
      evidence: [
        'experiments/full-e4-tom-prompted-results/metrics.json',
        'experiments/full-e4-tom-prompted-results/post-provider-report.json',
        'experiments/provider-results/full-tom-prompted-llm.jsonl',
        'experiments/full-e2-plain-llm-batch/raw-output-audit.json',
        'experiments/full-e3-candidate-constrained-batch/raw-output-audit.json',
        'experiments/full-e4-tom-prompted-batch/raw-output-audit.json',
      ],
      finding: fullTomReady
        ? `The primary 500-decision ToM full-split condition is present with parsed traces ${formatParsed(fullTom)}. Secondary full-split raw audits are plain ${formatRawAudit(fullPlainAudit)} and candidate ${formatRawAudit(fullCandidateAudit)}.`
        : `Full-split raw output audits show plain ${formatRawAudit(fullPlainAudit)}, candidate ${formatRawAudit(fullCandidateAudit)}, and ToM ${formatRawAudit(fullTomAudit)}; deterministic full-ToM schema repair currently yields ${formatParsed(fullTomRepair)}.`,
      requiredAction: fullTomReady
        ? 'Use the ToM full split as the primary larger-scale result, then decide whether plain/candidate full baselines are needed for a stronger final submission.'
        : 'Run at least one full-split LLM condition, preferably ToM plus schema repair first, before broad AAMAS full-paper claims.',
    },
    {
      id: 'replication-and-human-audit',
      title: 'Replication and Human Audit',
      status: 'needs_experiment',
      evidence: [
        'reviews/reviewer_report.md',
        'submission/aamas-latex/main.tex',
      ],
      finding: 'The current package is single-provider at pilot scale and has no human audit artifact for soft strategic labels.',
      requiredAction: 'Add either a second model/provider pilot replication or a small human audit of soft labels; ideally do both before claiming robust multi-agent reasoning behavior.',
    },
    {
      id: 'page-budget',
      title: 'AAMAS Page Budget',
      status: pageCount !== null && pageCount <= 8 ? 'pass' : 'needs_revision',
      evidence: [
        'submission/aamas-latex/main.pdf',
        'submission/aamas-latex/build-status.md',
      ],
      finding: pageCount === null
        ? 'Could not read a page-count line from the LaTeX build status.'
        : `AAMAS-style PDF page count is ${pageCount}.`,
      requiredAction: pageCount !== null && pageCount <= 8
        ? 'Preserve page budget by replacing prose with tables/figures when adding evidence.'
        : 'Compress or restructure the manuscript before adding more results.',
    },
  ]

  return {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    paper: 'Verifiable Multi-Agent Reasoning for LLM Agents in Zero-Communication Mixed-Motive Games',
    localSubmissionHygiene,
    aamasFullPaperReadiness: gates.some(gate => gate.status === 'needs_revision')
      ? 'not_ready'
      : gates.some(gate => gate.id === 'full-split-llm-evidence' && gate.status !== 'pass')
      ? 'not_ready'
      : gates.some(gate => gate.status === 'needs_experiment')
        ? 'borderline'
        : 'ready',
    headline: fullTomReady
      ? 'The package now has a primary 500-decision ToM full-split LLM path; remaining AAMAS risks are replication, human soft-label audit, and optional stronger full-split baselines.'
      : 'The package is locally clean and pilot-complete, but it is not yet an AAMAS full-paper empirical package because full-split LLM evidence and replication/human-audit evidence remain missing.',
    facts: {
      gateStatus: gate?.overallStatus ?? 'unknown',
      manifestEntries,
      manifestMissing,
      localPipelineStatus: pipeline?.status ?? 'unknown',
      localPipelineSteps: pipeline?.steps?.length ?? 0,
      aamasPageCount: pageCount,
      pilot: {
        plainParsed: formatParsed(plain),
        candidateParsed: formatParsed(candidate),
        tomParsed: formatParsed(tom),
        tomRepairParsed: formatParsed(tomRepair),
        verifierRevisionParsed: formatParsed(revision),
        verifierRevisionHardFailures: String(revision?.hardFailureCount ?? 'unknown'),
      },
      fullSplit: {
        decisionPoints: fullLegal?.totalDecisionPoints ?? fullStrategic?.totalDecisionPoints ?? null,
        deterministicBaselinesHardFailures: fullBaselineHardFailures,
        plainRawPresent: formatRawAudit(fullPlainAudit),
        candidateRawPresent: formatRawAudit(fullCandidateAudit),
        tomRawPresent: formatRawAudit(fullTomAudit),
        tomParsed: formatParsed(fullTom),
        tomRepairParsed: formatParsed(fullTomRepair),
      },
    },
    gates,
    nextActions: [
      fullTomReady
        ? 'Add the 500-decision ToM full-split result to the main AAMAS table and update the claims from pilot-only to pilot-plus-full-ToM.'
        : 'Run the 500-decision ToM full-split provider batch first, because it directly tests whether the strongest current prompt scales beyond the pilot.',
      'Run schema repair and verifier analysis on the full-split ToM outputs, preserving selectedActionId exactly as in the pilot ablation.',
      'Add a second provider/model pilot replication or a small human audit of soft labels to reduce single-provider and verifier-subjectivity attacks.',
      'Update the AAMAS draft only after the new evidence exists; keep current broad claims scoped to the 50-decision diagnostic pilot.',
    ],
  }
}

export function renderAAMASReadinessReport(report: AAMASReadinessReport): string {
  const lines = [
    '# AAMAS Full-Paper Readiness Report',
    '',
    `Generated at: \`${report.generatedAt}\``,
    '',
    `Paper: **${report.paper}**`,
    '',
    `Local submission hygiene: \`${report.localSubmissionHygiene}\``,
    `AAMAS full-paper readiness: \`${report.aamasFullPaperReadiness}\``,
    '',
    report.headline,
    '',
    '## Key Facts',
    '',
    '| Item | Value |',
    '| --- | --- |',
    `| Submission gate | \`${report.facts.gateStatus}\` |`,
    `| Manifest | ${report.facts.manifestEntries} entries, ${report.facts.manifestMissing} missing |`,
    `| Local pipeline | \`${report.facts.localPipelineStatus}\`, ${report.facts.localPipelineSteps} steps |`,
    `| AAMAS page count | ${report.facts.aamasPageCount ?? 'unknown'} |`,
    `| Plain pilot parse | ${report.facts.pilot.plainParsed} |`,
    `| Candidate pilot parse | ${report.facts.pilot.candidateParsed} |`,
    `| ToM pilot parse | ${report.facts.pilot.tomParsed} |`,
    `| ToM after schema repair | ${report.facts.pilot.tomRepairParsed} |`,
    `| Verifier revision parse | ${report.facts.pilot.verifierRevisionParsed} |`,
    `| Full split deterministic hard failures | ${report.facts.fullSplit.deterministicBaselinesHardFailures ?? 'unknown'} |`,
    `| Full split plain raw outputs | ${report.facts.fullSplit.plainRawPresent} |`,
    `| Full split candidate raw outputs | ${report.facts.fullSplit.candidateRawPresent} |`,
    `| Full split ToM raw outputs | ${report.facts.fullSplit.tomRawPresent} |`,
    `| Full split ToM parse | ${report.facts.fullSplit.tomParsed} |`,
    `| Full split ToM after schema repair | ${report.facts.fullSplit.tomRepairParsed} |`,
    '',
    '## Gate Audit',
    '',
    '| Gate | Status | Finding | Required action |',
    '| --- | --- | --- | --- |',
    ...report.gates.map(gate => [
      gate.title,
      `\`${gate.status}\``,
      gate.finding,
      gate.requiredAction,
    ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
    '',
    '## Next Actions',
    '',
    ...report.nextActions.map((action, index) => `${index + 1}. ${action}`),
    '',
  ]

  return lines.join('\n')
}

function hasPilotEvidence(...metrics: Array<Metrics | null>): boolean {
  return metrics.every(metric => Boolean(metric?.totalDecisionPoints ?? metric?.resultFiles?.length))
}

function formatParsed(metrics: Metrics | null): string {
  if (!metrics) return 'missing'
  const parsed = metrics.totalParsedTraces
    ?? metrics.totalParsedOutputs
    ?? metrics.traceFiles?.length
    ?? metrics.resultFiles?.length
    ?? 'unknown'
  const total = metrics.totalDecisionPoints ?? 'unknown'
  return `${parsed}/${total}`
}

function formatRawAudit(audit: RawAudit | null): string {
  if (!audit) return 'missing'
  return `${audit.presentCount ?? 'unknown'}/${audit.expectedCount ?? 'unknown'} present`
}

function sumNullable(...values: Array<number | undefined>): number | null {
  if (values.some(value => typeof value !== 'number')) return null
  return values.reduce<number>((sum, value) => sum + (value ?? 0), 0)
}

function readPageCountFromBuildStatus(researchRoot: string): number | null {
  const path = join(researchRoot, 'submission/aamas-latex/build-status.md')
  if (!existsSync(path)) return null
  const text = readFileSync(path, 'utf8')
  const match = text.match(/Page count:\s*(\d+)\s+pages/i)
  return match ? Number(match[1]) : null
}

function readJsonOptional<T>(researchRoot: string, relativePath: string): T | null {
  const path = join(researchRoot, relativePath)
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}
