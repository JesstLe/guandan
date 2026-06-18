# Provider Handoff Audit

Status: `ready`
Generated at: `2026-06-18T10:24:27.187Z`

This audit checks local handoff package consistency. Missing provider-result files are expected until external model runs are downloaded.

| Condition | Status | Mapping rows | Upload rows | Mismatches | Provider result |
| --- | --- | ---: | ---: | ---: | --- |
| plain-llm | `provider_results_present` | 50 | 50 | 0 | `present` |
| candidate-constrained-llm | `provider_results_present` | 50 | 50 | 0 | `present` |
| tom-prompted-llm | `provider_results_present` | 50 | 50 | 0 | `present` |
| verifier-revision-llm | `blocked_by_first_pass_results` | 32 | 0 | 32 | `present` |

## Issues

| Severity | Condition | Message |
| --- | --- | --- |
| `info` | `verifier-revision-llm` | Real verifier-revision package is intentionally blocked until first-pass LLM results exist. |

## verifier-revision-llm

- Real verifier-revision package is expected to be generated only after first-pass LLM traces and verifier results exist.

