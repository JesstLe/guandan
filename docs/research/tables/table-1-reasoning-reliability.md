# Table 1: Reasoning Reliability

Rows with `missing_raw_outputs` are not model results.

| Agent | Status | Parsed | Hard Failures | Legal P/F/U | Hidden P/F/U | Reason-Action P/F/U | Objective P/F/U |
| --- | --- | ---: | ---: | --- | --- | --- | --- |
| heuristic-legal-first | metrics_available | 50 / 50 | 0 | 50/0/0 | 50/0/0 | 50/0/0 | 50/0/0 |
| strategic-heuristic | metrics_available | 50 / 50 | 0 | 50/0/0 | 50/0/0 | 50/0/0 | 50/0/0 |
| plain-llm | metrics_available | 26 / 50 | 26 | 26/0/0 | 24/2/0 | 25/1/0 | 9/2/15 |
| candidate-constrained-llm | metrics_available | 32 / 50 | 35 | 32/0/0 | 26/6/0 | 31/1/0 | 13/5/14 |
| tom-prompted-llm | metrics_available | 36 / 50 | 1 | 36/0/0 | 35/1/0 | 36/0/0 | 16/2/18 |
| verifier-revision-llm | metrics_available | 32 / 32 | 10 | 32/0/0 | 31/1/0 | 32/0/0 | 14/0/18 |
