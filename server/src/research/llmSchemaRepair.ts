import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import type {
  GuandanDecisionPoint,
  LLMReasoningTrace,
  VerifierResult,
} from '@guandan/shared'
import { verifyReasoningTrace } from './reasoningVerifier'
import { summarizeVerifierResults } from './verifierMetrics'

export type SchemaRepairStatus = 'pass_through' | 'repaired' | 'not_repairable'

export interface SchemaRepairRecord {
  decisionId: string
  status: SchemaRepairStatus
  rawOutputFile: string
  traceFile?: string
  resultFile?: string
  reason: string
  repairedFields: string[]
}

export interface LLMSchemaRepairOptions {
  decisionsDir: string
  rawOutputDir: string
  outputDir: string
  agentId: string
}

export interface LLMSchemaRepairResult {
  metricsPath: string
  repairReportPath: string
  markdownPath: string
  records: SchemaRepairRecord[]
}

type ParsedRaw =
  | {
    ok: true
    value: unknown
  }
  | {
    ok: false
    message: string
  }

interface RepairOutcome {
  trace: LLMReasoningTrace
  status: Exclude<SchemaRepairStatus, 'not_repairable'>
  reason: string
  repairedFields: string[]
}

export function runLLMSchemaRepair(options: LLMSchemaRepairOptions): LLMSchemaRepairResult {
  const decisions = readDecisions(options.decisionsDir)
  const tracesDir = join(options.outputDir, 'traces')
  const resultsDir = join(options.outputDir, 'results')
  mkdirSync(tracesDir, { recursive: true })
  mkdirSync(resultsDir, { recursive: true })

  const traces: LLMReasoningTrace[] = []
  const results: VerifierResult[] = []
  const records: SchemaRepairRecord[] = []

  for (const decision of decisions) {
    const rawOutputFile = join(options.rawOutputDir, `${safeFilename(decision.decisionId)}.txt`)
    if (!existsSync(rawOutputFile)) {
      records.push({
        decisionId: decision.decisionId,
        status: 'not_repairable',
        rawOutputFile,
        reason: 'Raw output file is missing.',
        repairedFields: [],
      })
      continue
    }

    const raw = readFileSync(rawOutputFile, 'utf8')
    const outcome = repairRawTrace(raw, decision, options.agentId)
    if (!outcome) {
      records.push({
        decisionId: decision.decisionId,
        status: 'not_repairable',
        rawOutputFile,
        reason: 'Raw output does not contain a usable selectedActionId and reasoning content.',
        repairedFields: [],
      })
      continue
    }

    const result = verifyReasoningTrace(decision, outcome.trace)
    const traceFile = join(tracesDir, `${safeFilename(decision.decisionId)}.json`)
    const resultFile = join(resultsDir, `${safeFilename(decision.decisionId)}.json`)
    writeJson(traceFile, outcome.trace)
    writeJson(resultFile, result)
    traces.push(outcome.trace)
    results.push(result)
    records.push({
      decisionId: decision.decisionId,
      status: outcome.status,
      rawOutputFile,
      traceFile,
      resultFile,
      reason: outcome.reason,
      repairedFields: outcome.repairedFields,
    })
  }

  const verifierMetrics = summarizeVerifierResults(results)
  const notRepairableRecords = records.filter(record => record.status === 'not_repairable')
  const repairReportPath = join(options.outputDir, 'schema-repair-report.json')
  const markdownPath = join(options.outputDir, 'schema-repair-report.md')
  const metricsPath = join(options.outputDir, 'metrics.json')
  const repairStatusCounts = {
    passThrough: records.filter(record => record.status === 'pass_through').length,
    repaired: records.filter(record => record.status === 'repaired').length,
    notRepairable: notRepairableRecords.length,
  }

  writeJson(repairReportPath, {
    schemaVersion: '0.1.0',
    agentId: options.agentId,
    totalDecisionPoints: decisions.length,
    ...repairStatusCounts,
    records,
  })
  writeJson(metricsPath, {
    schemaVersion: '0.1.0',
    conditionId: options.agentId,
    totalDecisionPoints: decisions.length,
    totalParsedTraces: traces.length,
    parseFailureCount: notRepairableRecords.length,
    hardFailureCount: verifierMetrics.hardFailureCount,
    labelStatusCounts: verifierMetrics.labelStatusCounts,
    traceFiles: records
      .filter(record => record.traceFile)
      .map(record => (record.traceFile as string).replace(`${options.outputDir}/`, '')),
    resultFiles: records
      .filter(record => record.resultFile)
      .map(record => (record.resultFile as string).replace(`${options.outputDir}/`, '')),
    repairStatusCounts,
    failures: notRepairableRecords.map(record => ({
      decisionId: record.decisionId,
      rawOutputFile: record.rawOutputFile,
      message: record.reason,
    })),
  })
  writeFileSync(markdownPath, renderSchemaRepairMarkdown({
    agentId: options.agentId,
    totalDecisionPoints: decisions.length,
    totalParsedTraces: traces.length,
    hardFailureCount: verifierMetrics.hardFailureCount,
    repairStatusCounts,
    records,
  }), 'utf8')

  return { metricsPath, repairReportPath, markdownPath, records }
}

