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
import { writeHumanAuditPacket } from './humanAuditPacket'

describe('humanAuditPacket', () => {
  it('writes blind samples, answer keys, and a rubric-backed protocol', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-packet-'))
    const decisionsDir = join(rootDir, 'decisions')
    const tracesDir = join(rootDir, 'traces')
    const resultsDir = join(rootDir, 'results')
    const outputDir = join(rootDir, 'audit')
    mkdirSync(decisionsDir)
    mkdirSync(tracesDir)
    mkdirSync(resultsDir)

    writeFileSync(join(decisionsDir, 'd-1.json'), JSON.stringify({
      decisionId: 'd-1',
      phase: 'lead',
      handCounts: [4, 3, 3, 3],
      scenarioTags: ['lead_opening'],
      publicHistory: [{ eventId: 'event-1', type: 'new_game' }],
      legalActions: [{ actionId: 'play-single-spade-3-copy1' }],
    }), 'utf8')
    writeFileSync(join(tracesDir, 'd-1.json'), JSON.stringify({
      decisionId: 'd-1',
      selectedActionId: 'play-single-spade-3-copy1',
      teamObjective: { type: 'gain_lead', explanation: 'Lead cheaply.' },
      partnerBelief: { summary: 'Partner is unknown.', evidence: ['event-1'] },
      opponentBelief: { summary: 'Opponents are unknown.', evidence: ['event-1'] },
      actionRationale: { primaryReason: 'Lowest single preserves strength.' },
      riskAssessment: { risks: ['Opponent may beat the card.'], mitigation: 'Low cost.' },
    }), 'utf8')
    writeFileSync(join(resultsDir, 'd-1.json'), JSON.stringify({
      decisionId: 'd-1',
      selectedActionId: 'play-single-spade-3-copy1',
      labels: {
        partnerConsistent: { status: 'unknown' },
        opponentConsistent: { status: 'unknown' },
        teamObjectiveValid: { status: 'pass' },
        hiddenInfoDisciplined: { status: 'pass' },
        reasonActionConsistent: { status: 'pass' },
      },
      hardFailures: [],
      softWarnings: [],
    }), 'utf8')

    try {
      const result = writeHumanAuditPacket({
        decisionsDir,
        tracesDir,
        resultsDir,
        outputDir,
        sampleSize: 1,
      })

      expect(result.sampleCount).toBe(1)
      expect(readFileSync(result.annotationSheetPath, 'utf8')).toContain('humanReasonActionConsistent')
      expect(readFileSync(result.blindJsonlPath, 'utf8')).toContain('"sampleId":"human-audit-001"')
      expect(readFileSync(result.answerKeyPath, 'utf8')).toContain('"verifierReasonActionConsistent":"pass"')

      const protocol = readFileSync(result.protocolPath, 'utf8')
      expect(protocol).toContain('## Labeling Rubric')
      expect(protocol).toContain('Use `pass` when the statement is directly supported')
      expect(protocol).toContain('Use `fail` when the statement contradicts visible public facts')
      expect(protocol).toContain('Use `uncertain` when the visible row does not contain enough evidence')
      expect(protocol).toContain('Do not guess from Guandan expertise beyond the public fields shown in the row.')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
