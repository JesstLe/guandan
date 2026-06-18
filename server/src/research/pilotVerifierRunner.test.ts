import { describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { generatePilotDecisionDataset } from './pilotDatasetExporter'
import { runPilotVerifier, writePilotVerifierArtifacts } from './pilotVerifierRunner'

describe('pilotVerifierRunner', () => {
  it('runs the heuristic trace through the hard verifier for each decision', () => {
    const dataset = generatePilotDecisionDataset({ targetCount: 10, gameIdPrefix: 'verifier-pilot' })
    const report = runPilotVerifier(dataset.decisions)

    expect(report.schemaVersion).toBe('0.1.0')
    expect(report.agentId).toBe('heuristic-legal-first')
    expect(report.results).toHaveLength(10)
    expect(report.metrics.totalDecisionPoints).toBe(10)
    expect(report.metrics.hardFailureCount).toBe(0)
    expect(report.metrics.labelStatusCounts.legalAction.pass).toBe(10)
  })

  it('writes verifier results and metrics artifacts', () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'guandan-verifier-pilot-'))
    const dataset = generatePilotDecisionDataset({ targetCount: 5, gameIdPrefix: 'verifier-file' })

    try {
      const writeResult = writePilotVerifierArtifacts({
        decisions: dataset.decisions,
        outputDir,
      })

      expect(writeResult.metricsPath).toBe(join(outputDir, 'metrics.json'))
      expect(writeResult.tracePaths).toHaveLength(5)
      expect(writeResult.resultPaths).toHaveLength(5)

      const metrics = JSON.parse(readFileSync(writeResult.metricsPath, 'utf8'))
      expect(metrics.totalDecisionPoints).toBe(5)
      expect(metrics.hardFailureCount).toBe(0)
      expect(metrics.traceFiles).toHaveLength(5)

      const firstTrace = JSON.parse(readFileSync(writeResult.tracePaths[0], 'utf8'))
      expect(firstTrace.schemaVersion).toBe('0.1.0')
      expect(firstTrace.agentId).toBe('heuristic-legal-first')

      const firstResult = JSON.parse(readFileSync(writeResult.resultPaths[0], 'utf8'))
      expect(firstResult.schemaVersion).toBe('0.1.0')
      expect(firstResult.agentId).toBe('heuristic-legal-first')
    } finally {
      rmSync(outputDir, { recursive: true, force: true })
    }
  })

  it('runs the strategic heuristic as a baseline verifier condition', () => {
    const dataset = generatePilotDecisionDataset({ targetCount: 10, gameIdPrefix: 'strategic-pilot' })
    const report = runPilotVerifier(dataset.decisions, { agentId: 'strategic-heuristic' })

    expect(report.agentId).toBe('strategic-heuristic')
    expect(report.results).toHaveLength(10)
    expect(report.results.every(result => result.agentId === 'strategic-heuristic')).toBe(true)
    expect(report.metrics.hardFailureCount).toBe(0)
  })
})
