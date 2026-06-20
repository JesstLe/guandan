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
import { writeHumanAuditLaunchChecklist } from './humanAuditLaunchChecklist'

describe('humanAuditLaunchChecklist', () => {
  it('marks a clean blind package and archive as ready to send without claiming paper evidence', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-launch-'))

    try {
      writeLaunchFixture(rootDir)

      const result = writeHumanAuditLaunchChecklist({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'human-audit-launch'),
      })

      expect(result.report.status).toBe('ready_to_send')
      expect(result.report.facts.readyForAnnotation).toBe(true)
      expect(result.report.facts.readyForPaperEvidence).toBe(false)
      expect(result.report.facts.sampleCount).toBe(40)
      expect(result.report.facts.archiveSha256).toMatch(/^[a-f0-9]{64}$/)
      expect(result.report.checks.every(check => check.status === 'pass')).toBe(true)
      expect(result.report.nextActions).toContain('Send the blind archive to two independent annotators.')

      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('Status: `ready_to_send`')
      expect(markdown).toContain('human-audit-annotator-package.tar.gz')
      expect(markdown).toContain('human-audit-answer-key.jsonl')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('blocks launch when the blind package is not ready', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-launch-blocked-'))

    try {
      writeLaunchFixture(rootDir, { packageStatus: 'needs_attention' })

      const result = writeHumanAuditLaunchChecklist({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'human-audit-launch'),
      })

      expect(result.report.status).toBe('needs_attention')
      expect(result.report.checks.find(check => check.id === 'blind-package-ready')).toMatchObject({
        status: 'fail',
      })
      expect(result.report.nextActions[0]).toContain('Regenerate the packet quality report')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function writeLaunchFixture(
  rootDir: string,
  options: { packageStatus?: 'package_ready' | 'needs_attention' } = {},
): void {
  const auditDir = join(rootDir, 'experiments', 'human-soft-label-audit')
  const packageDir = join(auditDir, 'annotator-package')
  mkdirSync(packageDir, { recursive: true })

  writeJson(join(auditDir, 'human-audit-packet-quality-report.json'), {
    schemaVersion: '0.1.0',
    status: 'packet_ready',
    readyForAnnotation: true,
    readyForPaperEvidence: false,
    sampleCount: 40,
    checks: [{ id: 'all-good', status: 'pass' }],
  })
  writeJson(join(packageDir, 'human-audit-annotator-package-manifest.json'), {
    schemaVersion: '0.1.0',
    status: options.packageStatus ?? 'package_ready',
    sampleCount: 40,
    instructions: {
      completedCsvName: 'human-audit-completed-annotations.csv',
      referenceFileIncluded: false,
      referenceLabelsIncluded: false,
    },
    checks: [{ id: 'all-good', status: 'pass' }],
  })
  writeJson(join(auditDir, 'human-audit-annotator-package-archive-report.json'), {
    schemaVersion: '0.1.0',
    status: 'archive_ready',
    archivePath: 'docs/research/experiments/human-soft-label-audit/human-audit-annotator-package.tar.gz',
    bytes: 1234,
    sha256: 'a'.repeat(64),
    sampleCount: 40,
    checks: [{ id: 'all-good', status: 'pass' }],
  })
  writeJson(join(auditDir, 'human-audit-intake-report.json'), {
    status: 'awaiting_return',
    returnedCsvPresent: false,
    completedLabels: 0,
    totalLabels: 200,
    readyForAgreement: false,
  })
  writeJson(join(auditDir, 'human-audit-inter-annotator-agreement-report.json'), {
    status: 'awaiting_returns',
    pairedLabels: 0,
    totalLabels: 200,
  })
  writeJson(join(auditDir, 'human-audit-agreement-report.json'), {
    status: 'pending',
    readyForPaperEvidence: false,
    completedLabels: 0,
    totalLabels: 200,
  })
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
