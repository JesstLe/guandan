# Research Preflight Report

Status: `waiting_for_provider_results`
Generated at: `2026-06-18T00:49:21.774Z`

Submission gate: `not_ready`
Local ready: `false`
Manuscript ready: `false`
Manuscript words: `2825`

## Marker Counts

| Marker | Count |
| --- | ---: |
| NEED_SOURCE | 0 |
| UNCERTAIN | 0 |
| NEED_EXPERIMENT | 8 |
| DO_NOT_SUBMIT | 0 |
| AUTHOR_DECISION | 0 |

## Raw Output Audits

| Condition | Present | Missing | Ready for Ingest |
| --- | ---: | ---: | --- |
| Plain LLM | 0 | 50 | false |
| Candidate-Constrained LLM | 0 | 50 | false |
| Verifier Revision LLM | 0 | 50 | false |

## External Blockers

- LLM condition plain-llm has status missing_raw_outputs.
- LLM condition candidate-constrained-llm has status missing_raw_outputs.
- LLM condition verifier-revision-llm has status missing_raw_outputs.
- Verifier-revision comparison status is missing_raw_outputs.

## Local Blockers

- Submission-relevant files still have 8 NEED_EXPERIMENT markers.

## Next Actions

1. Materialize real provider outputs for: plain-llm, candidate-constrained-llm, verifier-revision-llm.
2. Resolve local blockers after provider outputs are ingested, then regenerate metrics, manuscript, gate, and preflight reports.
