import { describe, expect, it } from 'vitest'
import {
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runLocalResearchPipeline } from './localResearchPipeline'

describe('localResearchPipeline', () => {
  it('runs local-only downstream artifact steps in dependency order', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-local-pipeline-'))
    const calls: string[] = []

    try {
      const result = runLocalResearchPipeline({
        cwd: rootDir,
        reportDir: join(rootDir, 'reports'),
        runner: command => {
          calls.push(command.join(' '))
          return { exitCode: 0, stdout: 'ok', stderr: '' }
        },
      })

      expect(result.status).toBe('completed')
      expect(result.steps.map(step => step.id)).toEqual([
        'pilot-metrics-summary',
        'revision-comparison',
        'ablation-summary',
        'paper-tables',
        'manuscript',
        'marker-inventory',
        'experiment-resolution-ledger',
        'submission-gate',
        'preflight',
        'provider-handoff-audit',
        'bibliography-integrity',
        'reproducibility-manifest',
      ])
      expect(calls[0]).toContain('writePilotMetricsSummaryCli.ts')
      expect(calls.at(-1)).toContain('writeReproducibilityManifestCli.ts')

      const report = JSON.parse(readFileSync(result.jsonPath, 'utf8'))
      expect(report.status).toBe('completed')
      expect(report.steps.every((step: { status: string }) => step.status === 'passed')).toBe(true)

      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('# Local Research Pipeline Report')
      expect(markdown).toContain('| Pilot Metrics Summary | `passed` |')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('stops before later artifact steps when a local step fails', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-local-pipeline-fail-'))
    const calls: string[] = []

    try {
      const result = runLocalResearchPipeline({
        cwd: rootDir,
        reportDir: join(rootDir, 'reports'),
        runner: command => {
          calls.push(command.join(' '))
          if (command.some(part => part.includes('writeRevisionComparisonCli.ts'))) {
            return { exitCode: 1, stdout: '', stderr: 'revision failed' }
          }
          return { exitCode: 0, stdout: 'ok', stderr: '' }
        },
      })

      expect(result.status).toBe('failed')
      expect(result.steps.map(step => step.status)).toEqual(['passed', 'failed'])
      expect(calls).toHaveLength(2)
      expect(readFileSync(result.markdownPath, 'utf8')).toContain('revision failed')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
