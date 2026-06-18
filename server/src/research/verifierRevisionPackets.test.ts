import { describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createBaselineTrace } from './baselineTraceAgents'
import { generatePilotDecisionDataset } from './pilotDatasetExporter'
import { verifyReasoningTrace } from './reasoningVerifier'
import { writePilotVerifierArtifacts } from './pilotVerifierRunner'
import {
  createRevisionPromptPacket,
  readRevisionPromptInputsFromDirectories,
  writeRevisionPromptPackets,
} from './verifierRevisionPackets'

describe('verifierRevisionPackets', () => {
  it('creates a verifier-in-the-loop revision prompt packet', () => {
    const dataset = generatePilotDecisionDataset({ targetCount: 1, gameIdPrefix: 'revision' })
    const decision = dataset.decisions[0]
    const trace = createBaselineTrace(decision, 'strategic-heuristic')
    const verifierResult = verifyReasoningTrace(decision, trace)

    const packet = createRevisionPromptPacket(decision, trace, verifierResult)

    expect(packet.schemaVersion).toBe('0.1.0')
    expect(packet.conditionId).toBe('verifier-revision-llm')
    expect(packet.decisionId).toBe(decision.decisionId)
    expect(packet.expectedRawOutputFile).toBe(`${decision.decisionId}-revision.txt`)
    expect(packet.messages).toHaveLength(2)
    expect(packet.messages[0].content).toContain('revise a Guandan reasoning trace')
    expect(packet.messages[1].content).toContain('Previous reasoning trace:')
    expect(packet.messages[1].content).toContain('Verifier result:')
    expect(packet.messages[1].content).toContain(verifierResult.summary)
  })

  it('writes revision packets and a manifest', () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'guandan-revision-packets-'))
    const dataset = generatePilotDecisionDataset({ targetCount: 2, gameIdPrefix: 'revision-file' })
    const inputs = dataset.decisions.map(decision => {
      const trace = createBaselineTrace(decision, 'strategic-heuristic')
      return {
        decision,
        trace,
        verifierResult: verifyReasoningTrace(decision, trace),
      }
    })

    try {
      const result = writeRevisionPromptPackets({ inputs, outputDir })

      expect(result.packetPaths).toHaveLength(2)
      const manifest = JSON.parse(readFileSync(result.manifestPath, 'utf8'))
      expect(manifest.conditionId).toBe('verifier-revision-llm')
      expect(manifest.totalPromptPackets).toBe(2)
      expect(manifest.rawOutputDir).toBe('raw')

      const firstPacket = JSON.parse(readFileSync(result.packetPaths[0], 'utf8'))
      expect(firstPacket.expectedRawOutputFile).toContain('-revision.txt')
    } finally {
      rmSync(outputDir, { recursive: true, force: true })
    }
  })

  it('reads revision inputs from decision, trace, and verifier result directories', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-revision-inputs-'))
    const decisionDir = join(rootDir, 'decisions')
    const verifierDir = join(rootDir, 'verifier')
    const dataset = generatePilotDecisionDataset({ targetCount: 2, gameIdPrefix: 'revision-read' })

    try {
      writeDatasetDecisions(decisionDir, dataset.decisions)
      writePilotVerifierArtifacts({
        decisions: dataset.decisions,
        outputDir: verifierDir,
        agentId: 'strategic-heuristic',
      })

      const inputs = readRevisionPromptInputsFromDirectories({
        decisionDir,
        traceDir: join(verifierDir, 'traces'),
        resultDir: join(verifierDir, 'results'),
      })

      expect(inputs).toHaveLength(2)
      expect(inputs[0].decision.decisionId).toBe(dataset.decisions[0].decisionId)
      expect(inputs[0].trace.decisionId).toBe(dataset.decisions[0].decisionId)
      expect(inputs[0].verifierResult.decisionId).toBe(dataset.decisions[0].decisionId)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('skips decisions without parsed traces or verifier results', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-revision-inputs-partial-'))
    const decisionDir = join(rootDir, 'decisions')
    const verifierDir = join(rootDir, 'verifier')
    const dataset = generatePilotDecisionDataset({ targetCount: 2, gameIdPrefix: 'revision-partial' })

    try {
      writeDatasetDecisions(decisionDir, dataset.decisions)
      writePilotVerifierArtifacts({
        decisions: dataset.decisions,
        outputDir: verifierDir,
        agentId: 'strategic-heuristic',
      })
      rmSync(join(verifierDir, 'traces', `${dataset.decisions[0].decisionId}.json`), { force: true })

      const inputs = readRevisionPromptInputsFromDirectories({
        decisionDir,
        traceDir: join(verifierDir, 'traces'),
        resultDir: join(verifierDir, 'results'),
      })

      expect(inputs).toHaveLength(1)
      expect(inputs[0].decision.decisionId).toBe(dataset.decisions[1].decisionId)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function writeDatasetDecisions(
  decisionDir: string,
  decisions: ReturnType<typeof generatePilotDecisionDataset>['decisions'],
): void {
  mkdirSync(decisionDir, { recursive: true })
  for (const decision of decisions) {
    writeFileSync(join(decisionDir, `${decision.decisionId}.json`), `${JSON.stringify(decision, null, 2)}\n`, 'utf8')
  }
}
