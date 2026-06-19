import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import {
  buildSubmissionMarkerInventory,
  type SubmissionMarkerInventoryItem,
} from './submissionMarkerInventory'

export type ExperimentEvidenceFamily =
  | 'first_pass_llm'
  | 'verifier_revision'
  | 'full_dataset'
  | 'ablation'
  | 'case_study'
  | 'generalization'

export type ExperimentResolutionStatus =
  | 'missing_evidence'
  | 'evidence_available_marker_still_present'

export interface ExperimentRequiredEvidence {
  family: ExperimentEvidenceFamily
  artifactPath: string
  purpose: string
  ready: boolean
}

export interface ExperimentResolutionLedgerItem {
  ledgerId: string
  marker: 'NEED_EXPERIMENT'
  relativePath: string
  line: number
  excerpt: string
  evidenceFamilies: ExperimentEvidenceFamily[]
  requiredEvidence: ExperimentRequiredEvidence[]
  blockingArtifacts: string[]
  unblockCommands: string[]
  status: ExperimentResolutionStatus
}

export interface ExperimentResolutionLedgerCounts {
  totalItems: number
  byStatus: Record<ExperimentResolutionStatus, number>
  byEvidenceFamily: Record<ExperimentEvidenceFamily, number>
}

export interface ExperimentResolutionLedger {
  schemaVersion: '0.1.0'
  generatedAt: string
  markerSource: 'submission_marker_inventory'
  markerScope: 'blocking_need_experiment_markers'
  counts: ExperimentResolutionLedgerCounts
  items: ExperimentResolutionLedgerItem[]
}

export interface ExperimentResolutionLedgerOptions {
  researchRoot: string
  outputDir: string
}

export interface ExperimentResolutionLedgerResult {
  jsonPath: string
  markdownPath: string
  ledger: ExperimentResolutionLedger
}

interface EvidenceTemplate {
  artifactPath: string
  purpose: string
}

const familyEvidence: Record<ExperimentEvidenceFamily, EvidenceTemplate[]> = {
  first_pass_llm: [
    {
      artifactPath: 'experiments/provider-results/plain-llm.jsonl',
      purpose: 'Downloaded provider JSONL for the plain LLM condition.',
    },
    {
      artifactPath: 'experiments/provider-results/candidate-constrained-llm.jsonl',
      purpose: 'Downloaded provider JSONL for the candidate-constrained LLM condition.',
    },
    {
      artifactPath: 'experiments/pilot-e4-plain-llm-results/metrics.json',
      purpose: 'Parsed and verifier-scored metrics for the plain LLM condition.',
    },
    {
      artifactPath: 'experiments/pilot-e5-candidate-constrained-results/metrics.json',
      purpose: 'Parsed and verifier-scored metrics for the candidate-constrained LLM condition.',
    },
    {
      artifactPath: 'experiments/pilot-metrics-summary/pilot-metrics-summary.json',
      purpose: 'Aggregated comparison table with LLM rows marked as real metrics rather than missing raw outputs.',
    },
  ],
  verifier_revision: [
    {
      artifactPath: 'experiments/provider-results/verifier-revision-llm.jsonl',
      purpose: 'Downloaded provider JSONL for real verifier-revision prompts generated from first-pass LLM traces.',
    },
    {
      artifactPath: 'experiments/pilot-e6-verifier-revision-results/metrics.json',
      purpose: 'Parsed and verifier-scored metrics for the verifier-revision LLM condition.',
    },
    {
      artifactPath: 'experiments/pilot-revision-comparison/revision-comparison.json',
      purpose: 'Before/after comparison isolating the verifier-revision effect.',
    },
  ],
  full_dataset: [
    {
      artifactPath: 'experiments/full-e1/manifest.json',
      purpose: 'Final-scale decision-point dataset manifest matching the manuscript claim, or a manuscript rewrite narrowing the claim to pilot scope.',
    },
  ],
  ablation: [
    {
      artifactPath: 'experiments/pilot-ablation-summary/ablation-summary.json',
      purpose: 'Post-hoc verifier-label ablation over paired before/after traces, plus an explicit boundary separating it from future prompt-level component-removal reruns.',
    },
  ],
  case_study: [
    {
      artifactPath: 'experiments/pilot-case-studies/case-studies.json',
      purpose: 'Curated qualitative examples linking verifier labels to outcome-metric blind spots.',
    },
  ],
  generalization: [
    {
      artifactPath: 'experiments/transfer-eval/manifest.json',
      purpose: 'Additional-environment or transfer evaluation evidence, or a manuscript rewrite that moves broad generalization to limitations.',
    },
  ],
}

