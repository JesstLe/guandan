# Provider Handoff Audit

Status: `ready`
Generated at: `2026-06-18T00:49:22.154Z`

This audit checks local handoff package consistency. Missing provider-result files are expected until external model runs are downloaded.

| Condition | Status | Mapping rows | Upload rows | Mismatches | Provider result |
| --- | --- | ---: | ---: | ---: | --- |
| plain-llm | `waiting_for_provider_results` | 50 | 50 | 0 | `missing` |
| candidate-constrained-llm | `waiting_for_provider_results` | 50 | 50 | 0 | `missing` |
| verifier-revision-llm | `blocked_by_first_pass_results` | 0 | 0 | 0 | `missing` |

## Issues

| Severity | Condition | Message |
| --- | --- | --- |
| `info` | `plain-llm` | Provider result not present yet: docs/research/experiments/provider-results/plain-llm.jsonl. |
| `info` | `candidate-constrained-llm` | Provider result not present yet: docs/research/experiments/provider-results/candidate-constrained-llm.jsonl. |
| `info` | `verifier-revision-llm` | Real verifier-revision package is intentionally blocked until first-pass LLM results exist. |

## plain-llm

- Provider result should be saved to docs/research/experiments/provider-results/plain-llm.jsonl after the external run completes.

## candidate-constrained-llm

- Provider result should be saved to docs/research/experiments/provider-results/candidate-constrained-llm.jsonl after the external run completes.

## verifier-revision-llm

- Real verifier-revision package is expected to be generated only after first-pass LLM traces and verifier results exist.
- Provider result should be saved to docs/research/experiments/provider-results/verifier-revision-llm.jsonl after the external run completes.

