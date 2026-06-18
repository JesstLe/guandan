# Local Research Pipeline Report

Status: `completed`
Generated at: `2026-06-18T00:49:22.943Z`

This pipeline only regenerates local downstream artifacts. It does not call external model providers.

| Step | Status | Exit |
| --- | --- | ---: |
| Pilot Metrics Summary | `passed` | 0 |
| Revision Comparison | `passed` | 0 |
| Ablation Summary | `passed` | 0 |
| Paper Tables | `passed` | 0 |
| Manuscript Assembly | `passed` | 0 |
| Submission Marker Inventory | `passed` | 0 |
| Experiment Resolution Ledger | `passed` | 0 |
| Submission Gate | `passed` | 0 |
| Research Preflight | `passed` | 0 |
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
  "rowCount": 5
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
  "status": "missing_raw_outputs"
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
  "wordCount": 2825,
  "readyForSubmission": false,
  "markerCounts": {
    "NEED_SOURCE": 0,
    "UNCERTAIN": 0,
    "NEED_EXPERIMENT": 8,
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
    "NEED_EXPERIMENT": 25,
    "DO_NOT_SUBMIT": 0,
    "AUTHOR_DECISION": 0
  },
  "itemCount": 25
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
  "totalItems": 8,
  "byStatus": {
    "missing_evidence": 8,
    "evidence_available_marker_still_present": 0
  },
  "byEvidenceFamily": {
    "first_pass_llm": 7,
    "verifier_revision": 6,
    "full_dataset": 0,
    "ablation": 2,
    "case_study": 2,
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
  "overallStatus": "not_ready",
  "blockerCount": 5
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
  "status": "waiting_for_provider_results",
  "externalBlockers": 4,
  "localBlockers": 1
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
  "conditionCount": 3,
  "issueCount": 3
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
  "entries": 43,
  "missing": 3
}
```

Stderr:

```text

```
