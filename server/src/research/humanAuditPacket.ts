import {
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

interface DecisionPoint {
  decisionId: string
  phase?: string
  currentPlayer?: number
  teamId?: number
  handCounts?: number[]
  scenarioTags?: string[]
  publicHistory?: Array<{ eventId?: string; type?: string; player?: number }>
  legalActions?: Array<{ actionId: string; action?: string; combinationType?: string }>
}

interface Trace {
  decisionId: string
  selectedActionId: string
  teamObjective?: { type?: string; explanation?: string }
  partnerBelief?: { summary?: string; evidence?: string[] }
  opponentBelief?: { summary?: string; evidence?: string[] }
  actionRationale?: { primaryReason?: string }
  riskAssessment?: { risks?: string[]; mitigation?: string }
}

interface VerifierResult {
  decisionId: string
  selectedActionId: string
  labels?: Record<string, { status?: string; evidence?: string[] }>
  hardFailures?: Array<{ code?: string; message?: string; path?: string }>
  softWarnings?: Array<{ code?: string; message?: string; path?: string }>
}

interface AuditSample {
  sampleId: string
  decisionId: string
  phase: string
  scenarioTags: string
  handCounts: string
  selectedActionId: string
  legalActionCount: number
  publicEventSummary: string
  teamObjective: string
  partnerBelief: string
  opponentBelief: string
  actionRationale: string
  riskSummary: string
}

interface AuditAnswerKey extends AuditSample {
  verifierPartnerConsistent: string
  verifierOpponentConsistent: string
  verifierTeamObjectiveValid: string
  verifierHiddenInfoDisciplined: string
  verifierReasonActionConsistent: string
  verifierHardFailureCount: number
  verifierSoftWarningCount: number
}

export interface HumanAuditPacketOptions {
  decisionsDir: string
  tracesDir: string
  resultsDir: string
  outputDir: string
  sampleSize?: number
}

export interface HumanAuditPacketResult {
  manifestPath: string
  annotationSheetPath: string
  blindJsonlPath: string
  answerKeyPath: string
  protocolPath: string
  sampleCount: number
}

export function writeHumanAuditPacket(options: HumanAuditPacketOptions): HumanAuditPacketResult {
  const sampleSize = options.sampleSize ?? 40
  const decisions = readDirectoryMap<DecisionPoint>(options.decisionsDir)
  const traces = readDirectoryMap<Trace>(options.tracesDir)
  const results = readDirectoryMap<VerifierResult>(options.resultsDir)
  const sample = selectAuditRows(results, traces, decisions, sampleSize)
  mkdirSync(options.outputDir, { recursive: true })

  const blindJsonlPath = join(options.outputDir, 'human-audit-blind-sample.jsonl')
  const answerKeyPath = join(options.outputDir, 'human-audit-answer-key.jsonl')
  const annotationSheetPath = join(options.outputDir, 'human-audit-annotation-sheet.csv')
  const protocolPath = join(options.outputDir, 'human-audit-protocol.md')
  const manifestPath = join(options.outputDir, 'human-audit-manifest.json')

  writeFileSync(blindJsonlPath, `${sample.map(row => JSON.stringify(row.blind)).join('\n')}\n`, 'utf8')
  writeFileSync(answerKeyPath, `${sample.map(row => JSON.stringify(row.answerKey)).join('\n')}\n`, 'utf8')
  writeFileSync(annotationSheetPath, renderCsv(sample.map(row => row.blind)), 'utf8')
  writeFileSync(protocolPath, renderProtocol(sample.length), 'utf8')
  writeJson(manifestPath, {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    sampleCount: sample.length,
    stratumCounts: countBy(sample.map(row => row.blind.scenarioTags || row.blind.phase || 'unknown')),
    sourceDecisionsDir: options.decisionsDir,
    sourceTracesDir: options.tracesDir,
    sourceResultsDir: options.resultsDir,
    files: {
      blindJsonl: blindJsonlPath,
      answerKeyJsonl: answerKeyPath,
      annotationSheetCsv: annotationSheetPath,
      annotatorHtml: join(options.outputDir, 'human-audit-annotator.html'),
      protocolMarkdown: protocolPath,
    },
    status: 'annotation_packet_prepared_not_human_completed',
  })

  return {
    manifestPath,
    annotationSheetPath,
    blindJsonlPath,
    answerKeyPath,
    protocolPath,
    sampleCount: sample.length,
  }
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1
    return counts
  }, {})
}

