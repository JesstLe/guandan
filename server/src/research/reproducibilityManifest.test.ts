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
import { writeReproducibilityManifest } from './reproducibilityManifest'

describe('reproducibilityManifest', () => {
  it('records file, directory, and missing artifact status without inventing outputs', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-repro-manifest-'))
    const outputDir = join(rootDir, 'submission')
    const sourceDir = join(rootDir, 'artifacts', 'dataset')
    const sourceFile = join(rootDir, 'artifacts', 'metrics.json')

    mkdirSync(sourceDir, { recursive: true })
    writeFileSync(sourceFile, '{"rows":[]}\n', 'utf8')
    writeFileSync(join(sourceDir, 'a.json'), '{"id":"a"}\n', 'utf8')
    writeFileSync(join(sourceDir, 'nested.txt'), 'nested\n', 'utf8')

    try {
      const result = writeReproducibilityManifest({
        rootDir,
        outputDir,
        entries: [
          { id: 'metrics', title: 'Metrics Summary', path: 'artifacts/metrics.json' },
          { id: 'dataset', title: 'Pilot Dataset', path: 'artifacts/dataset' },
          { id: 'missing-llm', title: 'Provider Results', path: 'artifacts/provider-results.jsonl' },
        ],
      })

      expect(result.jsonPath).toBe(join(outputDir, 'reproducibility-manifest.json'))
      expect(result.markdownPath).toBe(join(outputDir, 'reproducibility-manifest.md'))

      const manifest = JSON.parse(readFileSync(result.jsonPath, 'utf8'))
      expect(manifest.schemaVersion).toBe('0.1.0')
      expect(manifest.entries).toHaveLength(3)

      const metrics = manifest.entries.find((entry: { id: string }) => entry.id === 'metrics')
      expect(metrics).toMatchObject({
        id: 'metrics',
        title: 'Metrics Summary',
        path: 'artifacts/metrics.json',
        kind: 'file',
        status: 'present',
        bytes: 12,
      })
      expect(metrics.sha256).toMatch(/^[a-f0-9]{64}$/)

      const dataset = manifest.entries.find((entry: { id: string }) => entry.id === 'dataset')
      expect(dataset).toMatchObject({
        id: 'dataset',
        title: 'Pilot Dataset',
        path: 'artifacts/dataset',
        kind: 'directory',
        status: 'present',
        fileCount: 2,
      })
      expect(dataset.bytes).toBeGreaterThan(0)
      expect(dataset.treeSha256).toMatch(/^[a-f0-9]{64}$/)

      const missing = manifest.entries.find((entry: { id: string }) => entry.id === 'missing-llm')
      expect(missing).toMatchObject({
        id: 'missing-llm',
        title: 'Provider Results',
        path: 'artifacts/provider-results.jsonl',
        kind: 'missing',
        status: 'missing',
      })
      expect(missing.bytes).toBe(0)

      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('# Reproducibility Manifest')
      expect(markdown).toContain('| Metrics Summary | `present` | file | `artifacts/metrics.json` |')
      expect(markdown).toContain('| Provider Results | `missing` | missing | `artifacts/provider-results.jsonl` |')
      expect(markdown).toContain('Missing entries are audit findings, not experimental results.')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
