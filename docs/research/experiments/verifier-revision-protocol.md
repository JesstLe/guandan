# Verifier Revision Protocol

Date: 2026-06-17

## Purpose

This protocol defines the E4 verifier-in-the-loop revision condition. It turns an initial reasoning trace and its verifier result into a second-round prompt asking a model to revise the trace and selected action.

No model API is called by this protocol. It only prepares prompt packets, batch files, and raw-output audits.

## Inputs

Each revision packet requires:

- one decision point from `docs/research/experiments/pilot-e1/decisions`,
- one previous reasoning trace,
- one verifier result for that trace.

For the current fixture, previous traces and verifier results come from:

- `docs/research/experiments/pilot-e3-strategic-heuristic/traces`
- `docs/research/experiments/pilot-e3-strategic-heuristic/results`

This fixture validates the protocol only. It is not an LLM result and must not be used to claim verifier-in-the-loop effectiveness.

## Export Revision Prompt Packets

```bash
npx tsx server/src/research/exportVerifierRevisionPacketsCli.ts \
  --decisions docs/research/experiments/pilot-e1/decisions \
  --traces docs/research/experiments/pilot-e3-strategic-heuristic/traces \
  --results docs/research/experiments/pilot-e3-strategic-heuristic/results \
  --out docs/research/experiments/pilot-e6-verifier-revision-fixture-prompts
```

Current output:

- `docs/research/experiments/pilot-e6-verifier-revision-fixture-prompts/manifest.json`
- `docs/research/experiments/pilot-e6-verifier-revision-fixture-prompts/packets/*.json`

## Export Revision Batch Files

```bash
npx tsx server/src/research/exportLLMBatchFilesCli.ts \
  --packets docs/research/experiments/pilot-e6-verifier-revision-fixture-prompts/packets \
  --out docs/research/experiments/pilot-e6-verifier-revision-fixture-batch
```

Current output:

- `docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/batch-input.jsonl`
- `docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/batch-manifest.json`

## Audit Revision Raw Outputs

```bash
npx tsx server/src/research/auditLLMRawOutputsCli.ts \
  --packets docs/research/experiments/pilot-e6-verifier-revision-fixture-prompts/packets \
  --raw docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/raw \
  --out docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/raw-output-audit.json
```

Current audit:

- expected outputs: 50
- present outputs: 0
- missing outputs: 50
- ready for ingest: false

## Ingest Revision Outputs After a Real Model Run

```bash
npx tsx server/src/research/ingestLLMRawOutputsCli.ts \
  --input docs/research/experiments/pilot-e1/decisions \
  --raw docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/raw \
  --out docs/research/experiments/pilot-e6-verifier-revision-results \
  --condition verifier-revision-llm
```

After ingest, regenerate the metrics summary:

```bash
npx tsx server/src/research/writePilotMetricsSummaryCli.ts \
  --out docs/research/experiments/pilot-metrics-summary
```
