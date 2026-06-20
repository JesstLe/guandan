import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

export type SelfReviewStatus = 'pass' | 'needs_revision' | 'needs_experiment'
export type SelfReviewOverallStatus = 'submission_ready' | 'needs_revision' | 'needs_experiment'

export interface AAMASSelfReviewOptions {
  researchRoot: string
  outputDir: string
}

export interface SelfReviewItem {
  dimension: 'contribution' | 'writing_clarity' | 'experimental_strength' | 'evaluation_completeness' | 'method_design_soundness'
  question: string
  status: SelfReviewStatus
  reviewerRisk: string
  evidence: string[]
  requiredAction: string
}

export interface ClaimEvidenceItem {
  claim: string
  evidence: string[]
  status: SelfReviewStatus
}

export interface AAMASSelfReviewReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  status: SelfReviewOverallStatus
  paper: string
  facts: {
    aamasReadiness: string
    preflightStatus: string
    visualEvidenceStatus: string
    claimEvidenceStatus: string
    methodReproducibilityStatus: string
    replicationGateStatus: string
    fullSplitGateStatus: string
    pageBudgetGateStatus: string
    manuscriptHasLimitations: boolean
  }
  items: SelfReviewItem[]
  claimEvidenceMap: ClaimEvidenceItem[]
  nextActions: string[]
}

export interface AAMASSelfReviewResult {
  jsonPath: string
  markdownPath: string
  report: AAMASSelfReviewReport
}

interface AAMASReadiness {
  aamasFullPaperReadiness?: string
  gates?: Array<{ id?: string; status?: string; finding?: string; requiredAction?: string }>
  nextActions?: string[]
}

interface PreflightReport {
  status?: string
}

interface VisualEvidenceReport {
  status?: string
  facts?: {
    figureCount?: number
    tableCount?: number
    requiredFigureRolesPresent?: number
    requiredFigureRolesTotal?: number
    requiredTableRolesPresent?: number
    requiredTableRolesTotal?: number
  }
}

interface ClaimEvidenceReportFile {
  status?: 'pass' | 'needs_revision'
  facts?: {
    claimCount?: number
    supportedCount?: number
    scopeLimitedCount?: number
    needsEvidenceCount?: number
  }
}

interface MethodReproducibilityReportFile {
  status?: 'pass' | 'needs_revision'
  facts?: {
    modulesPassing?: number
    modulesTotal?: number
    termsPresent?: number
    termsTotal?: number
    artifactsPresent?: number
    artifactsTotal?: number
    commandsPresent?: number
    commandsTotal?: number
  }
}

export function writeAAMASSelfReviewReport(options: AAMASSelfReviewOptions): AAMASSelfReviewResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = buildAAMASSelfReviewReport(options.researchRoot)
  const jsonPath = join(options.outputDir, 'aamas-self-review-report.json')
  const markdownPath = join(options.outputDir, 'aamas-self-review-report.md')
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderAAMASSelfReviewReport(report), 'utf8')
  return { jsonPath, markdownPath, report }
}

