import { describe, expect, it } from 'vitest'
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeHumanAuditAnnotator } from './humanAuditAnnotator'

describe('humanAuditAnnotator', () => {
  it('generates a standalone annotation UI with embedded samples and CSV-compatible headers', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-annotator-'))

    try {
      const sampleJsonl = join(rootDir, 'sample.jsonl')
      const annotations = join(rootDir, 'annotations.csv')
      const html = join(rootDir, 'human-audit-annotator.html')

      writeFileSync(sampleJsonl, `${JSON.stringify({
        sampleId: 'human-audit-001',
        decisionId: 'd-1',
        phase: 'lead',
        scenarioTags: 'lead_opening',
        handCounts: '4/3/3/3',
        selectedActionId: 'play-single-spade-3-copy1',
        legalActionCount: 4,
        publicEventSummary: 'event-1:new_game',
        teamObjective: 'gain_lead: lead cheaply',
        partnerBelief: 'Partner has no public signal.',
        opponentBelief: 'Opponents are unknown.',
        actionRationale: 'Lowest single preserves strength.',
        riskSummary: 'Opponent may beat the card.',
      })}\n`, 'utf8')
      writeFileSync(annotations, [
        'sampleId,decisionId,humanPartnerConsistent,humanOpponentConsistent,humanTeamObjectiveValid,humanHiddenInfoDisciplined,humanReasonActionConsistent,humanNotes',
        '"human-audit-001","d-1","","","","","",""',
        '',
      ].join('\n'), 'utf8')

      const result = writeHumanAuditAnnotator({
        sampleJsonlPath: sampleJsonl,
        annotationCsvPath: annotations,
        outputHtmlPath: html,
      })

      expect(result.sampleCount).toBe(1)
      expect(result.headers).toContain('humanPartnerConsistent')
      expect(result.htmlPath).toBe(html)

      const rendered = readFileSync(html, 'utf8')
      expect(rendered).toContain('Human Soft-Label Audit Annotator')
      expect(rendered).toContain('<h2>Rubric</h2>')
      expect(rendered).toContain('Supported by visible public facts')
      expect(rendered).toContain('Do not guess from private information')
      expect(rendered).toContain('human-audit-001')
      expect(rendered).toContain('play-single-spade-3-copy1')
      expect(rendered).toContain('humanPartnerConsistent')
      expect(rendered).toContain('humanReasonActionConsistent')
      expect(rendered).toContain('Import CSV')
      expect(rendered).toContain('Export CSV')
      expect(rendered).toContain('parseCsv')
      expect(rendered).toContain("a.download = 'human-audit-completed-annotations.csv'")
      expect(rendered).toContain("if (normalized === 'unknown') return 'uncertain'")
      expect(rendered).toContain('localStorage')
      expect(rendered).not.toContain('human-audit-answer-key')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
