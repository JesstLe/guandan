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
import { writeSubmissionMarkerInventory } from './submissionMarkerInventory'

describe('submissionMarkerInventory', () => {
  it('records marker locations from submission-relevant files only', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-marker-inventory-'))
    const outputDir = join(rootDir, 'submission', 'marker-inventory')

    mkdirSync(join(rootDir, 'drafts', 'paper-as-code'), { recursive: true })
    mkdirSync(join(rootDir, 'submission', 'manuscript'), { recursive: true })
    mkdirSync(join(rootDir, 'tables'), { recursive: true })

    writeFileSync(join(rootDir, 'PROJECT.md'), 'Line one\n[AUTHOR_DECISION] Choose venue.\n', 'utf8')
    writeFileSync(join(rootDir, 'drafts', 'paper-as-code', '04_experiments.md'), [
      '# Experiments',
      'Need model results. [NEED_EXPERIMENT]',
      '| Row | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] |',
    ].join('\n'), 'utf8')
    writeFileSync(join(rootDir, 'submission', 'manuscript', 'manuscript-draft.md'), '[DO_NOT_SUBMIT] Draft only.\n', 'utf8')
    writeFileSync(join(rootDir, 'tables', 'generated-table.md'), '[NEED_EXPERIMENT] generated placeholder\n', 'utf8')

    try {
      const result = writeSubmissionMarkerInventory({
        researchRoot: rootDir,
        outputDir,
      })

      expect(result.jsonPath).toBe(join(outputDir, 'submission-marker-inventory.json'))
      expect(result.markdownPath).toBe(join(outputDir, 'submission-marker-inventory.md'))
      expect(result.inventory.counts).toMatchObject({
        NEED_EXPERIMENT: 3,
        DO_NOT_SUBMIT: 1,
        AUTHOR_DECISION: 1,
      })
      expect(result.inventory.blockingCounts).toMatchObject({
        NEED_EXPERIMENT: 0,
        DO_NOT_SUBMIT: 1,
        AUTHOR_DECISION: 1,
      })
      expect(result.inventory.workbenchCounts).toMatchObject({
        NEED_EXPERIMENT: 3,
        DO_NOT_SUBMIT: 0,
        AUTHOR_DECISION: 0,
      })
      expect(result.inventory.items).toHaveLength(5)
      expect(result.inventory.items).toContainEqual(expect.objectContaining({
        marker: 'AUTHOR_DECISION',
        relativePath: 'PROJECT.md',
        line: 2,
        category: 'author_decision',
        resolutionScope: 'blocking',
      }))
      expect(result.inventory.items).toContainEqual(expect.objectContaining({
        marker: 'NEED_EXPERIMENT',
        relativePath: 'drafts/paper-as-code/04_experiments.md',
        line: 2,
        resolutionScope: 'workbench',
      }))
      expect(result.inventory.items.some(item => item.relativePath === 'tables/generated-table.md')).toBe(false)

      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('# Submission Marker Inventory')
      expect(markdown).toContain('| AUTHOR_DECISION | author_decision | blocking | `PROJECT.md` | 2 |')
      expect(markdown).toContain('| NEED_EXPERIMENT | experiment_result | workbench | `drafts/paper-as-code/04_experiments.md` | 2 |')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
