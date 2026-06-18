# Full Split LLM Summary

This table is generated from 500-decision full-split LLM artifacts when provider results are present; otherwise it records raw-output readiness.

| Agent | Status | Parsed / Total | Parse Failures | Hard Failures | Legal | Public | Hidden Info | Partner/Opponent Tags | Reason-Action | Objective | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| tom-prompted-llm-full | missing_raw_outputs | 268 / 500 | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | 500-decision Kimi Code CLI ToM-prompted full split |
| tom-schema-repair-full | metrics_available | 268 / 500 | 232 | 30 | 268 pass / 0 fail / 0 unknown / 0 n/a | 267 pass / 1 fail / 0 unknown / 0 n/a | 239 pass / 29 fail / 0 unknown / 0 n/a | partner 43 pass / 11 fail / 214 unknown; opponent 83 pass / 24 fail / 161 unknown | 267 pass / 1 fail / 0 unknown / 0 n/a | 142 pass / 18 fail / 108 unknown / 0 n/a | deterministic schema repair over available full-split ToM raw outputs |
