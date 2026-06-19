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
import { writeHumanAuditAnnotatorPackageArchive } from './humanAuditAnnotatorPackageArchive'

describe('humanAuditAnnotatorPackageArchive', () => {
  it('creates a sendable archive with digest and blind package files only', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-archive-'))
    try {
      writePackageFixture(rootDir)

      const result = writeHumanAuditAnnotatorPackageArchive({
        packageDir: join(rootDir, 'annotator-package'),
        packageManifestPath: join(rootDir, 'annotator-package', 'human-audit-annotator-package-manifest.json'),
        archivePath: join(rootDir, 'human-audit-annotator-package.tar.gz'),
        outputDir: rootDir,
      })

      expect(result.report.status).toBe('archive_ready')
      expect(result.report.bytes).toBeGreaterThan(0)
      expect(result.report.sha256).toMatch(/^[a-f0-9]{64}$/)
      expect(result.report.sampleCount).toBe(2)
      expect(result.report.archiveEntries.some(entry => entry.endsWith('/README.md'))).toBe(true)
      expect(result.report.archiveEntries.some(entry => entry.endsWith('/human-audit-blind-sample.jsonl'))).toBe(true)
      expect(result.report.archiveEntries.some(entry => /answer[-_]?key/i.test(entry))).toBe(false)
      expect(result.report.archiveEntries.some(entry => /verifier/i.test(entry))).toBe(false)
      expect(result.report.checks.every(check => check.status === 'pass')).toBe(true)

      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('The blind annotator package archive is ready to send')
      expect(markdown).toContain('| SHA-256 |')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('marks archives as needing attention when package manifest is not ready', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-human-audit-archive-bad-'))
    try {
      writePackageFixture(rootDir, { status: 'needs_attention' })

      const result = writeHumanAuditAnnotatorPackageArchive({
        packageDir: join(rootDir, 'annotator-package'),
        packageManifestPath: join(rootDir, 'annotator-package', 'human-audit-annotator-package-manifest.json'),
        archivePath: join(rootDir, 'human-audit-annotator-package.tar.gz'),
        outputDir: rootDir,
      })

      expect(result.report.status).toBe('needs_attention')
      expect(result.report.checks.find(check => check.id === 'package-manifest-ready')?.status).toBe('fail')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function writePackageFixture(rootDir: string, options: { status?: 'package_ready' | 'needs_attention' } = {}): void {
  const packageDir = join(rootDir, 'annotator-package')
  mkdirSync(packageDir, { recursive: true })
  writeFileSync(join(packageDir, 'README.md'), 'Annotator instructions\n', 'utf8')
  writeFileSync(join(packageDir, 'human-audit-annotator.html'), '<html></html>\n', 'utf8')
  writeFileSync(join(packageDir, 'human-audit-annotation-sheet.csv'), 'sampleId,decisionId,humanPartnerConsistent\ns1,d1,\ns2,d2,\n', 'utf8')
  writeFileSync(join(packageDir, 'human-audit-blind-sample.jsonl'), [
    JSON.stringify({ sampleId: 's1', decisionId: 'd1' }),
    JSON.stringify({ sampleId: 's2', decisionId: 'd2' }),
    '',
  ].join('\n'), 'utf8')
  writeFileSync(join(packageDir, 'human-audit-annotator-package-manifest.json'), `${JSON.stringify({
    schemaVersion: '0.1.0',
    status: options.status ?? 'package_ready',
    sampleCount: 2,
    instructions: {
      completedCsvName: 'human-audit-completed-annotations.csv',
      referenceFileIncluded: false,
      referenceLabelsIncluded: false,
    },
  }, null, 2)}\n`, 'utf8')
}
