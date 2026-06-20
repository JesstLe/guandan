import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

export type ReviewerResponseStatus = 'answerable_now' | 'needs_external_evidence' | 'needs_revision'
export type ReviewerResponseMatrixStatus = 'ready_for_revision' | 'needs_external_evidence' | 'needs_revision'
export type ReviewerRole =
  | 'area-chair'
  | 'experiment-reviewer'
  | 'method-reviewer'
  | 'related-work-reviewer'
  | 'reproducibility-reviewer'
  | 'skeptical-reviewer'

export interface AAMASReviewerResponseMatrixOptions {
  researchRoot: string
  outputDir: string
}

export interface ReviewerResponseItem {
  id: string
  reviewerRole: ReviewerRole
  riskLevel: 'high' | 'medium' | 'low'
  likelyConcern: string
  currentResponse: string
  evidence: string[]
  scopeBoundary: string
  requiredAction: string
  status: ReviewerResponseStatus
}

export interface AAMASReviewerResponseMatrixReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  paper: string
  status: ReviewerResponseMatrixStatus
  facts: {
    aamasReadiness: string
    selfReviewStatus: string
    claimEvidenceStatus: string
    methodReproducibilityStatus: string
    visualEvidenceStatus: string
    replicationGateStatus: string
    fullSplitGateStatus: string
    pageBudgetGateStatus: string
    manuscriptHasReviewerBoundaries: boolean
  }
  summary: {
    totalConcerns: number
    answerableNow: number
    needsExternalEvidence: number
    needsRevision: number
  }
  responses: ReviewerResponseItem[]
  nextActions: string[]
}

export interface AAMASReviewerResponseMatrixResult {
  jsonPath: string
  markdownPath: string
  report: AAMASReviewerResponseMatrixReport
}

interface ReadinessReport {
  aamasFullPaperReadiness?: string
  gates?: Array<{
    id?: string
    status?: string
    finding?: string
    requiredAction?: string
    evidence?: string[]
  }>
  nextActions?: string[]
}

interface SelfReviewReport {
  status?: string
  items?: Array<{
    dimension?: string
    status?: string
    reviewerRisk?: string
    evidence?: string[]
    requiredAction?: string
  }>
}

interface ClaimEvidenceReport {
  status?: string
}

interface MethodReproducibilityReport {
  status?: string
}

interface VisualEvidenceReport {
  status?: string
}

export function writeAAMASReviewerResponseMatrix(
  options: AAMASReviewerResponseMatrixOptions,
): AAMASReviewerResponseMatrixResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = buildAAMASReviewerResponseMatrix(options.researchRoot)
  const jsonPath = join(options.outputDir, 'aamas-reviewer-response-matrix.json')
  const markdownPath = join(options.outputDir, 'aamas-reviewer-response-matrix.md')
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderAAMASReviewerResponseMatrix(report), 'utf8')
  return { jsonPath, markdownPath, report }
}

