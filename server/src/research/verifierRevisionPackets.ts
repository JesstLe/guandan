import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type {
  GuandanDecisionPoint,
  LLMReasoningTrace,
  VerifierResult,
} from '@guandan/shared'
import type { LLMPromptPacket } from './llmPromptPackets'

export interface RevisionPromptInput {
  decision: GuandanDecisionPoint
  trace: LLMReasoningTrace
  verifierResult: VerifierResult
}

export interface WriteRevisionPromptPacketsOptions {
  inputs: RevisionPromptInput[]
  outputDir: string
}

export interface ReadRevisionPromptInputsOptions {
  decisionDir: string
  traceDir: string
  resultDir: string
}

export interface RevisionPromptPacketWriteResult {
  manifestPath: string
  packetPaths: string[]
}

export function createRevisionPromptPacket(
  decision: GuandanDecisionPoint,
  trace: LLMReasoningTrace,
  verifierResult: VerifierResult,
): LLMPromptPacket {
  return {
    schemaVersion: '0.1.0',
    conditionId: 'verifier-revision-llm',
    decisionId: decision.decisionId,
    promptTemplatePath: 'docs/research/prompts/verifier-revision-llm-v0.1.md',
    responseSchemaPath: 'docs/research/schemas/reasoning-trace.schema.json',
    expectedRawOutputFile: `${safeFilename(decision.decisionId)}-revision.txt`,
    messages: [
      { role: 'system', content: revisionSystemMessage() },
      { role: 'user', content: revisionUserMessage(decision, trace, verifierResult) },
    ],
  }
}

export function writeRevisionPromptPackets(
  options: WriteRevisionPromptPacketsOptions,
): RevisionPromptPacketWriteResult {
  const packetsDir = join(options.outputDir, 'packets')
  mkdirSync(packetsDir, { recursive: true })

  const packetPaths = options.inputs.map(input => {
    const packet = createRevisionPromptPacket(input.decision, input.trace, input.verifierResult)
    const path = join(packetsDir, `${safeFilename(input.decision.decisionId)}-revision.json`)
    writeJson(path, packet)
    return path
  })

  const manifestPath = join(options.outputDir, 'manifest.json')
  writeJson(manifestPath, {
    schemaVersion: '0.1.0',
    conditionId: 'verifier-revision-llm',
    totalPromptPackets: packetPaths.length,
    packetFiles: packetPaths.map(path => path.replace(`${options.outputDir}/`, '')),
    rawOutputDir: 'raw',
    responseSchemaPath: 'docs/research/schemas/reasoning-trace.schema.json',
    sourceTraceRequired: true,
    sourceVerifierResultRequired: true,
  })

  return { manifestPath, packetPaths }
}

export function readRevisionPromptInputsFromDirectories(
  options: ReadRevisionPromptInputsOptions,
): RevisionPromptInput[] {
  return readdirSync(options.decisionDir)
    .filter(filename => filename.endsWith('.json'))
    .sort()
    .map(filename => {
      const decision = readJson<GuandanDecisionPoint>(join(options.decisionDir, filename))
      const tracePath = join(options.traceDir, `${safeFilename(decision.decisionId)}.json`)
      const resultPath = join(options.resultDir, `${safeFilename(decision.decisionId)}.json`)
      return {
        decision,
        trace: readJson<LLMReasoningTrace>(tracePath),
        verifierResult: readJson<VerifierResult>(resultPath),
      }
    })
}

function revisionSystemMessage(): string {
  return [
    'You revise a Guandan reasoning trace after verifier feedback.',
    'Return JSON only, matching reasoning-trace.schema.json.',
    'Keep decisionId unchanged and use agentId "verifier-revision-llm".',
    'Resolve all hard failures when possible and address soft warnings without asserting hidden cards as facts.',
    'Select exactly one selectedActionId from the provided legal actions.',
  ].join(' ')
}

function revisionUserMessage(
  decision: GuandanDecisionPoint,
  trace: LLMReasoningTrace,
  verifierResult: VerifierResult,
): string {
  return [
    'Decision point:',
    JSON.stringify(decision, null, 2),
    '',
    'Previous reasoning trace:',
    JSON.stringify(trace, null, 2),
    '',
    'Verifier result:',
    JSON.stringify(verifierResult, null, 2),
    '',
    'Revision task:',
    [
      '- Produce one corrected reasoning trace.',
      '- Keep the same decisionId.',
      '- Use agentId "verifier-revision-llm".',
      '- If the previous selectedActionId caused hard failures, choose a legal alternative from legalActions.',
      '- Do not claim hidden partner or opponent cards as facts; use probabilistic wording for beliefs.',
      '- If no correction is needed, return a trace that preserves the selected action but improves the rationale.',
    ].join('\n'),
  ].join('\n')
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function safeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_')
}
