import {
  mkdirSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import type { LLMConditionId } from './llmPromptPackets'
import {
  type LLMRunProvenanceInput,
  type MaterializeProviderResultsReport,
  materializeProviderResults,
} from './llmProviderResults'
import {
  type LLMRawOutputAuditResult,
  auditLLMRawOutputs,
} from './llmBatchFiles'
import {
  type LLMOutputIngestResult,
  ingestLLMRawOutputs,
} from './llmOutputIngest'
import { readDecisionPointsFromDirectory } from './pilotVerifierRunner'

export interface PostProviderConditionOptions {
  decisionsDir: string
  promptPacketDir: string
  batchJsonlPath: string
  providerResultJsonlPath: string
  rawOutputDir: string
  outputDir: string
  conditionId: LLMConditionId
  provenance: LLMRunProvenanceInput
  materializationReportPath?: string
  provenancePath?: string
  auditPath?: string
  reportPath?: string
}

export interface PostProviderConditionResult {
  schemaVersion: '0.1.0'
  status: 'ingested' | 'not_ready_for_ingest'
  conditionId: LLMConditionId
  materialization: MaterializeProviderResultsReport
  audit: LLMRawOutputAuditResult
  ingest?: LLMOutputIngestResult
  reportPath: string
  metricsPath?: string
  blockers: string[]
}

export function runPostProviderCondition(options: PostProviderConditionOptions): PostProviderConditionResult {
  mkdirSync(options.outputDir, { recursive: true })
  const materializationReportPath = options.materializationReportPath
    ?? join(options.outputDir, 'provider-materialization-report.json')
  const provenancePath = options.provenancePath
    ?? join(options.outputDir, 'provenance.json')
  const auditPath = options.auditPath
    ?? join(options.outputDir, 'raw-output-audit.json')
  const reportPath = options.reportPath
    ?? join(options.outputDir, 'post-provider-report.json')

  const materialization = materializeProviderResults({
    batchJsonlPath: options.batchJsonlPath,
    providerResultJsonlPath: options.providerResultJsonlPath,
    rawOutputDir: options.rawOutputDir,
    reportPath: materializationReportPath,
    provenancePath,
    provenance: options.provenance,
  })

  const audit = auditLLMRawOutputs({
    promptPacketDir: options.promptPacketDir,
    rawOutputDir: options.rawOutputDir,
    outputPath: auditPath,
  })

  const blockers: string[] = []
  if (!materialization.readyForAudit) blockers.push('Provider-result materialization is not ready for audit.')
  if (!audit.readyForIngest) blockers.push('Raw-output audit is not ready for ingest.')

  if (blockers.length > 0) {
    const result: PostProviderConditionResult = {
      schemaVersion: '0.1.0',
      status: 'not_ready_for_ingest',
      conditionId: options.conditionId,
      materialization,
      audit,
      reportPath,
      blockers,
    }
    writeJson(reportPath, result)
    return result
  }

  const decisions = readDecisionPointsFromDirectory(options.decisionsDir)
  const ingest = ingestLLMRawOutputs({
    decisions,
    rawOutputDir: options.rawOutputDir,
    outputDir: options.outputDir,
    conditionId: options.conditionId,
  })

  const result: PostProviderConditionResult = {
    schemaVersion: '0.1.0',
    status: 'ingested',
    conditionId: options.conditionId,
    materialization,
    audit,
    ingest,
    reportPath,
    metricsPath: ingest.metricsPath,
    blockers,
  }
  writeJson(reportPath, result)
  return result
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