export function repairRawTrace(raw: string, decision: GuandanDecisionPoint, agentId: string): RepairOutcome | null {
  const parsed = parseJson(raw)
  if (!parsed.ok) return null
  const value = parsed.value
  if (!isRecord(value)) return null

  if (isReasoningTraceLike(value) && value.decisionId === decision.decisionId) {
    return {
      trace: {
        ...value,
        schemaVersion: '0.1.0',
        agentId,
      },
      status: 'pass_through',
      reason: 'Raw output already matched the reasoning trace shape.',
      repairedFields: ['agentId'],
    }
  }

  const selectedActionId = stringValue(value.selectedActionId) ?? stringValue(value.actionId)
  if (!selectedActionId || !decision.legalActions.some(action => action.actionId === selectedActionId)) return null

  const reasoning = firstRecord(value.reasoning, value.reasoningTrace, value)
  const publicEvidence = publicEvidenceIds(decision, value)
  const selectedAction = decision.legalActions.find(action => action.actionId === selectedActionId)
  const partnerSummary = extractSummary(reasoning, [
    'partnerBelief',
    'partnerBeliefs',
    'partnerIntent',
    'partner',
  ], partnerFallback(decision))
  const opponentSummary = extractSummary(reasoning, [
    'opponentBelief',
    'opponentBeliefs',
    'opponentIntent',
    'opponent',
  ], opponentFallback(decision))
  const primaryReason = extractPrimaryReason(reasoning, selectedActionId)
  const risks = extractRisks(reasoning)
  const confidence = clampNumber(value.confidence, 0.6)
  const objective = inferObjective(decision, selectedAction?.action ?? 'play', [
    primaryReason,
    partnerSummary,
    opponentSummary,
    textFromUnknown(reasoning.teamObjective),
    textFromUnknown(reasoning.conclusion),
  ].join(' '))

  return {
    trace: {
      schemaVersion: '0.1.0',
      decisionId: decision.decisionId,
      agentId,
      selectedActionId,
      teamObjective: {
        type: objective,
        explanation: textFromUnknown(reasoning.teamObjective)
          || textFromUnknown(reasoning.conclusion)
          || `Deterministically repaired ToM trace with objective ${objective}.`,
      },
      partnerBelief: {
        summary: partnerSummary,
        confidence,
        evidence: publicEvidence,
      },
      opponentBelief: {
        summary: opponentSummary,
        confidence,
        evidence: publicEvidence,
      },
      actionRationale: {
        primaryReason,
        whyNotAlternatives: alternatives(decision, selectedActionId, reasoning),
      },
      riskAssessment: {
        risks,
        mitigation: textFromUnknown(reasoning.mitigation)
          || 'Treat the repaired trace as schema-normalized reasoning; do not add hidden-card facts beyond the raw output.',
      },
      confidence,
      notes: 'Deterministically schema-repaired from a ToM-prompted raw output; selectedActionId is unchanged.',
    },
    status: 'repaired',
    reason: 'Raw output contained selectedActionId and reasoning content but used a non-conforming schema.',
    repairedFields: [
      'teamObjective',
      'partnerBelief',
      'opponentBelief',
      'actionRationale',
      'riskAssessment',
    ],
  }
}

function readDecisions(decisionsDir: string): GuandanDecisionPoint[] {
  return readdirSync(decisionsDir)
    .filter(filename => filename.endsWith('.json'))
    .sort()
    .map(filename => readJson<GuandanDecisionPoint>(join(decisionsDir, filename)))
}

