import { describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createBaselineTrace } from './baselineTraceAgents'
import { generatePilotDecisionDataset } from './pilotDatasetExporter'
import { ingestLLMRawOutputs } from './llmOutputIngest'

describe('llmOutputIngest', () => {
  it('parses raw LLM JSON outputs, verifies traces, and writes artifacts', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-llm-ingest-'))
    const rawOutputDir = join(rootDir, 'raw')
    const outputDir = join(rootDir, 'out')
    const dataset = generatePilotDecisionDataset({ targetCount: 2, gameIdPrefix: 'llm-ingest' })
    mkdirSync(rawOutputDir, { recursive: true })

    for (const decision of dataset.decisions) {
      const trace = {
        ...createBaselineTrace(decision, 'strategic-heuristic'),
        agentId: 'plain-llm',
      }
      writeFileSync(join(rawOutputDir, `${decision.decisionId}.txt`), JSON.stringify(trace), 'utf8')
    }

    try {
      const result = ingestLLMRawOutputs({
        decisions: dataset.decisions,
        rawOutputDir,
        outputDir,
        conditionId: 'plain-llm',
      })

      expect(result.metricsPath).toBe(join(outputDir, 'metrics.json'))
      expect(result.tracePaths).toHaveLength(2)
      expect(result.resultPaths).toHaveLength(2)

      const metrics = JSON.parse(readFileSync(result.metricsPath, 'utf8'))
      expect(metrics.conditionId).toBe('plain-llm')
      expect(metrics.parseFailureCount).toBe(0)
      expect(metrics.totalParsedTraces).toBe(2)
      expect(metrics.hardFailureCount).toBe(0)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('records parse failures without inventing verifier results', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-llm-ingest-'))
    const rawOutputDir = join(rootDir, 'raw')
    const outputDir = join(rootDir, 'out')
    const dataset = generatePilotDecisionDataset({ targetCount: 1, gameIdPrefix: 'llm-bad' })
    mkdirSync(rawOutputDir, { recursive: true })
    writeFileSync(join(rawOutputDir, `${dataset.decisions[0].decisionId}.txt`), 'not json', 'utf8')

    try {
      const result = ingestLLMRawOutputs({
        decisions: dataset.decisions,
        rawOutputDir,
        outputDir,
        conditionId: 'plain-llm',
      })

      expect(result.tracePaths).toHaveLength(0)
      expect(result.resultPaths).toHaveLength(0)

      const metrics = JSON.parse(readFileSync(result.metricsPath, 'utf8'))
      expect(metrics.parseFailureCount).toBe(1)
      expect(metrics.failures[0].decisionId).toBe(dataset.decisions[0].decisionId)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
