# Provider Handoff Audit

Status: `ready`
Generated at: `2026-06-18T21:15:58.709Z`

This audit checks local handoff package consistency. Missing provider-result files are expected until external model runs are downloaded.

| Condition | Status | Mapping rows | Upload rows | Mismatches | Provider result | Success | Error | Pending |
| --- | --- | ---: | ---: | ---: | --- | ---: | ---: | ---: |
| plain-llm | `provider_results_present` | 50 | 50 | 0 | `present` | 50 | 0 | 0 |
| candidate-constrained-llm | `provider_results_present` | 50 | 50 | 0 | `present` | 50 | 0 | 0 |
| tom-prompted-llm | `provider_results_present` | 50 | 50 | 0 | `present` | 50 | 0 | 0 |
| verifier-revision-llm | `blocked_by_first_pass_results` | 32 | 0 | 32 | `present` | 32 | 0 | 0 |
| full-tom-prompted-llm | `provider_results_partial` | 500 | 500 | 0 | `present` | 384 | 0 | 116 |

## Issues

| Severity | Condition | Message |
| --- | --- | --- |
| `info` | `verifier-revision-llm` | Real verifier-revision package is intentionally blocked until first-pass LLM results exist. |
| `warning` | `full-tom-prompted-llm` | Provider result is partial: 384/500 successful rows, 0 error rows, 116 rows still pending successful output. |

## verifier-revision-llm

- Real verifier-revision package is expected to be generated only after first-pass LLM traces and verifier results exist.

## full-tom-prompted-llm

- Provider result is partial: 384/500 successful rows, 0 error rows, and 116 rows still needing successful output.

