import { describe, expect, it } from 'vitest'
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeHumanAuditAgreement } from './humanAuditAgreement'

describe('humanAuditAgreement', () => {
  it('reports pending when no human labels are filled', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-pending-'))
    try {
      const annotations = join(rootDir, 'annotations.csv')
      const answerKey = join(rootDir, 'answer-key.jsonl')
      writeFileSync(annotations, [
        'sampleId,humanPartnerConsistent,humanOpponentConsistent,humanTeamObjectiveValid,humanHiddenInfoDisciplined,humanReasonActionConsistent',
        's1,,,,,',
        '',
      ].join('\n'), 'utf8')
      writeFileSync(answerKey, `${JSON.stringify({
        sampleId: 's1',
        verifierPartnerConsistent: 'pass',
        verifierOpponentConsistent: 'fail',
        verifierTeamObjectiveValid: 'unknown',
        verifierHiddenInfoDisciplined: 'pass',
        verifierReasonActionConsistent: 'pass',
      })}\n`, 'utf8')

      const result = writeHumanAuditAgreement({
        annotationCsvPath: annotations,
        answerKeyJsonlPath: answerKey,
        outputDir: rootDir,
      })

      expect(result.report.status).toBe('pending')
      expect(result.report.completedLabels).toBe(0)
      expect(result.report.remainingLabels).toBe(5)
      expect(result.report.readyForPaperEvidence).toBe(false)
      expect(result.report.macroAgreement).toBeNull()
      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('| Expected samples | 1 |')
      expect(markdown).toContain('| Remaining labels | 5 |')
      expect(markdown).toContain('| Ready for paper evidence | no |')
      expect(markdown).toContain('No human labels have been filled yet.')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('reports pending instead of failing when the annotation CSV is missing', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-missing-annotations-'))
    try {
      const answerKey = join(rootDir, 'answer-key.jsonl')
      writeFileSync(answerKey, `${JSON.stringify({
        sampleId: 's1',
        verifierPartnerConsistent: 'pass',
        verifierOpponentConsistent: 'fail',
        verifierTeamObjectiveValid: 'unknown',
        verifierHiddenInfoDisciplined: 'pass',
        verifierReasonActionConsistent: 'pass',
      })}\n`, 'utf8')

      const result = writeHumanAuditAgreement({
        annotationCsvPath: join(rootDir, 'missing-annotations.csv'),
        answerKeyJsonlPath: answerKey,
        outputDir: rootDir,
      })

      expect(result.report.status).toBe('pending')
      expect(result.report.annotationRowCount).toBe(0)
      expect(result.report.completedLabels).toBe(0)
      expect(result.report.totalLabels).toBe(5)
      expect(result.report.missingAnnotationSampleIds).toEqual(['s1'])
      expect(result.report.readyForPaperEvidence).toBe(false)
      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('No human labels have been filled yet.')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('computes label agreement and normalizes uncertain to verifier unknown', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-agreement-'))
    try {
      const annotations = join(rootDir, 'annotations.csv')
      const answerKey = join(rootDir, 'answer-key.jsonl')
      writeFileSync(annotations, [
        'sampleId,humanPartnerConsistent,humanOpponentConsistent,humanTeamObjectiveValid,humanHiddenInfoDisciplined,humanReasonActionConsistent',
        's1,pass,fail,uncertain,pass,fail',
        's2,fail,pass,unknown,pass,pass',
        '',
      ].join('\n'), 'utf8')
      writeFileSync(answerKey, [
        JSON.stringify({
          sampleId: 's1',
          verifierPartnerConsistent: 'pass',
          verifierOpponentConsistent: 'fail',
          verifierTeamObjectiveValid: 'unknown',
          verifierHiddenInfoDisciplined: 'pass',
          verifierReasonActionConsistent: 'pass',
        }),
        JSON.stringify({
          sampleId: 's2',
          verifierPartnerConsistent: 'fail',
          verifierOpponentConsistent: 'pass',
          verifierTeamObjectiveValid: 'unknown',
          verifierHiddenInfoDisciplined: 'fail',
          verifierReasonActionConsistent: 'pass',
        }),
        '',
      ].join('\n'), 'utf8')

      const result = writeHumanAuditAgreement({
        annotationCsvPath: annotations,
        answerKeyJsonlPath: answerKey,
        outputDir: rootDir,
      })

      expect(result.report.status).toBe('completed')
      expect(result.report.completedLabels).toBe(10)
      expect(result.report.totalLabels).toBe(10)
      expect(result.report.remainingLabels).toBe(0)
      expect(result.report.readyForPaperEvidence).toBe(true)
      expect(result.report.macroAgreement).toBeCloseTo(0.8)

      const hiddenInfo = result.report.labels.find(row => row.label === 'humanHiddenInfoDisciplined')
      expect(hiddenInfo?.completed).toBe(2)
      expect(hiddenInfo?.matched).toBe(1)
      expect(hiddenInfo?.agreement).toBe(0.5)

      const json = JSON.parse(readFileSync(result.jsonPath, 'utf8'))
      expect(json.status).toBe('completed')
      expect(json.remainingLabels).toBe(0)
      expect(json.readyForPaperEvidence).toBe(true)
      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('| Ready for paper evidence | yes |')
      expect(markdown).toContain('| humanHiddenInfoDisciplined | verifierHiddenInfoDisciplined | 2 | 1 | 50% |')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('does not mark agreement completed when annotation rows omit answer-key samples', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-missing-row-'))
    try {
      const annotations = join(rootDir, 'annotations.csv')
      const answerKey = join(rootDir, 'answer-key.jsonl')
      writeFileSync(annotations, [
        'sampleId,humanPartnerConsistent,humanOpponentConsistent,humanTeamObjectiveValid,humanHiddenInfoDisciplined,humanReasonActionConsistent',
        's1,pass,fail,unknown,pass,pass',
        '',
      ].join('\n'), 'utf8')
      writeFileSync(answerKey, [
        JSON.stringify({
          sampleId: 's1',
          verifierPartnerConsistent: 'pass',
          verifierOpponentConsistent: 'fail',
          verifierTeamObjectiveValid: 'unknown',
          verifierHiddenInfoDisciplined: 'pass',
          verifierReasonActionConsistent: 'pass',
        }),
        JSON.stringify({
          sampleId: 's2',
          verifierPartnerConsistent: 'pass',
          verifierOpponentConsistent: 'pass',
          verifierTeamObjectiveValid: 'pass',
          verifierHiddenInfoDisciplined: 'pass',
          verifierReasonActionConsistent: 'pass',
        }),
        '',
      ].join('\n'), 'utf8')

      const result = writeHumanAuditAgreement({
        annotationCsvPath: annotations,
        answerKeyJsonlPath: answerKey,
        outputDir: rootDir,
      })

      expect(result.report.status).toBe('partial')
      expect(result.report.readyForPaperEvidence).toBe(false)
      expect(result.report.sampleCount).toBe(2)
      expect(result.report.annotationRowCount).toBe(1)
      expect(result.report.completedLabels).toBe(5)
      expect(result.report.totalLabels).toBe(10)
      expect(result.report.remainingLabels).toBe(5)
      expect(result.report.missingAnnotationSampleIds).toEqual(['s2'])
      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('| Missing annotation samples | 1 |')
      expect(markdown).toContain('Do not report agreement until the status is completed.')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('reports duplicate and unexpected annotation sample ids without double counting duplicates', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-sample-issues-'))
    try {
      const annotations = join(rootDir, 'annotations.csv')
      const answerKey = join(rootDir, 'answer-key.jsonl')
      writeFileSync(annotations, [
        'sampleId,humanPartnerConsistent,humanOpponentConsistent,humanTeamObjectiveValid,humanHiddenInfoDisciplined,humanReasonActionConsistent',
        's1,pass,pass,pass,pass,pass',
        's1,fail,fail,fail,fail,fail',
        'extra,pass,pass,pass,pass,pass',
        '',
      ].join('\n'), 'utf8')
      writeFileSync(answerKey, `${JSON.stringify({
        sampleId: 's1',
        verifierPartnerConsistent: 'pass',
        verifierOpponentConsistent: 'pass',
        verifierTeamObjectiveValid: 'pass',
        verifierHiddenInfoDisciplined: 'pass',
        verifierReasonActionConsistent: 'pass',
      })}\n`, 'utf8')

      const result = writeHumanAuditAgreement({
        annotationCsvPath: annotations,
        answerKeyJsonlPath: answerKey,
        outputDir: rootDir,
      })

      expect(result.report.status).toBe('partial')
      expect(result.report.readyForPaperEvidence).toBe(false)
      expect(result.report.completedLabels).toBe(5)
      expect(result.report.totalLabels).toBe(5)
      expect(result.report.duplicateAnnotationSampleIds).toEqual(['s1'])
      expect(result.report.unexpectedAnnotationSampleIds).toEqual(['extra'])
      expect(result.report.missingAnswerKeys).toEqual(['extra'])
      const partner = result.report.labels.find(row => row.label === 'humanPartnerConsistent')
      expect(partner?.completed).toBe(1)
      expect(partner?.matched).toBe(1)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
