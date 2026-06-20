import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

export type ClaimEvidenceStatus = 'supported' | 'scope_limited' | 'needs_evidence'
export type ClaimEvidenceReportStatus = 'pass' | 'needs_revision'

export interface ClaimEvidenceReportOptions {
  researchRoot: string
  outputDir: string
}

export interface ClaimEvidenceItem {
  id: string
  location: 'abstract' | 'introduction'
  claim: string
  evidence: string[]
  status: ClaimEvidenceStatus
  scopeBoundary: string
  requiredAction: string
}

export interface ClaimEvidenceReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  status: ClaimEvidenceReportStatus
  manuscriptPath: string
  facts: {
    claimCount: number
    supportedCount: number
    scopeLimitedCount: number
    needsEvidenceCount: number
    manuscriptMentionsDecisionPointScope: boolean
    manuscriptMentionsFullGameFollowup: boolean
  }
  claims: ClaimEvidenceItem[]
}

export interface ClaimEvidenceReportResult {
  jsonPath: string
  markdownPath: string
  report: ClaimEvidenceReport
}

interface EvidenceSpec {
  path: string
  required?: boolean
}

interface ClaimSpec {
  id: string
  location: 'abstract' | 'introduction'
  claim: string
  evidence: EvidenceSpec[]
  scopeBoundary: string
  requiredAction: string
}

const claimSpecs: ClaimSpec[] = [
  {
    id: 'problem-outcomes-and-fluent-explanations',
    location: 'abstract',
    claim: 'Final outcomes and fluent explanations do not guarantee valid multi-agent reasoning.',
    evidence: [
      { path: 'experiments/pilot-metrics-summary/pilot-metrics-summary.json' },
      { path: 'experiments/pilot-verifier-attribution/verifier-attribution.json' },
      { path: 'submission/aamas-latex/main.tex' },
    ],
    scopeBoundary: 'Supported as a decision-point diagnostic claim; the paper does not claim full-game outcome correlation.',
    requiredAction: 'Keep the limitation that outcome correlation is future work.',
  },
  {
    id: 'framework-structured-decision-points',
    location: 'abstract',
    claim: 'The framework evaluates LLM agents through structured decision points and reasoning traces.',
    evidence: [
      { path: 'schemas/decision-point.schema.json' },
      { path: 'schemas/reasoning-trace.schema.json' },
      { path: 'experiments/pilot-e1/manifest.json' },
      { path: 'experiments/full-e1/manifest.json' },
    ],
    scopeBoundary: 'Supported as a framework and artifact claim.',
    requiredAction: 'Preserve schema paths and dataset manifests in the reproducibility package.',
  },
  {
    id: 'verifier-rule-grounded-labels',
    location: 'abstract',
    claim: 'A rule-grounded verifier checks legal action constraints, public history, hidden-information discipline, and reasoning-action consistency.',
    evidence: [
      { path: 'server/src/research/reasoningVerifier.ts' },
      { path: 'server/src/research/reasoningVerifier.test.ts' },
      { path: 'experiments/pilot-e2-heuristic-verifier/metrics.json' },
      { path: 'experiments/pilot-e3-strategic-heuristic/metrics.json' },
    ],
    scopeBoundary: 'Supported for implemented hard checks and conservative soft labels; not a proof of strategic optimality.',
    requiredAction: 'Keep hard and soft labels separated in text and tables.',
  },
  {
    id: 'guandan-testbed-properties',
    location: 'abstract',
    claim: 'Guandan instantiates a four-player imperfect-information partnership game with dynamic legal actions and action-only implicit signaling.',
    evidence: [
      { path: 'notes/knowledge_base.md' },
      { path: 'notes/literature_matrix.csv' },
      { path: 'submission/references.bib' },
      { path: 'experiments/pilot-e1/manifest.json' },
    ],
    scopeBoundary: 'Supported as a testbed property claim; the contribution is not claiming Guandan itself is new.',
    requiredAction: 'Do not frame Guandan, zero communication, or ToM prompting as the novelty.',
  },
  {
    id: 'pilot-parse-and-revision-numbers',
    location: 'abstract',
    claim: 'The 50-decision pilot reports parse yields and a paired hard-failure reduction from 35 to 10 on 32 eligible revision traces.',
    evidence: [
      { path: 'experiments/pilot-e4-plain-llm-results/metrics.json' },
      { path: 'experiments/pilot-e5-candidate-constrained-results/metrics.json' },
      { path: 'experiments/pilot-e7-tom-prompted-results/metrics.json' },
      { path: 'experiments/pilot-e6-verifier-revision-results/metrics.json' },
      { path: 'experiments/pilot-revision-comparison/revision-comparison.json' },
      { path: 'experiments/pilot-verifier-attribution/verifier-attribution.json' },
    ],
    scopeBoundary: 'Supported for the current pilot and paired eligible subset; not an end-to-end full-game result.',
    requiredAction: 'Always report the 32-trace denominator alongside the 35 to 10 hard-failure reduction.',
  },
  {
    id: 'posthoc-label-ablation-attribution',
    location: 'abstract',
    claim: 'A post-hoc label ablation attributes the paired label-burden reduction to public-history consistency and hidden-information discipline.',
    evidence: [
      { path: 'experiments/pilot-ablation-summary/ablation-summary.json' },
      { path: 'tables/table-3-verifier-ablation.md' },
    ],
    scopeBoundary: 'Supported as post-hoc accounting, not as a prompt-level rerun with removed feedback components.',
    requiredAction: 'Keep the table caption explicit that this is not a rerun with modified feedback prompts.',
  },
  {
    id: 'full-split-tom-scale-evidence',
    location: 'introduction',
    claim: 'The evaluation substrate and ToM condition scale beyond the 50-decision pilot to a completed 500-decision ToM full split.',
    evidence: [
      { path: 'experiments/full-e4-tom-prompted-results/metrics.json' },
      { path: 'experiments/full-e5-tom-schema-repair-results/metrics.json' },
      { path: 'experiments/full-llm-summary/full-llm-summary.json' },
      { path: 'tables/table-6-full-baseline.md', required: false },
    ],
    scopeBoundary: 'Supported for ToM full-split evidence; full plain/candidate baselines remain partial strengthening evidence.',
    requiredAction: 'Do not imply that full plain/candidate LLM baselines are complete.',
  },
  {
    id: 'diagnostic-layer-not-bot',
    location: 'introduction',
    claim: 'The contribution is a diagnostic layer for reasoning validity, not a stronger Guandan-playing bot.',
    evidence: [
      { path: 'submission/aamas-latex/main.tex' },
      { path: 'submission/aamas-self-review/aamas-self-review-report.json', required: false },
      { path: 'submission/visual-evidence/visual-evidence-report.json', required: false },
    ],
    scopeBoundary: 'Supported by manuscript scope language and self-review; strategic optimality and win rate are outside the current claim.',
    requiredAction: 'Preserve limitations and reviewer-boundary language when editing Abstract/Introduction.',
  },
]

