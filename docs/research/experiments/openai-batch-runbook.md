# OpenAI Batch Runbook

This runbook prepares OpenAI Batch API input files from the provider-neutral
pilot batch files. It does not upload files or call the OpenAI API.

Reference: the OpenAI Batch API guide states that each JSONL line contains one
request with a unique `custom_id`, `method`, `url`, and endpoint-specific `body`.
The current exporter targets `/v1/chat/completions`.

Source:

- https://developers.openai.com/api/docs/guides/batch

## Generated OpenAI-Ready Files

| Condition | OpenAI JSONL | Manifest | Requests |
|---|---|---|---:|
| `plain-llm` | `pilot-e4-plain-llm-batch/openai/openai-batch-input.jsonl` | `pilot-e4-plain-llm-batch/openai/openai-batch-manifest.json` | 50 |
| `candidate-constrained-llm` | `pilot-e5-candidate-constrained-batch/openai/openai-batch-input.jsonl` | `pilot-e5-candidate-constrained-batch/openai/openai-batch-manifest.json` | 50 |
| `verifier-revision-llm` fixture | `pilot-e6-verifier-revision-fixture-batch/openai/openai-batch-input.jsonl` | `pilot-e6-verifier-revision-fixture-batch/openai/openai-batch-manifest.json` | 50 |

The verifier-revision file above is fixture-only because it uses deterministic
strategic-heuristic traces. Final paper claims require a new verifier-revision
batch generated from real first-pass LLM traces and verifier results.

## Regenerate Commands

Plain LLM:

```bash
npx tsx server/src/research/exportOpenAIBatchCli.ts \
  --source docs/research/experiments/pilot-e4-plain-llm-batch/batch-input.jsonl \
  --out docs/research/experiments/pilot-e4-plain-llm-batch/openai \
  --model gpt-4.1-mini \
  --temperature 0 \
  --max-completion-tokens 1200 \
  --response-format json_object
```

Candidate-constrained LLM:

```bash
npx tsx server/src/research/exportOpenAIBatchCli.ts \
  --source docs/research/experiments/pilot-e5-candidate-constrained-batch/batch-input.jsonl \
  --out docs/research/experiments/pilot-e5-candidate-constrained-batch/openai \
  --model gpt-4.1-mini \
  --temperature 0 \
  --max-completion-tokens 1200 \
  --response-format json_object
```

Verifier-revision fixture:

```bash
npx tsx server/src/research/exportOpenAIBatchCli.ts \
  --source docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/batch-input.jsonl \
  --out docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/openai \
  --model gpt-4.1-mini \
  --temperature 0 \
  --max-completion-tokens 1200 \
  --response-format json_object
```

## After Provider Completion

1. Download the provider output JSONL as `provider-results.jsonl`.
2. Run `materializeLLMProviderResultsCli.ts` as documented in `provider-result-materialization.md`.
3. Audit raw outputs.
4. Ingest raw outputs.
5. Regenerate the pilot metrics summary.
6. Generate real verifier-revision packets from first-pass LLM traces and verifier results.
7. Run, materialize, audit, and ingest the real verifier-revision condition.
8. Regenerate the before/after revision comparison.

Do not report any OpenAI-ready batch file as an experiment result. It is only a
request package.