const familyCommands: Record<ExperimentEvidenceFamily, string[]> = {
  first_pass_llm: [
    'Follow submission/provider-run-handoff.md to save plain and candidate provider outputs under experiments/provider-results/.',
    'npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e4-plain-llm-prompts/packets --batch-jsonl docs/research/experiments/pilot-e4-plain-llm-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/plain-llm.jsonl --raw docs/research/experiments/pilot-e4-plain-llm-batch/raw --out docs/research/experiments/pilot-e4-plain-llm-results --condition plain-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0',
    'npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e5-candidate-constrained-prompts/packets --batch-jsonl docs/research/experiments/pilot-e5-candidate-constrained-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/candidate-constrained-llm.jsonl --raw docs/research/experiments/pilot-e5-candidate-constrained-batch/raw --out docs/research/experiments/pilot-e5-candidate-constrained-results --condition candidate-constrained-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0',
    'npx tsx server/src/research/writePilotMetricsSummaryCli.ts --out docs/research/experiments/pilot-metrics-summary',
  ],
  verifier_revision: [
    'Regenerate verifier-revision packets from real first-pass LLM traces and verifier results as described in submission/provider-run-handoff.md.',
    'npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e6-verifier-revision-prompts/packets --batch-jsonl docs/research/experiments/pilot-e6-verifier-revision-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/verifier-revision-llm.jsonl --raw docs/research/experiments/pilot-e6-verifier-revision-batch/raw --out docs/research/experiments/pilot-e6-verifier-revision-results --condition verifier-revision-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0',
    'npx tsx server/src/research/writeRevisionComparisonCli.ts --out docs/research/experiments/pilot-revision-comparison',
  ],
  full_dataset: [
    'Scale the decision-point export to the final dataset target or rewrite the manuscript claim to pilot scope before removing the marker.',
  ],
  ablation: [
    'Regenerate the post-hoc verifier-label ablation at experiments/pilot-ablation-summary/ablation-summary.json, or remove ablation claims from the manuscript.',
  ],
  case_study: [
    'Select trace-level case studies after LLM conditions are ingested and write experiments/pilot-case-studies/case-studies.json.',
  ],
  generalization: [
    'Add transfer/additional-environment evidence or rewrite the manuscript sentence as a limitation without empirical generalization.',
  ],
}

const allStatuses: ExperimentResolutionStatus[] = [
  'missing_evidence',
  'evidence_available_marker_still_present',
]

const allFamilies: ExperimentEvidenceFamily[] = [
  'first_pass_llm',
  'verifier_revision',
  'full_dataset',
  'ablation',
  'case_study',
  'generalization',
]

export function writeExperimentResolutionLedger(options: ExperimentResolutionLedgerOptions): ExperimentResolutionLedgerResult {
  mkdirSync(options.outputDir, { recursive: true })
  const ledger = buildExperimentResolutionLedger(options.researchRoot)
  const jsonPath = join(options.outputDir, 'experiment-resolution-ledger.json')
  const markdownPath = join(options.outputDir, 'experiment-resolution-ledger.md')

  writeFileSync(jsonPath, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderExperimentResolutionLedger(ledger), 'utf8')

  return { jsonPath, markdownPath, ledger }
}

export function buildExperimentResolutionLedger(researchRoot: string): ExperimentResolutionLedger {
  const markerItems = buildSubmissionMarkerInventory(researchRoot).items
    .filter(isBlockingNeedExperimentMarker)

  const items = markerItems.map((item, index) => buildLedgerItem(researchRoot, item, index))
  return {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    markerSource: 'submission_marker_inventory',
    markerScope: 'blocking_need_experiment_markers',
    counts: countLedgerItems(items),
    items,
  }
}