function selectAuditRows(
  results: Map<string, VerifierResult>,
  traces: Map<string, Trace>,
  decisions: Map<string, DecisionPoint>,
  sampleSize: number,
): Array<{ blind: AuditSample; answerKey: AuditAnswerKey }> {
  const scored = [...results.values()]
    .filter(result => traces.has(result.decisionId))
    .map(result => {
      const trace = traces.get(result.decisionId) as Trace
      const decision = decisions.get(result.decisionId)
      return {
        result,
        trace,
        decision,
        stratum: (decision?.scenarioTags ?? []).join(';') || decision?.phase || 'unknown',
        score: auditPriority(result),
      }
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      return left.result.decisionId.localeCompare(right.result.decisionId)
    })
  const selected = stratifiedTopRows(scored, sampleSize)

  return selected.map((entry, index) => {
    const blind: AuditSample = {
      sampleId: `human-audit-${String(index + 1).padStart(3, '0')}`,
      decisionId: entry.result.decisionId,
      phase: entry.decision?.phase ?? 'unknown',
      scenarioTags: (entry.decision?.scenarioTags ?? []).join(';'),
      handCounts: (entry.decision?.handCounts ?? []).join('/'),
      selectedActionId: entry.trace.selectedActionId,
      legalActionCount: entry.decision?.legalActions?.length ?? 0,
      publicEventSummary: summarizePublicEvents(entry.decision),
      teamObjective: `${entry.trace.teamObjective?.type ?? 'unknown'}: ${entry.trace.teamObjective?.explanation ?? ''}`.trim(),
      partnerBelief: withEvidence(entry.trace.partnerBelief?.summary, entry.trace.partnerBelief?.evidence),
      opponentBelief: withEvidence(entry.trace.opponentBelief?.summary, entry.trace.opponentBelief?.evidence),
      actionRationale: entry.trace.actionRationale?.primaryReason ?? '',
      riskSummary: [
        ...(entry.trace.riskAssessment?.risks ?? []),
        entry.trace.riskAssessment?.mitigation ?? '',
      ].filter(Boolean).join(' | '),
    }
    return {
      blind,
      answerKey: {
        ...blind,
        verifierPartnerConsistent: labelStatus(entry.result, 'partnerConsistent'),
        verifierOpponentConsistent: labelStatus(entry.result, 'opponentConsistent'),
        verifierTeamObjectiveValid: labelStatus(entry.result, 'teamObjectiveValid'),
        verifierHiddenInfoDisciplined: labelStatus(entry.result, 'hiddenInfoDisciplined'),
        verifierReasonActionConsistent: labelStatus(entry.result, 'reasonActionConsistent'),
        verifierHardFailureCount: entry.result.hardFailures?.length ?? 0,
        verifierSoftWarningCount: entry.result.softWarnings?.length ?? 0,
      },
    }
  })
}

function stratifiedTopRows<T extends { stratum: string; score: number; result: { decisionId: string } }>(
  rows: T[],
  sampleSize: number,
): T[] {
  const groups = new Map<string, T[]>()
  for (const row of rows) {
    const group = groups.get(row.stratum) ?? []
    group.push(row)
    groups.set(row.stratum, group)
  }

  const strata = [...groups.keys()].sort((left, right) => {
    const leftTop = groups.get(left)?.[0]?.score ?? 0
    const rightTop = groups.get(right)?.[0]?.score ?? 0
    if (rightTop !== leftTop) return rightTop - leftTop
    return left.localeCompare(right)
  })
  const selected: T[] = []

  while (selected.length < sampleSize) {
    let added = false
    for (const stratum of strata) {
      const group = groups.get(stratum) ?? []
      const next = group.shift()
      if (!next) continue
      selected.push(next)
      added = true
      if (selected.length >= sampleSize) break
    }
    if (!added) break
  }

  return selected
}

function auditPriority(result: VerifierResult): number {
  const labels = result.labels ?? {}
  let score = 0
  for (const name of ['partnerConsistent', 'opponentConsistent', 'teamObjectiveValid']) {
    const status = labels[name]?.status
    if (status === 'fail') score += 10
    if (status === 'unknown') score += 4
    if (status === 'pass') score += 1
  }
  score += (result.softWarnings?.length ?? 0) * 3
  score += (result.hardFailures?.length ?? 0) * 6
  return score
}

function readDirectoryMap<T extends { decisionId: string }>(dir: string): Map<string, T> {
  const map = new Map<string, T>()
  for (const filename of readdirSync(dir).filter(filename => filename.endsWith('.json')).sort()) {
    const value = readJson<T>(join(dir, filename))
    map.set(value.decisionId, value)
  }
  return map
}

function labelStatus(result: VerifierResult, label: string): string {
  return result.labels?.[label]?.status ?? 'missing'
}

