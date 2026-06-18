import { describe, expect, it } from 'vitest'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { generatePilotDecisionDataset } from './pilotDatasetExporter'
import { auditLLMRawOutputs, writeLLMBatchFiles } from './llmBatchFiles'
import { writePromptPackets } from './llmPromptPackets'

describe('llmBatchFiles', () => {
  it('exports prompt packets to provider-neutral JSONL and manifest files', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-llm-batch-'))
    const promptDir = join(rootDir, 'prompts')
    const batchDir = join(rootDir, 'batch')
    const dataset = generatePilotDecisionDataset({ targetCount: 3, gameIdPrefix: 'batch' })

    try {
      writePromptPackets({
        decisions: dataset.decisions,
        conditionId: 'plain-llm',
        outputDir: promptDir,
      })

      const result = writeLLMBatchFiles({
        promptPacketDir: join(promptDir, 'packets'),
        outputDir: batchDir,
      })

      expect(result.packetCount).toBe(3)
      expect(result.rawOutputDir).toBe(join(batchDir, 'raw'))

      const jsonlLines = readFileSync(result.batchJsonlPath, 'utf8').trim().split('\n')
      expect(jsonlLines).toHaveLength(3)
      const firstLine = JSON.parse(jsonlLines[0])
      expect(firstLine.custom_id).toBe(dataset.decisions[0].decisionId)
      expect(firstLine.messages).toHaveLength(2)

      const manifest = JSON.parse(readFileSync(result.manifestPath, 'utf8'))
      expect(manifest.providerFormat).toBe('generic-chat-jsonl')
      expect(manifest.expectedRawOutputFiles).toHaveLength(3)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('audits missing, empty, and unexpected raw output files', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-llm-audit-'))
    const promptDir = join(rootDir, 'prompts')
    const rawDir = join(rootDir, 'raw')
    const auditPath = join(rootDir, 'audit', 'raw-output-audit.json')
    const dataset = generatePilotDecisionDataset({ targetCount: 3, gameIdPrefix: 'audit' })

    try {
      const promptResult = writePromptPackets({
        decisions: dataset.decisions,
        conditionId: 'candidate-constrained-llm',
        outputDir: promptDir,
      })
      mkdirSync(rawDir, { recursive: true })

      const firstPacket = JSON.parse(readFileSync(promptResult.packetPaths[0], 'utf8'))
      const secondPacket = JSON.parse(readFileSync(promptResult.packetPaths[1], 'utf8'))
      writeFileSync(join(rawDir, firstPacket.expectedRawOutputFile), '{"ok": true}', 'utf8')
      writeFileSync(join(rawDir, secondPacket.expectedRawOutputFile), '', 'utf8')
      writeFileSync(join(rawDir, 'unexpected.txt'), 'extra', 'utf8')

      const audit = auditLLMRawOutputs({
        promptPacketDir: join(promptDir, 'packets'),
        rawOutputDir: rawDir,
        outputPath: auditPath,
      })

      expect(audit.expectedCount).toBe(3)
      expect(audit.presentCount).toBe(2)
      expect(audit.missingCount).toBe(1)
      expect(audit.emptyCount).toBe(1)
      expect(audit.unexpectedCount).toBe(1)
      expect(audit.readyForIngest).toBe(false)

      const writtenAudit = JSON.parse(readFileSync(auditPath, 'utf8'))
      expect(writtenAudit.missingFiles).toHaveLength(1)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
