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
import { writeSecondProviderReplicationPreflight } from './secondProviderReplicationPreflight'

describe('secondProviderReplicationPreflight', () => {
  it('blocks when only the primary Kimi key is present', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-second-provider-preflight-kimi-'))

    try {
      writeReplicationInputs(rootDir)
      const envFile = join(rootDir, '.env')
      writeFileSync(envFile, 'KIMI_API_KEY=redacted-test-key\n', 'utf8')

      const result = writeSecondProviderReplicationPreflight({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'experiments', 'pilot-replication'),
        envFile,
      })

      expect(result.report.status).toBe('blocked_missing_independent_provider_key')
      expect(result.report.facts.independentKeyPresent).toBe(false)
      expect(result.report.keyCandidates.find(candidate => candidate.env === 'KIMI_API_KEY')).toMatchObject({
        present: true,
        independentFromPrimary: false,
        recommended: false,
      })
      expect(readFileSync(result.markdownPath, 'utf8')).toContain('Kimi credentials do not count')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('is ready when an independent provider key and fixed inputs are present', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-second-provider-preflight-ready-'))

    try {
      writeReplicationInputs(rootDir)
      const envFile = join(rootDir, '.env.local')
      writeFileSync(envFile, 'ZHIPU_API_KEY=redacted-test-key\n', 'utf8')

      const result = writeSecondProviderReplicationPreflight({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'experiments', 'pilot-replication'),
        envFile,
      })

      expect(result.report.status).toBe('ready_to_run')
      expect(result.report.facts.independentKeyPresent).toBe(true)
      expect(result.report.blockers).toHaveLength(0)
      expect(result.report.recommendedCommand).toBe('npm run research:second-provider:run')
      expect(result.report.smokeCommand).toBe('npm run research:second-provider:smoke')
      expect(result.report.fullCommand).toBe('npm run research:second-provider:run')
      expect(result.report.successCriteria).toContain('Pilot replication report status becomes completed with completedReplicationCount > 0.')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('recognizes completed second-provider replication artifacts', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-second-provider-preflight-complete-'))

    try {
      writeReplicationInputs(rootDir)
      mkdirSync(join(rootDir, 'experiments', 'provider-results'), { recursive: true })
      mkdirSync(join(rootDir, 'experiments', 'pilot-replication', 'second-provider-tom-prompted-results'), { recursive: true })
      writeFileSync(
        join(rootDir, 'experiments', 'provider-results', 'tom-prompted-llm-second-provider.jsonl'),
        Array.from({ length: 50 }, (_, index) => JSON.stringify({ custom_id: `d-${index}` })).join('\n') + '\n',
        'utf8',
      )
      writeFileSync(join(rootDir, 'experiments', 'provider-results', 'tom-prompted-llm-second-provider-run-report.json'), JSON.stringify({
        expectedCount: 50,
        successCount: 50,
        errorCount: 0,
        runner: 'openai-compatible',
        model: 'replication-model',
      }), 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'pilot-replication', 'second-provider-tom-prompted-results', 'metrics.json'), JSON.stringify({
        totalDecisionPoints: 50,
        totalParsedTraces: 38,
      }), 'utf8')

      const result = writeSecondProviderReplicationPreflight({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'experiments', 'pilot-replication'),
      })

      expect(result.report.status).toBe('replication_complete')
      expect(result.report.facts.secondProviderRows).toBe(50)
      expect(result.report.blockers).toHaveLength(0)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function writeReplicationInputs(rootDir: string): void {
  mkdirSync(join(rootDir, 'experiments', 'pilot-e7-tom-prompted-batch', 'openai'), { recursive: true })
  mkdirSync(join(rootDir, 'experiments', 'pilot-e7-tom-prompted-prompts', 'packets'), { recursive: true })
  writeFileSync(
    join(rootDir, 'experiments', 'pilot-e7-tom-prompted-batch', 'openai', 'openai-batch-input.jsonl'),
    Array.from({ length: 50 }, (_, index) => JSON.stringify({ custom_id: `d-${index}` })).join('\n') + '\n',
    'utf8',
  )
  for (let i = 0; i < 50; i++) {
    writeFileSync(
      join(rootDir, 'experiments', 'pilot-e7-tom-prompted-prompts', 'packets', `packet-${String(i).padStart(3, '0')}.json`),
      '{}\n',
      'utf8',
    )
  }
}