export function writeClaimEvidenceReport(options: ClaimEvidenceReportOptions): ClaimEvidenceReportResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = buildClaimEvidenceReport(options.researchRoot)
  const jsonPath = join(options.outputDir, 'claim-evidence-report.json')
  const markdownPath = join(options.outputDir, 'claim-evidence-report.md')
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderClaimEvidenceReport(report), 'utf8')
  return { jsonPath, markdownPath, report }
}

export function buildClaimEvidenceReport(researchRoot: string): ClaimEvidenceReport {
  const manuscriptPath = 'submission/aamas-latex/main.tex'
  const manuscript = readTextOptional(researchRoot, manuscriptPath) ?? ''
  const claims = claimSpecs.map(spec => evaluateClaim(researchRoot, spec))
  const needsEvidenceCount = claims.filter(claim => claim.status === 'needs_evidence').length
  const scopeLimitedCount = claims.filter(claim => claim.status === 'scope_limited').length
  const supportedCount = claims.filter(claim => claim.status === 'supported').length

  return {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    status: needsEvidenceCount === 0 ? 'pass' : 'needs_revision',
    manuscriptPath,
    facts: {
      claimCount: claims.length,
      supportedCount,
      scopeLimitedCount,
      needsEvidenceCount,
      manuscriptMentionsDecisionPointScope: /decision-point reasoning pilot|decision points/.test(manuscript),
      manuscriptMentionsFullGameFollowup: /full-game outcome evaluation|full-game outcomes/.test(manuscript),
    },
    claims,
  }
}

export function renderClaimEvidenceReport(report: ClaimEvidenceReport): string {
  return [
    '# Claim-Evidence Report',
    '',
    `Generated at: \`${report.generatedAt}\``,
    '',
    `Status: \`${report.status}\``,
    '',
    `Manuscript: \`${report.manuscriptPath}\``,
    '',
    '## Facts',
    '',
    `- Claims: ${report.facts.claimCount}`,
    `- Supported: ${report.facts.supportedCount}`,
    `- Scope-limited: ${report.facts.scopeLimitedCount}`,
    `- Needs evidence: ${report.facts.needsEvidenceCount}`,
    `- Mentions decision-point scope: ${report.facts.manuscriptMentionsDecisionPointScope ? 'yes' : 'no'}`,
    `- Mentions full-game follow-up: ${report.facts.manuscriptMentionsFullGameFollowup ? 'yes' : 'no'}`,
    '',
    '## Claims',
    '',
    '| ID | Location | Status | Claim | Evidence | Scope Boundary | Required Action |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...report.claims.map(claim => [
      `\`${claim.id}\``,
      claim.location,
      `\`${claim.status}\``,
      claim.claim,
      claim.evidence.map(path => `\`${path}\``).join('<br>'),
      claim.scopeBoundary,
      claim.requiredAction,
    ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
    '',
  ].join('\n')
}

function evaluateClaim(researchRoot: string, spec: ClaimSpec): ClaimEvidenceItem {
  const requiredEvidence = spec.evidence.filter(item => item.required !== false)
  const missing = requiredEvidence.filter(item => !evidenceExists(researchRoot, item.path))
  const status: ClaimEvidenceStatus = missing.length > 0
    ? 'needs_evidence'
    : spec.scopeBoundary.toLowerCase().includes('not ')
      || spec.scopeBoundary.toLowerCase().includes('outside')
      || spec.scopeBoundary.toLowerCase().includes('partial')
      ? 'scope_limited'
      : 'supported'

  return {
    id: spec.id,
    location: spec.location,
    claim: spec.claim,
    evidence: spec.evidence.map(item => item.path),
    status,
    scopeBoundary: missing.length > 0
      ? `${spec.scopeBoundary} Missing required evidence: ${missing.map(item => item.path).join(', ')}.`
      : spec.scopeBoundary,
    requiredAction: missing.length > 0
      ? 'Add the missing evidence artifact or weaken/remove this claim from Abstract/Introduction.'
      : spec.requiredAction,
  }
}

function readTextOptional(researchRoot: string, relativePath: string): string | null {
  const path = join(researchRoot, relativePath)
  if (!existsSync(path)) return null
  return readFileSync(path, 'utf8')
}

function evidenceExists(researchRoot: string, relativePath: string): boolean {
  return existsSync(join(researchRoot, relativePath)) || existsSync(relativePath)
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}
