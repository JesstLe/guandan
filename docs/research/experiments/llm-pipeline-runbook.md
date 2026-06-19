# LLM Pipeline Runbook

## Scope

This runbook defines the E3 prompt-packet and raw-output ingestion pipeline. It
does not record completed LLM results yet.

## Step 1: Export Prompt Packets

Plain LLM:

```bash
npx tsx server/src/research/exportLLMPromptPacketsCli.ts \
  --input docs/research/experiments/pilot-e1/decisions \
  --out docs/research/experiments/pilot-e4-plain-llm-prompts \
  --condition plain-llm
```

Candidate-constrained LLM:

```bash
npx tsx server/src/research/exportLLMPromptPacketsCli.ts \
  --input docs/research/experiments/pilot-e1/decisions \
  --out docs/research/experiments/pilot-e5-candidate-constrained-prompts \
  --condition candidate-constrained-llm
```

ToM-prompted LLM:

```bash
npx tsx server/src/research/exportLLMPromptPacketsCli.ts \
  --input docs/research/experiments/pilot-e1/decisions \
  --out docs/research/experiments/pilot-e7-tom-prompted-prompts \
  --condition tom-prompted-llm
```

Current artifacts:

- `docs/research/experiments/pilot-e4-plain-llm-prompts/manifest.json`
- `docs/research/experiments/pilot-e4-plain-llm-prompts/packets/*.json`
- `docs/research/experiments/pilot-e5-candidate-constrained-prompts/manifest.json`
- `docs/research/experiments/pilot-e5-candidate-constrained-prompts/packets/*.json`
- `docs/research/experiments/pilot-e7-tom-prompted-prompts/manifest.json`
- `docs/research/experiments/pilot-e7-tom-prompted-prompts/packets/*.json`
- `docs/research/experiments/full-e2-plain-llm-prompts/manifest.json`
- `docs/research/experiments/full-e2-plain-llm-prompts/packets/*.json`
- `docs/research/experiments/full-e3-candidate-constrained-prompts/manifest.json`
- `docs/research/experiments/full-e3-candidate-constrained-prompts/packets/*.json`
- `docs/research/experiments/full-e4-tom-prompted-prompts/manifest.json`
- `docs/research/experiments/full-e4-tom-prompted-prompts/packets/*.json`

## Step 2: Run a Model

### 2.1 Export Provider-Neutral Batch Files

Plain LLM:

```bash
npx tsx server/src/research/exportLLMBatchFilesCli.ts \
  --packets docs/research/experiments/pilot-e4-plain-llm-prompts/packets \
  --out docs/research/experiments/pilot-e4-plain-llm-batch
```

Candidate-constrained LLM:

```bash
npx tsx server/src/research/exportLLMBatchFilesCli.ts \
  --packets docs/research/experiments/pilot-e5-candidate-constrained-prompts/packets \
  --out docs/research/experiments/pilot-e5-candidate-constrained-batch
```

ToM-prompted LLM:

```bash
npx tsx server/src/research/exportLLMBatchFilesCli.ts \
  --packets docs/research/experiments/pilot-e7-tom-prompted-prompts/packets \
  --out docs/research/experiments/pilot-e7-tom-prompted-batch
```

Current batch artifacts:

- `docs/research/experiments/pilot-e4-plain-llm-batch/batch-input.jsonl`
- `docs/research/experiments/pilot-e4-plain-llm-batch/batch-manifest.json`
- `docs/research/experiments/pilot-e4-plain-llm-batch/raw-output-audit.json`
- `docs/research/experiments/pilot-e5-candidate-constrained-batch/batch-input.jsonl`
- `docs/research/experiments/pilot-e5-candidate-constrained-batch/batch-manifest.json`
- `docs/research/experiments/pilot-e5-candidate-constrained-batch/raw-output-audit.json`
- `docs/research/experiments/pilot-e7-tom-prompted-batch/batch-input.jsonl`
- `docs/research/experiments/pilot-e7-tom-prompted-batch/batch-manifest.json`
- `docs/research/experiments/pilot-e7-tom-prompted-batch/raw-output-audit.json`
- `docs/research/experiments/full-e2-plain-llm-batch/batch-input.jsonl`
- `docs/research/experiments/full-e2-plain-llm-batch/batch-manifest.json`
- `docs/research/experiments/full-e2-plain-llm-batch/raw-output-audit.json`
- `docs/research/experiments/full-e3-candidate-constrained-batch/batch-input.jsonl`
- `docs/research/experiments/full-e3-candidate-constrained-batch/batch-manifest.json`
- `docs/research/experiments/full-e3-candidate-constrained-batch/raw-output-audit.json`
- `docs/research/experiments/full-e4-tom-prompted-batch/batch-input.jsonl`
- `docs/research/experiments/full-e4-tom-prompted-batch/batch-manifest.json`
- `docs/research/experiments/full-e4-tom-prompted-batch/raw-output-audit.json`