function isReasoningTraceLike(value: unknown): value is LLMReasoningTrace {
  if (!isRecord(value)) return false
  return value.schemaVersion === '0.1.0'
    && typeof value.decisionId === 'string'
    && typeof value.agentId === 'string'
    && typeof value.selectedActionId === 'string'
    && Boolean(value.teamObjective)
    && Boolean(value.partnerBelief)
    && Boolean(value.opponentBelief)
    && Boolean(value.actionRationale)
    && Boolean(value.riskAssessment)
    && typeof value.confidence === 'number'
}

function publicEvidenceIds(decision: GuandanDecisionPoint, raw: Record<string, unknown>): string[] {
  const publicIds = new Set(decision.publicHistory.map(event => event.eventId))
  const candidates = collectStrings(raw).filter(value => publicIds.has(value))
  const unique = [...new Set(candidates)]
  if (unique.length > 0) return unique
  return decision.publicHistory.slice(0, 1).map(event => event.eventId)
}

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(collectStrings)
  if (!isRecord(value)) return []
  return Object.values(value).flatMap(collectStrings)
}

function extractSummary(record: Record<string, unknown>, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string') return value
    if (isRecord(value)) {
      const summary = stringValue(value.summary)
        ?? stringValue(value.belief)
        ?? stringValue(value.assessment)
        ?? stringValue(value.intent)
      if (summary) return summary
      const text = textFromUnknown(value)
      if (text) return text
    }
  }
  return fallback
}

function extractPrimaryReason(record: Record<string, unknown>, selectedActionId: string): string {
  const direct = stringValue(record.selectedRationale)
    ?? stringValue(record.primaryReason)
    ?? stringValue(record.conclusion)
    ?? stringValue(record.teamObjective)
  if (direct) return direct

  const actionRationale = firstRecord(record.actionRationale)
  if (actionRationale) {
    const primary = stringValue(actionRationale.primaryReason)
    if (primary) return primary
  }

  for (const key of ['counterfactualComparison', 'counterfactuals']) {
    const rows = Array.isArray(record[key]) ? record[key] : []
    const selected = rows.find(row => isRecord(row) && row.actionId === selectedActionId)
    if (isRecord(selected)) {
      const reason = stringValue(selected.assessment) ?? stringValue(selected.comparison)
      if (reason) return reason
    }
  }

  return `Selected ${selectedActionId} after deterministic schema repair of ToM reasoning.`
}

function alternatives(
  decision: GuandanDecisionPoint,
  selectedActionId: string,
  record: Record<string, unknown>,
): LLMReasoningTrace['actionRationale']['whyNotAlternatives'] {
  const fromRaw: LLMReasoningTrace['actionRationale']['whyNotAlternatives'] = []
  for (const key of ['counterfactualComparison', 'counterfactuals', 'whyNotAlternatives']) {
    const rows = Array.isArray(record[key]) ? record[key] : []
    for (const row of rows) {
      if (!isRecord(row)) continue
      const actionId = stringValue(row.actionId)
      if (!actionId || actionId === selectedActionId) continue
      fromRaw.push({
        actionId,
        reason: stringValue(row.reason)
          ?? stringValue(row.assessment)
          ?? stringValue(row.comparison)
          ?? 'Alternative mentioned in raw ToM output.',
      })
    }
  }
  if (fromRaw.length > 0) return fromRaw.slice(0, 3)

  return decision.legalActions
    .filter(action => action.actionId !== selectedActionId)
    .slice(0, 3)
    .map(action => ({
      actionId: action.actionId,
      reason: 'Legal alternative retained for verifier comparison after schema repair.',
    }))
}

function extractRisks(record: Record<string, unknown>): string[] {
  const riskAssessment = firstRecord(record.riskAssessment)
  if (riskAssessment) {
    const risks = Array.isArray(riskAssessment.risks)
      ? riskAssessment.risks.filter((risk): risk is string => typeof risk === 'string')
      : []
    if (risks.length > 0) return risks
  }
  const risks = Array.isArray(record.risks)
    ? record.risks.filter((risk): risk is string => typeof risk === 'string')
    : []
  if (risks.length > 0) return risks
  return ['Schema repair may preserve imperfect reasoning from the raw model output.']
}

