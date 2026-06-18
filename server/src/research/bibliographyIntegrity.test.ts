import { describe, expect, it } from 'vitest'
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  checkBibliographyIntegrity,
  writeBibliographyIntegrityReport,
} from './bibliographyIntegrity'

describe('bibliographyIntegrity', () => {
  it('accepts a complete arXiv and software bibliography', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-bib-ok-'))
    const bibPath = join(rootDir, 'references.bib')

    try {
      writeFileSync(bibPath, [
        '@misc{paper2026,',
        '  title = {A Real Paper},',
        '  author = {Author, Ada},',
        '  year = {2026},',
        '  eprint = {2601.00001},',
        '  archivePrefix = {arXiv},',
        '  doi = {10.48550/arXiv.2601.00001},',
        '  url = {https://arxiv.org/abs/2601.00001}',
        '}',
        '',
        '@software{software2026,',
        '  title = {A Software Artifact},',
        '  author = {Research Lab},',
        '  year = {2026},',
        '  url = {https://github.com/example/project},',
        '  note = {GitHub repository}',
        '}',
      ].join('\n'), 'utf8')

      const result = writeBibliographyIntegrityReport({
        bibPath,
        outputDir: join(rootDir, 'submission', 'citation-integrity'),
        expectedKeys: ['paper2026', 'software2026'],
      })

      expect(result.report.ready).toBe(true)
      expect(result.report.entryCount).toBe(2)
      expect(result.report.issues).toHaveLength(0)
      expect(JSON.parse(readFileSync(result.jsonPath, 'utf8')).ready).toBe(true)
      expect(readFileSync(result.markdownPath, 'utf8')).toContain('No blocking bibliography integrity issues found.')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('flags missing keys, duplicate keys, missing arXiv metadata, and placeholders', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-bib-bad-'))
    const bibPath = join(rootDir, 'references.bib')

    try {
      writeFileSync(bibPath, [
        '@misc{paper2026,',
        '  title = {[NEED_SOURCE]},',
        '  author = {Author, Ada},',
        '  year = {2026},',
        '  eprint = {2601.00001},',
        '  archivePrefix = {NotArxiv},',
        '  url = {https://arxiv.org/abs/2601.00001}',
        '}',
        '',
        '@misc{paper2026,',
        '  title = {Duplicate},',
        '  author = {Author, Ada},',
        '  year = {2026},',
        '  url = {https://example.com}',
        '}',
      ].join('\n'), 'utf8')

      const report = checkBibliographyIntegrity({
        bibPath,
        expectedKeys: ['paper2026', 'missing2026'],
      })

      expect(report.ready).toBe(false)
      expect(report.missingKeys).toEqual(['missing2026'])
      expect(report.duplicateKeys).toEqual(['paper2026'])
      expect(report.issues.map(issue => issue.message)).toEqual(expect.arrayContaining([
        'Missing expected bibliography key missing2026.',
        'Duplicate bibliography key paper2026.',
        'Field title contains an unresolved placeholder.',
        'arXiv entry must set archiveprefix = {arXiv}.',
        'arXiv entry is missing doi.',
      ]))
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
