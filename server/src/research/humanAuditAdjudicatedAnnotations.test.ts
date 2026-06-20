import { describe, expect, it } from 'vitest'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeHumanAuditAdjudicatedAnnotations } from './humanAuditAdjudicatedAnnotations'

describe('humanAuditAdjudicatedAnnotations', () => {
  it('writes an awaiting report without creating a final CSV when annotator returns are missing', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-adjudicated-awaiting-'))
    try {
      writeBlindFixture(rootDir)

      const result = writeHumanAuditAdjudicatedAnnotations({
        annotatorACsvPath: join(rootDir, 'a.csv'),
        annotatorBCsvPath: join(rootDir, 'b.csv'),
        adjudicationTemplateCsvPath: join(rootDir, 'template.csv'),
        blindJsonlPath: join(rootDir, 'blind.jsonl'),
        adjudicatedCsvPath: join(rootDir, 'adjudicated.csv'),
        outputDir: rootDir,
      })

      expect(result.report.status).toBe('awaiting_returns')
      expect(result.report.readyForAgreement).toBe(false)
      expect(result.report.adjudicatedCsvWritten).toBe(false)
      expect(existsSync(join(rootDir, 'adjudicated.csv'))).toBe(false)
      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('this report is a readiness artifact')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('requires an adjudicated label for each paired disagreement', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-adjudicated-needs-'))
    try {
      writeBlindFixture(rootDir)
      writeAnnotatorCsv(join(rootDir, 'a.csv'), [
        ['human-audit-001', 'd-1', 'pass', 'pass', 'pass', 'pass', 'pass'],
        ['human-audit-002', 'd-2', 'pass', 'fail', 'pass', 'unknown', 'pass'],
      ])
      writeAnnotatorCsv(join(rootDir, 'b.csv'), [
        ['human-audit-001', 'd-1', 'fail', 'pass', 'pass', 'pass', 'pass'],
        ['human-audit-002', 'd-2', 'pass', 'fail', 'pass', 'unknown', 'pass'],
      ])
      writeFileSync(join(rootDir, 'template.csv'), [
        'sampleId,decisionId,label,annotatorA,annotatorB,adjudicatedLabel,adjudicationNotes',
        'human-audit-001,d-1,humanPartnerConsistent,pass,fail,,needs reviewer decision',
        '',
      ].join('\n'), 'utf8')

      const result = writeHumanAuditAdjudicatedAnnotations({
        annotatorACsvPath: join(rootDir, 'a.csv'),
        annotatorBCsvPath: join(rootDir, 'b.csv'),
        adjudicationTemplateCsvPath: join(rootDir, 'template.csv'),
        blindJsonlPath: join(rootDir, 'blind.jsonl'),
        adjudicatedCsvPath: join(rootDir, 'adjudicated.csv'),
        outputDir: rootDir,
      })

      expect(result.report.status).toBe('needs_adjudication')
      expect(result.report.unresolvedDisagreements).toBe(1)
      expect(result.report.completedLabels).toBe(9)
      expect(result.report.readyForAgreement).toBe(false)
      expect(existsSync(join(rootDir, 'adjudicated.csv'))).toBe(false)
      expect(result.report.invalidLabels[0]).toMatchObject({
        sampleId: 'human-audit-001',
        label: 'humanPartnerConsistent',
        reason: 'missing_adjudicated_label',
      })
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('writes a complete final CSV when agreements and adjudicated disagreements are resolved', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-adjudicated-ready-'))
    try {
      writeBlindFixture(rootDir)
      writeAnnotatorCsv(join(rootDir, 'a.csv'), [
        ['human-audit-001', 'd-1', 'pass', 'pass', 'pass', 'pass', 'pass'],
        ['human-audit-002', 'd-2', 'pass', 'fail', 'pass', 'unknown', 'pass'],
      ])
      writeAnnotatorCsv(join(rootDir, 'b.csv'), [
        ['human-audit-001', 'd-1', 'fail', 'pass', 'pass', 'pass', 'pass'],
        ['human-audit-002', 'd-2', 'pass', 'fail', 'pass', 'unknown', 'pass'],
      ])
      writeFileSync(join(rootDir, 'template.csv'), [
        'sampleId,decisionId,label,annotatorA,annotatorB,adjudicatedLabel,adjudicationNotes',
        'human-audit-001,d-1,humanPartnerConsistent,pass,fail,unknown,public evidence insufficient',
        '',
      ].join('\n'), 'utf8')

      const result = writeHumanAuditAdjudicatedAnnotations({
        annotatorACsvPath: join(rootDir, 'a.csv'),
        annotatorBCsvPath: join(rootDir, 'b.csv'),
        adjudicationTemplateCsvPath: join(rootDir, 'template.csv'),
        blindJsonlPath: join(rootDir, 'blind.jsonl'),
        adjudicatedCsvPath: join(rootDir, 'adjudicated.csv'),
        outputDir: rootDir,
      })

      expect(result.report.status).toBe('ready')
      expect(result.report.outputRows).toBe(2)
      expect(result.report.completedLabels).toBe(10)
      expect(result.report.unresolvedDisagreements).toBe(0)
      expect(result.report.readyForAgreement).toBe(true)
      expect(result.report.adjudicatedCsvWritten).toBe(true)
      const csv = readFileSync(join(rootDir, 'adjudicated.csv'), 'utf8')
      expect(csv).toContain('sampleId,decisionId,phase')
      expect(csv).toContain('"human-audit-001","d-1"')
      expect(csv).toContain('"unknown","pass","pass","pass","pass"')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('does not require a template when both annotators fully agree', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-adjudicated-no-disagreement-'))
    try {
      writeBlindFixture(rootDir)
      const rows: Array<[string, string, string, string, string, string, string]> = [
        ['human-audit-001', 'd-1', 'pass', 'pass', 'pass', 'pass', 'pass'],
        ['human-audit-002', 'd-2', 'pass', 'fail', 'pass', 'unknown', 'pass'],
      ]
      writeAnnotatorCsv(join(rootDir, 'a.csv'), rows)
      writeAnnotatorCsv(join(rootDir, 'b.csv'), rows)

      const result = writeHumanAuditAdjudicatedAnnotations({
        annotatorACsvPath: join(rootDir, 'a.csv'),
        annotatorBCsvPath: join(rootDir, 'b.csv'),
        adjudicationTemplateCsvPath: join(rootDir, 'missing-template.csv'),
        blindJsonlPath: join(rootDir, 'blind.jsonl'),
        adjudicatedCsvPath: join(rootDir, 'adjudicated.csv'),
        outputDir: rootDir,
      })

      expect(result.report.status).toBe('ready')
      expect(result.report.adjudicationTemplatePresent).toBe(false)
      expect(result.report.checks.find(check => check.id === 'adjudication-template-present')?.status).toBe('pass')
      expect(existsSync(join(rootDir, 'adjudicated.csv'))).toBe(true)
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

function writeAnnotatorCsv(
  path: string,
  rows: Array<[string, string, string, string, string, string, string]>,
): void {
  const headers = [
    'sampleId',
    'decisionId',
    'humanPartnerConsistent',
    'humanOpponentConsistent',
    'humanTeamObjectiveValid',
    'humanHiddenInfoDisciplined',
    'humanReasonActionConsistent',
  ]
  writeFileSync(path, [
    headers.join(','),
    ...rows.map(row => row.join(',')),
    '',
  ].join('\n'), 'utf8')
}
