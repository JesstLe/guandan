# Local Research Pipeline Report

Status: `completed`
Generated at: `2026-06-18T10:24:28.082Z`

This pipeline only regenerates local downstream artifacts. It does not call external model providers.

| Step | Status | Exit |
| --- | --- | ---: |
| Pilot Metrics Summary | `passed` | 0 |
| Full Split Heuristic Verifier | `passed` | 0 |
| Full Split Strategic Heuristic | `passed` | 0 |
| Full Split Baseline Summary | `passed` | 0 |
| ToM Pilot Prompt Packets | `passed` | 0 |
| ToM Pilot Batch Files | `passed` | 0 |
| ToM Pilot OpenAI Batch | `passed` | 0 |
| ToM Pilot Raw Output Audit | `passed` | 0 |
| Plain Full Prompt Packets | `passed` | 0 |
| Plain Full Batch Files | `passed` | 0 |
| Plain Full OpenAI Batch | `passed` | 0 |
| Plain Full Raw Output Audit | `passed` | 0 |
| Candidate Full Prompt Packets | `passed` | 0 |
| Candidate Full Batch Files | `passed` | 0 |
| Candidate Full OpenAI Batch | `passed` | 0 |
| Candidate Full Raw Output Audit | `passed` | 0 |
| ToM Full Prompt Packets | `passed` | 0 |
| ToM Full Batch Files | `passed` | 0 |
| ToM Full OpenAI Batch | `passed` | 0 |
| ToM Full Raw Output Audit | `passed` | 0 |
| ToM Full Optional Post-Provider Ingest | `passed` | 0 |
| ToM Full Schema Repair | `passed` | 0 |
| Full Split LLM Summary | `passed` | 0 |
| Revision Comparison | `passed` | 0 |
| ToM Failure Analysis | `passed` | 0 |
| ToM Schema Repair | `passed` | 0 |
| Paired Verifier Attribution | `passed` | 0 |
| Ablation Summary | `passed` | 0 |
| Figure Artifacts | `passed` | 0 |
| Paper Tables | `passed` | 0 |
| Manuscript Assembly | `passed` | 0 |
| Submission Marker Inventory | `passed` | 0 |
| Experiment Resolution Ledger | `passed` | 0 |
| Submission Gate | `passed` | 0 |
| Research Preflight | `passed` | 0 |
| AAMAS Full-Paper Readiness | `passed` | 0 |
| Provider Handoff Audit | `passed` | 0 |
| Bibliography Integrity | `passed` | 0 |
| Reproducibility Manifest | `passed` | 0 |

## Step Logs

### Pilot Metrics Summary

Command: `npx tsx server/src/research/writePilotMetricsSummaryCli.ts --out docs/research/experiments/pilot-metrics-summary`

Stdout:

```text
{
  "jsonPath": "docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json",
  "markdownPath": "docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.md",
  "rowCount": 6
}
```

Stderr:

```text

```

### Full Split Heuristic Verifier

Command: `npx tsx server/src/research/runPilotVerifierCli.ts --input docs/research/experiments/full-e1/decisions --out docs/research/experiments/full-e2-heuristic-verifier --agent heuristic-legal-first`

Stdout:

```text
{
  "metricsPath": "docs/research/experiments/full-e2-heuristic-verifier/metrics.json",
  "resultCount": 500,
  "hardFailureCount": 0
}
```

Stderr:

```text

```

### Full Split Strategic Heuristic

Command: `npx tsx server/src/research/runPilotVerifierCli.ts --input docs/research/experiments/full-e1/decisions --out docs/research/experiments/full-e3-strategic-heuristic --agent strategic-heuristic`

Stdout:

```text
{
  "metricsPath": "docs/research/experiments/full-e3-strategic-heuristic/metrics.json",
  "resultCount": 500,
  "hardFailureCount": 0
}
```

Stderr:

```text

```

### Full Split Baseline Summary

