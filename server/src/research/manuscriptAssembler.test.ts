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
import { assembleManuscript } from './manuscriptAssembler'

describe('manuscriptAssembler', () => {
  it('assembles paper-as-code sections into one manuscript and status file', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-manuscript-'))
    const sectionsDir = join(rootDir, 'drafts', 'paper-as-code')
    const outputDir = join(rootDir, 'submission', 'manuscript')
    const tablesDir = join(rootDir, 'tables')
    mkdirSync(sectionsDir, { recursive: true })
    mkdirSync(tablesDir, { recursive: true })

    writeSection(sectionsDir, '06_abstract.md', '# Abstract Source\n\n## Draft Abstract\n\nAbstract text. [NEED_EXPERIMENT]\n\n## Keywords\n\nalpha; beta.')
    writeSection(sectionsDir, '01_introduction.md', '# Intro Source\n\n## Draft\n\nIntro text.')
    writeSection(sectionsDir, '02_related_work.md', '# Related Source\n\n## Draft\n\nRelated text. [NEED_SOURCE]')
    writeSection(sectionsDir, '03_method.md', '# Method Source\n\n## Draft\n\nMethod text.')
    writeSection(sectionsDir, '04_experiments.md', '# Exp Source\n\n## Draft\n\nExperiment text. [DO_NOT_SUBMIT]')
    writeSection(sectionsDir, '05_discussion_limitations.md', '# Discussion Source\n\n## Draft\n\nDiscussion text.')
    writeSection(tablesDir, 'table-0-related-work-positioning.md', '# Table 0: Related-Work Positioning\n\n| Work | Setting |\n| --- | --- |\n| This project | Guandan decision points |')

    try {
      const result = assembleManuscript({
        sectionsDir,
        outputDir,
        title: 'Verifiable Multi-Agent Reasoning',
        tablesDir,
      })

      const manuscript = readFileSync(result.manuscriptPath, 'utf8')
      expect(manuscript).toContain('# Verifiable Multi-Agent Reasoning')
      expect(manuscript.indexOf('## Abstract')).toBeLessThan(manuscript.indexOf('## Introduction'))
      expect(manuscript.indexOf('## Introduction')).toBeLessThan(manuscript.indexOf('## Related Work'))
      expect(manuscript).toContain('### Table 0: Related-Work Positioning')
      expect(manuscript).not.toContain('\n# Table 0: Related-Work Positioning')
      expect(manuscript.indexOf('### Table 0: Related-Work Positioning')).toBeGreaterThan(manuscript.indexOf('## Related Work'))
      expect(manuscript.indexOf('### Table 0: Related-Work Positioning')).toBeLessThan(manuscript.indexOf('## Method'))
      expect(manuscript).toContain('## Keywords')
      expect(manuscript).not.toContain('Self-Review')

      const status = JSON.parse(readFileSync(result.statusPath, 'utf8'))
      expect(status.sectionCount).toBe(6)
      expect(status.artifactSources).toEqual([join(tablesDir, 'table-0-related-work-positioning.md')])
      expect(status.markerCounts.NEED_EXPERIMENT).toBe(1)
      expect(status.markerCounts.NEED_SOURCE).toBe(1)
      expect(status.markerCounts.DO_NOT_SUBMIT).toBe(1)
      expect(status.readyForSubmission).toBe(false)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('does not inject a submission blocker when source sections are marker-free', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-manuscript-clean-'))
    const sectionsDir = join(rootDir, 'drafts', 'paper-as-code')
    const outputDir = join(rootDir, 'submission', 'manuscript')
    mkdirSync(sectionsDir, { recursive: true })

    writeSection(sectionsDir, '06_abstract.md', '# Abstract Source\n\n## Draft Abstract\n\nAbstract text.\n\n## Keywords\n\nalpha; beta.')
    writeSection(sectionsDir, '01_introduction.md', '# Intro Source\n\n## Draft\n\nIntro text.')
    writeSection(sectionsDir, '02_related_work.md', '# Related Source\n\n## Draft\n\nRelated text.')
    writeSection(sectionsDir, '03_method.md', '# Method Source\n\n## Draft\n\nMethod text.')
    writeSection(sectionsDir, '04_experiments.md', '# Exp Source\n\n## Draft\n\nExperiment text.')
    writeSection(sectionsDir, '05_discussion_limitations.md', '# Discussion Source\n\n## Draft\n\nDiscussion text.')

    try {
      const result = assembleManuscript({
        sectionsDir,
        outputDir,
        title: 'Verifiable Multi-Agent Reasoning',
      })

      const manuscript = readFileSync(result.manuscriptPath, 'utf8')
      expect(manuscript).not.toContain('[DO_NOT_SUBMIT]')
      expect(result.status.readyForSubmission).toBe(true)
      expect(Object.values(result.status.markerCounts).every(count => count === 0)).toBe(true)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function writeSection(dir: string, filename: string, content: string) {
  writeFileSync(join(dir, filename), `${content}\n`, 'utf8')
}
