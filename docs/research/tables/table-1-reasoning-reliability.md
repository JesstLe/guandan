# Table 1: Reasoning Reliability

Rows with `missing_raw_outputs` are not model results.

| Agent | Status | Parsed | Hard Failures | Legal P/F/U | Hidden P/F/U | Reason-Action P/F/U | Objective P/F/U |
| --- | --- | ---: | ---: | --- | --- | --- | --- |
| heuristic-legal-first | metrics_available | 50 / 50 | 0 | 50/0/0 | 50/0/0 | 50/0/0 | 50/0/0 |
| strategic-heuristic | metrics_available | 50 / 50 | 0 | 50/0/0 | 50/0/0 | 50/0/0 | 50/0/0 |
| plain-llm | missing_raw_outputs | 0 / 50 | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] |
| candidate-constrained-llm | missing_raw_outputs | 0 / 50 | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] |
| verifier-revision-llm | missing_raw_outputs | 0 / 50 | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] |
