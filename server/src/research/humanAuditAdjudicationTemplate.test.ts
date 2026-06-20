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
import { writeHumanAuditAdjudicationTemplate } from './humanAuditAdjudicationTemplate'

describe('humanAuditAdjudicationTemplate', () => {
  it('writes an awaiting template report when annotator returns are missing', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-adjudication-awaiting-'))
    try {
      writeBlindFixture(rootDir)
      writeReport(rootDir, {
        status: 'awaiting_returns',
        disagreementCount: 0,
        disagreements: [],
        requiresAdjudication: false,
      })

      const result = writeHumanAuditAdjudicationTemplate({
        interAnnotatorReportPath: join(rootDir, 'inter.json'),
        blindJsonlPath: join(rootDir, 'blind.jsonl'),
        outputDir: rootDir,
      })

      expect(result.report.status).toBe('awaiting_returns')
      expect(result.report.readyForAdjudication).toBe(false)
      expect(result.report.templateRows).toBe(0)
      const csv = readFileSync(result.templateCsvPath, 'utf8')
      expect(csv).toContain('sampleId,decisionId,label,annotatorA,annotatorB')
      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('this template is a readiness artifact')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('writes a context-rich adjudication template for disagreement rows', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-adjudication-ready-'))
    try {
      writeBlindFixture(rootDir)
      writeReport(rootDir, {
        status: 'completed',
        disagreementCount: 2,
        requiresAdjudication: true,
        disagreements: [
          {
            sampleId: 'human-audit-001',
            decisionId: 'd-1',
            label: 'humanPartnerConsistent',
            annotatorA: 'pass',
            annotatorB: 'fail',
          },
          {
            sampleId: 'human-audit-002',
            decisionId: 'd-2',
            label: 'humanReasonActionConsistent',
            annotatorA: 'unknown',
            annotatorB: 'pass',
          },
        ],
      })

      const result = writeHumanAuditAdjudicationTemplate({
        interAnnotatorReportPath: join(rootDir, 'inter.json'),
        blindJsonlPath: join(rootDir, 'blind.jsonl'),
        outputDir: rootDir,
      })

      expect(result.report.status).toBe('ready_for_adjudication')
      expect(result.report.readyForAdjudication).toBe(true)
      expect(result.report.templateRows).toBe(2)
      expect(result.report.checks.every(check => check.status === 'pass')).toBe(true)
      const csv = readFileSync(result.templateCsvPath, 'utf8')
      expect(csv).toContain('teamObjective')
      expect(csv).toContain('gain_lead: lead cheaply')
      expect(csv).toContain('humanPartnerConsistent')
      expect(csv).toContain('adjudicatedLabel,adjudicationNotes')
      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('Resolve `adjudicatedLabel` without using verifier answer-key labels')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('reports that adjudication is not needed when there are no disagreements', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-adjudication-none-'))
    try {
      writeBlindFixture(rootDir)
      writeReport(rootDir, {
        status: 'completed',
        disagreementCount: 0,
        disagreements: [],
        requiresAdjudication: false,
      })

      const result = writeHumanAuditAdjudicationTemplate({
        interAnnotatorReportPath: join(rootDir, 'inter.json'),
        blindJsonlPath: join(rootDir, 'blind.jsonl'),
        outputDir: rootDir,
      })

      expect(result.report.status).toBe('no_adjudication_needed')
      expect(result.report.readyForAdjudication).toBe(false)
      expect(result.report.templateRows).toBe(0)
      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('adjudication is not required')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function writeBlindFixture(rootDir: string): void {
  mkdirSync(rootDir, { recursive: true })
  const rows = [
    {
      sampleId: 'human-audit-001',
      decisionId: 'd-1',
      phase: 'lead',
      scenarioTags: 'lead_opening',
      handCounts: '4/3/3/3',
      selectedActionId: 'play-single-spade-3-copy1',
      legalActionCount: 4,
      publicEventSummary: 'event-1:new_game',
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
      scenarioTags: 'follow_beat_or_pass',
      handCounts: '2/3/3/3',
      selectedActionId: 'pass',
      legalActionCount: 3,
      publicEventSummary: 'event-2:play:p0',
      teamObjective: 'protect_partner: conserve',
      partnerBelief: 'partner may cover',
      opponentBelief: 'opponent near finish',
      actionRationale: 'pass preserves options',
      riskSummary: 'opponent may keep lead',
    },
  ]
  writeFileSync(join(rootDir, 'blind.jsonl'), `${rows.map(row => JSON.stringify(row)).join('\n')}\n`, 'utf8')
}

function writeReport(rootDir: string, report: unknown): void {
  writeFileSync(join(rootDir, 'inter.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
}
