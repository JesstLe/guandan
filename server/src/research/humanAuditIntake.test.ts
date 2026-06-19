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
import { writeHumanAuditIntakeReport } from './humanAuditIntake'

describe('humanAuditIntake', () => {
  it('reports awaiting_return when the completed CSV has not been returned', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-intake-awaiting-'))
    try {
      writeFixture(rootDir)

      const result = writeHumanAuditIntakeReport({
        returnedCsvPath: join(rootDir, 'human-audit-completed-annotations.csv'),
        packageManifestPath: join(rootDir, 'manifest.json'),
        blindJsonlPath: join(rootDir, 'blind.jsonl'),
        outputDir: rootDir,
      })

      expect(result.report.status).toBe('awaiting_return')
      expect(result.report.returnedCsvPresent).toBe(false)
      expect(result.report.readyForAgreement).toBe(false)
      expect(result.report.readyForPaperEvidence).toBe(false)
      expect(result.report.checks.find(check => check.id === 'returned-file-present')?.status).toBe('fail')
      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('The annotator package is prepared, but the completed CSV has not been returned yet.')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('accepts a structurally valid returned CSV for agreement evaluation without marking it paper evidence', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-intake-ready-'))
    try {
      writeFixture(rootDir)
      writeFileSync(join(rootDir, 'human-audit-completed-annotations.csv'), [
        'sampleId,decisionId,humanPartnerConsistent,humanOpponentConsistent,humanTeamObjectiveValid,humanHiddenInfoDisciplined,humanReasonActionConsistent',
        'human-audit-001,d-1,pass,fail,uncertain,pass,pass',
        'human-audit-002,d-2,fail,pass,unknown,pass,fail',
        '',
      ].join('\n'), 'utf8')

      const result = writeHumanAuditIntakeReport({
        returnedCsvPath: join(rootDir, 'human-audit-completed-annotations.csv'),
        packageManifestPath: join(rootDir, 'manifest.json'),
        blindJsonlPath: join(rootDir, 'blind.jsonl'),
        outputDir: rootDir,
      })

      expect(result.report.status).toBe('ready_for_agreement')
      expect(result.report.returnedRowCount).toBe(2)
      expect(result.report.completedLabels).toBe(10)
      expect(result.report.totalLabels).toBe(10)
      expect(result.report.readyForAgreement).toBe(true)
      expect(result.report.readyForPaperEvidence).toBe(false)
      expect(result.report.checks.every(check => check.status === 'pass')).toBe(true)
      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('| Ready for agreement | yes |')
      expect(markdown).toContain('it is still not paper evidence until agreement is completed')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('flags returned CSVs with reference columns, duplicate ids, unexpected ids, and invalid labels', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-intake-bad-'))
    try {
      writeFixture(rootDir)
      writeFileSync(join(rootDir, 'human-audit-completed-annotations.csv'), [
        'sampleId,decisionId,humanPartnerConsistent,humanOpponentConsistent,humanTeamObjectiveValid,humanHiddenInfoDisciplined,humanReasonActionConsistent,verifierPartnerConsistent',
        'human-audit-001,d-1,pass,maybe,uncertain,pass,pass,pass',
        'human-audit-001,d-1,fail,fail,fail,fail,fail,pass',
        'extra,d-x,pass,pass,pass,pass,pass,pass',
        '',
      ].join('\n'), 'utf8')

      const result = writeHumanAuditIntakeReport({
        returnedCsvPath: join(rootDir, 'human-audit-completed-annotations.csv'),
        packageManifestPath: join(rootDir, 'manifest.json'),
        blindJsonlPath: join(rootDir, 'blind.jsonl'),
        outputDir: rootDir,
      })

      expect(result.report.status).toBe('needs_attention')
      expect(result.report.readyForAgreement).toBe(false)
      expect(result.report.checks.find(check => check.id === 'no-reference-columns')?.status).toBe('fail')
      expect(result.report.checks.find(check => check.id === 'row-count')?.status).toBe('fail')
      expect(result.report.checks.find(check => check.id === 'sample-id-match')?.status).toBe('fail')
      expect(result.report.checks.find(check => check.id === 'unique-sample-ids')?.status).toBe('fail')
      expect(result.report.checks.find(check => check.id === 'label-values')?.status).toBe('fail')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function writeFixture(rootDir: string): void {
  mkdirSync(rootDir, { recursive: true })
  const blindRows = [
    {
      sampleId: 'human-audit-001',
      decisionId: 'd-1',
      phase: 'lead',
      scenarioTags: 'lead_opening',
    },
    {
      sampleId: 'human-audit-002',
      decisionId: 'd-2',
      phase: 'follow',
      scenarioTags: 'follow_beat_or_pass',
    },
  ]
  writeFileSync(join(rootDir, 'blind.jsonl'), `${blindRows.map(row => JSON.stringify(row)).join('\n')}\n`, 'utf8')
  writeFileSync(join(rootDir, 'manifest.json'), `${JSON.stringify({
    schemaVersion: '0.1.0',
    status: 'package_ready',
    sampleCount: 2,
    instructions: {
      completedCsvName: 'human-audit-completed-annotations.csv',
      referenceFileIncluded: false,
      referenceLabelsIncluded: false,
    },
    checks: [],
  }, null, 2)}\n`, 'utf8')
}