export function buildAAMASSelfReviewReport(researchRoot: string): AAMASSelfReviewReport {
  const readiness = readJsonOptional<AAMASReadiness>(researchRoot, 'submission/aamas-readiness/aamas-readiness-report.json')
  const preflight = readJsonOptional<PreflightReport>(researchRoot, 'submission/preflight/research-preflight-report.json')
  const visual = readJsonOptional<VisualEvidenceReport>(researchRoot, 'submission/visual-evidence/visual-evidence-report.json')
  const claimEvidence = readJsonOptional<ClaimEvidenceReportFile>(researchRoot, 'submission/claim-evidence/claim-evidence-report.json')
  const methodReproducibility = readJsonOptional<MethodReproducibilityReportFile>(researchRoot, 'submission/method-reproducibility/method-reproducibility-report.json')
  const manuscript = readTextOptional(researchRoot, 'submission/aamas-latex/main.tex') ?? ''
  const replicationGate = readiness?.gates?.find(gate => gate.id === 'replication-and-human-audit')
  const fullSplitGate = readiness?.gates?.find(gate => gate.id === 'full-split-llm-evidence')
  const pageBudgetGate = readiness?.gates?.find(gate => gate.id === 'page-budget')
  const visualGate = readiness?.gates?.find(gate => gate.id === 'visual-evidence-package')
  const pilotGate = readiness?.gates?.find(gate => gate.id === 'pilot-evidence')
  const attributionGate = readiness?.gates?.find(gate => gate.id === 'schema-vs-reasoning-attribution')
  const localGate = readiness?.gates?.find(gate => gate.id === 'local-artifact-hygiene')
  const manuscriptHasLimitations = /Threats to Validity/.test(manuscript)
    && /Reviewer-Relevant Boundaries/.test(manuscript)
    && /diagnostic evidence rather than proof of strategic optimality/.test(manuscript)

  const items: SelfReviewItem[] = [
    {
      dimension: 'contribution',
      question: 'Does the paper make a clear, non-trivial contribution beyond building a Guandan bot?',
      status: pilotGate?.status === 'pass' && attributionGate?.status === 'pass' && fullSplitGate?.status === 'pass' ? 'pass' : 'needs_experiment',
      reviewerRisk: 'Reviewers may dismiss the work as a game-specific prompt pipeline unless the diagnostic contribution and full-split evidence stay explicit.',
      evidence: [
        `Pilot gate: ${pilotGate?.status ?? 'missing'}`,
        `Schema-vs-reasoning attribution gate: ${attributionGate?.status ?? 'missing'}`,
        `Full-split LLM evidence gate: ${fullSplitGate?.status ?? 'missing'}`,
      ],
      requiredAction: 'Keep the contribution framed as verifiable reasoning diagnostics under zero communication, not as a stronger card-playing agent.',
    },
    {
      dimension: 'writing_clarity',
      question: 'Can a knowledgeable reader reproduce the method, figures, tables, and artifact boundaries?',
      status: localGate?.status === 'pass'
        && visualGate?.status === 'pass'
        && claimEvidence?.status === 'pass'
        && methodReproducibility?.status === 'pass'
        ? 'pass'
        : 'needs_revision',
      reviewerRisk: 'Unclear artifact boundaries would make the pilot/full-split/protocol distinction look like post-hoc storytelling.',
      evidence: [
        `Local artifact hygiene gate: ${localGate?.status ?? 'missing'}`,
        `Visual evidence gate: ${visualGate?.status ?? 'missing'}`,
        `Visual evidence report: ${visual?.status ?? 'missing'} with ${visual?.facts?.figureCount ?? 'unknown'} figures and ${visual?.facts?.tableCount ?? 'unknown'} tables`,
        `Claim-evidence report: ${claimEvidence?.status ?? 'missing'} with ${claimEvidence?.facts?.needsEvidenceCount ?? 'unknown'} claims needing evidence`,
        `Method reproducibility report: ${methodReproducibility?.status ?? 'missing'} with ${methodReproducibility?.facts?.modulesPassing ?? 'unknown'}/${methodReproducibility?.facts?.modulesTotal ?? 'unknown'} modules passing`,
      ],
      requiredAction: 'Preserve the current denominator, provenance, visual-evidence, and claim-evidence reports whenever the manuscript changes.',
    },
    {
      dimension: 'experimental_strength',
      question: 'Are the empirical effects strong enough for AAMAS rather than only a pilot note?',
      status: fullSplitGate?.status === 'pass' && replicationGate?.status === 'pass' ? 'pass' : 'needs_experiment',
      reviewerRisk: 'The 500-decision ToM evidence is useful, but single-provider/model evidence remains attackable without replication or human validation.',
      evidence: [
        `Full-split LLM evidence gate: ${fullSplitGate?.status ?? 'missing'}`,
        `Replication/human-audit gate: ${replicationGate?.status ?? 'missing'}`,
        replicationGate?.finding ?? 'No replication/human-audit finding found.',
      ],
      requiredAction: replicationGate?.requiredAction ?? 'Complete second-provider/model replication or human soft-label audit.',
    },
    {
      dimension: 'evaluation_completeness',
      question: 'Are important baselines, ablations, metrics, and validation layers complete?',
      status: replicationGate?.status === 'pass' ? 'pass' : 'needs_experiment',
      reviewerRisk: 'Reviewers can still ask whether improvements are provider-specific, prompt-specific, or verifier-subjectivity artifacts.',
      evidence: [
        `Replication/human-audit gate: ${replicationGate?.status ?? 'missing'}`,
        'Pilot ablation and paired attribution are present, but external validation is still pending.',
      ],
      requiredAction: 'Run the fixed second-provider pilot replication when API access is available, or complete the prepared human audit packet.',
    },
    {
      dimension: 'method_design_soundness',
      question: 'Does the paper honestly separate verifier validity from strategic optimality and full-game performance?',
      status: manuscriptHasLimitations && pageBudgetGate?.status === 'pass' ? 'pass' : 'needs_revision',
      reviewerRisk: 'If the paper overclaims strategic optimality, the domain-specific verifier may look like an oracle or a reward model rather than a diagnostic layer.',
      evidence: [
        `Page-budget gate: ${pageBudgetGate?.status ?? 'missing'}`,
        `Limitations and reviewer-boundary text present: ${manuscriptHasLimitations ? 'yes' : 'no'}`,
      ],
      requiredAction: 'Keep the limitation language: verifier labels diagnose reasoning validity, not optimal play or cross-game transfer.',
    },
  ]

  const claimEvidenceMap: ClaimEvidenceItem[] = [
    {
      claim: 'Verifier-grounded reasoning reveals failures hidden by fluent LLM explanations.',
      evidence: [
        'experiments/pilot-e4-plain-llm-results/metrics.json',
        'experiments/pilot-e5-candidate-constrained-results/metrics.json',
        'experiments/pilot-e7-tom-prompted-results/metrics.json',
        'experiments/pilot-verifier-attribution/verifier-attribution.json',
      ],
      status: pilotGate?.status === 'pass' && attributionGate?.status === 'pass' ? 'pass' : 'needs_experiment',
    },
    {
      claim: 'Verifier feedback improves structured reasoning on paired eligible traces.',
      evidence: [
        'experiments/pilot-e6-verifier-revision-results/metrics.json',
        'experiments/pilot-revision-comparison/revision-comparison.json',
        'experiments/pilot-verifier-attribution/verifier-attribution.json',
      ],
      status: attributionGate?.status === 'pass' ? 'pass' : 'needs_experiment',
    },
    {
      claim: 'The evaluation substrate scales beyond the 50-decision pilot to a 500-decision ToM full split.',
      evidence: [
        'experiments/full-e4-tom-prompted-results/metrics.json',
        'experiments/full-e5-tom-schema-repair-results/metrics.json',
        'experiments/full-llm-summary/full-llm-summary.json',
      ],
      status: fullSplitGate?.status === 'pass' ? 'pass' : 'needs_experiment',
    },
    {
      claim: 'The paper is robust to single-provider or verifier-subjectivity attacks.',
      evidence: [
        'experiments/pilot-replication/pilot-replication-report.json',
        'experiments/human-soft-label-audit/human-audit-agreement-report.json',
      ],
      status: replicationGate?.status === 'pass' ? 'pass' : 'needs_experiment',
    },
  ]

  const status: SelfReviewOverallStatus = items.some(item => item.status === 'needs_revision')
    ? 'needs_revision'
    : items.some(item => item.status === 'needs_experiment')
      ? 'needs_experiment'
      : 'submission_ready'

  return {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    status,
    paper: 'Verifiable Multi-Agent Reasoning for LLM Agents in Zero-Communication Mixed-Motive Games',
    facts: {
      aamasReadiness: readiness?.aamasFullPaperReadiness ?? 'missing',
      preflightStatus: preflight?.status ?? 'missing',
      visualEvidenceStatus: visual?.status ?? 'missing',
      claimEvidenceStatus: claimEvidence?.status ?? 'missing',
      methodReproducibilityStatus: methodReproducibility?.status ?? 'missing',
      replicationGateStatus: replicationGate?.status ?? 'missing',
      fullSplitGateStatus: fullSplitGate?.status ?? 'missing',
      pageBudgetGateStatus: pageBudgetGate?.status ?? 'missing',
      manuscriptHasLimitations,
    },
    items,
    claimEvidenceMap,
    nextActions: deriveNextActions(items, readiness?.nextActions ?? []),
  }
}