Command: `npx tsx server/src/research/writePilotMetricsSummaryCli.ts --no-defaults --out docs/research/experiments/full-baseline-summary --basename full-baseline-summary --title Full Split Baseline Summary --description This table is generated from 500-decision full-split deterministic baseline artifacts. These rows validate the full split, trace schema, and verifier plumbing; they are not LLM model results. --source agentId=heuristic-legal-first-full,metricsPath=docs/research/experiments/full-e2-heuristic-verifier/metrics.json,notes=500-decision deterministic pipeline validation baseline --source agentId=strategic-heuristic-full,metricsPath=docs/research/experiments/full-e3-strategic-heuristic/metrics.json,notes=500-decision deterministic strategic baseline`

Stdout:

```text
{
  "jsonPath": "docs/research/experiments/full-baseline-summary/full-baseline-summary.json",
  "markdownPath": "docs/research/experiments/full-baseline-summary/full-baseline-summary.md",
  "rowCount": 2
}
```

Stderr:

```text

```

### ToM Pilot Prompt Packets

Command: `npx tsx server/src/research/exportLLMPromptPacketsCli.ts --input docs/research/experiments/pilot-e1/decisions --out docs/research/experiments/pilot-e7-tom-prompted-prompts --condition tom-prompted-llm`

Stdout:

```text
{
  "manifestPath": "docs/research/experiments/pilot-e7-tom-prompted-prompts/manifest.json",
  "packetCount": 50,
  "conditionId": "tom-prompted-llm"
}
```

Stderr:

```text

```

### ToM Pilot Batch Files

Command: `npx tsx server/src/research/exportLLMBatchFilesCli.ts --packets docs/research/experiments/pilot-e7-tom-prompted-prompts/packets --out docs/research/experiments/pilot-e7-tom-prompted-batch`

Stdout:

```text
{
  "batchJsonlPath": "docs/research/experiments/pilot-e7-tom-prompted-batch/batch-input.jsonl",
  "manifestPath": "docs/research/experiments/pilot-e7-tom-prompted-batch/batch-manifest.json",
  "rawOutputDir": "docs/research/experiments/pilot-e7-tom-prompted-batch/raw",
  "packetCount": 50
}
```

Stderr:

```text

```

### ToM Pilot OpenAI Batch

Command: `npx tsx server/src/research/exportOpenAIBatchCli.ts --source docs/research/experiments/pilot-e7-tom-prompted-batch/batch-input.jsonl --out docs/research/experiments/pilot-e7-tom-prompted-batch/openai --model gpt-4.1-mini --temperature 0 --max-completion-tokens 1200`

Stdout:

```text
{
  "openAIJsonlPath": "docs/research/experiments/pilot-e7-tom-prompted-batch/openai/openai-batch-input.jsonl",
  "manifestPath": "docs/research/experiments/pilot-e7-tom-prompted-batch/openai/openai-batch-manifest.json",
  "requestCount": 50
}
```

Stderr:

```text

```

### ToM Pilot Raw Output Audit

Command: `npx tsx server/src/research/auditLLMRawOutputsCli.ts --packets docs/research/experiments/pilot-e7-tom-prompted-prompts/packets --raw docs/research/experiments/pilot-e7-tom-prompted-batch/raw --out docs/research/experiments/pilot-e7-tom-prompted-batch/raw-output-audit.json`

Stdout:

```text
{
  "outputPath": "docs/research/experiments/pilot-e7-tom-prompted-batch/raw-output-audit.json",
  "expectedCount": 50,
  "presentCount": 50,
  "missingCount": 0,
  "emptyCount": 0,
  "unexpectedCount": 0,
  "readyForIngest": true
}
```

Stderr:

```text

```

### Plain Full Prompt Packets

Command: `npx tsx server/src/research/exportLLMPromptPacketsCli.ts --input docs/research/experiments/full-e1/decisions --out docs/research/experiments/full-e2-plain-llm-prompts --condition plain-llm`

Stdout:

