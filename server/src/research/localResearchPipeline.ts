import { spawnSync } from 'node:child_process'
import {
  mkdirSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

export type LocalResearchPipelineStatus = 'completed' | 'failed'
export type LocalResearchPipelineStepStatus = 'passed' | 'failed'

export interface LocalResearchPipelineCommandResult {
  exitCode: number
  stdout: string
  stderr: string
}

export type LocalResearchPipelineRunner = (command: string[], cwd: string) => LocalResearchPipelineCommandResult

export interface LocalResearchPipelineOptions {
  cwd: string
  reportDir: string
  runner?: LocalResearchPipelineRunner
}

export interface LocalResearchPipelineStepDefinition {
  id: string
  title: string
  command: string[]
}

export interface LocalResearchPipelineStepReport extends LocalResearchPipelineStepDefinition {
  status: LocalResearchPipelineStepStatus
  exitCode: number
  stdout: string
  stderr: string
}

export interface LocalResearchPipelineReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  status: LocalResearchPipelineStatus
  steps: LocalResearchPipelineStepReport[]
}

export interface LocalResearchPipelineResult extends LocalResearchPipelineReport {
  jsonPath: string
  markdownPath: string
}

const localPipelineSteps: LocalResearchPipelineStepDefinition[] = [
  {
    id: 'pilot-metrics-summary',
    title: 'Pilot Metrics Summary',
    command: ['npx', 'tsx', 'server/src/research/writePilotMetricsSummaryCli.ts', '--out', 'docs/research/experiments/pilot-metrics-summary'],
  },
  {
    id: 'full-heuristic-verifier',
    title: 'Full Split Heuristic Verifier',
    command: ['npx', 'tsx', 'server/src/research/runPilotVerifierCli.ts', '--input', 'docs/research/experiments/full-e1/decisions', '--out', 'docs/research/experiments/full-e2-heuristic-verifier', '--agent', 'heuristic-legal-first'],
  },
  {
    id: 'full-strategic-heuristic',
    title: 'Full Split Strategic Heuristic',
    command: ['npx', 'tsx', 'server/src/research/runPilotVerifierCli.ts', '--input', 'docs/research/experiments/full-e1/decisions', '--out', 'docs/research/experiments/full-e3-strategic-heuristic', '--agent', 'strategic-heuristic'],
  },
  {
    id: 'full-baseline-summary',
    title: 'Full Split Baseline Summary',
    command: [
      'npx',
      'tsx',
      'server/src/research/writePilotMetricsSummaryCli.ts',
      '--no-defaults',
      '--out',
      'docs/research/experiments/full-baseline-summary',
      '--basename',
      'full-baseline-summary',
      '--title',
      'Full Split Baseline Summary',
      '--description',
      'This table is generated from 500-decision full-split deterministic baseline artifacts. These rows validate the full split, trace schema, and verifier plumbing; they are not LLM model results.',
      '--source',
      'agentId=heuristic-legal-first-full,metricsPath=docs/research/experiments/full-e2-heuristic-verifier/metrics.json,notes=500-decision deterministic pipeline validation baseline',
      '--source',
      'agentId=strategic-heuristic-full,metricsPath=docs/research/experiments/full-e3-strategic-heuristic/metrics.json,notes=500-decision deterministic strategic baseline',
    ],
  },
  {
    id: 'tom-pilot-prompts',
    title: 'ToM Pilot Prompt Packets',
    command: ['npx', 'tsx', 'server/src/research/exportLLMPromptPacketsCli.ts', '--input', 'docs/research/experiments/pilot-e1/decisions', '--out', 'docs/research/experiments/pilot-e7-tom-prompted-prompts', '--condition', 'tom-prompted-llm'],
  },
  {
    id: 'tom-pilot-batch',
    title: 'ToM Pilot Batch Files',
    command: ['npx', 'tsx', 'server/src/research/exportLLMBatchFilesCli.ts', '--packets', 'docs/research/experiments/pilot-e7-tom-prompted-prompts/packets', '--out', 'docs/research/experiments/pilot-e7-tom-prompted-batch'],
  },
  {
    id: 'tom-pilot-openai-batch',
    title: 'ToM Pilot OpenAI Batch',
    command: ['npx', 'tsx', 'server/src/research/exportOpenAIBatchCli.ts', '--source', 'docs/research/experiments/pilot-e7-tom-prompted-batch/batch-input.jsonl', '--out', 'docs/research/experiments/pilot-e7-tom-prompted-batch/openai', '--model', 'gpt-4.1-mini', '--temperature', '0', '--max-completion-tokens', '1200'],
  },
  {
    id: 'tom-pilot-raw-audit',
    title: 'ToM Pilot Raw Output Audit',
    command: ['npx', 'tsx', 'server/src/research/auditLLMRawOutputsCli.ts', '--packets', 'docs/research/experiments/pilot-e7-tom-prompted-prompts/packets', '--raw', 'docs/research/experiments/pilot-e7-tom-prompted-batch/raw', '--out', 'docs/research/experiments/pilot-e7-tom-prompted-batch/raw-output-audit.json'],
  },
  {
    id: 'plain-full-prompts',
    title: 'Plain Full Prompt Packets',
    command: ['npx', 'tsx', 'server/src/research/exportLLMPromptPacketsCli.ts', '--input', 'docs/research/experiments/full-e1/decisions', '--out', 'docs/research/experiments/full-e2-plain-llm-prompts', '--condition', 'plain-llm'],
  },
  {
    id: 'plain-full-batch',
    title: 'Plain Full Batch Files',
    command: ['npx', 'tsx', 'server/src/research/exportLLMBatchFilesCli.ts', '--packets', 'docs/research/experiments/full-e2-plain-llm-prompts/packets', '--out', 'docs/research/experiments/full-e2-plain-llm-batch'],
  },
  {
    id: 'plain-full-openai-batch',
    title: 'Plain Full OpenAI Batch',
    command: ['npx', 'tsx', 'server/src/research/exportOpenAIBatchCli.ts', '--source', 'docs/research/experiments/full-e2-plain-llm-batch/batch-input.jsonl', '--out', 'docs/research/experiments/full-e2-plain-llm-batch/openai', '--model', 'gpt-4.1-mini', '--temperature', '0', '--max-completion-tokens', '1200'],
  },
  {
    id: 'plain-full-post-provider',
    title: 'Plain Full Optional Post-Provider Ingest',
    command: [
      'npx',
      'tsx',
      'server/src/research/runOptionalPostProviderConditionCli.ts',
      '--decisions',
      'docs/research/experiments/full-e1/decisions',
      '--packets',
      'docs/research/experiments/full-e2-plain-llm-prompts/packets',
      '--batch-jsonl',
      'docs/research/experiments/full-e2-plain-llm-batch/batch-input.jsonl',
      '--provider-results',
      'docs/research/experiments/provider-results/full-plain-llm.jsonl',
      '--raw',
      'docs/research/experiments/full-e2-plain-llm-batch/raw',
      '--out',
      'docs/research/experiments/full-e2-plain-llm-results',
      '--condition',
      'plain-llm',
      '--model-provider',
      'kimi-cli',
      '--model-name',
      'kimi-code/kimi-for-coding',
      '--temperature',
      '0',
      '--notes',
      '500-decision full-split plain run; optional step skips until provider JSONL exists.',
      '--allow-partial-ingest',
    ],
  },
  {
    id: 'plain-full-raw-audit',
    title: 'Plain Full Raw Output Audit',
    command: ['npx', 'tsx', 'server/src/research/auditLLMRawOutputsCli.ts', '--packets', 'docs/research/experiments/full-e2-plain-llm-prompts/packets', '--raw', 'docs/research/experiments/full-e2-plain-llm-batch/raw', '--out', 'docs/research/experiments/full-e2-plain-llm-batch/raw-output-audit.json'],
  },
  {
    id: 'candidate-full-prompts',
    title: 'Candidate Full Prompt Packets',
    command: ['npx', 'tsx', 'server/src/research/exportLLMPromptPacketsCli.ts', '--input', 'docs/research/experiments/full-e1/decisions', '--out', 'docs/research/experiments/full-e3-candidate-constrained-prompts', '--condition', 'candidate-constrained-llm'],
  },
  {
    id: 'candidate-full-batch',
    title: 'Candidate Full Batch Files',
    command: ['npx', 'tsx', 'server/src/research/exportLLMBatchFilesCli.ts', '--packets', 'docs/research/experiments/full-e3-candidate-constrained-prompts/packets', '--out', 'docs/research/experiments/full-e3-candidate-constrained-batch'],
  },
  {
    id: 'candidate-full-openai-batch',
    title: 'Candidate Full OpenAI Batch',
    command: ['npx', 'tsx', 'server/src/research/exportOpenAIBatchCli.ts', '--source', 'docs/research/experiments/full-e3-candidate-constrained-batch/batch-input.jsonl', '--out', 'docs/research/experiments/full-e3-candidate-constrained-batch/openai', '--model', 'gpt-4.1-mini', '--temperature', '0', '--max-completion-tokens', '1200'],
  },
  {
    id: 'candidate-full-post-provider',
    title: 'Candidate Full Optional Post-Provider Ingest',
    command: [
      'npx',
      'tsx',
      'server/src/research/runOptionalPostProviderConditionCli.ts',
      '--decisions',
      'docs/research/experiments/full-e1/decisions',
      '--packets',
      'docs/research/experiments/full-e3-candidate-constrained-prompts/packets',
      '--batch-jsonl',
      'docs/research/experiments/full-e3-candidate-constrained-batch/batch-input.jsonl',
      '--provider-results',
      'docs/research/experiments/provider-results/full-candidate-constrained-llm.jsonl',
      '--raw',
      'docs/research/experiments/full-e3-candidate-constrained-batch/raw',
      '--out',
      'docs/research/experiments/full-e3-candidate-constrained-results',
      '--condition',
      'candidate-constrained-llm',
      '--model-provider',
      'kimi-cli',
      '--model-name',
      'kimi-code/kimi-for-coding',
      '--temperature',
      '0',
      '--notes',
      '500-decision full-split candidate-constrained run; optional step skips until provider JSONL exists.',
      '--allow-partial-ingest',
    ],
  },
  {
    id: 'candidate-full-raw-audit',
    title: 'Candidate Full Raw Output Audit',
    command: ['npx', 'tsx', 'server/src/research/auditLLMRawOutputsCli.ts', '--packets', 'docs/research/experiments/full-e3-candidate-constrained-prompts/packets', '--raw', 'docs/research/experiments/full-e3-candidate-constrained-batch/raw', '--out', 'docs/research/experiments/full-e3-candidate-constrained-batch/raw-output-audit.json'],
  },
  {
    id: 'tom-full-prompts',
    title: 'ToM Full Prompt Packets',
    command: ['npx', 'tsx', 'server/src/research/exportLLMPromptPacketsCli.ts', '--input', 'docs/research/experiments/full-e1/decisions', '--out', 'docs/research/experiments/full-e4-tom-prompted-prompts', '--condition', 'tom-prompted-llm'],
  },
  {
    id: 'tom-full-batch',
    title: 'ToM Full Batch Files',
    command: ['npx', 'tsx', 'server/src/research/exportLLMBatchFilesCli.ts', '--packets', 'docs/research/experiments/full-e4-tom-prompted-prompts/packets', '--out', 'docs/research/experiments/full-e4-tom-prompted-batch'],
  },
  {
    id: 'tom-full-openai-batch',
    title: 'ToM Full OpenAI Batch',
    command: ['npx', 'tsx', 'server/src/research/exportOpenAIBatchCli.ts', '--source', 'docs/research/experiments/full-e4-tom-prompted-batch/batch-input.jsonl', '--out', 'docs/research/experiments/full-e4-tom-prompted-batch/openai', '--model', 'gpt-4.1-mini', '--temperature', '0', '--max-completion-tokens', '1200'],
  },
  {
    id: 'tom-full-post-provider',
    title: 'ToM Full Optional Post-Provider Ingest',
    command: [
      'npx',
      'tsx',
      'server/src/research/runOptionalPostProviderConditionCli.ts',
      '--decisions',
      'docs/research/experiments/full-e1/decisions',
      '--packets',
      'docs/research/experiments/full-e4-tom-prompted-prompts/packets',
      '--batch-jsonl',
      'docs/research/experiments/full-e4-tom-prompted-batch/batch-input.jsonl',
      '--provider-results',
      'docs/research/experiments/provider-results/full-tom-prompted-llm.jsonl',
      '--raw',
      'docs/research/experiments/full-e4-tom-prompted-batch/raw',
      '--out',
      'docs/research/experiments/full-e4-tom-prompted-results',
      '--condition',
      'tom-prompted-llm',
      '--model-provider',
      'kimi-cli',
      '--model-name',
      'kimi-code/kimi-for-coding',
      '--temperature',
      '0',
      '--notes',
      '500-decision full-split ToM run; optional step skips until provider JSONL exists.',
      '--allow-partial-ingest',
    ],
  },
  {
    id: 'tom-full-raw-audit',
    title: 'ToM Full Raw Output Audit',
    command: ['npx', 'tsx', 'server/src/research/auditLLMRawOutputsCli.ts', '--packets', 'docs/research/experiments/full-e4-tom-prompted-prompts/packets', '--raw', 'docs/research/experiments/full-e4-tom-prompted-batch/raw', '--out', 'docs/research/experiments/full-e4-tom-prompted-batch/raw-output-audit.json'],
  },
  {
    id: 'tom-full-schema-repair',
    title: 'ToM Full Schema Repair',
    command: [
      'npx',
      'tsx',
      'server/src/research/runLLMSchemaRepairCli.ts',
      '--decisions',
      'docs/research/experiments/full-e1/decisions',
      '--raw',
      'docs/research/experiments/full-e4-tom-prompted-batch/raw',
      '--out',
      'docs/research/experiments/full-e5-tom-schema-repair-results',
      '--agent',
      'tom-schema-repair-full',
    ],
  },
  {
    id: 'full-llm-summary',
    title: 'Full Split LLM Summary',
    command: [
      'npx',
      'tsx',
      'server/src/research/writePilotMetricsSummaryCli.ts',
      '--no-defaults',
      '--out',
      'docs/research/experiments/full-llm-summary',
      '--basename',
      'full-llm-summary',
      '--title',
      'Full Split LLM Summary',
      '--description',
      'This table is generated from 500-decision full-split LLM artifacts when provider results are present; otherwise it records raw-output readiness.',
      '--source',
      'agentId=plain-llm-full,metricsPath=docs/research/experiments/full-e2-plain-llm-results/metrics.json,rawAuditPath=docs/research/experiments/full-e2-plain-llm-batch/raw-output-audit.json,notes=500-decision Kimi Code CLI plain full split',
      '--source',
      'agentId=candidate-constrained-llm-full,metricsPath=docs/research/experiments/full-e3-candidate-constrained-results/metrics.json,rawAuditPath=docs/research/experiments/full-e3-candidate-constrained-batch/raw-output-audit.json,notes=500-decision Kimi Code CLI candidate-constrained full split',
      '--source',
      'agentId=tom-prompted-llm-full,metricsPath=docs/research/experiments/full-e4-tom-prompted-results/metrics.json,rawAuditPath=docs/research/experiments/full-e4-tom-prompted-batch/raw-output-audit.json,notes=500-decision Kimi Code CLI ToM-prompted full split',
      '--source',
      'agentId=tom-schema-repair-full,metricsPath=docs/research/experiments/full-e5-tom-schema-repair-results/metrics.json,rawAuditPath=docs/research/experiments/full-e4-tom-prompted-batch/raw-output-audit.json,notes=deterministic schema repair over available full-split ToM raw outputs',
    ],
  },
  {
    id: 'human-soft-label-audit-packet',
    title: 'Human Soft-Label Audit Packet',
    command: [
      'npx',
      'tsx',
      'server/src/research/writeHumanAuditPacketCli.ts',
      '--decisions',
      'docs/research/experiments/full-e1/decisions',
      '--traces',
      'docs/research/experiments/full-e5-tom-schema-repair-results/traces',
      '--results',
      'docs/research/experiments/full-e5-tom-schema-repair-results/results',
      '--out',
      'docs/research/experiments/human-soft-label-audit',
      '--sample-size',
      '40',
    ],
  },
  {
    id: 'human-soft-label-audit-annotator',
    title: 'Human Soft-Label Audit Annotator',
    command: [
      'npx',
      'tsx',
      'server/src/research/writeHumanAuditAnnotatorCli.ts',
      '--sample',
      'docs/research/experiments/human-soft-label-audit/human-audit-blind-sample.jsonl',
      '--annotations',
      'docs/research/experiments/human-soft-label-audit/human-audit-annotation-sheet.csv',
      '--out',
      'docs/research/experiments/human-soft-label-audit/human-audit-annotator.html',
    ],
  },
  {
    id: 'human-soft-label-audit-packet-quality',
    title: 'Human Soft-Label Audit Packet Quality',
    command: [
      'npx',
      'tsx',
      'server/src/research/writeHumanAuditPacketQualityCli.ts',
      '--manifest',
      'docs/research/experiments/human-soft-label-audit/human-audit-manifest.json',
      '--blind',
      'docs/research/experiments/human-soft-label-audit/human-audit-blind-sample.jsonl',
      '--answer-key',
      'docs/research/experiments/human-soft-label-audit/human-audit-answer-key.jsonl',
      '--annotations',
      'docs/research/experiments/human-soft-label-audit/human-audit-annotation-sheet.csv',
      '--annotator',
      'docs/research/experiments/human-soft-label-audit/human-audit-annotator.html',
      '--protocol',
      'docs/research/experiments/human-soft-label-audit/human-audit-protocol.md',
      '--out',
      'docs/research/experiments/human-soft-label-audit',
    ],
  },
  {
    id: 'human-soft-label-audit-annotator-package',
    title: 'Human Soft-Label Audit Annotator Package',
    command: [
      'npx',
      'tsx',
      'server/src/research/writeHumanAuditAnnotatorPackageCli.ts',
      '--blind',
      'docs/research/experiments/human-soft-label-audit/human-audit-blind-sample.jsonl',
      '--annotations',
      'docs/research/experiments/human-soft-label-audit/human-audit-annotation-sheet.csv',
      '--annotator',
      'docs/research/experiments/human-soft-label-audit/human-audit-annotator.html',
      '--out',
      'docs/research/experiments/human-soft-label-audit/annotator-package',
    ],
  },
  {
    id: 'human-soft-label-audit-annotator-package-archive',
    title: 'Human Soft-Label Audit Annotator Package Archive',
    command: [
      'npx',
      'tsx',
      'server/src/research/writeHumanAuditAnnotatorPackageArchiveCli.ts',
      '--package-dir',
      'docs/research/experiments/human-soft-label-audit/annotator-package',
      '--package-manifest',
      'docs/research/experiments/human-soft-label-audit/annotator-package/human-audit-annotator-package-manifest.json',
      '--archive',
      'docs/research/experiments/human-soft-label-audit/human-audit-annotator-package.tar.gz',
      '--out',
      'docs/research/experiments/human-soft-label-audit',
    ],
  },
  {
    id: 'human-soft-label-audit-inter-annotator',
    title: 'Human Soft-Label Audit Inter-Annotator Agreement',
    command: [
      'npx',
      'tsx',
      'server/src/research/writeHumanAuditInterAnnotatorAgreementCli.ts',
      '--annotator-a',
      'docs/research/experiments/human-soft-label-audit/human-audit-completed-annotations-annotator-a.csv',
      '--annotator-b',
      'docs/research/experiments/human-soft-label-audit/human-audit-completed-annotations-annotator-b.csv',
      '--blind',
      'docs/research/experiments/human-soft-label-audit/human-audit-blind-sample.jsonl',
      '--out',
      'docs/research/experiments/human-soft-label-audit',
    ],
  },
  {
    id: 'human-soft-label-audit-adjudication-template',
    title: 'Human Soft-Label Audit Adjudication Template',
    command: [
      'npx',
      'tsx',
      'server/src/research/writeHumanAuditAdjudicationTemplateCli.ts',
      '--inter-annotator',
      'docs/research/experiments/human-soft-label-audit/human-audit-inter-annotator-agreement-report.json',
      '--blind',
      'docs/research/experiments/human-soft-label-audit/human-audit-blind-sample.jsonl',
      '--out',
      'docs/research/experiments/human-soft-label-audit',
    ],
  },
  {
    id: 'human-soft-label-audit-build-adjudicated',
    title: 'Human Soft-Label Audit Build Adjudicated CSV',
    command: [
      'npx',
      'tsx',
      'server/src/research/writeHumanAuditAdjudicatedAnnotationsCli.ts',
      '--annotator-a',
      'docs/research/experiments/human-soft-label-audit/human-audit-completed-annotations-annotator-a.csv',
      '--annotator-b',
      'docs/research/experiments/human-soft-label-audit/human-audit-completed-annotations-annotator-b.csv',
      '--adjudication-template',
      'docs/research/experiments/human-soft-label-audit/human-audit-adjudication-template.csv',
      '--blind',
      'docs/research/experiments/human-soft-label-audit/human-audit-blind-sample.jsonl',
      '--adjudicated',
      'docs/research/experiments/human-soft-label-audit/human-audit-adjudicated-annotations.csv',
      '--out',
      'docs/research/experiments/human-soft-label-audit',
    ],
  },
  {
    id: 'human-soft-label-audit-intake',
    title: 'Human Soft-Label Audit Adjudicated-Annotation Intake',
    command: [
      'npx',
      'tsx',
      'server/src/research/writeHumanAuditIntakeCli.ts',
      '--returned',
      'docs/research/experiments/human-soft-label-audit/human-audit-adjudicated-annotations.csv',
      '--package-manifest',
      'docs/research/experiments/human-soft-label-audit/annotator-package/human-audit-annotator-package-manifest.json',
      '--blind',
      'docs/research/experiments/human-soft-label-audit/human-audit-blind-sample.jsonl',
      '--out',
      'docs/research/experiments/human-soft-label-audit',
    ],
  },
  {
    id: 'human-soft-label-audit-agreement',
    title: 'Human Soft-Label Audit Agreement',
    command: [
      'npx',
      'tsx',
      'server/src/research/writeHumanAuditAgreementCli.ts',
      '--annotations',
      'docs/research/experiments/human-soft-label-audit/human-audit-adjudicated-annotations.csv',
      '--answer-key',
      'docs/research/experiments/human-soft-label-audit/human-audit-answer-key.jsonl',
      '--out',
      'docs/research/experiments/human-soft-label-audit',
    ],
  },
  {
    id: 'human-soft-label-audit-evidence-gate',
    title: 'Human Soft-Label Audit Evidence Gate',
    command: [
      'npx',
      'tsx',
      'server/src/research/writeHumanAuditEvidenceGateCli.ts',
      '--root',
      'docs/research',
      '--out',
      'docs/research/submission/human-audit-evidence-gate',
    ],
  },
  {
    id: 'pilot-replication-report',
    title: 'Pilot Replication Report',
    command: [
      'npx',
      'tsx',
      'server/src/research/writePilotReplicationReportCli.ts',
      '--root',
      'docs/research',
      '--out',
      'docs/research/experiments/pilot-replication',
    ],
  },
  {
    id: 'second-provider-replication-package',
    title: 'Second-Provider Replication Package',
    command: [
      'npx',
      'tsx',
      'server/src/research/writeSecondProviderReplicationPackageCli.ts',
      '--root',
      'docs/research',
      '--out',
      'docs/research/experiments/pilot-replication',
    ],
  },
  {
    id: 'second-provider-replication-preflight',
    title: 'Second-Provider Replication Preflight',
    command: [
      'npx',
      'tsx',
      'server/src/research/writeSecondProviderReplicationPreflightCli.ts',
      '--root',
      'docs/research',
      '--out',
      'docs/research/experiments/pilot-replication',
      '--env-file',
      '.env',
    ],
  },
  {
    id: 'revision-comparison',
    title: 'Revision Comparison',
    command: ['npx', 'tsx', 'server/src/research/writeRevisionComparisonCli.ts', '--out', 'docs/research/experiments/pilot-revision-comparison'],
  },
  {
    id: 'tom-failure-analysis',
    title: 'ToM Failure Analysis',
    command: ['npx', 'tsx', 'server/src/research/writeLLMFailureAnalysisCli.ts', '--out', 'docs/research/experiments/pilot-e7-tom-failure-analysis'],
  },
  {
    id: 'tom-schema-repair',
    title: 'ToM Schema Repair',
    command: ['npx', 'tsx', 'server/src/research/runLLMSchemaRepairCli.ts', '--out', 'docs/research/experiments/pilot-e8-tom-schema-repair-results'],
  },
  {
    id: 'verifier-attribution',
    title: 'Paired Verifier Attribution',
    command: ['npx', 'tsx', 'server/src/research/writePairedVerifierAttributionCli.ts', '--out', 'docs/research/experiments/pilot-verifier-attribution'],
  },
  {
    id: 'ablation-summary',
    title: 'Ablation Summary',
    command: ['npx', 'tsx', 'server/src/research/writeAblationSummaryCli.ts', '--out', 'docs/research/experiments/pilot-ablation-summary'],
  },
  {
    id: 'figure-artifacts',
    title: 'Figure Artifacts',
    command: ['npx', 'tsx', 'server/src/research/writeFigureArtifactsCli.ts', '--out', 'docs/research/figures'],
  },
  {
    id: 'paper-tables',
    title: 'Paper Tables',
    command: ['npx', 'tsx', 'server/src/research/writePaperTableArtifactsCli.ts', '--out', 'docs/research/tables'],
  },
  {
    id: 'visual-evidence-report',
    title: 'Visual Evidence Report',
    command: ['npx', 'tsx', 'server/src/research/writeVisualEvidenceReportCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission/visual-evidence'],
  },
  {
    id: 'manuscript',
    title: 'Manuscript Assembly',
    command: ['npx', 'tsx', 'server/src/research/assembleManuscriptCli.ts'],
  },
  {
    id: 'claim-evidence-report',
    title: 'Claim-Evidence Report',
    command: ['npx', 'tsx', 'server/src/research/writeClaimEvidenceReportCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission/claim-evidence'],
  },
  {
    id: 'method-reproducibility-report',
    title: 'Method Reproducibility Report',
    command: ['npx', 'tsx', 'server/src/research/writeMethodReproducibilityReportCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission/method-reproducibility'],
  },
  {
    id: 'marker-inventory',
    title: 'Submission Marker Inventory',
    command: ['npx', 'tsx', 'server/src/research/writeSubmissionMarkerInventoryCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission/marker-inventory'],
  },
  {
    id: 'experiment-resolution-ledger',
    title: 'Experiment Resolution Ledger',
    command: ['npx', 'tsx', 'server/src/research/writeExperimentResolutionLedgerCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission/experiment-resolution-ledger'],
  },
  {
    id: 'submission-gate',
    title: 'Submission Gate',
    command: ['npx', 'tsx', 'server/src/research/writeSubmissionGateReportCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission/gate-report'],
  },
  {
    id: 'aamas-readiness',
    title: 'AAMAS Full-Paper Readiness',
    command: ['npx', 'tsx', 'server/src/research/writeAAMASReadinessReportCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission/aamas-readiness'],
  },
  {
    id: 'aamas-self-review',
    title: 'AAMAS Adversarial Self-Review',
    command: ['npx', 'tsx', 'server/src/research/writeAAMASSelfReviewReportCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission/aamas-self-review'],
  },
  {
    id: 'aamas-reviewer-response',
    title: 'AAMAS Reviewer-Response Matrix',
    command: ['npx', 'tsx', 'server/src/research/writeAAMASReviewerResponseMatrixCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission/aamas-reviewer-response'],
  },
  {
    id: 'preflight',
    title: 'Research Preflight',
    command: ['npx', 'tsx', 'server/src/research/writeResearchPreflightReportCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission/preflight'],
  },
  {
    id: 'provider-handoff-audit',
    title: 'Provider Handoff Audit',
    command: ['npx', 'tsx', 'server/src/research/writeProviderHandoffAuditCli.ts', '--out', 'docs/research/submission/provider-handoff-audit'],
  },
  {
    id: 'bibliography-integrity',
    title: 'Bibliography Integrity',
    command: ['npx', 'tsx', 'server/src/research/writeBibliographyIntegrityReportCli.ts', '--bib', 'docs/research/submission/references.bib', '--out', 'docs/research/submission/citation-integrity'],
  },
  {
    id: 'reproducibility-manifest',
    title: 'Reproducibility Manifest',
    command: ['npx', 'tsx', 'server/src/research/writeReproducibilityManifestCli.ts', '--root', 'docs/research', '--out', 'docs/research/submission'],
  },
]

