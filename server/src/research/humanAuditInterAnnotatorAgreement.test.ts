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
import { writeHumanAuditInterAnnotatorAgreement } from './humanAuditInterAnnotatorAgreement'

describe('humanAuditInterAnnotatorAgreement', () => {
  it('reports awaiting_returns when annotator CSVs are missing', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-iaa-awaiting-'))
    try {
      writeBlindFixture(rootDir)
      const result = writeHumanAuditInterAnnotatorAgreement({
        annotatorACsvPath: join(rootDir, 'missing-a.csv'),
        annotatorBCsvPath: join(rootDir, 'missing-b.csv'),
        blindJsonlPath: join(rootDir, 'blind.jsonl'),
        outputDir: rootDir,
      })

      expect(result.report.status).toBe('awaiting_returns')
      expect(result.report.annotatorAPresent).toBe(false)
      expect(result.report.annotatorBPresent).toBe(false)
      expect(result.report.totalLabels).toBe(10)
      expect(result.report.readyForAdjudication).toBe(false)
      expect(result.report.readyForPaperEvidence).toBe(false)
      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('Two completed annotator CSVs have not been returned yet.')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('computes paired inter-annotator agreement and disagreement rows', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-iaa-complete-'))
    try {
      writeBlindFixture(rootDir)
      writeAnnotationCsv(join(rootDir, 'a.csv'), [
        ['human-audit-001', 'd-1', 'pass', 'fail', 'uncertain', 'pass', 'pass'],
        ['human-audit-002', 'd-2', 'fail', 'pass', 'unknown', 'pass', 'fail'],
      ])
      writeAnnotationCsv(join(rootDir, 'b.csv'), [
        ['human-audit-001', 'd-1', 'pass', 'fail', 'unknown', 'pass', 'fail'],
        ['human-audit-002', 'd-2', 'fail', 'fail', 'unknown', 'pass', 'fail'],
      ])

      const result = writeHumanAuditInterAnnotatorAgreement({
        annotatorACsvPath: join(rootDir, 'a.csv'),
        annotatorBCsvPath: join(rootDir, 'b.csv'),
        blindJsonlPath: join(rootDir, 'blind.jsonl'),
        outputDir: rootDir,
      })

      expect(result.report.status).toBe('completed')
      expect(result.report.completedLabelsA).toBe(10)
      expect(result.report.completedLabelsB).toBe(10)
      expect(result.report.pairedLabels).toBe(10)
      expect(result.report.matchedLabels).toBe(8)
      expect(result.report.disagreementCount).toBe(2)
      expect(result.report.requiresAdjudication).toBe(true)
      expect(result.report.readyForAdjudication).toBe(true)
      expect(result.report.macroAgreement).toBeCloseTo(0.8)
      expect(result.report.disagreements).toEqual([
        {
          sampleId: 'human-audit-001',
          decisionId: 'd-1',
          label: 'humanReasonActionConsistent',
          annotatorA: 'pass',
          annotatorB: 'fail',
        },
        {
          sampleId: 'human-audit-002',
          decisionId: 'd-2',
          label: 'humanOpponentConsistent',
          annotatorA: 'pass',
          annotatorB: 'fail',
        },
      ])
      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('| Disagreements | 2 |')
      expect(markdown).toContain('Resolve disagreements without the verifier answer key')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('flags structural issues before adjudication', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-iaa-bad-'))
    try {
      writeBlindFixture(rootDir)
      writeAnnotationCsv(join(rootDir, 'a.csv'), [
        ['human-audit-001', 'd-1', 'pass', 'maybe', 'uncertain', 'pass', 'pass'],
        ['human-audit-001', 'd-1', 'fail', 'fail', 'fail', 'fail', 'fail'],
        ['extra', 'd-x', 'pass', 'pass', 'pass', 'pass', 'pass'],
      ])
      writeAnnotationCsv(join(rootDir, 'b.csv'), [
        ['human-audit-001', 'd-1', 'pass', 'fail', 'unknown', 'pass', 'pass'],
      ])

      const result = writeHumanAuditInterAnnotatorAgreement({
        annotatorACsvPath: join(rootDir, 'a.csv'),
        annotatorBCsvPath: join(rootDir, 'b.csv'),
        blindJsonlPath: join(rootDir, 'blind.jsonl'),
        outputDir: rootDir,
      })

      expect(result.report.status).toBe('needs_attention')
      expect(result.report.readyForAdjudication).toBe(false)
      expect(result.report.invalidLabelsA).toHaveLength(1)
      expect(result.report.duplicateSampleIdsA).toEqual(['human-audit-001'])
      expect(result.report.unexpectedSampleIdsA).toEqual(['extra'])
      expect(result.report.missingSampleIdsB).toEqual(['human-audit-002'])
      expect(result.report.checks.find(check => check.id === 'annotator-a-label-values')?.status).toBe('fail')
      expect(result.report.checks.find(check => check.id === 'annotator-b-row-count')?.status).toBe('fail')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function writeBlindFixture(rootDir: string): void {
  mkdirSync(rootDir, { recursive: true })
  const blindRows = [
    { sampleId: 'human-audit-001', decisionId: 'd-1' },
    { sampleId: 'human-audit-002', decisionId: 'd-2' },
  ]
  writeFileSync(join(rootDir, 'blind.jsonl'), `${blindRows.map(row => JSON.stringify(row)).join('\n')}\n`, 'utf8')
}

function writeAnnotationCsv(path: string, rows: string[][]): void {
  writeFileSync(path, [
    'sampleId,decisionId,humanPartnerConsistent,humanOpponentConsistent,humanTeamObjectiveValid,humanHiddenInfoDisciplined,humanReasonActionConsistent',
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    '',
  ].join('\n'), 'utf8')
}