function summarizePublicEvents(decision?: DecisionPoint): string {
  const events = decision?.publicHistory ?? []
  if (events.length === 0) return 'none'
  return events.slice(0, 6).map(event => [
    event.eventId ?? 'no-id',
    event.type ?? 'unknown',
    event.player === undefined ? '' : `p${event.player}`,
  ].filter(Boolean).join(':')).join('; ')
}

function withEvidence(summary?: string, evidence?: string[]): string {
  const text = summary ?? ''
  const evidenceText = evidence && evidence.length > 0 ? ` evidence=${evidence.join(';')}` : ''
  return `${text}${evidenceText}`.trim()
}

function renderCsv(rows: AuditSample[]): string {
  const headers = [
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
    'humanPartnerConsistent',
    'humanOpponentConsistent',
    'humanTeamObjectiveValid',
    'humanHiddenInfoDisciplined',
    'humanReasonActionConsistent',
    'humanNotes',
  ]
  return [
    headers.join(','),
    ...rows.map(row => headers.map(header => csvCell(((row as unknown) as Record<string, unknown>)[header] ?? '')).join(',')),
    '',
  ].join('\n')
}

function renderProtocol(sampleCount: number): string {
  return [
    '# Human Soft-Label Audit Protocol',
    '',
    `This packet contains ${sampleCount} blind samples drawn from repaired full-split ToM traces.`,
    '',
    '## Task',
    '',
    'For each row in `human-audit-annotation-sheet.csv`, assign one of `pass`, `fail`, or `uncertain` for:',
    '',
    '- `humanPartnerConsistent`: whether the partner belief is plausible from public state and scenario tags.',
    '- `humanOpponentConsistent`: whether the opponent belief is plausible from public state and scenario tags.',
    '- `humanTeamObjectiveValid`: whether the stated team objective fits the selected action and situation.',
    '- `humanHiddenInfoDisciplined`: whether the trace avoids asserting hidden cards as facts.',
    '- `humanReasonActionConsistent`: whether the rationale supports the selected action.',
    '',
    '## Labeling Rubric',
    '',
    'Use `pass` when the statement is directly supported by visible public facts, scenario tags, selected action, or a cautious probabilistic hedge.',
    '',
    'Use `fail` when the statement contradicts visible public facts, treats hidden cards or private intentions as certain, or gives a rationale/objective that does not support the selected action.',
    '',
    'Use `uncertain` when the visible row does not contain enough evidence to decide. Do not guess from Guandan expertise beyond the public fields shown in the row.',
    '',
    'Field-specific guidance:',
    '',
    '- Partner belief: pass if the belief is a plausible public-state inference about the teammate; fail if it asserts the partner has specific hidden cards or ignores a clear public scenario tag.',
    '- Opponent belief: pass if the belief is a plausible public-state inference about opponents; fail if it asserts exact opponent holdings or intentions without public evidence.',
    '- Team objective: pass if the objective fits team identity, hand counts, scenario tags, and the selected action; fail if the objective points in a different strategic direction than the action.',
    '- Hidden-information discipline: pass if hidden cards and intentions are hedged as uncertain; fail if unobserved cards, suits, ranks, or private plans are stated as facts.',
    '- Reason-action consistency: pass if the rationale explains why the selected action follows from the visible state; fail if it justifies a different action or omits the selected action logic.',
    '',
    'Annotators should use only the visible row fields and should not inspect `human-audit-answer-key.jsonl` until annotation is complete.',
    '',
    'Do not add, delete, reorder, or edit `sampleId` values. The agreement evaluator checks the completed annotation file against the answer-key sample ids and will keep the audit in `partial` status if any expected sample is missing, duplicated, or replaced by an unexpected id.',
    '',
    'The local helper UI `human-audit-annotator.html` can be opened directly in a browser. It stores draft labels in browser local storage, can import a previously exported CSV, and exports `human-audit-completed-annotations.csv` with the same columns as `human-audit-annotation-sheet.csv`.',
    '',
    '## Completion Criteria',
    '',
    'A completed audit should save `human-audit-completed-annotations.csv` beside this packet and report agreement with verifier labels from `human-audit-answer-key.jsonl`.',
    '',
    'Run the agreement report after annotation:',
    '',
    '```bash',
    'npx tsx server/src/research/writeHumanAuditAgreementCli.ts \\',
    '  --annotations docs/research/experiments/human-soft-label-audit/human-audit-completed-annotations.csv \\',
    '  --answer-key docs/research/experiments/human-soft-label-audit/human-audit-answer-key.jsonl \\',
    '  --out docs/research/experiments/human-soft-label-audit',
    '```',
    '',
    'The report remains `pending` until human labels are filled, `partial` if any labels are missing or invalid, and `completed` only when every required label is valid.',
    '',
  ].join('\n')
}

function csvCell(value: unknown): string {
  return `"${String(value).replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
