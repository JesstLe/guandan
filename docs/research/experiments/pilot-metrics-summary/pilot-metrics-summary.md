# Pilot Metrics Summary

This table is generated from current experiment artifacts. Rows marked `missing_raw_outputs` are not model results.

| Agent | Status | Parsed / Total | Parse Failures | Hard Failures | Legal | Public | Hidden Info | Partner/Opponent Tags | Reason-Action | Objective | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| heuristic-legal-first | metrics_available | 50 / 50 | 0 | 0 | 50 pass / 0 fail / 0 unknown / 0 n/a | 50 pass / 0 fail / 0 unknown / 0 n/a | 50 pass / 0 fail / 0 unknown / 0 n/a | partner 10 pass / 0 fail / 40 unknown; opponent 20 pass / 0 fail / 30 unknown | 50 pass / 0 fail / 0 unknown / 0 n/a | 50 pass / 0 fail / 0 unknown / 0 n/a | deterministic baseline; pipeline validation only |
| strategic-heuristic | metrics_available | 50 / 50 | 0 | 0 | 50 pass / 0 fail / 0 unknown / 0 n/a | 50 pass / 0 fail / 0 unknown / 0 n/a | 50 pass / 0 fail / 0 unknown / 0 n/a | partner 10 pass / 0 fail / 40 unknown; opponent 20 pass / 0 fail / 30 unknown | 50 pass / 0 fail / 0 unknown / 0 n/a | 50 pass / 0 fail / 0 unknown / 0 n/a | deterministic strategic baseline |
| plain-llm | missing_raw_outputs | 0 / 50 | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | waiting for real model raw outputs |
| candidate-constrained-llm | missing_raw_outputs | 0 / 50 | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | waiting for real model raw outputs |
| verifier-revision-llm | missing_raw_outputs | 0 / 50 | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | fixture revision prompts exported; waiting for real revision raw outputs |
