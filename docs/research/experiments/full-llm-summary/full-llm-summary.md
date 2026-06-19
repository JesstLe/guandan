# Full Split LLM Summary

This table is generated from 500-decision full-split LLM artifacts when provider results are present; otherwise it records raw-output readiness.

| Agent | Status | Parsed / Total | Parse Failures | Hard Failures | Legal | Public | Hidden Info | Partner/Opponent Tags | Reason-Action | Objective | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| tom-prompted-llm-full | partial_metrics_available | 306 / 500 | 194 | 38 | 306 pass / 0 fail / 0 unknown / 0 n/a | 305 pass / 1 fail / 0 unknown / 0 n/a | 269 pass / 37 fail / 0 unknown / 0 n/a | partner 50 pass / 13 fail / 243 unknown; opponent 94 pass / 27 fail / 185 unknown | 305 pass / 1 fail / 0 unknown / 0 n/a | 158 pass / 23 fail / 125 unknown / 0 n/a | 500-decision Kimi Code CLI ToM-prompted full split; PARTIAL ONLY: raw outputs present 384/500; missing 116; not final full-split evidence |
| tom-schema-repair-full | partial_metrics_available | 384 / 500 | 116 | 41 | 384 pass / 0 fail / 0 unknown / 0 n/a | 383 pass / 1 fail / 0 unknown / 0 n/a | 344 pass / 40 fail / 0 unknown / 0 n/a | partner 62 pass / 15 fail / 307 unknown; opponent 122 pass / 32 fail / 230 unknown | 383 pass / 1 fail / 0 unknown / 0 n/a | 191 pass / 23 fail / 170 unknown / 0 n/a | deterministic schema repair over available full-split ToM raw outputs; PARTIAL ONLY: raw outputs present 384/500; missing 116; not final full-split evidence |