export function renderExperimentResolutionLedger(ledger: ExperimentResolutionLedger): string {
  const lines = [
    '# Experiment Resolution Ledger',
    '',
    `Generated at: \`${ledger.generatedAt}\``,
    '',
    'Scope: blocking `[NEED_EXPERIMENT]` markers in submission-relevant files.',
    '',
    'This ledger maps manuscript blockers to evidence artifacts. It does not convert planned experiments into results.',
    '',
    '## Counts',
    '',
    '| Status | Count |',
    '| --- | ---: |',
    ...allStatuses.map(status => `| ${status} | ${ledger.counts.byStatus[status]} |`),
    '',
    '| Evidence family | Marker count |',
    '| --- | ---: |',
    ...allFamilies.map(family => `| ${family} | ${ledger.counts.byEvidenceFamily[family]} |`),
    '',
    '## Blocking Markers',
    '',
    '| ID | Status | Families | File | Line | Missing artifacts | Excerpt |',
    '| --- | --- | --- | --- | ---: | --- | --- |',
    ...ledger.items.map(item => [
      item.ledgerId,
      `\`${item.status}\``,
      item.evidenceFamilies.map(family => `\`${family}\``).join(', '),
      `\`${item.relativePath}\``,
      String(item.line),
      item.blockingArtifacts.map(path => `\`${path}\``).join('<br>') || 'None',
      item.excerpt,
    ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
    '',
    '## Unblock Commands',
    '',
    ...ledger.items.flatMap(item => [
      `### ${item.ledgerId}`,
      '',
      ...item.unblockCommands.map(command => `- \`${command}\``),
      '',
    ]),
  ]

  return lines.join('\n')
}

function buildLedgerItem(
  researchRoot: string,
  markerItem: SubmissionMarkerInventoryItem,
  index: number,
): ExperimentResolutionLedgerItem {
  const sourceText = readMarkerSourceLine(researchRoot, markerItem) ?? markerItem.excerpt
  const evidenceFamilies = classifyEvidenceFamilies(sourceText)
  const requiredEvidence = evidenceFamilies.flatMap(family => familyEvidence[family].map(evidence => ({
    family,
    artifactPath: evidence.artifactPath,
    purpose: evidence.purpose,
    ready: isArtifactReady(researchRoot, evidence.artifactPath),
  })))
  const blockingArtifacts = requiredEvidence
    .filter(evidence => !evidence.ready)
    .map(evidence => evidence.artifactPath)
  const status: ExperimentResolutionStatus = blockingArtifacts.length === 0
    ? 'evidence_available_marker_still_present'
    : 'missing_evidence'

  return {
    ledgerId: `need-exp-${String(index + 1).padStart(3, '0')}`,
    marker: 'NEED_EXPERIMENT',
    relativePath: markerItem.relativePath,
    line: markerItem.line,
    excerpt: markerItem.excerpt,
    evidenceFamilies,
    requiredEvidence,
    blockingArtifacts,
    unblockCommands: unique(evidenceFamilies.flatMap(family => familyCommands[family])),
    status,
  }
}

function isBlockingNeedExperimentMarker(item: SubmissionMarkerInventoryItem): boolean {
  return item.marker === 'NEED_EXPERIMENT' && item.resolutionScope === 'blocking'
}

function readMarkerSourceLine(researchRoot: string, item: SubmissionMarkerInventoryItem): string | undefined {
  const path = join(researchRoot, item.relativePath)
  if (!existsSync(path)) return undefined
  const line = readFileSync(path, 'utf8').split(/\r?\n/)[item.line - 1]
  return line?.trim()
}

function classifyEvidenceFamilies(excerpt: string): ExperimentEvidenceFamily[] {
  const normalized = excerpt.toLowerCase()
  const families: ExperimentEvidenceFamily[] = []

  if (mentionsAny(normalized, [
    'plain',
    'candidate',
    'outcome metrics',
    'team-decision',
    'reasoning reliability',
    'reasoning failures',
    'compare them with',
    'reveals failures',
  ])) families.push('first_pass_llm')

  if (mentionsAny(normalized, [
    'verifier feedback',
    'verifier-in-the-loop',
    'revision',
    'before/after',
    'improve agent behavior',
    'reduces failures',
  ])) families.push('verifier_revision')

  if (mentionsAny(normalized, [
    '500-2,000',
    'dataset size',
    'current pilot implementation',
    'not for final empirical claims',
    'final empirical claims',
  ])) families.push('full_dataset')

  if (mentionsAny(normalized, ['ablation', 'ablations'])) families.push('ablation')
  if (mentionsAny(normalized, ['qualitative case', 'planned cases', 'case studies'])) families.push('case_study')
  if (mentionsAny(normalized, ['generalization beyond guandan', 'broader class', 'additional environments', 'transfer'])) families.push('generalization')

  if (families.length === 0) families.push('first_pass_llm')
  return unique(families)
}

function mentionsAny(text: string, needles: string[]): boolean {
  return needles.some(needle => text.includes(needle))
}

function isArtifactReady(researchRoot: string, artifactPath: string): boolean {
  const absolutePath = join(researchRoot, artifactPath)
  if (!existsSync(absolutePath)) return false

  const stats = statSync(absolutePath)
  if (stats.isDirectory()) return true
  if (!stats.isFile() || stats.size === 0) return false

  if (artifactPath.endsWith('.json')) {
    try {
      return jsonValueLooksReady(JSON.parse(readFileSync(absolutePath, 'utf8')))
    } catch {
      return false
    }
  }

  return true
}

function jsonValueLooksReady(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return true
  if (Array.isArray(value)) return value.every(jsonValueLooksReady)

  const record = value as Record<string, unknown>
  if (typeof record.status === 'string' && statusMeansIncomplete(record.status)) return false
  if (typeof record.readyForIngest === 'boolean' && !record.readyForIngest) return false
  if (typeof record.readyForSubmission === 'boolean' && !record.readyForSubmission) return false

  return true
}

function statusMeansIncomplete(status: string): boolean {
  const normalized = status.toLowerCase()
  return [
    'missing',
    'not_ready',
    'waiting',
    'blocked',
  ].some(fragment => normalized.includes(fragment))
}

function countLedgerItems(items: ExperimentResolutionLedgerItem[]): ExperimentResolutionLedgerCounts {
  const byStatus = Object.fromEntries(allStatuses.map(status => [status, 0])) as Record<ExperimentResolutionStatus, number>
  const byEvidenceFamily = Object.fromEntries(allFamilies.map(family => [family, 0])) as Record<ExperimentEvidenceFamily, number>

  for (const item of items) {
    byStatus[item.status]++
    for (const family of item.evidenceFamilies) byEvidenceFamily[family]++
  }

  return {
    totalItems: items.length,
    byStatus,
    byEvidenceFamily,
  }
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values))
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|')
}
