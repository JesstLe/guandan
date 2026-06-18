# Experiment Resolution Ledger

Generated at: `2026-06-18T00:49:21.022Z`

Scope: blocking `[NEED_EXPERIMENT]` markers in submission-relevant files.

This ledger maps manuscript blockers to evidence artifacts. It does not convert planned experiments into results.

## Counts

| Status | Count |
| --- | ---: |
| missing_evidence | 8 |
| evidence_available_marker_still_present | 0 |

| Evidence family | Marker count |
| --- | ---: |
| first_pass_llm | 7 |
| verifier_revision | 6 |
| full_dataset | 0 |
| ablation | 2 |
| case_study | 2 |
| generalization | 0 |

## Blocking Markers

| ID | Status | Families | File | Line | Missing artifacts | Excerpt |
| --- | --- | --- | --- | ---: | --- | --- |
| need-exp-001 | `missing_evidence` | `first_pass_llm`, `verifier_revision` | `submission/manuscript/manuscript-draft.md` | 7 | `experiments/provider-results/plain-llm.jsonl`<br>`experiments/provider-results/candidate-constrained-llm.jsonl`<br>`experiments/pilot-e4-plain-llm-results/metrics.json`<br>`experiments/pilot-e5-candidate-constrained-results/metrics.json`<br>`experiments/provider-results/verifier-revision-llm.jsonl`<br>`experiments/pilot-e6-verifier-revision-results/metrics.json`<br>`experiments/pilot-revision-comparison/revision-comparison.json` | Large language model agents are increasingly evaluated in multi-agent decision settings, but final outcomes and fluent explanations do not guarantee valid reasoning. We study th... |
| need-exp-002 | `missing_evidence` | `first_pass_llm`, `verifier_revision` | `submission/manuscript/manuscript-draft.md` | 7 | `experiments/provider-results/plain-llm.jsonl`<br>`experiments/provider-results/candidate-constrained-llm.jsonl`<br>`experiments/pilot-e4-plain-llm-results/metrics.json`<br>`experiments/pilot-e5-candidate-constrained-results/metrics.json`<br>`experiments/provider-results/verifier-revision-llm.jsonl`<br>`experiments/pilot-e6-verifier-revision-results/metrics.json`<br>`experiments/pilot-revision-comparison/revision-comparison.json` | Large language model agents are increasingly evaluated in multi-agent decision settings, but final outcomes and fluent explanations do not guarantee valid reasoning. We study th... |
| need-exp-003 | `missing_evidence` | `first_pass_llm`, `verifier_revision`, `ablation`, `case_study` | `submission/manuscript/manuscript-draft.md` | 23 | `experiments/provider-results/plain-llm.jsonl`<br>`experiments/provider-results/candidate-constrained-llm.jsonl`<br>`experiments/pilot-e4-plain-llm-results/metrics.json`<br>`experiments/pilot-e5-candidate-constrained-results/metrics.json`<br>`experiments/provider-results/verifier-revision-llm.jsonl`<br>`experiments/pilot-e6-verifier-revision-results/metrics.json`<br>`experiments/pilot-revision-comparison/revision-comparison.json`<br>`experiments/pilot-ablation-summary/ablation-summary.json`<br>`experiments/pilot-case-studies/case-studies.json` | This paper aims to answer whether verifier-grounded reasoning reveals failures that outcome metrics miss and whether verifier feedback can improve agent behavior. We will compar... |
| need-exp-004 | `missing_evidence` | `first_pass_llm`, `verifier_revision` | `submission/manuscript/manuscript-draft.md` | 35 | `experiments/provider-results/plain-llm.jsonl`<br>`experiments/provider-results/candidate-constrained-llm.jsonl`<br>`experiments/pilot-e4-plain-llm-results/metrics.json`<br>`experiments/pilot-e5-candidate-constrained-results/metrics.json`<br>`experiments/provider-results/verifier-revision-llm.jsonl`<br>`experiments/pilot-e6-verifier-revision-results/metrics.json`<br>`experiments/pilot-revision-comparison/revision-comparison.json` | Overall, the closest prior work supplies nearly all surrounding pieces: LLM coordination, imperfect-information card games, mixed-motive process-aware evaluation, Guandan benchm... |
| need-exp-005 | `missing_evidence` | `first_pass_llm`, `verifier_revision` | `submission/manuscript/manuscript-draft.md` | 68 | `experiments/provider-results/plain-llm.jsonl`<br>`experiments/provider-results/candidate-constrained-llm.jsonl`<br>`experiments/pilot-e4-plain-llm-results/metrics.json`<br>`experiments/pilot-e5-candidate-constrained-results/metrics.json`<br>`experiments/provider-results/verifier-revision-llm.jsonl`<br>`experiments/pilot-e6-verifier-revision-results/metrics.json`<br>`experiments/pilot-revision-comparison/revision-comparison.json` | We aggregate verifier labels into reasoning reliability metrics and compare them with team-decision metrics. Reasoning reliability includes legality rate, public-history consist... |
| need-exp-006 | `missing_evidence` | `first_pass_llm`, `verifier_revision` | `submission/manuscript/manuscript-draft.md` | 86 | `experiments/provider-results/plain-llm.jsonl`<br>`experiments/provider-results/candidate-constrained-llm.jsonl`<br>`experiments/pilot-e4-plain-llm-results/metrics.json`<br>`experiments/pilot-e5-candidate-constrained-results/metrics.json`<br>`experiments/provider-results/verifier-revision-llm.jsonl`<br>`experiments/pilot-e6-verifier-revision-results/metrics.json`<br>`experiments/pilot-revision-comparison/revision-comparison.json` | The main comparison tests whether the verifier-in-the-loop condition reduces failures relative to plain and candidate-constrained prompting. A positive result would show lower h... |
| need-exp-007 | `missing_evidence` | `ablation` | `submission/manuscript/manuscript-draft.md` | 88 | `experiments/pilot-ablation-summary/ablation-summary.json` | Ablations remove verifier components one at a time. We test variants without hidden-information checks, partner consistency checks, opponent consistency checks, reasoning-action... |
| need-exp-008 | `missing_evidence` | `first_pass_llm`, `case_study` | `submission/manuscript/manuscript-draft.md` | 90 | `experiments/provider-results/plain-llm.jsonl`<br>`experiments/provider-results/candidate-constrained-llm.jsonl`<br>`experiments/pilot-e4-plain-llm-results/metrics.json`<br>`experiments/pilot-e5-candidate-constrained-results/metrics.json`<br>`experiments/pilot-case-studies/case-studies.json` | Qualitative case studies will show failures that outcome metrics miss. Planned cases include a legal winning action with invalid hidden-information reasoning, a fluent explanati... |