These files are provider-neutral. They do not call any external model API.

### 2.2 Store Raw Model Outputs

For each prompt packet, send `messages` to the selected model and store the raw
model response as:

```text
<batch-output-dir>/raw/<decisionId>.txt
```

Example for plain LLM:

```text
docs/research/experiments/pilot-e4-plain-llm-batch/raw/pilot-e1-000-turn-1-player-0.txt
```

Experiment provenance must record:

- model provider,
- model version,
- date,
- temperature,
- sampling parameters,
- any retries or parse repairs,
- known exclusions.

### 2.3 Audit Raw Output Completeness

Plain LLM:

```bash
npx tsx server/src/research/auditLLMRawOutputsCli.ts \
  --packets docs/research/experiments/pilot-e4-plain-llm-prompts/packets \
  --raw docs/research/experiments/pilot-e4-plain-llm-batch/raw \
  --out docs/research/experiments/pilot-e4-plain-llm-batch/raw-output-audit.json
```

Candidate-constrained LLM:

```bash
npx tsx server/src/research/auditLLMRawOutputsCli.ts \
  --packets docs/research/experiments/pilot-e5-candidate-constrained-prompts/packets \
  --raw docs/research/experiments/pilot-e5-candidate-constrained-batch/raw \
  --out docs/research/experiments/pilot-e5-candidate-constrained-batch/raw-output-audit.json
```

Current audit status:

- Plain LLM: 0 / 50 present, 50 missing, not ready for ingest.
- Candidate-constrained LLM: 0 / 50 present, 50 missing, not ready for ingest.
- ToM-prompted LLM: 50 / 50 raw outputs present after Kimi CLI provider run; 36 / 50 parsed traces and 14 / 50 parse failures after ingest.
- Full-split Plain LLM: 0 / 500 present, 500 missing, not ready for ingest.
- Full-split Candidate-constrained LLM: 0 / 500 present, 500 missing, not ready for ingest.
- Full-split ToM-prompted LLM: 384 / 500 raw outputs present after Kimi CLI resume-capable provider runs; the provider JSONL currently has 384 usable model outputs, 0 retained provider-error rows, and 116 rows still needing successful output. The latest bounded resumes on 2026-06-19 advanced the run from 328 to 384 successful outputs using `--max-steps-per-turn 8`, then `--max-steps-per-turn 12` to clear a max-step retry and continue bounded resumes; direct parsing now yields 306 / 500 traces, and deterministic schema repair yields 384 / 500 usable traces. The current full-split ToM artifacts are not final evidence until the remaining 116 raw outputs are resumed and materialized.

Rows marked as provider errors must not be counted as model outputs. Use
`runKimiCliBatchJsonlCli.ts --resume --attempt-limit <N>` after quota refresh
to preserve existing successful rows and retry a bounded number of failed or
missing rows.

### 2.4 Materialize Downloaded Provider Results

If the model provider returns one JSONL file rather than per-decision raw files,
materialize it locally before audit:

```bash
npx tsx server/src/research/materializeLLMProviderResultsCli.ts \
  --batch-jsonl docs/research/experiments/pilot-e4-plain-llm-batch/batch-input.jsonl \
  --provider-results docs/research/experiments/pilot-e4-plain-llm-batch/provider-results.jsonl \
  --raw docs/research/experiments/pilot-e4-plain-llm-batch/raw \
  --report docs/research/experiments/pilot-e4-plain-llm-batch/provider-materialization-report.json \
  --provenance-out docs/research/experiments/pilot-e4-plain-llm-batch/provenance.json \
  --model-provider <provider> \
  --model-name <model-name-and-version> \
  --run-id <provider-batch-or-run-id> \
  --temperature 0
```

Detailed provider-result formats and condition-specific commands are documented
at `docs/research/experiments/provider-result-materialization.md`. A provenance
template is available at `docs/research/experiments/llm-run-provenance-template.json`.

OpenAI-ready batch input files can be generated with
`server/src/research/exportOpenAIBatchCli.ts`; see
`docs/research/experiments/openai-batch-runbook.md`.

