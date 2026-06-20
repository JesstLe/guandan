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
import { writePilotReplicationReport } from './pilotReplicationReport'

describe('pilotReplicationReport', () => {
  it('stays pending until a second-provider/model replication is materialized', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-pilot-replication-pending-'))

    try {
      const result = writePilotReplicationReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'experiments', 'pilot-replication'),
      })

      expect(result.report.status).toBe('pending_missing_replication')
      expect(result.report.completedReplicationCount).toBe(0)
      expect(result.report.replications[0].status).toBe('missing')

      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('pending_missing_replication')
      expect(markdown).toContain('second-provider-tom-pilot is missing')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('marks replication complete only when provider and metrics evidence are complete', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-pilot-replication-complete-'))

    try {
      mkdirSync(join(rootDir, 'experiments', 'provider-results'), { recursive: true })
      mkdirSync(join(rootDir, 'experiments', 'pilot-replication', 'second-provider-tom-prompted-results'), { recursive: true })
      writeFileSync(join(rootDir, 'experiments', 'provider-results', 'tom-prompted-llm-second-provider.jsonl'), '{"custom_id":"d-1"}\n', 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'provider-results', 'tom-prompted-llm-second-provider-run-report.json'), JSON.stringify({
        expectedCount: 50,
        successCount: 50,
        errorCount: 0,
        runner: 'openai-compatible',
        model: 'replication-model',
      }), 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'pilot-replication', 'second-provider-tom-prompted-results', 'metrics.json'), JSON.stringify({
        totalDecisionPoints: 50,
        totalParsedTraces: 37,
        parseFailureCount: 13,
        hardFailureCount: 4,
      }), 'utf8')

      const result = writePilotReplicationReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'experiments', 'pilot-replication'),
      })

      expect(result.report.status).toBe('completed')
      expect(result.report.completedReplicationCount).toBe(1)
      expect(result.report.replications[0]).toMatchObject({
        status: 'completed',
        independentFromPrimary: true,
        provider: 'openai-compatible',
        model: 'replication-model',
        parsedCount: 37,
        hardFailureCount: 4,
      })
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('does not count a same-provider same-model rerun as second-provider/model replication', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-pilot-replication-same-model-'))

    try {
      mkdirSync(join(rootDir, 'experiments', 'provider-results'), { recursive: true })
      mkdirSync(join(rootDir, 'experiments', 'pilot-e7-tom-prompted-results'), { recursive: true })
      mkdirSync(join(rootDir, 'experiments', 'pilot-replication', 'second-provider-tom-prompted-results'), { recursive: true })

      writeFileSync(join(rootDir, 'experiments', 'provider-results', 'tom-prompted-llm.jsonl'), '{"custom_id":"d-1"}\n', 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'provider-results', 'tom-prompted-llm-kimi-merge-report.json'), JSON.stringify({
        expectedCount: 50,
        successCount: 50,
        errorCount: 0,
        runner: 'kimi-cli',
        model: 'kimi-code/kimi-for-coding',
      }), 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'pilot-e7-tom-prompted-results', 'metrics.json'), JSON.stringify({
        totalDecisionPoints: 50,
        totalParsedTraces: 36,
        parseFailureCount: 14,
        hardFailureCount: 1,
      }), 'utf8')

      writeFileSync(join(rootDir, 'experiments', 'provider-results', 'tom-prompted-llm-second-provider.jsonl'), '{"custom_id":"d-1"}\n', 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'provider-results', 'tom-prompted-llm-second-provider-run-report.json'), JSON.stringify({
        expectedCount: 50,
        successCount: 50,
        errorCount: 0,
        runner: 'kimi-cli',
        model: 'kimi-code/kimi-for-coding',
      }), 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'pilot-replication', 'second-provider-tom-prompted-results', 'metrics.json'), JSON.stringify({
        totalDecisionPoints: 50,
        totalParsedTraces: 37,
        parseFailureCount: 13,
        hardFailureCount: 4,
      }), 'utf8')

      const result = writePilotReplicationReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'experiments', 'pilot-replication'),
      })

      expect(result.report.status).toBe('partial')
      expect(result.report.completedReplicationCount).toBe(0)
      expect(result.report.replications[0]).toMatchObject({
        status: 'partial',
        independentFromPrimary: false,
        provider: 'kimi-cli',
        model: 'kimi-code/kimi-for-coding',
        parsedCount: 37,
      })
      expect(result.report.replications[0].finding).toContain('not an independent second-provider/model replication')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
