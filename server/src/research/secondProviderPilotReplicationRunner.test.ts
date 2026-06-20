import { describe, expect, it } from 'vitest'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createBaselineTrace } from './baselineTraceAgents'
import { writeLLMBatchFiles } from './llmBatchFiles'
import { writePromptPackets } from './llmPromptPackets'
import { writeOpenAIChatBatchFile } from './openAIBatchExport'
import { generatePilotDecisionDataset } from './pilotDatasetExporter'
import { runSecondProviderPilotReplication } from './secondProviderPilotReplicationRunner'
import type { GuandanDecisionPoint } from '@guandan/shared'

describe('secondProviderPilotReplicationRunner', () => {
  it('refuses to spend requests on a same-provider same-model replication', async () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-second-provider-same-primary-'))
    const dataset = generatePilotDecisionDataset({ targetCount: 50, gameIdPrefix: 'second-provider-same-primary' })

    try {
      writeFixedTomPilotInputs(rootDir, dataset.decisions)
      mkdirSync(join(rootDir, 'experiments', 'provider-results'), { recursive: true })
      writeFileSync(join(rootDir, 'experiments', 'provider-results', 'tom-prompted-llm-kimi-merge-report.json'), JSON.stringify({
        runner: 'kimi-cli',
        model: 'kimi-code/kimi-for-coding',
      }), 'utf8')

      await expect(runSecondProviderPilotReplication({
        researchRoot: rootDir,
        apiKey: 'test-key',
        baseUrl: 'https://provider.test/',
        model: 'kimi-code/kimi-for-coding',
        runner: 'kimi-cli',
        request: async () => {
          throw new Error('request should not be called')
        },
      })).rejects.toThrow('Refusing to run second-provider replication')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('runs a smoke request without materializing partial replication metrics', async () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-second-provider-smoke-'))
    const dataset = generatePilotDecisionDataset({ targetCount: 50, gameIdPrefix: 'second-provider-smoke' })

    try {
      const decisionsById = writeFixedTomPilotInputs(rootDir, dataset.decisions)
      const result = await runSecondProviderPilotReplication({
        researchRoot: rootDir,
        apiKey: 'test-key',
        apiKeyEnv: 'TEST_API_KEY',
        baseUrl: 'https://provider.test/',
        requestPath: '/chat/completions',
        model: 'glm-test',
        runner: 'zhipu-openai-compatible',
        completionTokensField: 'max_tokens',
        limit: 1,
        stopOnError: true,
        request: async line => providerBodyForDecision(decisionsById.get(line.custom_id)!),
      })

      expect(result.status).toBe('provider_partial_not_materialized')
      expect(result.materialized).toBe(false)
      expect(result.providerRun).toMatchObject({
        expectedCount: 1,
        successCount: 1,
        errorCount: 0,
        pendingSuccessCount: 0,
        requestPath: '/chat/completions',
        runner: 'zhipu-openai-compatible',
        model: 'glm-test',
        completionTokensField: 'max_tokens',
      })
      expect(existsSync(result.providerResultsPath)).toBe(true)
      expect(existsSync(result.runReportPath)).toBe(true)
      expect(existsSync(join(rootDir, 'experiments/pilot-replication/second-provider-tom-prompted-results/metrics.json'))).toBe(false)

      const runReport = JSON.parse(readFileSync(result.runReportPath, 'utf8'))
      expect(runReport.apiKeyEnv).toBe('TEST_API_KEY')
      expect(runReport.apiKey).toBeUndefined()
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('materializes replication metrics only after all 50 provider rows succeed', async () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-second-provider-full-'))
    const dataset = generatePilotDecisionDataset({ targetCount: 50, gameIdPrefix: 'second-provider-full' })

    try {
      const decisionsById = writeFixedTomPilotInputs(rootDir, dataset.decisions)
      const result = await runSecondProviderPilotReplication({
        researchRoot: rootDir,
        apiKey: 'test-key',
        baseUrl: 'https://provider.test/',
        requestPath: '/chat/completions',
        model: 'glm-test',
        runner: 'zhipu-openai-compatible',
        completionTokensField: 'max_tokens',
        concurrency: 3,
        stopOnError: true,
        request: async line => providerBodyForDecision(decisionsById.get(line.custom_id)!),
      })

      expect(result.status).toBe('provider_complete_materialized')
      expect(result.materialized).toBe(true)
      expect(result.providerRun).toMatchObject({
        expectedCount: 50,
        successCount: 50,
        errorCount: 0,
        pendingSuccessCount: 0,
      })
      expect(result.materialization?.status).toBe('ingested')
      expect(result.materialization?.metricsPath).toBe(join(rootDir, 'experiments/pilot-replication/second-provider-tom-prompted-results/metrics.json'))

      const metricsPath = result.materialization?.metricsPath
      expect(metricsPath).toBeDefined()
      const metrics = JSON.parse(readFileSync(metricsPath!, 'utf8'))
      expect(metrics.conditionId).toBe('tom-prompted-llm')
      expect(metrics.totalDecisionPoints).toBe(50)
      expect(metrics.totalParsedTraces).toBe(50)
      expect(metrics.parseFailureCount).toBe(0)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function writeFixedTomPilotInputs(
  researchRoot: string,
  decisions: GuandanDecisionPoint[],
): Map<string, GuandanDecisionPoint> {
  const decisionsDir = join(researchRoot, 'experiments/pilot-e1/decisions')
  const promptRoot = join(researchRoot, 'experiments/pilot-e7-tom-prompted-prompts')
  const batchRoot = join(researchRoot, 'experiments/pilot-e7-tom-prompted-batch')
  const decisionsById = new Map(decisions.map(decision => [decision.decisionId, decision]))

  mkdirSync(decisionsDir, { recursive: true })
  for (const decision of decisions) {
    writeFileSync(join(decisionsDir, `${decision.decisionId}.json`), JSON.stringify(decision), 'utf8')
  }

  writePromptPackets({
    decisions,
    conditionId: 'tom-prompted-llm',
    outputDir: promptRoot,
  })
  const batch = writeLLMBatchFiles({
    promptPacketDir: join(promptRoot, 'packets'),
    outputDir: batchRoot,
  })
  writeOpenAIChatBatchFile({
    sourceBatchJsonlPath: batch.batchJsonlPath,
    outputDir: join(batchRoot, 'openai'),
    model: 'gpt-test',
    temperature: 0,
    maxCompletionTokens: 1200,
  })
  return decisionsById
}

function providerBodyForDecision(decision: GuandanDecisionPoint): Record<string, unknown> {
  const trace = {
    ...createBaselineTrace(decision, 'strategic-heuristic'),
    agentId: 'tom-prompted-llm',
  }
  return {
    id: `chatcmpl-${decision.decisionId}`,
    choices: [
      {
        message: {
          content: JSON.stringify(trace),
        },
      },
    ],
  }
}
