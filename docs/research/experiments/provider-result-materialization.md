# Provider Result Materialization

This note defines how downloaded LLM provider results become auditable raw output
files for the pilot experiments. No external model API is called by this step.

For OpenAI Batch input preparation, see `openai-batch-runbook.md`.

## Supported JSONL Shapes

Each provider result line must include a decision identifier as `custom_id` or
`customId`. The materializer currently accepts:

- OpenAI batch-style lines with `response.body.choices[0].message.content`.
- OpenAI response-style lines with `response.body.output_text`.
- Generic lines with top-level `content`.
- Generic lines with top-level `output_text`.
- Error lines with `error.message` or `response.error.message`.

## Plain LLM Example

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

Then audit and ingest the raw directory using `llm-pipeline-runbook.md`.

One-command post-provider processing for the plain condition:

```bash
npx tsx server/src/research/runPostProviderConditionCli.ts \
  --packets docs/research/experiments/pilot-e4-plain-llm-prompts/packets \
  --batch-jsonl docs/research/experiments/pilot-e4-plain-llm-batch/batch-input.jsonl \
  --provider-results docs/research/experiments/pilot-e4-plain-llm-batch/provider-results.jsonl \
  --raw docs/research/experiments/pilot-e4-plain-llm-batch/raw \
  --out docs/research/experiments/pilot-e4-plain-llm-results \
  --condition plain-llm \
  --model-provider <provider> \
  --model-name <model-name-and-version> \
  --run-id <provider-batch-or-run-id> \
  --temperature 0
```

## Candidate-Constrained LLM Example

```bash
npx tsx server/src/research/materializeLLMProviderResultsCli.ts \
  --batch-jsonl docs/research/experiments/pilot-e5-candidate-constrained-batch/batch-input.jsonl \
  --provider-results docs/research/experiments/pilot-e5-candidate-constrained-batch/provider-results.jsonl \
  --raw docs/research/experiments/pilot-e5-candidate-constrained-batch/raw \
  --report docs/research/experiments/pilot-e5-candidate-constrained-batch/provider-materialization-report.json \
  --provenance-out docs/research/experiments/pilot-e5-candidate-constrained-batch/provenance.json \
  --model-provider <provider> \
  --model-name <model-name-and-version> \
  --run-id <provider-batch-or-run-id> \
  --temperature 0
```

One-command post-provider processing for the candidate-constrained condition:

```bash
npx tsx server/src/research/runPostProviderConditionCli.ts \
  --packets docs/research/experiments/pilot-e5-candidate-constrained-prompts/packets \
  --batch-jsonl docs/research/experiments/pilot-e5-candidate-constrained-batch/batch-input.jsonl \
  --provider-results docs/research/experiments/pilot-e5-candidate-constrained-batch/provider-results.jsonl \
  --raw docs/research/experiments/pilot-e5-candidate-constrained-batch/raw \
  --out docs/research/experiments/pilot-e5-candidate-constrained-results \
  --condition candidate-constrained-llm \
  --model-provider <provider> \
  --model-name <model-name-and-version> \
  --run-id <provider-batch-or-run-id> \
  --temperature 0
```

## Verifier-Revision LLM Example

Only run this after real first-pass LLM traces and verifier results exist.

```bash
npx tsx server/src/research/materializeLLMProviderResultsCli.ts \
  --batch-jsonl docs/research/experiments/pilot-e6-verifier-revision-batch/batch-input.jsonl \
  --provider-results docs/research/experiments/pilot-e6-verifier-revision-batch/provider-results.jsonl \
  --raw docs/research/experiments/pilot-e6-verifier-revision-batch/raw \
  --report docs/research/experiments/pilot-e6-verifier-revision-batch/provider-materialization-report.json \
  --provenance-out docs/research/experiments/pilot-e6-verifier-revision-batch/provenance.json \
  --model-provider <provider> \
  --model-name <model-name-and-version> \
  --run-id <provider-batch-or-run-id> \
  --temperature 0
```

## Interpretation Rule

A materialization report is not an experiment result. It only proves that provider
outputs were mapped to expected raw output filenames. The result table can only
use metrics generated after raw-output audit and ingest.

The post-provider runner stops before ingest if materialization or raw-output
audit is incomplete. In that case, the generated `post-provider-report.json`
must be treated as a readiness report, not as an experiment result.
