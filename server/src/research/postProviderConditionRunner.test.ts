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
import { createBaselineTrace } from './baselineTraceAgents'
import { generatePilotDecisionDataset } from './pilotDatasetExporter'
import { writePromptPackets } from './llmPromptPackets'
import { writeLLMBatchFiles } from './llmBatchFiles'
import { createRevisionPromptPacket, writeRevisionPromptPackets } from './verifierRevisionPackets'
import { verifyReasoningTrace } from './reasoningVerifier'
import { runPostProviderCondition } from './postProviderConditionRunner'

describe('postProviderConditionRunner', () => {
  it('materializes, audits, and ingests a complete provider result JSONL', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-post-provider-'))
    const decisionsDir = join(rootDir, 'decisions')
    const promptDir = join(rootDir, 'prompts')
    const batchDir = join(rootDir, 'batch')
    const providerResultsPath = join(batchDir, 'provider-results.jsonl')
    const outputDir = join(rootDir, 'results')
    const dataset = generatePilotDecisionDataset({ targetCount: 2, gameIdPrefix: 'post-provider' })

    try {
      mkdirSync(decisionsDir, { recursive: true })
      for (const decision of dataset.decisions) {
        writeFileSync(join(decisionsDir, `${decision.decisionId}.json`), JSON.stringify(decision), 'utf8')
      }
      writePromptPackets({ decisions: dataset.decisions, conditionId: 'plain-llm', outputDir: promptDir })
      const batch = writeLLMBatchFiles({ promptPacketDir: join(promptDir, 'packets'), outputDir: batchDir })
      writeFileSync(providerResultsPath, dataset.decisions.map(decision => {
        const trace = {
          ...createBaselineTrace(decision, 'strategic-heuristic'),
          agentId: 'plain-llm',
        }
        return JSON.stringify(openAiBatchResult(decision.decisionId, JSON.stringify(trace)))
      }).join('\n'), 'utf8')

      const result = runPostProviderCondition({
        decisionsDir,
        promptPacketDir: join(promptDir, 'packets'),
        batchJsonlPath: batch.batchJsonlPath,
        providerResultJsonlPath: providerResultsPath,
        rawOutputDir: batch.rawOutputDir,
        outputDir,
        conditionId: 'plain-llm',
        provenance: {
          modelProvider: 'openai',
          modelName: 'gpt-test',
          runId: 'run-1',
          temperature: 0,
        },
      })

      expect(result.status).toBe('ingested')
      expect(result.materialization.writtenCount).toBe(2)
      expect(result.audit.readyForIngest).toBe(true)
      expect(result.ingest?.failures).toHaveLength(0)

      const metrics = JSON.parse(readFileSync(join(outputDir, 'metrics.json'), 'utf8'))
      expect(metrics.totalParsedTraces).toBe(2)
      expect(metrics.parseFailureCount).toBe(0)

      const report = JSON.parse(readFileSync(result.reportPath, 'utf8'))
      expect(report.status).toBe('ingested')
      expect(report.metricsPath).toBe(join(outputDir, 'metrics.json'))
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('stops before ingest when provider results are incomplete', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-post-provider-missing-'))
    const decisionsDir = join(rootDir, 'decisions')
    const promptDir = join(rootDir, 'prompts')
    const batchDir = join(rootDir, 'batch')
    const providerResultsPath = join(batchDir, 'provider-results.jsonl')
    const outputDir = join(rootDir, 'results')
    const dataset = generatePilotDecisionDataset({ targetCount: 2, gameIdPrefix: 'post-provider-missing' })

    try {
      mkdirSync(decisionsDir, { recursive: true })
      for (const decision of dataset.decisions) {
        writeFileSync(join(decisionsDir, `${decision.decisionId}.json`), JSON.stringify(decision), 'utf8')
      }
      writePromptPackets({ decisions: dataset.decisions, conditionId: 'plain-llm', outputDir: promptDir })
      const batch = writeLLMBatchFiles({ promptPacketDir: join(promptDir, 'packets'), outputDir: batchDir })
      const trace = {
        ...createBaselineTrace(dataset.decisions[0], 'strategic-heuristic'),
        agentId: 'plain-llm',
      }
      writeFileSync(providerResultsPath, `${JSON.stringify(openAiBatchResult(dataset.decisions[0].decisionId, JSON.stringify(trace)))}\n`, 'utf8')

      const result = runPostProviderCondition({
        decisionsDir,
        promptPacketDir: join(promptDir, 'packets'),
        batchJsonlPath: batch.batchJsonlPath,
        providerResultJsonlPath: providerResultsPath,
        rawOutputDir: batch.rawOutputDir,
        outputDir,
        conditionId: 'plain-llm',
        provenance: {
          modelProvider: 'openai',
          modelName: 'gpt-test',
        },
      })

      expect(result.status).toBe('not_ready_for_ingest')
      expect(result.audit.readyForIngest).toBe(false)
      expect(result.ingest).toBeUndefined()
      const report = JSON.parse(readFileSync(result.reportPath, 'utf8'))
      expect(report.blockers).toContain('Raw-output audit is not ready for ingest.')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('ingests revision outputs using packet raw-output filenames', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-post-provider-revision-'))
    const decisionsDir = join(rootDir, 'decisions')
    const promptDir = join(rootDir, 'revision-prompts')
    const batchDir = join(rootDir, 'revision-batch')
    const providerResultsPath = join(batchDir, 'provider-results.jsonl')
    const outputDir = join(rootDir, 'revision-results')
    const dataset = generatePilotDecisionDataset({ targetCount: 1, gameIdPrefix: 'post-provider-revision' })
    const decision = dataset.decisions[0]
    const trace = createBaselineTrace(decision, 'strategic-heuristic')
    const verifierResult = verifyReasoningTrace(decision, trace)

    try {
      mkdirSync(decisionsDir, { recursive: true })
      writeFileSync(join(decisionsDir, `${decision.decisionId}.json`), JSON.stringify(decision), 'utf8')
      writeRevisionPromptPackets({
        inputs: [{ decision, trace, verifierResult }],
        outputDir: promptDir,
      })
      const batch = writeLLMBatchFiles({ promptPacketDir: join(promptDir, 'packets'), outputDir: batchDir })
      const revisionTrace = {
        ...createRevisionPromptPacket(decision, trace, verifierResult),
        schemaVersion: '0.1.0',
        decisionId: decision.decisionId,
        agentId: 'verifier-revision-llm',
        selectedActionId: trace.selectedActionId,
        teamObjective: trace.teamObjective,
        partnerBelief: trace.partnerBelief,
        opponentBelief: trace.opponentBelief,
        actionRationale: trace.actionRationale,
        riskAssessment: trace.riskAssessment,
        confidence: trace.confidence,
      }
      writeFileSync(providerResultsPath, `${JSON.stringify(openAiBatchResult(decision.decisionId, JSON.stringify(revisionTrace)))}\n`, 'utf8')

      const result = runPostProviderCondition({
        decisionsDir,
        promptPacketDir: join(promptDir, 'packets'),
        batchJsonlPath: batch.batchJsonlPath,
        providerResultJsonlPath: providerResultsPath,
        rawOutputDir: batch.rawOutputDir,
        outputDir,
        conditionId: 'verifier-revision-llm',
        provenance: {
          modelProvider: 'openai',
          modelName: 'gpt-test',
        },
      })

      expect(result.status).toBe('ingested')
      expect(result.ingest?.failures).toHaveLength(0)
      const metrics = JSON.parse(readFileSync(join(outputDir, 'metrics.json'), 'utf8'))
      expect(metrics.totalDecisionPoints).toBe(1)
      expect(metrics.totalParsedTraces).toBe(1)
      expect(metrics.parseFailureCount).toBe(0)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function openAiBatchResult(customId: string, content: string) {
  return {
    custom_id: customId,
    response: {
      body: {
        choices: [
          {
            message: { content },
          },
        ],
      },
    },
  }
}
