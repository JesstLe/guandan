# Provider Run Handoff

Date: 2026-06-17

This handoff is the external-run boundary for the paper pipeline. It tells the
operator exactly which batch files leave the repository and where provider
results must return. It does not authorize any external upload by itself.

As of 2026-06-18, the PI has authorized sending the 50 pilot decision prompt
packets to OpenAI for Phase A. This authorization covers the prompt packets/game
state JSON for the pilot run, not the unpublished manuscript, private notes, or
unrelated repository content.

## Current State

- Provider execution is partially complete: the ToM-prompted pilot run is present, and the 500-decision full-split ToM run is partially complete through the local Kimi CLI runner.
- Plain and candidate-constrained first-pass batches are ready.
- ToM-prompted pilot provider results are present at `docs/research/experiments/provider-results/tom-prompted-llm.jsonl`.
- ToM-prompted pilot post-provider artifacts are present at `docs/research/experiments/pilot-e7-tom-prompted-results`; the run produced 50 / 50 raw outputs, 36 / 50 parsed traces, and 14 / 50 parse failures.
- Full-split plain and candidate-constrained batches are prepared locally.
- Full-split ToM-prompted was attempted through the local Kimi CLI runner. The provider-result file is present at `docs/research/experiments/provider-results/full-tom-prompted-llm.jsonl`, with 268 usable model outputs, 50 explicit Kimi usage/quota-limit errors from the latest bounded attempt, and 182 pending rows not present in the current provider-result file. The run is recoverable with bounded `--resume --attempt-limit <N>` batches after quota refresh.
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
| `tom-prompted-llm` | `docs/research/experiments/pilot-e7-tom-prompted-batch/openai/openai-batch-input.jsonl` | `docs/research/experiments/provider-results/tom-prompted-llm.jsonl` (present) |

Optional 500-decision full-split upload files, prepared but not covered by the
Phase A pilot authorization:

| Condition | Upload file | Suggested provider-result file after download |
|---|---|---|
| `plain-llm` | `docs/research/experiments/full-e2-plain-llm-batch/openai/openai-batch-input.jsonl` | `docs/research/experiments/provider-results/full-plain-llm.jsonl` |
| `candidate-constrained-llm` | `docs/research/experiments/full-e3-candidate-constrained-batch/openai/openai-batch-input.jsonl` | `docs/research/experiments/provider-results/full-candidate-constrained-llm.jsonl` |
| `tom-prompted-llm` | `docs/research/experiments/full-e4-tom-prompted-batch/openai/openai-batch-input.jsonl` | `docs/research/experiments/provider-results/full-tom-prompted-llm.jsonl` (partial: 268 usable, 50 quota errors, 182 pending) |

Prepared run parameters:

- model field: `gpt-4.1-mini`
- temperature: `0`
- max completion tokens: `1200`
- response format: `json_object`

### Option 1: Direct OpenAI API Runner

The direct runner executes the existing OpenAI-compatible JSONL locally and
writes provider-result JSONL in the same shape expected by the downstream
materializer. It requires `OPENAI_API_KEY` in the environment or an explicit
`--env-file` that defines it.

```bash
npx tsx server/src/research/runOpenAIChatCompletionJsonlCli.ts \
  --input docs/research/experiments/pilot-e4-plain-llm-batch/openai/openai-batch-input.jsonl \
  --out docs/research/experiments/provider-results/plain-llm.jsonl \
  --report docs/research/experiments/provider-results/plain-llm-openai-run-report.json \
  --concurrency 4
```

```bash
npx tsx server/src/research/runOpenAIChatCompletionJsonlCli.ts \
  --input docs/research/experiments/pilot-e5-candidate-constrained-batch/openai/openai-batch-input.jsonl \
  --out docs/research/experiments/provider-results/candidate-constrained-llm.jsonl \
  --report docs/research/experiments/provider-results/candidate-constrained-llm-openai-run-report.json \
  --concurrency 4
```

```bash
npx tsx server/src/research/runOpenAIChatCompletionJsonlCli.ts \
  --input docs/research/experiments/pilot-e7-tom-prompted-batch/openai/openai-batch-input.jsonl \
  --out docs/research/experiments/provider-results/tom-prompted-llm.jsonl \
  --report docs/research/experiments/provider-results/tom-prompted-llm-openai-run-report.json \
  --concurrency 4
```

### Option 2: OpenAI Batch Upload

Alternatively, upload the OpenAI batch JSONL files listed above and save the
downloaded provider results to the expected provider-result paths.

### Option 3: Kimi Code CLI Runner

Kimi Code documents an OpenAI-compatible endpoint at
`https://api.kimi.com/coding/v1/chat/completions` with model id
`kimi-for-coding`, but the service rejects generic raw clients and requires a
supported coding-agent identity. Do not spoof another agent's User-Agent. If the
official `kimi` CLI is configured locally, use the CLI runner instead:

```bash
npx tsx server/src/research/exportOpenAIBatchCli.ts \
  --source docs/research/experiments/pilot-e4-plain-llm-batch/batch-input.jsonl \
  --out docs/research/experiments/pilot-e4-plain-llm-batch/kimi \
  --model kimi-for-coding \
  --temperature 0 \
  --max-completion-tokens 1200 \
  --response-format json_object
```

```bash
npx tsx server/src/research/runKimiCliBatchJsonlCli.ts \
  --input docs/research/experiments/pilot-e4-plain-llm-batch/kimi/openai-batch-input.jsonl \
  --out docs/research/experiments/provider-results/plain-llm.jsonl \
  --report docs/research/experiments/provider-results/plain-llm-kimi-cli-run-report.json \
  --model kimi-code/kimi-for-coding \
  --max-steps-per-turn 3 \
  --concurrency 4
```

If some rows fail because the CLI does not emit a final assistant text block in
time, retry only those failed rows with a larger `--max-steps-per-turn`, then
merge by `custom_id` while preserving the original input order. Record the merge
in `docs/research/experiments/provider-results/plain-llm-kimi-merge-report.json`.

For the current full-split ToM run, resume after Kimi quota refresh with:

```bash
npx tsx server/src/research/runKimiCliBatchJsonlCli.ts \
  --input docs/research/experiments/full-e4-tom-prompted-batch/openai/openai-batch-input.jsonl \
  --out docs/research/experiments/provider-results/full-tom-prompted-llm.jsonl \
  --report docs/research/experiments/provider-results/full-tom-prompted-llm-kimi-cli-run-report.json \
  --model kimi-code/kimi-for-coding \
  --max-steps-per-turn 20 \
  --concurrency 4 \
  --timeout-ms 600000 \
  --resume \
  --attempt-limit 50
```

### Post-Provider Materialization

After direct runs or downloaded batch results, run:

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

```bash
npx tsx server/src/research/runPostProviderConditionCli.ts \
  --packets docs/research/experiments/pilot-e7-tom-prompted-prompts/packets \
  --batch-jsonl docs/research/experiments/pilot-e7-tom-prompted-batch/batch-input.jsonl \
  --provider-results docs/research/experiments/provider-results/tom-prompted-llm.jsonl \
  --raw docs/research/experiments/pilot-e7-tom-prompted-batch/raw \
  --out docs/research/experiments/pilot-e7-tom-prompted-results \
  --condition tom-prompted-llm \
  --model-provider openai \
  --model-name gpt-4.1-mini \
  --temperature 0 \
  --notes "ToM-prompted baseline batch; response_format=json_object; max_completion_tokens=1200"
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