```text
{
  "manifestPath": "docs/research/experiments/full-e2-plain-llm-prompts/manifest.json",
  "packetCount": 500,
  "conditionId": "plain-llm"
}
```

Stderr:

```text

```

### Plain Full Batch Files

Command: `npx tsx server/src/research/exportLLMBatchFilesCli.ts --packets docs/research/experiments/full-e2-plain-llm-prompts/packets --out docs/research/experiments/full-e2-plain-llm-batch`

Stdout:

```text
{
  "batchJsonlPath": "docs/research/experiments/full-e2-plain-llm-batch/batch-input.jsonl",
  "manifestPath": "docs/research/experiments/full-e2-plain-llm-batch/batch-manifest.json",
  "rawOutputDir": "docs/research/experiments/full-e2-plain-llm-batch/raw",
  "packetCount": 500
}
```

Stderr:

```text

```

### Plain Full OpenAI Batch

Command: `npx tsx server/src/research/exportOpenAIBatchCli.ts --source docs/research/experiments/full-e2-plain-llm-batch/batch-input.jsonl --out docs/research/experiments/full-e2-plain-llm-batch/openai --model gpt-4.1-mini --temperature 0 --max-completion-tokens 1200`

Stdout:

```text
{
  "openAIJsonlPath": "docs/research/experiments/full-e2-plain-llm-batch/openai/openai-batch-input.jsonl",
  "manifestPath": "docs/research/experiments/full-e2-plain-llm-batch/openai/openai-batch-manifest.json",
  "requestCount": 500
}
```

Stderr:

```text

```

### Plain Full Raw Output Audit

Command: `npx tsx server/src/research/auditLLMRawOutputsCli.ts --packets docs/research/experiments/full-e2-plain-llm-prompts/packets --raw docs/research/experiments/full-e2-plain-llm-batch/raw --out docs/research/experiments/full-e2-plain-llm-batch/raw-output-audit.json`

Stdout:

```text
{
  "outputPath": "docs/research/experiments/full-e2-plain-llm-batch/raw-output-audit.json",
  "expectedCount": 500,
  "presentCount": 0,
  "missingCount": 500,
  "emptyCount": 0,
  "unexpectedCount": 0,
  "readyForIngest": false
}
```

Stderr:

```text

```

### Candidate Full Prompt Packets

Command: `npx tsx server/src/research/exportLLMPromptPacketsCli.ts --input docs/research/experiments/full-e1/decisions --out docs/research/experiments/full-e3-candidate-constrained-prompts --condition candidate-constrained-llm`

Stdout:

```text
{
  "manifestPath": "docs/research/experiments/full-e3-candidate-constrained-prompts/manifest.json",
  "packetCount": 500,
  "conditionId": "candidate-constrained-llm"
}
```

Stderr:

```text

```

### Candidate Full Batch Files

Command: `npx tsx server/src/research/exportLLMBatchFilesCli.ts --packets docs/research/experiments/full-e3-candidate-constrained-prompts/packets --out docs/research/experiments/full-e3-candidate-constrained-batch`

Stdout:

```text
{
  "batchJsonlPath": "docs/research/experiments/full-e3-candidate-constrained-batch/batch-input.jsonl",
  "manifestPath": "docs/research/experiments/full-e3-candidate-constrained-batch/batch-manifest.json",
  "rawOutputDir": "docs/research/experiments/full-e3-candidate-constrained-batch/raw",
  "packetCount": 500
}
```

Stderr:

```text

```

### Candidate Full OpenAI Batch

Command: `npx tsx server/src/research/exportOpenAIBatchCli.ts --source docs/research/experiments/full-e3-candidate-constrained-batch/batch-input.jsonl --out docs/research/experiments/full-e3-candidate-constrained-batch/openai --model gpt-4.1-mini --temperature 0 --max-completion-tokens 1200`

Stdout:

