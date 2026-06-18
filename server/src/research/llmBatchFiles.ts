import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, join } from 'node:path'
import type { LLMPromptPacket } from './llmPromptPackets'

export interface LLMBatchExportOptions {
  promptPacketDir: string
  outputDir: string
}

export interface LLMBatchExportResult {
  batchJsonlPath: string
  manifestPath: string
  rawOutputDir: string
  packetCount: number
}

export interface LLMRawOutputAuditOptions {
  promptPacketDir: string
  rawOutputDir: string
  outputPath: string
}

export interface LLMRawOutputAuditResult {
  schemaVersion: '0.1.0'
  promptPacketDir: string
  rawOutputDir: string
  expectedCount: number
  presentCount: number
  emptyCount: number
  missingCount: number
  unexpectedCount: number
  readyForIngest: boolean
  missingFiles: string[]
  emptyFiles: string[]
  unexpectedFiles: string[]
}

export function writeLLMBatchFiles(options: LLMBatchExportOptions): LLMBatchExportResult {
  const packets = readPromptPacketsFromDirectory(options.promptPacketDir)
  mkdirSync(options.outputDir, { recursive: true })

  const rawOutputDir = join(options.outputDir, 'raw')
  mkdirSync(rawOutputDir, { recursive: true })

  const batchJsonlPath = join(options.outputDir, 'batch-input.jsonl')
  const jsonl = packets.map(packet => JSON.stringify({
    custom_id: packet.decisionId,
    condition_id: packet.conditionId,
    messages: packet.messages,
    response_schema_path: packet.responseSchemaPath,
    expected_raw_output_file: packet.expectedRawOutputFile,
  })).join('\n')
  writeFileSync(batchJsonlPath, `${jsonl}\n`, 'utf8')

  const manifestPath = join(options.outputDir, 'batch-manifest.json')
  writeJson(manifestPath, {
    schemaVersion: '0.1.0',
    sourcePromptPacketDir: options.promptPacketDir,
    providerFormat: 'generic-chat-jsonl',
    packetCount: packets.length,
    batchJsonlFile: basename(batchJsonlPath),
    rawOutputDir: 'raw',
    expectedRawOutputFiles: packets.map(packet => packet.expectedRawOutputFile),
    ingestCommandTemplate: [
      'npx tsx server/src/research/ingestLLMRawOutputsCli.ts',
      '--input docs/research/experiments/pilot-e1/decisions',
      `--raw ${rawOutputDir}`,
      '--out <condition-results-dir>',
      `--condition ${packets[0]?.conditionId ?? '<condition-id>'}`,
    ].join(' '),
  })

  return { batchJsonlPath, manifestPath, rawOutputDir, packetCount: packets.length }
}

export function auditLLMRawOutputs(options: LLMRawOutputAuditOptions): LLMRawOutputAuditResult {
  const packets = readPromptPacketsFromDirectory(options.promptPacketDir)
  const expectedFiles = packets.map(packet => packet.expectedRawOutputFile).sort()
  const expectedSet = new Set(expectedFiles)
  const presentFiles = existsSync(options.rawOutputDir)
    ? readdirSync(options.rawOutputDir).filter(filename => filename.endsWith('.txt')).sort()
    : []

  const presentSet = new Set(presentFiles)
  const missingFiles = expectedFiles.filter(filename => !presentSet.has(filename))
  const emptyFiles = presentFiles
    .filter(filename => expectedSet.has(filename))
    .filter(filename => statSync(join(options.rawOutputDir, filename)).size === 0)
  const unexpectedFiles = presentFiles.filter(filename => !expectedSet.has(filename))

  const result: LLMRawOutputAuditResult = {
    schemaVersion: '0.1.0',
    promptPacketDir: options.promptPacketDir,
    rawOutputDir: options.rawOutputDir,
    expectedCount: expectedFiles.length,
    presentCount: expectedFiles.length - missingFiles.length,
    emptyCount: emptyFiles.length,
    missingCount: missingFiles.length,
    unexpectedCount: unexpectedFiles.length,
    readyForIngest: missingFiles.length === 0 && emptyFiles.length === 0,
    missingFiles,
    emptyFiles,
    unexpectedFiles,
  }

  mkdirSync(dirname(options.outputPath), { recursive: true })
  writeJson(options.outputPath, result)
  return result
}

export function readPromptPacketsFromDirectory(promptPacketDir: string): LLMPromptPacket[] {
  return readdirSync(promptPacketDir)
    .filter(filename => filename.endsWith('.json'))
    .sort()
    .map(filename => JSON.parse(readFileSync(join(promptPacketDir, filename), 'utf8')) as LLMPromptPacket)
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