export function renderAAMASSelfReviewReport(report: AAMASSelfReviewReport): string {
  return [
    '# AAMAS Adversarial Self-Review Report',
    '',
    `Generated at: \`${report.generatedAt}\``,
    '',
    `Paper: **${report.paper}**`,
    '',
    `Status: \`${report.status}\``,
    '',
    '## Facts',
    '',
    `- AAMAS readiness: \`${report.facts.aamasReadiness}\``,
    `- Preflight: \`${report.facts.preflightStatus}\``,
    `- Visual evidence: \`${report.facts.visualEvidenceStatus}\``,
    `- Claim evidence: \`${report.facts.claimEvidenceStatus}\``,
    `- Method reproducibility: \`${report.facts.methodReproducibilityStatus}\``,
    `- Replication/human-audit gate: \`${report.facts.replicationGateStatus}\``,
    `- Full-split LLM gate: \`${report.facts.fullSplitGateStatus}\``,
    `- Page-budget gate: \`${report.facts.pageBudgetGateStatus}\``,
    `- Limitations/reviewer-boundary text present: ${report.facts.manuscriptHasLimitations ? 'yes' : 'no'}`,
    '',
    '## Reviewer-Risk Checklist',
    '',
    '| Dimension | Status | Question | Reviewer Risk | Required Action | Evidence |',
    '| --- | --- | --- | --- | --- | --- |',
    ...report.items.map(item => [
      item.dimension,
      `\`${item.status}\``,
      item.question,
      item.reviewerRisk,
      item.requiredAction,
      item.evidence.map(evidence => `\`${evidence}\``).join('<br>'),
    ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
    '',
    '## Claim-Evidence Map',
    '',
    '| Claim | Status | Evidence |',
    '| --- | --- | --- |',
    ...report.claimEvidenceMap.map(item => [
      item.claim,
      `\`${item.status}\``,
      item.evidence.map(evidence => `\`${evidence}\``).join('<br>'),
    ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
    '',
    '## Next Actions',
    '',
    ...report.nextActions.map((action, index) => `${index + 1}. ${action}`),
    '',
  ].join('\n')
}

function deriveNextActions(items: SelfReviewItem[], readinessActions: string[]): string[] {
  const fromItems = items
    .filter(item => item.status !== 'pass')
    .map(item => item.requiredAction)
  return unique([...fromItems, ...readinessActions]).slice(0, 6)
}

function readJsonOptional<T>(researchRoot: string, relativePath: string): T | null {
  const path = join(researchRoot, relativePath)
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function readTextOptional(researchRoot: string, relativePath: string): string | null {
  const path = join(researchRoot, relativePath)
  if (!existsSync(path)) return null
  return readFileSync(path, 'utf8')
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}