## Unblock Commands

### need-exp-001

- `Follow submission/provider-run-handoff.md to save plain and candidate provider outputs under experiments/provider-results/.`
- `npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e4-plain-llm-prompts/packets --batch-jsonl docs/research/experiments/pilot-e4-plain-llm-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/plain-llm.jsonl --raw docs/research/experiments/pilot-e4-plain-llm-batch/raw --out docs/research/experiments/pilot-e4-plain-llm-results --condition plain-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0`
- `npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e5-candidate-constrained-prompts/packets --batch-jsonl docs/research/experiments/pilot-e5-candidate-constrained-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/candidate-constrained-llm.jsonl --raw docs/research/experiments/pilot-e5-candidate-constrained-batch/raw --out docs/research/experiments/pilot-e5-candidate-constrained-results --condition candidate-constrained-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0`
- `npx tsx server/src/research/writePilotMetricsSummaryCli.ts --out docs/research/experiments/pilot-metrics-summary`
- `Regenerate verifier-revision packets from real first-pass LLM traces and verifier results as described in submission/provider-run-handoff.md.`
- `npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e6-verifier-revision-prompts/packets --batch-jsonl docs/research/experiments/pilot-e6-verifier-revision-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/verifier-revision-llm.jsonl --raw docs/research/experiments/pilot-e6-verifier-revision-batch/raw --out docs/research/experiments/pilot-e6-verifier-revision-results --condition verifier-revision-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0`
- `npx tsx server/src/research/writeRevisionComparisonCli.ts --out docs/research/experiments/pilot-revision-comparison`

### need-exp-002

