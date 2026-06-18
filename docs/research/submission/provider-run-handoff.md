# Provider Run Handoff

Date: 2026-06-17

This handoff is the external-run boundary for the paper pipeline. It tells the
operator exactly which batch files leave the repository and where downloaded
provider results must return. It does not authorize any external upload by
itself.

## Current State

- No provider API call has been made by the local pipeline.
- Plain and candidate-constrained first-pass batches are ready.
- The existing verifier-revision batch is fixture-only and must not be used for
  final empirical claims.
- A real verifier-revision batch must be regenerated after first-pass LLM traces
  and verifier results exist.

## Phase A: First-Pass LLM Runs

Upload or run these OpenAI-compatible batch files:

| Condition | Upload file | Expected provider-result file after download |
|---|---|---|
| `plain-llm` | `docs/research/experiments/pilot-e4-plain-llm-batch/openai/openai-batch-input.jsonl` | `docs/research/experiments/provider-results/plain-llm.jsonl` |
| `candidate-constrained-llm` | `docs/research/experiments/pilot-e5-candidate-constrained-batch/openai/openai-batch-input.jsonl` | `docs/research/experiments/provider-results/candidate-constrained-llm.jsonl` |

Prepared run parameters:

- model field: `gpt-4.1-mini`
- temperature: `0`
- max completion tokens: `1200`
- response format: `json_object`

After downloading provider results, run:

Important: the upload file is the OpenAI batch JSONL, but the post-provider
command must receive the provider-neutral `batch-input.jsonl`. That file carries
the `expected_raw_output_file` mapping used to materialize raw `.txt` outputs.

```bash
npx tsx server/src/research/runPostProviderConditionCli.ts \
  --packets docs/research/experiments/pilot-e4-plain-llm-prompts/packets \
  --batch-jsonl docs/research/experiments/pilot-e4-plain-llm-batch/batch-input.jsonl \
  --provider-results docs/research/experiments/provider-results/plain-llm.jsonl \
  --raw docs/research/experiments/pilot-e4-plain-llm-batch/raw \
  --out docs/research/experiments/pilot-e4-plain-llm-results \
  --condition plain-llm \
  --model-provider openai \
  --model-name gpt-4.1-mini \
  --temperature 0 \
  --notes "OpenAI-compatible batch run; response_format=json_object; max_completion_tokens=1200"
```

```bash
npx tsx server/src/research/runPostProviderConditionCli.ts \
  --packets docs/research/experiments/pilot-e5-candidate-constrained-prompts/packets \
  --batch-jsonl docs/research/experiments/pilot-e5-candidate-constrained-batch/batch-input.jsonl \
  --provider-results docs/research/experiments/provider-results/candidate-constrained-llm.jsonl \
  --raw docs/research/experiments/pilot-e5-candidate-constrained-batch/raw \
  --out docs/research/experiments/pilot-e5-candidate-constrained-results \
  --condition candidate-constrained-llm \
  --model-provider openai \
  --model-name gpt-4.1-mini \
  --temperature 0 \
  --notes "OpenAI-compatible batch run; response_format=json_object; max_completion_tokens=1200"
```

Then refresh downstream artifacts:

```bash
npm run research:local-pipeline -- --report-dir docs/research/submission/local-pipeline
```

## Phase B: Real Verifier-Revision Run

Do not upload the fixture revision batch for final claims. After Phase A is
ingested, build revision packets from real first-pass traces and verifier
results:

```bash
npx tsx server/src/research/exportVerifierRevisionPacketsCli.ts \
  --decisions docs/research/experiments/pilot-e1/decisions \
  --traces docs/research/experiments/pilot-e5-candidate-constrained-results/traces \
  --results docs/research/experiments/pilot-e5-candidate-constrained-results/results \
  --out docs/research/experiments/pilot-e6-verifier-revision-prompts
```

```bash
npx tsx server/src/research/exportLLMBatchFilesCli.ts \
  --packets docs/research/experiments/pilot-e6-verifier-revision-prompts/packets \
  --out docs/research/experiments/pilot-e6-verifier-revision-batch
```

```bash
npx tsx server/src/research/exportOpenAIBatchCli.ts \
  --source docs/research/experiments/pilot-e6-verifier-revision-batch/batch-input.jsonl \
  --out docs/research/experiments/pilot-e6-verifier-revision-batch/openai \
  --model gpt-4.1-mini \
  --temperature 0 \
  --max-completion-tokens 1200 \
  --response-format json_object
```

Upload:

```text
docs/research/experiments/pilot-e6-verifier-revision-batch/openai/openai-batch-input.jsonl
```

Save downloaded provider results as:

```text
docs/research/experiments/provider-results/verifier-revision-llm.jsonl
```

Materialize and ingest:

```bash
npx tsx server/src/research/runPostProviderConditionCli.ts \
  --packets docs/research/experiments/pilot-e6-verifier-revision-prompts/packets \
  --batch-jsonl docs/research/experiments/pilot-e6-verifier-revision-batch/batch-input.jsonl \
  --provider-results docs/research/experiments/provider-results/verifier-revision-llm.jsonl \
  --raw docs/research/experiments/pilot-e6-verifier-revision-batch/raw \
  --out docs/research/experiments/pilot-e6-verifier-revision-results \
  --condition verifier-revision-llm \
  --model-provider openai \
  --model-name gpt-4.1-mini \
  --temperature 0 \
  --notes "Verifier-revision batch generated from real candidate-constrained first-pass traces"
```

## Phase C: Final Metric Refresh

After all three conditions are ingested:

```bash
npx tsx server/src/research/writePilotMetricsSummaryCli.ts \
  --out docs/research/experiments/pilot-metrics-summary
```

```bash
npx tsx server/src/research/writeRevisionComparisonCli.ts \
  --first-pass-metrics docs/research/experiments/pilot-e5-candidate-constrained-results/metrics.json \
  --revision-metrics docs/research/experiments/pilot-e6-verifier-revision-results/metrics.json \
  --out docs/research/experiments/pilot-revision-comparison
```

```bash
npm run research:local-pipeline -- --report-dir docs/research/submission/local-pipeline
```

Submission gate can only move past the current provider blockers after the
provider result files, provenance files, raw-output audits, ingested traces, and
metrics files all exist and pass their local checks.
