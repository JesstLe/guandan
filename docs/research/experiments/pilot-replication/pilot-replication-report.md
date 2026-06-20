# Pilot Replication Report

Status: `pending_missing_replication`
Generated at: `2026-06-19T12:36:15.996Z`

Completed replication count: 0

## Conditions

| Condition | Role | Status | Independent? | Provider | Model | Provider Outputs | Parsed | Hard Failures |
| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: |
| primary-kimi-tom-pilot | primary | `completed` | yes | kimi-cli | kimi-code/kimi-for-coding | 50/50 | 36/50 | 1 |
| second-provider-tom-pilot | replication | `missing` | yes | second-provider | second-model | missing/missing | missing/50 | missing |

## Findings

- primary-kimi-tom-pilot is complete: 50/50 provider outputs, 36/50 parsed traces, and 1 hard verifier failures.
- second-provider-tom-pilot is missing: expected provider results at experiments/provider-results/tom-prompted-llm-second-provider.jsonl and metrics at experiments/pilot-replication/second-provider-tom-prompted-results/metrics.json.

## Required Action

Materialize one second-provider or second-model ToM pilot replication at the fixed replication paths, then rerun the local pipeline.