```text
{
  "openAIJsonlPath": "docs/research/experiments/full-e3-candidate-constrained-batch/openai/openai-batch-input.jsonl",
  "manifestPath": "docs/research/experiments/full-e3-candidate-constrained-batch/openai/openai-batch-manifest.json",
  "requestCount": 500
}
```

Stderr:

```text

```

### Candidate Full Raw Output Audit

Command: `npx tsx server/src/research/auditLLMRawOutputsCli.ts --packets docs/research/experiments/full-e3-candidate-constrained-prompts/packets --raw docs/research/experiments/full-e3-candidate-constrained-batch/raw --out docs/research/experiments/full-e3-candidate-constrained-batch/raw-output-audit.json`

Stdout:

```text
{
  "outputPath": "docs/research/experiments/full-e3-candidate-constrained-batch/raw-output-audit.json",
  "expectedCount": 500,
  "presentCount": 0,
  "missingCount": 500,
  "emptyCount": 0,
  "unexpectedCount": 0,
  "readyForIngest": false
}
```

Stderr:

```text

```

### ToM Full Prompt Packets

Command: `npx tsx server/src/research/exportLLMPromptPacketsCli.ts --input docs/research/experiments/full-e1/decisions --out docs/research/experiments/full-e4-tom-prompted-prompts --condition tom-prompted-llm`

Stdout:

```text
{
  "manifestPath": "docs/research/experiments/full-e4-tom-prompted-prompts/manifest.json",
  "packetCount": 500,
  "conditionId": "tom-prompted-llm"
}
```

Stderr:

```text

```

### ToM Full Batch Files

Command: `npx tsx server/src/research/exportLLMBatchFilesCli.ts --packets docs/research/experiments/full-e4-tom-prompted-prompts/packets --out docs/research/experiments/full-e4-tom-prompted-batch`

Stdout:

```text
{
  "batchJsonlPath": "docs/research/experiments/full-e4-tom-prompted-batch/batch-input.jsonl",
  "manifestPath": "docs/research/experiments/full-e4-tom-prompted-batch/batch-manifest.json",
  "rawOutputDir": "docs/research/experiments/full-e4-tom-prompted-batch/raw",
  "packetCount": 500
}
```

Stderr:

```text

```

### ToM Full OpenAI Batch

Command: `npx tsx server/src/research/exportOpenAIBatchCli.ts --source docs/research/experiments/full-e4-tom-prompted-batch/batch-input.jsonl --out docs/research/experiments/full-e4-tom-prompted-batch/openai --model gpt-4.1-mini --temperature 0 --max-completion-tokens 1200`

Stdout:

```text
{
  "openAIJsonlPath": "docs/research/experiments/full-e4-tom-prompted-batch/openai/openai-batch-input.jsonl",
  "manifestPath": "docs/research/experiments/full-e4-tom-prompted-batch/openai/openai-batch-manifest.json",
  "requestCount": 500
}
```

Stderr:

```text

```

### ToM Full Raw Output Audit

Command: `npx tsx server/src/research/auditLLMRawOutputsCli.ts --packets docs/research/experiments/full-e4-tom-prompted-prompts/packets --raw docs/research/experiments/full-e4-tom-prompted-batch/raw --out docs/research/experiments/full-e4-tom-prompted-batch/raw-output-audit.json`

Stdout:

```text
{
  "outputPath": "docs/research/experiments/full-e4-tom-prompted-batch/raw-output-audit.json",
  "expectedCount": 500,
  "presentCount": 268,
  "missingCount": 232,
  "emptyCount": 0,
  "unexpectedCount": 0,
  "readyForIngest": false
}
```

Stderr:

```text

```

### ToM Full Optional Post-Provider Ingest

