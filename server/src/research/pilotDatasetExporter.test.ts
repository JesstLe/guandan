import { describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { generatePilotDecisionDataset, writePilotDecisionDataset } from './pilotDatasetExporter'

describe('pilotDatasetExporter', () => {
  it('generates the requested number of unique decision points', () => {
    const dataset = generatePilotDecisionDataset({ targetCount: 50, gameIdPrefix: 'pilot' })

    expect(dataset.schemaVersion).toBe('0.1.0')
    expect(dataset.decisions).toHaveLength(50)

    const ids = new Set(dataset.decisions.map(decision => decision.decisionId))
    expect(ids.size).toBe(50)
    expect(dataset.coverage.totalDecisionPoints).toBe(50)
  })

  it('covers at least five scenario tags in the pilot set', () => {
    const dataset = generatePilotDecisionDataset({ targetCount: 50, gameIdPrefix: 'pilot' })

    expect(dataset.coverage.scenarioTags.length).toBeGreaterThanOrEqual(5)
    expect(dataset.coverage.scenarioTags).toEqual(expect.arrayContaining([
      'lead_opening',
      'follow_beat_or_pass',
      'partner_near_finish',
      'opponent_near_finish',
      'endgame_race',
    ]))
  })

  it('writes a manifest and one JSON file per decision point', () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'guandan-research-pilot-'))

    try {
      const result = writePilotDecisionDataset({
        targetCount: 5,
        gameIdPrefix: 'pilot-file',
        outputDir,
      })

      expect(result.manifestPath).toBe(join(outputDir, 'manifest.json'))
      expect(result.decisionPaths).toHaveLength(5)

      const manifest = JSON.parse(readFileSync(result.manifestPath, 'utf8'))
      expect(manifest.schemaVersion).toBe('0.1.0')
      expect(manifest.datasetConstruction).toBe('controlled_game_session_states')
      expect(manifest.sourceDescription).toContain('GameSession')
      expect(manifest.totalDecisionPoints).toBe(5)
      expect(manifest.decisionFiles).toHaveLength(5)

      const firstDecision = JSON.parse(readFileSync(result.decisionPaths[0], 'utf8'))
      expect(firstDecision.schemaVersion).toBe('0.1.0')
      expect(firstDecision.decisionId).toContain('pilot-file-000')
    } finally {
      rmSync(outputDir, { recursive: true, force: true })
    }
  })
})
