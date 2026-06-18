import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { GuandanDecisionPoint } from '@guandan/shared'

export type LLMConditionId = 'plain-llm' | 'candidate-constrained-llm' | 'verifier-revision-llm'

export interface PromptMessage {
  role: 'system' | 'user'
  content: string
}

export interface LLMPromptPacket {
  schemaVersion: '0.1.0'
  conditionId: LLMConditionId
  decisionId: string
  promptTemplatePath: string
  responseSchemaPath: string
  expectedRawOutputFile: string
  messages: PromptMessage[]
}

export interface WritePromptPacketsOptions {
  decisions: GuandanDecisionPoint[]
  conditionId: LLMConditionId
  outputDir: string
}

export interface PromptPacketWriteResult {
  manifestPath: string
  packetPaths: string[]
}

export function createPromptPacket(
  decision: GuandanDecisionPoint,
  conditionId: LLMConditionId,
): LLMPromptPacket {
  const promptTemplatePath = conditionId === 'plain-llm'
    ? 'docs/research/prompts/plain-llm-v0.1.md'
    : 'docs/research/prompts/candidate-constrained-llm-v0.1.md'

  return {
    schemaVersion: '0.1.0',
    conditionId,
    decisionId: decision.decisionId,
    promptTemplatePath,
    responseSchemaPath: 'docs/research/schemas/reasoning-trace.schema.json',
    expectedRawOutputFile: `${safeFilename(decision.decisionId)}.txt`,
    messages: [
      { role: 'system', content: systemMessage(conditionId) },
      { role: 'user', content: userMessage(decision, conditionId) },
    ],
  }
}

export function writePromptPackets(options: WritePromptPacketsOptions): PromptPacketWriteResult {
  const packetsDir = join(options.outputDir, 'packets')
  mkdirSync(packetsDir, { recursive: true })

  const packetPaths = options.decisions.map(decision => {
    const packet = createPromptPacket(decision, options.conditionId)
    const path = join(packetsDir, `${safeFilename(decision.decisionId)}.json`)
    writeJson(path, packet)
    return path
  })

  const manifestPath = join(options.outputDir, 'manifest.json')
  writeJson(manifestPath, {
    schemaVersion: '0.1.0',
    conditionId: options.conditionId,
    totalPromptPackets: packetPaths.length,
    packetFiles: packetPaths.map(path => path.replace(`${options.outputDir}/`, '')),
    rawOutputDir: 'raw',
    responseSchemaPath: 'docs/research/schemas/reasoning-trace.schema.json',
  })

  return { manifestPath, packetPaths }
}

function systemMessage(conditionId: LLMConditionId): string {
  if (conditionId === 'candidate-constrained-llm') {
    return [
      'You are an LLM agent acting in a zero-communication cooperative-competitive Guandan decision point.',
      'The legal action list is verifier-provided; select exactly one selectedActionId from it.',
      'Do not assert hidden partner or opponent cards as facts.',
      'Return JSON only, matching reasoning-trace.schema.json.',
    ].join(' ')
  }

  return [
    'You are an LLM agent acting in a zero-communication cooperative-competitive Guandan decision point.',
    'Choose one action from the provided legal actions and return one reasoning trace.',
    'Do not assert hidden partner or opponent cards as facts.',
    'Return JSON only, matching reasoning-trace.schema.json.',
  ].join(' ')
}

function userMessage(decision: GuandanDecisionPoint, conditionId: LLMConditionId): string {
  const decisionJson = JSON.stringify(decision, null, 2)
  if (conditionId === 'candidate-constrained-llm') {
    return [
      'Decision point:',
      decisionJson,
      '',
      'Legal candidates:',
      JSON.stringify(decision.legalActions, null, 2),
      '',
      `Use agentId "${conditionId}" and decisionId "${decision.decisionId}".`,
    ].join('\n')
  }

  return [
    'Decision point:',
    decisionJson,
    '',
    `Use agentId "${conditionId}" and decisionId "${decision.decisionId}".`,
  ].join('\n')
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function safeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_')
}