Command: `npx tsx server/src/research/runOptionalPostProviderConditionCli.ts --decisions docs/research/experiments/full-e1/decisions --packets docs/research/experiments/full-e4-tom-prompted-prompts/packets --batch-jsonl docs/research/experiments/full-e4-tom-prompted-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/full-tom-prompted-llm.jsonl --raw docs/research/experiments/full-e4-tom-prompted-batch/raw --out docs/research/experiments/full-e4-tom-prompted-results --condition tom-prompted-llm --model-provider kimi-cli --model-name kimi-code/kimi-for-coding --temperature 0 --notes 500-decision full-split ToM run; optional step skips until provider JSONL exists.`

Stdout:

```text
{
  "status": "not_ready_for_ingest",
  "conditionId": "tom-prompted-llm",
  "reportPath": "docs/research/experiments/full-e4-tom-prompted-results/post-provider-report.json",
  "metricsPath": null,
  "blockerCount": 2,
  "blockers": [
    "Provider-result materialization is not ready for audit.",
    "Raw-output audit is not ready for ingest."
  ]
}
```

Stderr:

```text

```

### ToM Full Schema Repair

Command: `npx tsx server/src/research/runLLMSchemaRepairCli.ts --decisions docs/research/experiments/full-e1/decisions --raw docs/research/experiments/full-e4-tom-prompted-batch/raw --out docs/research/experiments/full-e5-tom-schema-repair-results --agent tom-schema-repair-full`

Stdout:

```text
{
  "metricsPath": "docs/research/experiments/full-e5-tom-schema-repair-results/metrics.json",
  "repairReportPath": "docs/research/experiments/full-e5-tom-schema-repair-results/schema-repair-report.json",
  "markdownPath": "docs/research/experiments/full-e5-tom-schema-repair-results/schema-repair-report.md",
  "repaired": 56,
  "passThrough": 212,
  "notRepairable": 232
}
```

Stderr:

```text

```

### Full Split LLM Summary

Command: `npx tsx server/src/research/writePilotMetricsSummaryCli.ts --no-defaults --out docs/research/experiments/full-llm-summary --basename full-llm-summary --title Full Split LLM Summary --description This table is generated from 500-decision full-split LLM artifacts when provider results are present; otherwise it records raw-output readiness. --source agentId=tom-prompted-llm-full,metricsPath=docs/research/experiments/full-e4-tom-prompted-results/metrics.json,rawAuditPath=docs/research/experiments/full-e4-tom-prompted-batch/raw-output-audit.json,notes=500-decision Kimi Code CLI ToM-prompted full split --source agentId=tom-schema-repair-full,metricsPath=docs/research/experiments/full-e5-tom-schema-repair-results/metrics.json,notes=deterministic schema repair over available full-split ToM raw outputs`

Stdout:

```text
{
  "jsonPath": "docs/research/experiments/full-llm-summary/full-llm-summary.json",
  "markdownPath": "docs/research/experiments/full-llm-summary/full-llm-summary.md",
  "rowCount": 2
}
```

Stderr:

```text

```

### Revision Comparison

Command: `npx tsx server/src/research/writeRevisionComparisonCli.ts --out docs/research/experiments/pilot-revision-comparison`

Stdout:

```text
{
  "jsonPath": "docs/research/experiments/pilot-revision-comparison/revision-comparison.json",
  "markdownPath": "docs/research/experiments/pilot-revision-comparison/revision-comparison.md",
  "status": "metrics_available"
}
```

Stderr:

```text

```

### ToM Failure Analysis

Command: `npx tsx server/src/research/writeLLMFailureAnalysisCli.ts --out docs/research/experiments/pilot-e7-tom-failure-analysis`

Stdout:

```text
{
  "jsonPath": "docs/research/experiments/pilot-e7-tom-failure-analysis/tom-failure-analysis.json",
  "markdownPath": "docs/research/experiments/pilot-e7-tom-failure-analysis/tom-failure-analysis.md",
  "conditionId": "tom-prompted-llm",
  "parseFailures": 14,
  "hardFailures": 1
}
```

Stderr:

```text

```

### ToM Schema Repair

Command: `npx tsx server/src/research/runLLMSchemaRepairCli.ts --out docs/research/experiments/pilot-e8-tom-schema-repair-results`