function inferObjective(
  decision: GuandanDecisionPoint,
  action: 'play' | 'pass',
  text: string,
): LLMReasoningTrace['teamObjective']['type'] {
  const normalized = text.toLowerCase()
  if (action === 'pass') return 'save_resources'
  if (decision.handCounts[decision.currentPlayer] <= 2) return 'finish_hand'
  if (decision.scenarioTags.includes('partner_near_finish') || /\bpartner\b/.test(normalized)) return 'protect_partner'
  if (decision.scenarioTags.includes('opponent_near_finish') || /\bopponent|suppress|prevent\b/.test(normalized)) return 'suppress_opponent'
  if (/\bsave|preserve|avoid wasting|minimal expenditure\b/.test(normalized)) return 'save_resources'
  if (decision.tableLead) return 'gain_lead'
  return 'keep_lead'
}

function partnerFallback(decision: GuandanDecisionPoint): string {
  return decision.scenarioTags.includes('partner_near_finish')
    ? 'Partner may be near finishing according to public hand-count context; exact hidden cards remain uncertain.'
    : 'Partner state is uncertain; only public events and hand counts are used.'
}

function opponentFallback(decision: GuandanDecisionPoint): string {
  return decision.scenarioTags.includes('opponent_near_finish')
    ? 'An opponent may be near finishing according to public hand-count context; exact hidden cards remain uncertain.'
    : 'Opponent state is uncertain; no hidden cards are asserted as facts.'
}

function parseJson(raw: string): ParsedRaw {
  try {
    return { ok: true, value: JSON.parse(stripMarkdownFence(raw)) }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Unknown parse error.' }
  }
}

interface SchemaRepairMarkdownReport {
  agentId: string
  totalDecisionPoints: number
  totalParsedTraces: number
  hardFailureCount: number
  repairStatusCounts: {
    passThrough: number
    repaired: number
    notRepairable: number
  }
  records: SchemaRepairRecord[]
}

function renderSchemaRepairMarkdown(report: SchemaRepairMarkdownReport): string {
  const repaired = report.records.filter(record => record.status === 'repaired')
  const notRepairable = report.records.filter(record => record.status === 'not_repairable')
  const lines = [
    '# ToM Schema Repair Report',
    '',
    `Condition: \`${report.agentId}\``,
    '',
    '| Metric | Value |',
    '| --- | ---: |',
    `| Total decision points | ${report.totalDecisionPoints} |`,
    `| Parsed traces after repair | ${report.totalParsedTraces} |`,
    `| Pass-through traces | ${report.repairStatusCounts.passThrough} |`,
    `| Repaired traces | ${report.repairStatusCounts.repaired} |`,
    `| Not repairable | ${report.repairStatusCounts.notRepairable} |`,
    `| Hard verifier failures after repair | ${report.hardFailureCount} |`,
    '',
    'The repair step is a deterministic schema-normalization ablation. It preserves the model-selected `selectedActionId` and only reconstructs missing reasoning fields from raw ToM-prompted output plus public evidence ids.',
    '',
    '## Repaired Examples',
    '',
    ...repaired.slice(0, 10).map(record => `- \`${record.decisionId}\`: ${record.repairedFields.join(', ')}`),
    ...(repaired.length === 0 ? ['No traces required schema repair.'] : []),
    '',
    '## Not Repairable',
    '',
    ...notRepairable.map(record => `- \`${record.decisionId}\`: ${record.reason}`),
    ...(notRepairable.length === 0 ? ['All raw outputs were repairable or already valid.'] : []),
    '',
  ]

  return lines.join('\n')
}

function stripMarkdownFence(raw: string): string {
  const trimmed = raw.trim()
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  return match ? match[1].trim() : trimmed
}

function firstRecord(...values: unknown[]): Record<string, unknown> {
  for (const value of values) {
    if (isRecord(value)) return value
  }
  return {}
}

function textFromUnknown(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(textFromUnknown).filter(Boolean).join(' ')
  if (!isRecord(value)) return ''
  return Object.entries(value)
    .filter(([key]) => key !== 'evidence')
    .map(([, nested]) => textFromUnknown(nested))
    .filter(Boolean)
    .join(' ')
}

function clampNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : fallback
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function safeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
