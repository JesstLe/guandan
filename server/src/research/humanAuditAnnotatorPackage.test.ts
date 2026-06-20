import { describe, expect, it } from 'vitest'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeHumanAuditAnnotatorPackage } from './humanAuditAnnotatorPackage'

describe('humanAuditAnnotatorPackage', () => {
  it('writes a blind annotator package without answer-key or verifier-label leakage', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-package-'))
    try {
      writeFixture(rootDir)
      const result = writeHumanAuditAnnotatorPackage({
        blindJsonlPath: join(rootDir, 'blind.jsonl'),
        annotationCsvPath: join(rootDir, 'annotations.csv'),
        annotatorHtmlPath: join(rootDir, 'annotator.html'),
        outputDir: join(rootDir, 'package'),
      })

      expect(result.manifest.status).toBe('package_ready')
      expect(result.manifest.sampleCount).toBe(2)
      expect(result.manifest.instructions.referenceFileIncluded).toBe(false)
      expect(result.manifest.instructions.referenceLabelsIncluded).toBe(false)
      expect(result.manifest.checks.every(check => check.status === 'pass')).toBe(true)

      const files = readdirSync(result.packageDir).sort()
      expect(files).toEqual([
        'README.md',
        'human-audit-annotation-sheet.csv',
        'human-audit-annotator-package-manifest.json',
        'human-audit-annotator.html',
        'human-audit-blind-sample.jsonl',
      ])
      expect(files.some(filename => /answer[-_]?key/i.test(filename))).toBe(false)
      const joinedPackageText = files
        .map(filename => readFileSync(join(result.packageDir, filename), 'utf8'))
        .join('\n')
      expect(joinedPackageText).not.toMatch(/\bverifier[A-Za-z0-9_]*\b/)
      expect(joinedPackageText).not.toMatch(/answer[-_]?key/i)
      expect(joinedPackageText).toContain('## Fields To Label')
      expect(joinedPackageText).toContain('humanHiddenInfoDisciplined')
      expect(joinedPackageText).toContain('## Label Rubric')
      expect(joinedPackageText).toContain('Judge the explanation-action link')
      expect(joinedPackageText).toContain('Return only `human-audit-completed-annotations.csv`')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('marks the package as needing attention when blind rows contain verifier fields', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-package-leak-'))
    try {
      writeFixture(rootDir, { includeVerifierLeak: true })
      const result = writeHumanAuditAnnotatorPackage({
        blindJsonlPath: join(rootDir, 'blind.jsonl'),
        annotationCsvPath: join(rootDir, 'annotations.csv'),
        annotatorHtmlPath: join(rootDir, 'annotator.html'),
        outputDir: join(rootDir, 'package'),
      })

      expect(result.manifest.status).toBe('needs_attention')
      expect(result.manifest.checks.find(check => check.id === 'no-forbidden-content')?.status).toBe('fail')
      expect(result.manifest.checks.find(check => check.id === 'blind-hides-reference-fields')?.status).toBe('fail')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function writeFixture(rootDir: string, options: { includeVerifierLeak?: boolean } = {}): void {
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
      publicEventSummary: 'e-1:new_game',
      teamObjective: 'gain_lead: lead cheaply',
      partnerBelief: 'partner unknown',
      opponentBelief: 'opponents unknown',
      actionRationale: 'lowest single',
      riskSummary: 'opponent may beat',
      ...(options.includeVerifierLeak ? { verifierPartnerConsistent: 'pass' } : {}),
    },
    {
      sampleId: 'human-audit-002',
      decisionId: 'd-2',
      phase: 'follow',
      scenarioTags: 'follow_beat_or_pass',
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

  writeFileSync(join(rootDir, 'blind.jsonl'), `${rows.map(row => JSON.stringify(row)).join('\n')}\n`, 'utf8')
  writeFileSync(join(rootDir, 'annotations.csv'), [
    'sampleId,decisionId,humanPartnerConsistent,humanOpponentConsistent,humanTeamObjectiveValid,humanHiddenInfoDisciplined,humanReasonActionConsistent',
    'human-audit-001,d-1,,,,,',
    'human-audit-002,d-2,,,,,',
    '',
  ].join('\n'), 'utf8')
  writeFileSync(join(rootDir, 'annotator.html'), `<html><script id="samples-data" type="application/json">${JSON.stringify(rows)}</script></html>`, 'utf8')
}