Stdout:

```text
{
  "metricsPath": "docs/research/experiments/pilot-e8-tom-schema-repair-results/metrics.json",
  "repairReportPath": "docs/research/experiments/pilot-e8-tom-schema-repair-results/schema-repair-report.json",
  "markdownPath": "docs/research/experiments/pilot-e8-tom-schema-repair-results/schema-repair-report.md",
  "repaired": 13,
  "passThrough": 36,
  "notRepairable": 1
}
```

Stderr:

```text

```

### Paired Verifier Attribution

Command: `npx tsx server/src/research/writePairedVerifierAttributionCli.ts --out docs/research/experiments/pilot-verifier-attribution`

Stdout:

```text
{
  "jsonPath": "docs/research/experiments/pilot-verifier-attribution/verifier-attribution.json",
  "markdownPath": "docs/research/experiments/pilot-verifier-attribution/verifier-attribution.md",
  "status": "metrics_available",
  "pairedDecisionCount": 32,
  "excludedParseFailureCount": 18
}
```

Stderr:

```text

```

### Ablation Summary

Command: `npx tsx server/src/research/writeAblationSummaryCli.ts --out docs/research/experiments/pilot-ablation-summary`

Stdout:

```text
{
  "jsonPath": "docs/research/experiments/pilot-ablation-summary/ablation-summary.json",
  "markdownPath": "docs/research/experiments/pilot-ablation-summary/ablation-summary.md",
  "status": "missing_metrics",
  "rowCount": 5
}
```

Stderr:

```text

```

### Figure Artifacts

Command: `npx tsx server/src/research/writeFigureArtifactsCli.ts --out docs/research/figures`

Stdout:

```text
{
  "svgPath": "docs/research/figures/figure-2-tom-schema-repair-flow.svg",
  "markdownPath": "docs/research/figures/figure-2-tom-schema-repair-flow.md",
  "totalOutputs": 50,
  "rawParsed": 36,
  "repaired": 13,
  "finalParsed": 49,
  "hardFailures": 1
}
```

Stderr:

```text

```

### Paper Tables

Command: `npx tsx server/src/research/writePaperTableArtifactsCli.ts --out docs/research/tables`

Stdout:

```text
{
  "tableZeroPath": "docs/research/tables/table-0-related-work-positioning.md",
  "tableOnePath": "docs/research/tables/table-1-reasoning-reliability.md",
  "tableTwoPath": "docs/research/tables/table-2-verifier-revision-effect.md",
  "tableThreePath": "docs/research/tables/table-3-verifier-ablation.md"
}
```

Stderr:

```text

```

### Manuscript Assembly

Command: `npx tsx server/src/research/assembleManuscriptCli.ts`

Stdout:

```text
{
  "manuscriptPath": "docs/research/submission/manuscript/manuscript-draft.md",
  "statusPath": "docs/research/submission/manuscript/manuscript-status.json",
  "wordCount": 3724,
  "readyForSubmission": true,
  "markerCounts": {
    "NEED_SOURCE": 0,
    "UNCERTAIN": 0,
    "NEED_EXPERIMENT": 0,
    "DO_NOT_SUBMIT": 0,
    "AUTHOR_DECISION": 0
  }
}
```

Stderr:

```text

```

### Submission Marker Inventory

Command: `npx tsx server/src/research/writeSubmissionMarkerInventoryCli.ts --root docs/research --out docs/research/submission/marker-inventory`

Stdout:

```text
{
  "jsonPath": "docs/research/submission/marker-inventory/submission-marker-inventory.json",
  "markdownPath": "docs/research/submission/marker-inventory/submission-marker-inventory.md",
  "markerScope": "submission_relevant_files",
  "counts": {
    "NEED_SOURCE": 0,
    "UNCERTAIN": 0,
    "NEED_EXPERIMENT": 0,
    "DO_NOT_SUBMIT": 0,
    "AUTHOR_DECISION": 0
  },
  "itemCount": 0
}
```