- `Follow submission/provider-run-handoff.md to save plain and candidate provider outputs under experiments/provider-results/.`
- `npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e4-plain-llm-prompts/packets --batch-jsonl docs/research/experiments/pilot-e4-plain-llm-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/plain-llm.jsonl --raw docs/research/experiments/pilot-e4-plain-llm-batch/raw --out docs/research/experiments/pilot-e4-plain-llm-results --condition plain-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0`
- `npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e5-candidate-constrained-prompts/packets --batch-jsonl docs/research/experiments/pilot-e5-candidate-constrained-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/candidate-constrained-llm.jsonl --raw docs/research/experiments/pilot-e5-candidate-constrained-batch/raw --out docs/research/experiments/pilot-e5-candidate-constrained-results --condition candidate-constrained-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0`
- `npx tsx server/src/research/writePilotMetricsSummaryCli.ts --out docs/research/experiments/pilot-metrics-summary`
- `Regenerate verifier-revision packets from real first-pass LLM traces and verifier results as described in submission/provider-run-handoff.md.`
- `npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e6-verifier-revision-prompts/packets --batch-jsonl docs/research/experiments/pilot-e6-verifier-revision-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/verifier-revision-llm.jsonl --raw docs/research/experiments/pilot-e6-verifier-revision-batch/raw --out docs/research/experiments/pilot-e6-verifier-revision-results --condition verifier-revision-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0`
- `npx tsx server/src/research/writeRevisionComparisonCli.ts --out docs/research/experiments/pilot-revision-comparison`

### need-exp-003

- `Follow submission/provider-run-handoff.md to save plain and candidate provider outputs under experiments/provider-results/.`
- `npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e4-plain-llm-prompts/packets --batch-jsonl docs/research/experiments/pilot-e4-plain-llm-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/plain-llm.jsonl --raw docs/research/experiments/pilot-e4-plain-llm-batch/raw --out docs/research/experiments/pilot-e4-plain-llm-results --condition plain-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0`
- `npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e5-candidate-constrained-prompts/packets --batch-jsonl docs/research/experiments/pilot-e5-candidate-constrained-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/candidate-constrained-llm.jsonl --raw docs/research/experiments/pilot-e5-candidate-constrained-batch/raw --out docs/research/experiments/pilot-e5-candidate-constrained-results --condition candidate-constrained-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0`
- `npx tsx server/src/research/writePilotMetricsSummaryCli.ts --out docs/research/experiments/pilot-metrics-summary`
- `Regenerate verifier-revision packets from real first-pass LLM traces and verifier results as described in submission/provider-run-handoff.md.`
- `npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e6-verifier-revision-prompts/packets --batch-jsonl docs/research/experiments/pilot-e6-verifier-revision-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/verifier-revision-llm.jsonl --raw docs/research/experiments/pilot-e6-verifier-revision-batch/raw --out docs/research/experiments/pilot-e6-verifier-revision-results --condition verifier-revision-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0`
- `npx tsx server/src/research/writeRevisionComparisonCli.ts --out docs/research/experiments/pilot-revision-comparison`
- `Run verifier-component ablations and write experiments/pilot-ablation-summary/ablation-summary.json before removing ablation claims.`
- `Select trace-level case studies after LLM conditions are ingested and write experiments/pilot-case-studies/case-studies.json.`

### need-exp-004

- `Follow submission/provider-run-handoff.md to save plain and candidate provider outputs under experiments/provider-results/.`
- `npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e4-plain-llm-prompts/packets --batch-jsonl docs/research/experiments/pilot-e4-plain-llm-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/plain-llm.jsonl --raw docs/research/experiments/pilot-e4-plain-llm-batch/raw --out docs/research/experiments/pilot-e4-plain-llm-results --condition plain-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0`
- `npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e5-candidate-constrained-prompts/packets --batch-jsonl docs/research/experiments/pilot-e5-candidate-constrained-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/candidate-constrained-llm.jsonl --raw docs/research/experiments/pilot-e5-candidate-constrained-batch/raw --out docs/research/experiments/pilot-e5-candidate-constrained-results --condition candidate-constrained-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0`
- `npx tsx server/src/research/writePilotMetricsSummaryCli.ts --out docs/research/experiments/pilot-metrics-summary`
- `Regenerate verifier-revision packets from real first-pass LLM traces and verifier results as described in submission/provider-run-handoff.md.`
- `npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e6-verifier-revision-prompts/packets --batch-jsonl docs/research/experiments/pilot-e6-verifier-revision-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/verifier-revision-llm.jsonl --raw docs/research/experiments/pilot-e6-verifier-revision-batch/raw --out docs/research/experiments/pilot-e6-verifier-revision-results --condition verifier-revision-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0`
- `npx tsx server/src/research/writeRevisionComparisonCli.ts --out docs/research/experiments/pilot-revision-comparison`

### need-exp-005

