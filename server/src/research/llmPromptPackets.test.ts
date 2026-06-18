import { describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { generatePilotDecisionDataset } from './pilotDatasetExporter'
import { createPromptPacket, writePromptPackets } from './llmPromptPackets'

describe('llmPromptPackets', () => {
  it('creates a plain LLM prompt packet for one decision point', () => {
    const dataset = generatePilotDecisionDataset({ targetCount: 1, gameIdPrefix: 'prompt' })
    const packet = createPromptPacket(dataset.decisions[0], 'plain-llm')

    expect(packet.schemaVersion).toBe('0.1.0')
    expect(packet.conditionId).toBe('plain-llm')
    expect(packet.decisionId).toBe(dataset.decisions[0].decisionId)
    expect(packet.messages).toHaveLength(2)
    expect(packet.messages[0].role).toBe('system')
    expect(packet.messages[1].content).toContain(dataset.decisions[0].decisionId)
    expect(packet.expectedRawOutputFile).toContain(`${dataset.decisions[0].decisionId}.txt`)
  })

  it('creates a candidate-constrained packet that repeats the legal action list', () => {
    const dataset = generatePilotDecisionDataset({ targetCount: 1, gameIdPrefix: 'prompt' })
    const packet = createPromptPacket(dataset.decisions[0], 'candidate-constrained-llm')

    expect(packet.conditionId).toBe('candidate-constrained-llm')
    expect(packet.messages[1].content).toContain('Legal candidates:')
    expect(packet.messages[1].content).toContain(dataset.decisions[0].legalActions[0].actionId)
  })

  it('writes prompt packets and a manifest', () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'guandan-prompts-'))
    const dataset = generatePilotDecisionDataset({ targetCount: 3, gameIdPrefix: 'prompt-file' })

    try {
      const result = writePromptPackets({
        decisions: dataset.decisions,
        conditionId: 'plain-llm',
        outputDir,
      })

      expect(result.manifestPath).toBe(join(outputDir, 'manifest.json'))
      expect(result.packetPaths).toHaveLength(3)

      const manifest = JSON.parse(readFileSync(result.manifestPath, 'utf8'))
      expect(manifest.conditionId).toBe('plain-llm')
      expect(manifest.totalPromptPackets).toBe(3)

      const firstPacket = JSON.parse(readFileSync(result.packetPaths[0], 'utf8'))
      expect(firstPacket.schemaVersion).toBe('0.1.0')
      expect(firstPacket.conditionId).toBe('plain-llm')
    } finally {
      rmSync(outputDir, { recursive: true, force: true })
    }
  })
})