For completed provider result JSONL files, the one-command post-provider runner
is `server/src/research/runPostProviderConditionCli.ts`. It materializes provider
results, writes provenance, audits raw outputs, and ingests traces only if the
audit is complete.
Pass the provider-neutral `batch-input.jsonl` to this command, not the
OpenAI upload JSONL, because the materializer needs the
`expected_raw_output_file` mapping.

For the exact external-run boundary, upload paths, return paths, and
post-provider commands, see `docs/research/submission/provider-run-handoff.md`.

## Step 3: Ingest Raw Outputs

Plain LLM:

```bash
npx tsx server/src/research/ingestLLMRawOutputsCli.ts \
  --input docs/research/experiments/pilot-e1/decisions \
  --raw docs/research/experiments/pilot-e4-plain-llm-batch/raw \
  --out docs/research/experiments/pilot-e4-plain-llm-results \
  --condition plain-llm
```

Candidate-constrained LLM:

```bash
npx tsx server/src/research/ingestLLMRawOutputsCli.ts \
  --input docs/research/experiments/pilot-e1/decisions \
  --raw docs/research/experiments/pilot-e5-candidate-constrained-batch/raw \
  --out docs/research/experiments/pilot-e5-candidate-constrained-results \
  --condition candidate-constrained-llm
```

ToM-prompted LLM:

```bash
npx tsx server/src/research/ingestLLMRawOutputsCli.ts \
  --input docs/research/experiments/pilot-e1/decisions \
  --raw docs/research/experiments/pilot-e7-tom-prompted-batch/raw \
  --out docs/research/experiments/pilot-e7-tom-prompted-results \
  --condition tom-prompted-llm
```

The ingest command writes:

- `traces/*.json`
- `results/*.json`
- `metrics.json`

## Step 4: Regenerate Pilot Metrics Summary

After baseline metrics, raw-output audits, or LLM result metrics change, regenerate
the pilot metrics summary:

```bash
npx tsx server/src/research/writePilotMetricsSummaryCli.ts \
  --out docs/research/experiments/pilot-metrics-summary
```

Current artifacts:

- `docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json`
- `docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.md`

Rows marked `missing_raw_outputs` are not model results and must not be used as
evidence for LLM performance.

## Step 5: Verifier Revision Packets

The verifier-in-the-loop condition is prepared by:

```bash
npx tsx server/src/research/exportVerifierRevisionPacketsCli.ts \
  --decisions docs/research/experiments/pilot-e1/decisions \
  --traces docs/research/experiments/pilot-e3-strategic-heuristic/traces \
  --results docs/research/experiments/pilot-e3-strategic-heuristic/results \
  --out docs/research/experiments/pilot-e6-verifier-revision-fixture-prompts
```

For the current fixture, the source traces are deterministic strategic-heuristic
traces. This validates the revision protocol only. Real E4 evidence requires
revision prompts built from LLM traces and corresponding verifier results.
The submission handoff therefore treats the fixture revision batch as non-final
and requires regeneration from real first-pass LLM traces before the
verifier-revision condition can support manuscript claims.

The detailed protocol is documented at:

- `docs/research/experiments/verifier-revision-protocol.md`

## Step 6: Compare First-Pass and Revision Metrics

Before real revision outputs exist, the comparison artifact can still be generated
from raw-output audits. In that state it must remain `missing_raw_outputs` and
must not be used as a result table:

```bash
npx tsx server/src/research/writeRevisionComparisonCli.ts \
  --out docs/research/experiments/pilot-revision-comparison
```

Current artifacts:

- `docs/research/experiments/pilot-revision-comparison/revision-comparison.json`
- `docs/research/experiments/pilot-revision-comparison/revision-comparison.md`

After real first-pass and revision metrics exist, regenerate with metrics paths:

```bash
npx tsx server/src/research/writeRevisionComparisonCli.ts \
  --first-pass-metrics docs/research/experiments/pilot-e5-candidate-constrained-results/metrics.json \
  --revision-metrics docs/research/experiments/pilot-e6-verifier-revision-results/metrics.json \
  --out docs/research/experiments/pilot-revision-comparison
```

## Fixture Check

A small fixture-only ingest check was run using 5 synthetic raw outputs. It is
stored under:

- `docs/research/experiments/pilot-e4-fixture-raw-outputs`
- `docs/research/experiments/pilot-e4-fixture-ingest-check`

This is not an LLM result and must not be used in paper result tables.
