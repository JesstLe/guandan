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
import { writeHumanAuditPacketQualityReport } from './humanAuditPacketQuality'

describe('humanAuditPacketQuality', () => {
  it('marks a blind, complete, embedded packet as ready for annotation but not paper evidence', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-quality-'))
    try {
      writeFixturePacket(rootDir)

      const result = writeHumanAuditPacketQualityReport(paths(rootDir))

      expect(result.report.status).toBe('packet_ready')
      expect(result.report.sampleCount).toBe(2)
      expect(result.report.readyForAnnotation).toBe(true)
      expect(result.report.readyForPaperEvidence).toBe(false)
      expect(result.report.checks.every(check => check.status === 'pass')).toBe(true)
      expect(result.report.warnings).toContain('Annotation CSV contains no human labels yet; agreement remains pending until annotation is completed.')
      expect(result.report.stratumCounts).toEqual({
        lead_opening: 1,
        'follow_beat_or_pass;opponent_near_finish': 1,
      })

      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('Status: `packet_ready`')
      expect(markdown).toContain('| Ready for annotation | yes |')
      expect(markdown).toContain('| Ready for paper evidence | no |')
      expect(markdown).toContain('not human-audit evidence until human labels are completed')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('fails when answer-key sample ids do not match the blind packet', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-quality-fail-'))
    try {
      writeFixturePacket(rootDir)
      writeFileSync(join(rootDir, 'answer-key.jsonl'), `${JSON.stringify({
        sampleId: 'missing-sample',
        verifierPartnerConsistent: 'pass',
        verifierOpponentConsistent: 'pass',
        verifierTeamObjectiveValid: 'pass',
        verifierHiddenInfoDisciplined: 'pass',
        verifierReasonActionConsistent: 'pass',
      })}\n`, 'utf8')

      const result = writeHumanAuditPacketQualityReport(paths(rootDir))

      expect(result.report.status).toBe('needs_attention')
      expect(result.report.readyForAnnotation).toBe(false)
      expect(result.report.checks.find(check => check.id === 'answer-key-count')?.status).toBe('fail')
      expect(result.report.checks.find(check => check.id === 'answer-key-id-match')?.status).toBe('fail')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function paths(rootDir: string) {
  return {
    manifestPath: join(rootDir, 'manifest.json'),
    blindJsonlPath: join(rootDir, 'blind.jsonl'),
    answerKeyJsonlPath: join(rootDir, 'answer-key.jsonl'),
    annotationCsvPath: join(rootDir, 'annotations.csv'),
    annotatorHtmlPath: join(rootDir, 'annotator.html'),
    protocolPath: join(rootDir, 'protocol.md'),
    outputDir: rootDir,
  }
}

function writeFixturePacket(rootDir: string): void {
  mkdirSync(rootDir, { recursive: true })
  const blindRows = [
    {
      sampleId: 'human-audit-001',
      decisionId: 'd-1',
      phase: 'lead',
      scenarioTags: 'lead_opening',
      handCounts: '4/3/3/3',
      selectedActionId: 'play-single-spade-3-copy1',
      legalActionCount: 4,
      publicEventSummary: 'e-1:new_game',
      teamObjective: 'gain_lead: lead cheaply',
      partnerBelief: 'partner unknown',
      opponentBelief: 'opponents unknown',
      actionRationale: 'lowest single',
      riskSummary: 'opponent may beat',
    },
    {
      sampleId: 'human-audit-002',
      decisionId: 'd-2',
      phase: 'follow',
      scenarioTags: 'follow_beat_or_pass;opponent_near_finish',
      handCounts: '2/3/3/3',
      selectedActionId: 'pass',
      legalActionCount: 3,
      publicEventSummary: 'e-2:play:p0',
      teamObjective: 'protect_partner: conserve',
      partnerBelief: 'partner unknown',
      opponentBelief: 'opponent near finish',
      actionRationale: 'pass preserves control option',
      riskSummary: 'opponent may keep lead',
    },
  ]
  const answerRows = blindRows.map(row => ({
    ...row,
    verifierPartnerConsistent: 'pass',
    verifierOpponentConsistent: 'pass',
    verifierTeamObjectiveValid: 'pass',
    verifierHiddenInfoDisciplined: 'pass',
    verifierReasonActionConsistent: 'pass',
  }))

  writeFileSync(join(rootDir, 'manifest.json'), `${JSON.stringify({
    schemaVersion: '0.1.0',
    sampleCount: 2,
    stratumCounts: {
      lead_opening: 1,
      'follow_beat_or_pass;opponent_near_finish': 1,
    },
    status: 'annotation_packet_prepared_not_human_completed',
  }, null, 2)}\n`, 'utf8')
  writeFileSync(join(rootDir, 'blind.jsonl'), `${blindRows.map(row => JSON.stringify(row)).join('\n')}\n`, 'utf8')
  writeFileSync(join(rootDir, 'answer-key.jsonl'), `${answerRows.map(row => JSON.stringify(row)).join('\n')}\n`, 'utf8')
  writeFileSync(join(rootDir, 'annotations.csv'), [
    'sampleId,decisionId,phase,scenarioTags,handCounts,selectedActionId,legalActionCount,publicEventSummary,teamObjective,partnerBelief,opponentBelief,actionRationale,riskSummary,humanPartnerConsistent,humanOpponentConsistent,humanTeamObjectiveValid,humanHiddenInfoDisciplined,humanReasonActionConsistent,humanNotes',
    '"human-audit-001","d-1","lead","lead_opening","4/3/3/3","play-single-spade-3-copy1","4","e-1:new_game","gain_lead: lead cheaply","partner unknown","opponents unknown","lowest single","opponent may beat","","","","","",""',
    '"human-audit-002","d-2","follow","follow_beat_or_pass;opponent_near_finish","2/3/3/3","pass","3","e-2:play:p0","protect_partner: conserve","partner unknown","opponent near finish","pass preserves control option","opponent may keep lead","","","","","",""',
    '',
  ].join('\n'), 'utf8')
  writeFileSync(join(rootDir, 'annotator.html'), `<html><body><script id="samples-data" type="application/json">${JSON.stringify(blindRows)}</script></body></html>`, 'utf8')
  writeFileSync(join(rootDir, 'protocol.md'), [
    '# Protocol',
    '## Labeling Rubric',
    '- humanPartnerConsistent',
    '- humanOpponentConsistent',
    '- humanTeamObjectiveValid',
    '- humanHiddenInfoDisciplined',
    '- humanReasonActionConsistent',
    '',
  ].join('\n'), 'utf8')
}