export function buildAAMASReviewerResponseMatrix(researchRoot: string): AAMASReviewerResponseMatrixReport {
  const readiness = readJsonOptional<ReadinessReport>(researchRoot, 'submission/aamas-readiness/aamas-readiness-report.json')
  const selfReview = readJsonOptional<SelfReviewReport>(researchRoot, 'submission/aamas-self-review/aamas-self-review-report.json')
  const claimEvidence = readJsonOptional<ClaimEvidenceReport>(researchRoot, 'submission/claim-evidence/claim-evidence-report.json')
  const methodReproducibility = readJsonOptional<MethodReproducibilityReport>(researchRoot, 'submission/method-reproducibility/method-reproducibility-report.json')
  const visualEvidence = readJsonOptional<VisualEvidenceReport>(researchRoot, 'submission/visual-evidence/visual-evidence-report.json')
  const manuscript = readTextOptional(researchRoot, 'submission/aamas-latex/main.tex') ?? ''

  const pilotGate = gateById(readiness, 'pilot-evidence')
  const attributionGate = gateById(readiness, 'schema-vs-reasoning-attribution')
  const fullSplitGate = gateById(readiness, 'full-split-llm-evidence')
  const replicationGate = gateById(readiness, 'replication-and-human-audit')
  const visualGate = gateById(readiness, 'visual-evidence-package')
  const pageBudgetGate = gateById(readiness, 'page-budget')
  const localGate = gateById(readiness, 'local-artifact-hygiene')
  const contributionItem = selfItemByDimension(selfReview, 'contribution')
  const methodItem = selfItemByDimension(selfReview, 'method_design_soundness')
  const experimentalItem = selfItemByDimension(selfReview, 'experimental_strength')
  const evaluationItem = selfItemByDimension(selfReview, 'evaluation_completeness')
  const manuscriptHasReviewerBoundaries = /Reviewer-Relevant Boundaries/.test(manuscript)
    && /diagnostic evidence rather than proof of strategic optimality/.test(manuscript)
    && /not be framed as introducing Guandan/.test(manuscript)

  const rawResponses: ReviewerResponseItem[] = [
    {
      id: 'not-a-guandan-bot',
      reviewerRole: 'area-chair',
      riskLevel: 'high',
      likelyConcern: 'Is this just a Guandan bot or a game-specific prompting pipeline?',
      currentResponse: 'The contribution is a verifier-grounded diagnostic framework for structured LLM reasoning under zero communication; Guandan is the dense imperfect-information testbed, not the claimed product.',
      evidence: [
        'submission/aamas-latex/main.tex',
        'submission/claim-evidence/claim-evidence-report.json',
        'submission/aamas-self-review/aamas-self-review-report.json',
        ...gateEvidence(pilotGate),
        ...gateEvidence(attributionGate),
        ...gateEvidence(fullSplitGate),
      ],
      scopeBoundary: 'The paper does not claim stronger Guandan play, win-rate improvement, or a general game-solving policy.',
      requiredAction: contributionItem?.requiredAction ?? 'Keep contribution language scoped to verifiable reasoning diagnostics.',
      status: allPass(pilotGate, attributionGate, fullSplitGate) && contributionItem?.status === 'pass'
        ? 'answerable_now'
        : 'needs_revision',
    },
    {
      id: 'single-provider-robustness',
      reviewerRole: 'experiment-reviewer',
      riskLevel: 'high',
      likelyConcern: 'Are the results specific to one provider, one model, or one prompting stack?',
      currentResponse: 'The current artifacts include a completed primary ToM full split and a ready second-provider pilot package, but independent provider/model outputs are not yet paper evidence.',
      evidence: [
        ...gateEvidence(fullSplitGate),
        'experiments/pilot-replication/second-provider-replication-package-report.json',
        'experiments/pilot-replication/second-provider-replication-preflight.json',
        'experiments/pilot-replication/pilot-replication-report.json',
      ],
      scopeBoundary: 'Do not claim provider robustness until second-provider/model outputs return and are ingested.',
      requiredAction: replicationGate?.requiredAction ?? experimentalItem?.requiredAction ?? 'Run second-provider/model replication.',
      status: replicationGate?.status === 'pass' ? 'answerable_now' : 'needs_external_evidence',
    },
    {
      id: 'schema-vs-reasoning',
      reviewerRole: 'method-reviewer',
      riskLevel: 'high',
      likelyConcern: 'Are the gains merely schema formatting rather than improved reasoning validity?',
      currentResponse: 'The paper separates raw parse yield, deterministic schema repair, paired verifier revision, and hard-failure attribution; the attribution gate specifically isolates public-history and hidden-information repairs.',
      evidence: [
        ...gateEvidence(pilotGate),
        ...gateEvidence(attributionGate),
        'experiments/pilot-e8-tom-schema-repair-results/schema-repair-report.json',
        'experiments/pilot-verifier-attribution/verifier-attribution.json',
        'figures/figure-4-main-pilot-results.md',
      ],
      scopeBoundary: 'Schema repair is reported as reliability plumbing; paired hard-label changes are the reasoning-validity evidence.',
      requiredAction: attributionGate?.requiredAction ?? 'Keep parse and reasoning validity denominators separate.',
      status: allPass(pilotGate, attributionGate) ? 'answerable_now' : 'needs_revision',
    },
    {
      id: 'verifier-as-oracle',
      reviewerRole: 'skeptical-reviewer',
      riskLevel: 'medium',
      likelyConcern: 'Does the verifier act as an oracle or silently choose better actions?',
      currentResponse: 'The verifier maps a fixed state, trace, and selected action to labels and issue codes; revision repairs commitments under the same decision id and the manuscript explicitly separates reasoning validity from optimal play.',
      evidence: [
        'server/src/research/reasoningVerifier.ts',
        'server/src/research/reasoningVerifier.test.ts',
        'submission/aamas-latex/main.tex',
        'figures/figure-2-revision-architecture.md',
        ...(methodItem?.evidence ?? []),
      ],
      scopeBoundary: 'Verifier labels diagnose validity and evidence boundaries; they are not strategic optimality labels and not full-game outcome claims.',
      requiredAction: methodItem?.requiredAction ?? 'Preserve the verifier-boundary language in Method and Limitations.',
      status: methodItem?.status === 'pass' && manuscriptHasReviewerBoundaries ? 'answerable_now' : 'needs_revision',
    },
    {
      id: 'denominator-cherry-picking',
      reviewerRole: 'experiment-reviewer',
      riskLevel: 'high',
      likelyConcern: 'Are parse failures hidden by reporting only the favorable paired subset?',
      currentResponse: 'The paper exposes provider completion, parse yield, schema failures, paired revision denominator, and provenance tables; paired analysis is restricted to eligible traces but end-to-end failures remain visible.',
      evidence: [
        ...gateEvidence(pilotGate),
        ...gateEvidence(visualGate),
        'tables/table-2-reasoning-reliability.md',
        'submission/aamas-latex/main.tex',
        'submission/visual-evidence/visual-evidence-report.json',
      ],
      scopeBoundary: 'The 32-trace paired result must always be read alongside 50-decision end-to-end accounting.',
      requiredAction: 'Keep Table 4/Figure 4 denominator language and provenance table wording intact after every edit.',
      status: allPass(pilotGate, visualGate) ? 'answerable_now' : 'needs_revision',
    },
    {
      id: 'related-work-novelty',
      reviewerRole: 'related-work-reviewer',
      riskLevel: 'medium',
      likelyConcern: 'Is the contribution novel relative to LLM coordination, Hanabi, ToM-Guandan, ToolPoker, and process-aware mixed-motive evaluation?',
      currentResponse: 'The manuscript positions the paper narrowly around deterministic checking of structured traces in zero-explicit-communication, mixed-motive, dynamic-action team play.',
      evidence: [
        'submission/aamas-latex/main.tex',
        'notes/literature_matrix.csv',
        'notes/knowledge_base.md',
        'submission/references.bib',
        'submission/claim-evidence/claim-evidence-report.json',
      ],
      scopeBoundary: 'The paper must not claim to introduce Guandan, ToM prompting, LLM game agents, or action-space reduction.',
      requiredAction: 'Keep related-work limitations explicit and refresh novelty checks before final submission.',
      status: claimEvidence?.status === 'pass' && manuscriptHasReviewerBoundaries ? 'answerable_now' : 'needs_revision',
    },
    {
      id: 'human-soft-label-subjectivity',
      reviewerRole: 'experiment-reviewer',
      riskLevel: 'high',
      likelyConcern: 'Are the soft partner/opponent labels subjective or tuned to the authors expectations?',
      currentResponse: 'A blind human-audit packet and annotator package exist, but no returned labels or agreement metrics are available yet; this remains an external-evidence gap.',
      evidence: [
        'experiments/human-soft-label-audit/human-audit-packet-quality-report.json',
        'experiments/human-soft-label-audit/human-audit-annotator-package-archive-report.json',
        'experiments/human-soft-label-audit/human-audit-agreement-report.json',
      ],
      scopeBoundary: 'Treat soft labels as conservative diagnostics until human agreement evidence is complete.',
      requiredAction: evaluationItem?.requiredAction ?? replicationGate?.requiredAction ?? 'Complete human soft-label audit.',
      status: replicationGate?.status === 'pass' ? 'answerable_now' : 'needs_external_evidence',
    },
    {
      id: 'page-budget-and-polish',
      reviewerRole: 'area-chair',
      riskLevel: 'medium',
      likelyConcern: 'Can the paper fit a full AAMAS submission without looking like a protocol dump?',
      currentResponse: 'The AAMAS-style PDF remains 9 pages total with the main body ending on page 8, and the visual package provides five role-covered figures and nine compact tables.',
      evidence: [
        ...gateEvidence(pageBudgetGate),
        ...gateEvidence(visualGate),
        'submission/aamas-latex/page-renders',
      ],
      scopeBoundary: 'New evidence should replace protocol scaffolding rather than expanding the 8-page body.',
      requiredAction: pageBudgetGate?.requiredAction ?? 'Preserve the 8-page body budget.',
      status: allPass(pageBudgetGate, visualGate) ? 'answerable_now' : 'needs_revision',
    },
    {
      id: 'artifact-reproducibility',
      reviewerRole: 'reproducibility-reviewer',
      riskLevel: 'medium',
      likelyConcern: 'Are the reported numbers, figures, and tables reproducible from local artifacts?',
      currentResponse: 'The finalizer, manifest, local pipeline, method reproducibility report, and claim-evidence report are present; local artifact hygiene passes with no missing manifest entries.',
      evidence: [
        ...gateEvidence(localGate),
        'submission/method-reproducibility/method-reproducibility-report.json',
        'submission/finalizer/aamas-submission-finalizer-report.json',
      ],
      scopeBoundary: 'Reproducibility covers current local artifacts, not unavailable second-provider or returned human-audit evidence.',
      requiredAction: 'Run the finalizer after every manuscript, experiment, or figure change.',
      status: localGate?.status === 'pass' && methodReproducibility?.status === 'pass' ? 'answerable_now' : 'needs_revision',
    },
  ]

  const responses = rawResponses.map(response => ({
    ...response,
    evidence: unique(response.evidence),
  }))

  const summary = {
    totalConcerns: responses.length,
    answerableNow: responses.filter(response => response.status === 'answerable_now').length,
    needsExternalEvidence: responses.filter(response => response.status === 'needs_external_evidence').length,
    needsRevision: responses.filter(response => response.status === 'needs_revision').length,
  }
  const status: ReviewerResponseMatrixStatus = summary.needsRevision > 0
    ? 'needs_revision'
    : summary.needsExternalEvidence > 0
      ? 'needs_external_evidence'
      : 'ready_for_revision'

  return {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    paper: 'Verifiable Multi-Agent Reasoning for LLM Agents in Zero-Communication Mixed-Motive Games',
    status,
    facts: {
      aamasReadiness: readiness?.aamasFullPaperReadiness ?? 'missing',
      selfReviewStatus: selfReview?.status ?? 'missing',
      claimEvidenceStatus: claimEvidence?.status ?? 'missing',
      methodReproducibilityStatus: methodReproducibility?.status ?? 'missing',
      visualEvidenceStatus: visualEvidence?.status ?? 'missing',
      replicationGateStatus: replicationGate?.status ?? 'missing',
      fullSplitGateStatus: fullSplitGate?.status ?? 'missing',
      pageBudgetGateStatus: pageBudgetGate?.status ?? 'missing',
      manuscriptHasReviewerBoundaries,
    },
    summary,
    responses,
    nextActions: deriveNextActions(responses, readiness?.nextActions ?? []),
  }
}

