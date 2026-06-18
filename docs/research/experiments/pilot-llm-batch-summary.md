# Pilot LLM Batch Summary

Date: 2026-06-17

## Scope

This document summarizes the offline batch artifacts for the first LLM pilot and the verifier-revision fixture path. No external model API was called, and no real LLM result is recorded here.

## Batch Artifacts

| Condition | Prompt Packets | Batch JSONL | Raw Output Audit | Current Status |
|---|---:|---|---|---|
| `plain-llm` | 50 | `pilot-e4-plain-llm-batch/batch-input.jsonl` | `pilot-e4-plain-llm-batch/raw-output-audit.json` | waiting for 50 raw outputs |
| `candidate-constrained-llm` | 50 | `pilot-e5-candidate-constrained-batch/batch-input.jsonl` | `pilot-e5-candidate-constrained-batch/raw-output-audit.json` | waiting for 50 raw outputs |
| `verifier-revision-llm` | 50 | `pilot-e6-verifier-revision-fixture-batch/batch-input.jsonl` | `pilot-e6-verifier-revision-fixture-batch/raw-output-audit.json` | fixture-only prompts exported; waiting for 50 revision raw outputs |

## Audit Result

All three current raw-output audits report:

- expected outputs: 50
- present outputs: 0
- missing outputs: 50
- empty outputs: 0
- unexpected outputs: 0
- ready for ingest: false

This is expected before a real model run. These rows must not be used as LLM experiment results.

The verifier-revision row is fixture-only: it uses deterministic strategic baseline traces to validate the revision-packet format. Final verifier-in-the-loop claims require revision packets built from real first-pass LLM traces and verifier results.

## Next Commands After Raw Outputs Exist

Audit plain outputs:

```bash
npx tsx server/src/research/auditLLMRawOutputsCli.ts \
  --packets docs/research/experiments/pilot-e4-plain-llm-prompts/packets \
  --raw docs/research/experiments/pilot-e4-plain-llm-batch/raw \
  --out docs/research/experiments/pilot-e4-plain-llm-batch/raw-output-audit.json
```

Ingest plain outputs:

```bash
npx tsx server/src/research/ingestLLMRawOutputsCli.ts \
  --input docs/research/experiments/pilot-e1/decisions \
  --raw docs/research/experiments/pilot-e4-plain-llm-batch/raw \
  --out docs/research/experiments/pilot-e4-plain-llm-results \
  --condition plain-llm
```

Audit candidate-constrained outputs:

```bash
npx tsx server/src/research/auditLLMRawOutputsCli.ts \
  --packets docs/research/experiments/pilot-e5-candidate-constrained-prompts/packets \
  --raw docs/research/experiments/pilot-e5-candidate-constrained-batch/raw \
  --out docs/research/experiments/pilot-e5-candidate-constrained-batch/raw-output-audit.json
```

Ingest candidate-constrained outputs:

```bash
npx tsx server/src/research/ingestLLMRawOutputsCli.ts \
  --input docs/research/experiments/pilot-e1/decisions \
  --raw docs/research/experiments/pilot-e5-candidate-constrained-batch/raw \
  --out docs/research/experiments/pilot-e5-candidate-constrained-results \
  --condition candidate-constrained-llm
```

After real first-pass traces and verifier results exist, export verifier-revision packets:

```bash
npx tsx server/src/research/exportVerifierRevisionPacketsCli.ts \
  --decisions docs/research/experiments/pilot-e1/decisions \
  --traces docs/research/experiments/pilot-e5-candidate-constrained-results/traces \
  --results docs/research/experiments/pilot-e5-candidate-constrained-results/results \
  --out docs/research/experiments/pilot-e6-verifier-revision-prompts
```

Batch verifier-revision packets:

```bash
npx tsx server/src/research/exportLLMBatchFilesCli.ts \
  --packets docs/research/experiments/pilot-e6-verifier-revision-prompts/packets \
  --out docs/research/experiments/pilot-e6-verifier-revision-batch
```

Audit verifier-revision outputs:

```bash
npx tsx server/src/research/auditLLMRawOutputsCli.ts \
  --packets docs/research/experiments/pilot-e6-verifier-revision-prompts/packets \
  --raw docs/research/experiments/pilot-e6-verifier-revision-batch/raw \
  --out docs/research/experiments/pilot-e6-verifier-revision-batch/raw-output-audit.json
```

Ingest verifier-revision outputs:

```bash
npx tsx server/src/research/ingestLLMRawOutputsCli.ts \
  --input docs/research/experiments/pilot-e1/decisions \
  --raw docs/research/experiments/pilot-e6-verifier-revision-batch/raw \
  --out docs/research/experiments/pilot-e6-verifier-revision-results \
  --condition verifier-revision-llm
```

## Provenance Required Before Ingest

Before raw outputs are ingested, record:

- model provider,
- model identifier and version/date if available,
- temperature and sampling parameters,
- prompt packet directory,
- batch file used,
- any retry or repair policy,
- excluded decision IDs if any.

For verifier-revision outputs, also record:

- source first-pass condition,
- source trace directory,
- source verifier-result directory,
- whether all decision IDs were revised or only failed/uncertain cases were revised.