export function runLocalResearchPipeline(options: LocalResearchPipelineOptions): LocalResearchPipelineResult {
  mkdirSync(options.reportDir, { recursive: true })
  const runner = options.runner ?? defaultRunner
  const steps: LocalResearchPipelineStepReport[] = []

  for (const step of localPipelineSteps) {
    const result = runner(step.command, options.cwd)
    steps.push({
      ...step,
      status: result.exitCode === 0 ? 'passed' : 'failed',
      exitCode: result.exitCode,
      stdout: trimOutput(result.stdout),
      stderr: trimOutput(result.stderr),
    })
    if (result.exitCode !== 0) break
  }

  const status: LocalResearchPipelineStatus = steps.every(step => step.status === 'passed')
    && steps.length === localPipelineSteps.length
    ? 'completed'
    : 'failed'
  const report: LocalResearchPipelineReport = {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    status,
    steps,
  }
  const jsonPath = join(options.reportDir, 'local-research-pipeline-report.json')
  const markdownPath = join(options.reportDir, 'local-research-pipeline-report.md')

  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderLocalResearchPipelineReport(report), 'utf8')

  return {
    ...report,
    jsonPath,
    markdownPath,
  }
}

export function renderLocalResearchPipelineReport(report: LocalResearchPipelineReport): string {
  const lines = [
    '# Local Research Pipeline Report',
    '',
    `Status: \`${report.status}\``,
    `Generated at: \`${report.generatedAt}\``,
    '',
    'This pipeline only regenerates local downstream artifacts. It does not call external model providers.',
    '',
    '| Step | Status | Exit |',
    '| --- | --- | ---: |',
    ...report.steps.map(step => `| ${escapeMarkdownCell(step.title)} | \`${step.status}\` | ${step.exitCode} |`),
    '',
    '## Step Logs',
    '',
    ...report.steps.flatMap(step => [
      `### ${step.title}`,
      '',
      `Command: \`${step.command.join(' ')}\``,
      '',
      'Stdout:',
      '',
      '```text',
      step.stdout,
      '```',
      '',
      'Stderr:',
      '',
      '```text',
      step.stderr,
      '```',
      '',
    ]),
  ]

  return lines.join('\n')
}

function defaultRunner(command: string[], cwd: string): LocalResearchPipelineCommandResult {
  const result = spawnSync(command[0], command.slice(1), {
    cwd,
    encoding: 'utf8',
  })

  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

function trimOutput(output: string): string {
  const maxLength = 6000
  if (output.length <= maxLength) return output.trim()
  return `${output.slice(0, maxLength).trim()}\n[truncated]`
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|')
}
