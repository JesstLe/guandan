import {
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import {
  type GuandanDecisionPoint,
  type LLMReasoningTrace,
  type VerifierResult,
} from '@guandan/shared'
import { type BaselineTraceAgentId, createBaselineTrace } from './baselineTraceAgents'
import { verifyReasoningTrace } from './reasoningVerifier'
import { type VerifierMetrics, summarizeVerifierResults } from './verifierMetrics'

export type PilotVerifierMetrics = VerifierMetrics

export interface PilotVerifierReport {
  schemaVersion: '0.1.0'
  agentId: BaselineTraceAgentId
  traces: LLMReasoningTrace[]
  results: VerifierResult[]
  metrics: PilotVerifierMetrics
}

export interface WritePilotVerifierArtifactsOptions {
  decisions: GuandanDecisionPoint[]
  outputDir: string
  agentId?: BaselineTraceAgentId
}

export interface PilotVerifierWriteResult {
  metricsPath: string
  tracePaths: string[]
  resultPaths: string[]
  report: PilotVerifierReport
}

export function runPilotVerifier(
  decisions: GuandanDecisionPoint[],
  options: { agentId?: BaselineTraceAgentId } = {},
): PilotVerifierReport {
  const agentId = options.agentId ?? 'heuristic-legal-first'
  const traces = decisions.map(decision => createBaselineTrace(decision, agentId))
  const results = decisions.map((decision, index) => verifyReasoningTrace(decision, traces[index]))

  return {
    schemaVersion: '0.1.0',
    agentId,
    traces,
    results,
    metrics: summarizeVerifierResults(results),
  }
}

export function writePilotVerifierArtifacts(
  options: WritePilotVerifierArtifactsOptions,
): PilotVerifierWriteResult {
  const report = runPilotVerifier(options.decisions, { agentId: options.agentId })
  const tracesDir = join(options.outputDir, 'traces')
  const resultsDir = join(options.outputDir, 'results')
  mkdirSync(tracesDir, { recursive: true })
  mkdirSync(resultsDir, { recursive: true })

  const tracePaths = report.traces.map(trace => {
    const path = join(tracesDir, `${safeFilename(trace.decisionId)}.json`)
    writeJson(path, trace)
    return path
  })

  const resultPaths = report.results.map(result => {
    const path = join(resultsDir, `${safeFilename(result.decisionId)}.json`)
    writeJson(path, result)
    return path
  })

  const metricsPath = join(options.outputDir, 'metrics.json')
  writeJson(metricsPath, {
    schemaVersion: report.schemaVersion,
    agentId: report.agentId,
    ...report.metrics,
    traceFiles: tracePaths.map(path => path.replace(`${options.outputDir}/`, '')),
    resultFiles: resultPaths.map(path => path.replace(`${options.outputDir}/`, '')),
  })

  return { metricsPath, tracePaths, resultPaths, report }
}

export function readDecisionPointsFromDirectory(inputDir: string): GuandanDecisionPoint[] {
  return readdirSync(inputDir)
    .filter(filename => filename.endsWith('.json'))
    .sort()
    .map(filename => JSON.parse(readFileSync(join(inputDir, filename), 'utf8')) as GuandanDecisionPoint)
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function safeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_')
}