- `Follow submission/provider-run-handoff.md to save plain and candidate provider outputs under experiments/provider-results/.`
- `npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e4-plain-llm-prompts/packets --batch-jsonl docs/research/experiments/pilot-e4-plain-llm-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/plain-llm.jsonl --raw docs/research/experiments/pilot-e4-plain-llm-batch/raw --out docs/research/experiments/pilot-e4-plain-llm-results --condition plain-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0`
- `npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e5-candidate-constrained-prompts/packets --batch-jsonl docs/research/experiments/pilot-e5-candidate-constrained-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/candidate-constrained-llm.jsonl --raw docs/research/experiments/pilot-e5-candidate-constrained-batch/raw --out docs/research/experiments/pilot-e5-candidate-constrained-results --condition candidate-constrained-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0`
- `npx tsx server/src/research/writePilotMetricsSummaryCli.ts --out docs/research/experiments/pilot-metrics-summary`
- `Regenerate verifier-revision packets from real first-pass LLM traces and verifier results as described in submission/provider-run-handoff.md.`
- `npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e6-verifier-revision-prompts/packets --batch-jsonl docs/research/experiments/pilot-e6-verifier-revision-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/verifier-revision-llm.jsonl --raw docs/research/experiments/pilot-e6-verifier-revision-batch/raw --out docs/research/experiments/pilot-e6-verifier-revision-results --condition verifier-revision-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0`
- `npx tsx server/src/research/writeRevisionComparisonCli.ts --out docs/research/experiments/pilot-revision-comparison`

### need-exp-006

- `Follow submission/provider-run-handoff.md to save plain and candidate provider outputs under experiments/provider-results/.`
- `npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e4-plain-llm-prompts/packets --batch-jsonl docs/research/experiments/pilot-e4-plain-llm-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/plain-llm.jsonl --raw docs/research/experiments/pilot-e4-plain-llm-batch/raw --out docs/research/experiments/pilot-e4-plain-llm-results --condition plain-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0`
- `npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e5-candidate-constrained-prompts/packets --batch-jsonl docs/research/experiments/pilot-e5-candidate-constrained-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/candidate-constrained-llm.jsonl --raw docs/research/experiments/pilot-e5-candidate-constrained-batch/raw --out docs/research/experiments/pilot-e5-candidate-constrained-results --condition candidate-constrained-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0`
- `npx tsx server/src/research/writePilotMetricsSummaryCli.ts --out docs/research/experiments/pilot-metrics-summary`
- `Regenerate verifier-revision packets from real first-pass LLM traces and verifier results as described in submission/provider-run-handoff.md.`
- `npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e6-verifier-revision-prompts/packets --batch-jsonl docs/research/experiments/pilot-e6-verifier-revision-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/verifier-revision-llm.jsonl --raw docs/research/experiments/pilot-e6-verifier-revision-batch/raw --out docs/research/experiments/pilot-e6-verifier-revision-results --condition verifier-revision-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0`
- `npx tsx server/src/research/writeRevisionComparisonCli.ts --out docs/research/experiments/pilot-revision-comparison`

### need-exp-007

- `Run verifier-component ablations and write experiments/pilot-ablation-summary/ablation-summary.json before removing ablation claims.`

### need-exp-008

- `Follow submission/provider-run-handoff.md to save plain and candidate provider outputs under experiments/provider-results/.`
- `npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e4-plain-llm-prompts/packets --batch-jsonl docs/research/experiments/pilot-e4-plain-llm-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/plain-llm.jsonl --raw docs/research/experiments/pilot-e4-plain-llm-batch/raw --out docs/research/experiments/pilot-e4-plain-llm-results --condition plain-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0`
- `npx tsx server/src/research/runPostProviderConditionCli.ts --packets docs/research/experiments/pilot-e5-candidate-constrained-prompts/packets --batch-jsonl docs/research/experiments/pilot-e5-candidate-constrained-batch/batch-input.jsonl --provider-results docs/research/experiments/provider-results/candidate-constrained-llm.jsonl --raw docs/research/experiments/pilot-e5-candidate-constrained-batch/raw --out docs/research/experiments/pilot-e5-candidate-constrained-results --condition candidate-constrained-llm --model-provider openai --model-name gpt-4.1-mini --temperature 0`
- `npx tsx server/src/research/writePilotMetricsSummaryCli.ts --out docs/research/experiments/pilot-metrics-summary`
- `Select trace-level case studies after LLM conditions are ingested and write experiments/pilot-case-studies/case-studies.json.`
