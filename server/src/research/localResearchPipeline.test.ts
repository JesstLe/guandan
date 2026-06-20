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
        'full-heuristic-verifier',
        'full-strategic-heuristic',
        'full-baseline-summary',
        'tom-pilot-prompts',
        'tom-pilot-batch',
        'tom-pilot-openai-batch',
        'tom-pilot-raw-audit',
        'plain-full-prompts',
        'plain-full-batch',
        'plain-full-openai-batch',
        'plain-full-post-provider',
        'plain-full-raw-audit',
        'candidate-full-prompts',
        'candidate-full-batch',
        'candidate-full-openai-batch',
        'candidate-full-post-provider',
        'candidate-full-raw-audit',
        'tom-full-prompts',
        'tom-full-batch',
        'tom-full-openai-batch',
        'tom-full-post-provider',
        'tom-full-raw-audit',
        'tom-full-schema-repair',
        'full-llm-summary',
        'human-soft-label-audit-packet',
        'human-soft-label-audit-annotator',
        'human-soft-label-audit-packet-quality',
        'human-soft-label-audit-annotator-package',
        'human-soft-label-audit-annotator-package-archive',
        'human-soft-label-audit-inter-annotator',
        'human-soft-label-audit-adjudication-template',
        'human-soft-label-audit-build-adjudicated',
        'human-soft-label-audit-intake',
        'human-soft-label-audit-agreement',
        'human-soft-label-audit-evidence-gate',
        'pilot-replication-report',
        'second-provider-replication-package',
        'second-provider-replication-preflight',
        'revision-comparison',
        'tom-failure-analysis',
        'tom-schema-repair',
        'verifier-attribution',
        'ablation-summary',
        'figure-artifacts',
        'paper-tables',
        'visual-evidence-report',
        'manuscript',
        'claim-evidence-report',
        'method-reproducibility-report',
        'marker-inventory',
        'experiment-resolution-ledger',
        'submission-gate',
        'aamas-readiness',
        'aamas-self-review',
        'aamas-reviewer-response',
        'preflight',
        'provider-handoff-audit',
        'bibliography-integrity',
        'reproducibility-manifest',
      ])
      expect(calls[0]).toContain('writePilotMetricsSummaryCli.ts')
      expect(calls[2]).toContain('runPilotVerifierCli.ts')
      expect(calls.some(call => call.includes('tom-prompted-llm'))).toBe(true)
      expect(calls.some(call => call.includes('full-e2-plain-llm-prompts'))).toBe(true)
      expect(calls.some(call => call.includes('full-e3-candidate-constrained-prompts'))).toBe(true)
      expect(calls.some(call => call.includes('writeLLMFailureAnalysisCli.ts'))).toBe(true)
      expect(calls.some(call => call.includes('runLLMSchemaRepairCli.ts'))).toBe(true)
      expect(calls.some(call => call.includes('writePairedVerifierAttributionCli.ts'))).toBe(true)
      expect(calls.some(call => call.includes('runOptionalPostProviderConditionCli.ts'))).toBe(true)
      expect(calls.some(call => call.includes('full-llm-summary'))).toBe(true)
      expect(calls.some(call => call.includes('writeHumanAuditPacketCli.ts'))).toBe(true)
      expect(calls.some(call => call.includes('writeHumanAuditAnnotatorCli.ts'))).toBe(true)
      expect(calls.some(call => call.includes('writeHumanAuditPacketQualityCli.ts'))).toBe(true)
      expect(calls.some(call => call.includes('writeHumanAuditAnnotatorPackageCli.ts'))).toBe(true)
      expect(calls.some(call => call.includes('writeHumanAuditAnnotatorPackageArchiveCli.ts'))).toBe(true)
      expect(calls.some(call => call.includes('writeHumanAuditIntakeCli.ts'))).toBe(true)
      expect(calls.some(call => call.includes('writeHumanAuditInterAnnotatorAgreementCli.ts'))).toBe(true)
      expect(calls.some(call => call.includes('writeHumanAuditAdjudicationTemplateCli.ts'))).toBe(true)
      expect(calls.some(call => call.includes('writeHumanAuditAdjudicatedAnnotationsCli.ts'))).toBe(true)
      expect(calls.some(call => call.includes('writeHumanAuditAgreementCli.ts'))).toBe(true)
      expect(calls.some(call => call.includes('writePilotReplicationReportCli.ts'))).toBe(true)
      expect(calls.some(call => call.includes('writeSecondProviderReplicationPackageCli.ts'))).toBe(true)
      expect(calls.some(call => call.includes('writeSecondProviderReplicationPreflightCli.ts'))).toBe(true)
      expect(calls.some(call => call.includes('writeVisualEvidenceReportCli.ts'))).toBe(true)
      expect(calls.some(call => call.includes('writeClaimEvidenceReportCli.ts'))).toBe(true)
      expect(calls.some(call => call.includes('writeMethodReproducibilityReportCli.ts'))).toBe(true)
      const humanAuditAgreementCall = calls.find(call => call.includes('writeHumanAuditAgreementCli.ts'))
      expect(humanAuditAgreementCall).not.toContain('human-audit-annotation-sheet.csv')
      expect(humanAuditAgreementCall).toContain('human-audit-adjudicated-annotations.csv')
      expect(calls.some(call => call.includes('writeFigureArtifactsCli.ts'))).toBe(true)
      expect(calls.some(call => call.includes('writeAAMASReadinessReportCli.ts'))).toBe(true)
      expect(calls.some(call => call.includes('writeAAMASReviewerResponseMatrixCli.ts'))).toBe(true)
      expect(calls.at(-1)).toContain('writeReproducibilityManifestCli.ts')

      const report = JSON.parse(readFileSync(result.jsonPath, 'utf8'))
      expect(report.status).toBe('completed')
      expect(report.steps.every((step: { status: string }) => step.status === 'passed')).toBe(true)

      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('# Local Research Pipeline Report')
      expect(markdown).toContain('| Pilot Metrics Summary | `passed` |')
      expect(markdown).toContain('| Full Split Baseline Summary | `passed` |')
      expect(markdown).toContain('| ToM Pilot Prompt Packets | `passed` |')
      expect(markdown).toContain('| Plain Full OpenAI Batch | `passed` |')
      expect(markdown).toContain('| Plain Full Optional Post-Provider Ingest | `passed` |')
      expect(markdown).toContain('| Candidate Full OpenAI Batch | `passed` |')
      expect(markdown).toContain('| Candidate Full Optional Post-Provider Ingest | `passed` |')
      expect(markdown).toContain('| ToM Full Optional Post-Provider Ingest | `passed` |')
      expect(markdown).toContain('| ToM Full Schema Repair | `passed` |')
      expect(markdown).toContain('| Full Split LLM Summary | `passed` |')
      expect(markdown).toContain('| Human Soft-Label Audit Packet | `passed` |')
      expect(markdown).toContain('| Human Soft-Label Audit Annotator | `passed` |')
      expect(markdown).toContain('| Human Soft-Label Audit Packet Quality | `passed` |')
      expect(markdown).toContain('| Human Soft-Label Audit Annotator Package | `passed` |')
      expect(markdown).toContain('| Human Soft-Label Audit Annotator Package Archive | `passed` |')
      expect(markdown).toContain('| Human Soft-Label Audit Inter-Annotator Agreement | `passed` |')
      expect(markdown).toContain('| Human Soft-Label Audit Adjudication Template | `passed` |')
      expect(markdown).toContain('| Human Soft-Label Audit Build Adjudicated CSV | `passed` |')
      expect(markdown).toContain('| Human Soft-Label Audit Adjudicated-Annotation Intake | `passed` |')
      expect(markdown).toContain('| Human Soft-Label Audit Agreement | `passed` |')
      expect(markdown).toContain('| Pilot Replication Report | `passed` |')
      expect(markdown).toContain('| Second-Provider Replication Package | `passed` |')
      expect(markdown).toContain('| Second-Provider Replication Preflight | `passed` |')
      expect(markdown).toContain('| AAMAS Reviewer-Response Matrix | `passed` |')
      expect(markdown).toContain('| ToM Failure Analysis | `passed` |')
      expect(markdown).toContain('| ToM Schema Repair | `passed` |')
      expect(markdown).toContain('| Figure Artifacts | `passed` |')
      expect(markdown).toContain('| Visual Evidence Report | `passed` |')
      expect(markdown).toContain('| Claim-Evidence Report | `passed` |')
      expect(markdown).toContain('| Method Reproducibility Report | `passed` |')
      expect(markdown).toContain('| AAMAS Full-Paper Readiness | `passed` |')
      expect(markdown).toContain('| AAMAS Adversarial Self-Review | `passed` |')
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
      expect(result.steps.at(-1)?.id).toBe('revision-comparison')
      expect(result.steps.at(-1)?.status).toBe('failed')
      expect(result.steps.slice(0, -1).every(step => step.status === 'passed')).toBe(true)
      expect(calls.at(-1)).toContain('writeRevisionComparisonCli.ts')
      expect(readFileSync(result.markdownPath, 'utf8')).toContain('revision failed')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
