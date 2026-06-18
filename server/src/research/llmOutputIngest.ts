import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import {
  type GuandanDecisionPoint,
  type LLMReasoningTrace,
  type VerifierResult,
} from '@guandan/shared'
import type { LLMConditionId } from './llmPromptPackets'
import { verifyReasoningTrace } from './reasoningVerifier'
import { summarizeVerifierResults } from './verifierMetrics'

export interface IngestLLMRawOutputsOptions {
  decisions: GuandanDecisionPoint[]
  rawOutputDir: string
  outputDir: string
  conditionId: LLMConditionId
}

export interface LLMParseFailure {
  decisionId: string
  rawOutputFile: string
  message: string
}

export interface LLMOutputIngestResult {
  metricsPath: string
  tracePaths: string[]
  resultPaths: string[]
  failures: LLMParseFailure[]
}

export function ingestLLMRawOutputs(options: IngestLLMRawOutputsOptions): LLMOutputIngestResult {
  const tracesDir = join(options.outputDir, 'traces')
  const resultsDir = join(options.outputDir, 'results')
  mkdirSync(tracesDir, { recursive: true })
  mkdirSync(resultsDir, { recursive: true })

  const traces: LLMReasoningTrace[] = []
  const results: VerifierResult[] = []
  const failures: LLMParseFailure[] = []
  const tracePaths: string[] = []
  const resultPaths: string[] = []

  for (const decision of options.decisions) {
    const rawOutputFile = join(options.rawOutputDir, `${safeFilename(decision.decisionId)}.txt`)
    const raw = existsSync(rawOutputFile) ? readFileSync(rawOutputFile, 'utf8') : null

    if (raw === null) {
      failures.push({
        decisionId: decision.decisionId,
        rawOutputFile,
        message: 'Raw output file is missing.',
      })
      continue
    }

    const parsed = parseReasoningTrace(raw, decision, options.conditionId)
    if ('error' in parsed) {
      failures.push({
        decisionId: decision.decisionId,
        rawOutputFile,
        message: parsed.error,
      })
      continue
    }

    const result = verifyReasoningTrace(decision, parsed.trace)
    traces.push(parsed.trace)
    results.push(result)

    const tracePath = join(tracesDir, `${safeFilename(decision.decisionId)}.json`)
    const resultPath = join(resultsDir, `${safeFilename(decision.decisionId)}.json`)
    writeJson(tracePath, parsed.trace)
    writeJson(resultPath, result)
    tracePaths.push(tracePath)
    resultPaths.push(resultPath)
  }

  const verifierMetrics = summarizeVerifierResults(results)
  const metricsPath = join(options.outputDir, 'metrics.json')
  writeJson(metricsPath, {
    schemaVersion: '0.1.0',
    conditionId: options.conditionId,
    totalDecisionPoints: options.decisions.length,
    totalParsedTraces: traces.length,
    parseFailureCount: failures.length,
    hardFailureCount: verifierMetrics.hardFailureCount,
    labelStatusCounts: verifierMetrics.labelStatusCounts,
    traceFiles: tracePaths.map(path => path.replace(`${options.outputDir}/`, '')),
    resultFiles: resultPaths.map(path => path.replace(`${options.outputDir}/`, '')),
    failures,
  })

  return { metricsPath, tracePaths, resultPaths, failures }
}

function parseReasoningTrace(
  raw: string,
  decision: GuandanDecisionPoint,
  conditionId: LLMConditionId,
): { trace: LLMReasoningTrace } | { error: string } {
  try {
    const value = JSON.parse(stripMarkdownFence(raw))
    if (!isReasoningTraceLike(value)) {
      return { error: 'Parsed JSON does not match the required reasoning trace shape.' }
    }
    if (value.decisionId !== decision.decisionId) {
      return { error: `Trace decisionId ${value.decisionId} does not match ${decision.decisionId}.` }
    }
    return {
      trace: {
        ...value,
        schemaVersion: '0.1.0',
        agentId: conditionId,
      },
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown parse error.' }
  }
}

function stripMarkdownFence(raw: string): string {
  const trimmed = raw.trim()
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  return match ? match[1].trim() : trimmed
}

function isReasoningTraceLike(value: unknown): value is LLMReasoningTrace {
  if (!value || typeof value !== 'object') return false
  const trace = value as Partial<LLMReasoningTrace>
  return trace.schemaVersion === '0.1.0'
    && typeof trace.decisionId === 'string'
    && typeof trace.agentId === 'string'
    && typeof trace.selectedActionId === 'string'
    && Boolean(trace.teamObjective)
    && Boolean(trace.partnerBelief)
    && Boolean(trace.opponentBelief)
    && Boolean(trace.actionRationale)
    && Boolean(trace.riskAssessment)
    && typeof trace.confidence === 'number'
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function safeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_')
}
