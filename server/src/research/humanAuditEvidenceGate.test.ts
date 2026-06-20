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
import { writeHumanAuditEvidenceGate } from './humanAuditEvidenceGate'

describe('humanAuditEvidenceGate', () => {
  it('keeps a launch-ready packet out of paper evidence until annotator returns arrive', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-evidence-gate-'))

    try {
      writeBaseFixture(rootDir)

      const result = writeHumanAuditEvidenceGate({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'human-audit-evidence-gate'),
      })

      expect(result.report.status).toBe('awaiting_returns')
      expect(result.report.facts.readyForPaperEvidence).toBe(false)
      expect(result.report.facts.sampleCount).toBe(40)
      expect(result.report.facts.completedLabels).toBe(0)
      expect(result.report.checks.find(check => check.id === 'launch-ready')).toMatchObject({
        status: 'pass',
      })
      expect(result.report.checks.find(check => check.id === 'agreement-complete')).toMatchObject({
        status: 'pending',
      })
      expect(result.report.nextActions[0]).toContain('Send the blind archive')

      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('Status: `awaiting_returns`')
      expect(markdown).toContain('Ready for paper evidence | no')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('marks completed adjudicated agreement as paper evidence ready', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-evidence-ready-'))

    try {
      writeBaseFixture(rootDir)
      const auditDir = join(rootDir, 'experiments', 'human-soft-label-audit')
      writeJson(join(auditDir, 'human-audit-inter-annotator-agreement-report.json'), {
        status: 'completed',
        annotatorAPresent: true,
        annotatorBPresent: true,
        sampleCount: 40,
        pairedLabels: 200,
        totalLabels: 200,
        macroAgreement: 0.87,
        disagreementCount: 12,
        readyForAdjudication: true,
        checks: [{ id: 'all-good', status: 'pass' }],
      })
      writeJson(join(auditDir, 'human-audit-adjudicated-annotations-report.json'), {
        status: 'ready',
        sampleCount: 40,
        outputRows: 40,
        completedLabels: 200,
        totalLabels: 200,
        unresolvedDisagreements: 0,
        adjudicatedCsvWritten: true,
        readyForAgreement: true,
        checks: [{ id: 'all-good', status: 'pass' }],
      })
      writeJson(join(auditDir, 'human-audit-agreement-report.json'), {
        status: 'completed',
        sampleCount: 40,
        completedLabels: 200,
        totalLabels: 200,
        remainingLabels: 0,
        readyForPaperEvidence: true,
        invalidLabels: [],
        missingAnswerKeys: [],
        missingAnnotationSampleIds: [],
        unexpectedAnnotationSampleIds: [],
        duplicateAnnotationSampleIds: [],
        macroAgreement: 0.82,
      })

      const result = writeHumanAuditEvidenceGate({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'human-audit-evidence-gate'),
      })

      expect(result.report.status).toBe('paper_evidence_ready')
      expect(result.report.facts.readyForPaperEvidence).toBe(true)
      expect(result.report.facts.completedLabels).toBe(200)
      expect(result.report.checks.every(check => check.status === 'pass')).toBe(true)
      expect(result.report.nextActions[0]).toContain('Refresh AAMAS readiness')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function writeBaseFixture(rootDir: string): void {
  const auditDir = join(rootDir, 'experiments', 'human-soft-label-audit')
  mkdirSync(auditDir, { recursive: true })
  writeJson(join(rootDir, 'submission', 'human-audit-launch', 'human-audit-launch-checklist.json'), {
    status: 'ready_to_send',
    facts: {
      readyForAnnotation: true,
      readyForPaperEvidence: false,
      sampleCount: 40,
      totalLabels: 200,
      completedLabels: 0,
    },
  })
  writeJson(join(auditDir, 'human-audit-inter-annotator-agreement-report.json'), {
    status: 'awaiting_returns',
    annotatorAPresent: false,
    annotatorBPresent: false,
    sampleCount: 40,
    pairedLabels: 0,
    totalLabels: 200,
    macroAgreement: null,
    disagreementCount: 0,
    readyForAdjudication: false,
    checks: [
      { id: 'annotator-a-present', status: 'fail' },
      { id: 'annotator-b-present', status: 'fail' },
    ],
  })
  writeJson(join(auditDir, 'human-audit-adjudicated-annotations-report.json'), {
    status: 'awaiting_returns',
    sampleCount: 40,
    outputRows: 0,
    completedLabels: 0,
    totalLabels: 200,
    unresolvedDisagreements: 0,
    adjudicatedCsvWritten: false,
    readyForAgreement: false,
    checks: [{ id: 'annotator-a-present', status: 'fail' }],
  })
  writeJson(join(auditDir, 'human-audit-agreement-report.json'), {
    status: 'pending',
    sampleCount: 40,
    completedLabels: 0,
    totalLabels: 200,
    remainingLabels: 200,
    readyForPaperEvidence: false,
    invalidLabels: [],
    missingAnswerKeys: [],
    missingAnnotationSampleIds: [],
    unexpectedAnnotationSampleIds: [],
    duplicateAnnotationSampleIds: [],
    macroAgreement: null,
  })
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