export function renderAAMASReviewerResponseMatrix(report: AAMASReviewerResponseMatrixReport): string {
  return [
    '# AAMAS Reviewer-Response Matrix',
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
    `- Self-review: \`${report.facts.selfReviewStatus}\``,
    `- Claim evidence: \`${report.facts.claimEvidenceStatus}\``,
    `- Method reproducibility: \`${report.facts.methodReproducibilityStatus}\``,
    `- Visual evidence: \`${report.facts.visualEvidenceStatus}\``,
    `- Replication/human-audit gate: \`${report.facts.replicationGateStatus}\``,
    `- Full-split LLM gate: \`${report.facts.fullSplitGateStatus}\``,
    `- Page-budget gate: \`${report.facts.pageBudgetGateStatus}\``,
    `- Reviewer-boundary language present: ${report.facts.manuscriptHasReviewerBoundaries ? 'yes' : 'no'}`,
    '',
    '## Summary',
    '',
    `- Total concerns: ${report.summary.totalConcerns}`,
    `- Answerable now: ${report.summary.answerableNow}`,
    `- Needs external evidence: ${report.summary.needsExternalEvidence}`,
    `- Needs revision: ${report.summary.needsRevision}`,
    '',
    '## Matrix',
    '',
    '| ID | Role | Risk | Status | Likely Concern | Current Response | Scope Boundary | Required Action | Evidence |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...report.responses.map(response => [
      response.id,
      response.reviewerRole,
      response.riskLevel,
      `\`${response.status}\``,
      response.likelyConcern,
      response.currentResponse,
      response.scopeBoundary,
      response.requiredAction,
      response.evidence.map(evidence => `\`${evidence}\``).join('<br>'),
    ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
    '',
    '## Next Actions',
    '',
    ...report.nextActions.map((action, index) => `${index + 1}. ${action}`),
    '',
  ].join('\n')
}

function gateById(report: ReadinessReport | null, id: string): NonNullable<ReadinessReport['gates']>[number] | null {
  return report?.gates?.find(gate => gate.id === id) ?? null
}

function selfItemByDimension(report: SelfReviewReport | null, dimension: string): NonNullable<SelfReviewReport['items']>[number] | null {
  return report?.items?.find(item => item.dimension === dimension) ?? null
}

function allPass(...gates: Array<{ status?: string } | null>): boolean {
  return gates.every(gate => gate?.status === 'pass')
}

function gateEvidence(gate: { evidence?: string[] } | null): string[] {
  return gate?.evidence ?? []
}

function deriveNextActions(responses: ReviewerResponseItem[], readinessActions: string[]): string[] {
  return unique([
    ...responses
      .filter(response => response.status !== 'answerable_now')
      .map(response => response.requiredAction),
    ...readinessActions,
  ]).slice(0, 8)
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