Stderr:

```text

```

### Experiment Resolution Ledger

Command: `npx tsx server/src/research/writeExperimentResolutionLedgerCli.ts --root docs/research --out docs/research/submission/experiment-resolution-ledger`

Stdout:

```text
{
  "jsonPath": "docs/research/submission/experiment-resolution-ledger/experiment-resolution-ledger.json",
  "markdownPath": "docs/research/submission/experiment-resolution-ledger/experiment-resolution-ledger.md",
  "totalItems": 0,
  "byStatus": {
    "missing_evidence": 0,
    "evidence_available_marker_still_present": 0
  },
  "byEvidenceFamily": {
    "first_pass_llm": 0,
    "verifier_revision": 0,
    "full_dataset": 0,
    "ablation": 0,
    "case_study": 0,
    "generalization": 0
  }
}
```

Stderr:

```text

```

### Submission Gate

Command: `npx tsx server/src/research/writeSubmissionGateReportCli.ts --root docs/research --out docs/research/submission/gate-report`

Stdout:

```text
{
  "jsonPath": "docs/research/submission/gate-report/submission-gate-report.json",
  "markdownPath": "docs/research/submission/gate-report/submission-gate-report.md",
  "overallStatus": "ready",
  "blockerCount": 0
}
```

Stderr:

```text

```

### Research Preflight

Command: `npx tsx server/src/research/writeResearchPreflightReportCli.ts --root docs/research --out docs/research/submission/preflight`

Stdout:

```text
{
  "jsonPath": "docs/research/submission/preflight/research-preflight-report.json",
  "markdownPath": "docs/research/submission/preflight/research-preflight-report.md",
  "status": "ready_for_submission",
  "externalBlockers": 0,
  "localBlockers": 0
}
```

Stderr:

```text

```

### AAMAS Full-Paper Readiness

Command: `npx tsx server/src/research/writeAAMASReadinessReportCli.ts --root docs/research --out docs/research/submission/aamas-readiness`

Stdout:

```text
{
  "jsonPath": "docs/research/submission/aamas-readiness/aamas-readiness-report.json",
  "markdownPath": "docs/research/submission/aamas-readiness/aamas-readiness-report.md",
  "localSubmissionHygiene": "not_ready",
  "aamasFullPaperReadiness": "not_ready",
  "gates": 7,
  "needsExperiment": 2,
  "needsRevision": 1
}
```

Stderr:

```text

```

### Provider Handoff Audit

Command: `npx tsx server/src/research/writeProviderHandoffAuditCli.ts --out docs/research/submission/provider-handoff-audit`

Stdout:

```text
{
  "jsonPath": "docs/research/submission/provider-handoff-audit/provider-handoff-audit.json",
  "markdownPath": "docs/research/submission/provider-handoff-audit/provider-handoff-audit.md",
  "status": "ready",
  "conditionCount": 4,
  "issueCount": 1
}
```

Stderr:

```text

```

### Bibliography Integrity

Command: `npx tsx server/src/research/writeBibliographyIntegrityReportCli.ts --bib docs/research/submission/references.bib --out docs/research/submission/citation-integrity`

Stdout:

```text
{
  "jsonPath": "docs/research/submission/citation-integrity/bibliography-integrity-report.json",
  "markdownPath": "docs/research/submission/citation-integrity/bibliography-integrity-report.md",
  "ready": true,
  "entryCount": 14,
  "issueCount": 0
}
```

Stderr:

```text

```

### Reproducibility Manifest

Command: `npx tsx server/src/research/writeReproducibilityManifestCli.ts --root docs/research --out docs/research/submission`

Stdout:

```text
{
  "jsonPath": "docs/research/submission/reproducibility-manifest.json",
  "markdownPath": "docs/research/submission/reproducibility-manifest.md",
  "entries": 80,
  "missing": 1
}
```

Stderr:

```text

```
