# Research Preflight Report

Status: `research_not_ready`
Generated at: `2026-06-18T21:15:58.340Z`

Submission gate: `ready`
Local ready: `true`
AAMAS full-paper readiness: `not_ready`
Manuscript ready: `true`
Manuscript words: `3724`

## Marker Counts

| Marker | Count |
| --- | ---: |
| NEED_SOURCE | 0 |
| UNCERTAIN | 0 |
| NEED_EXPERIMENT | 0 |
| DO_NOT_SUBMIT | 0 |
| AUTHOR_DECISION | 0 |

## Raw Output Audits

| Condition | Present | Missing | Ready for Ingest |
| --- | ---: | ---: | --- |
| Plain LLM | 50 | 0 | true |
| Candidate-Constrained LLM | 50 | 0 | true |
| Verifier Revision LLM | 32 | 0 | true |

## External Blockers

None.

## Local Blockers

None.

## AAMAS Readiness Blockers

| Gate | Status | Finding | Required Action |
| --- | --- | --- | --- |
| 500-Decision LLM Evidence | `needs_experiment` | Full-split raw output audits show plain 0/500 present, candidate 0/500 present, and ToM 384/500 present; ToM metrics are 306/500 and deterministic full-ToM schema repair currently yields 384/500. The latest kimi-cli using kimi-code/kimi-for-coding run reports 384/500 successful, 0 errors, 116 pending. | Complete and materialize both the 500-decision ToM provider metrics and the matching schema-repair metrics before broad AAMAS full-paper claims. |
| Replication and Human Audit | `needs_experiment` | A human soft-label audit packet is prepared with 40 blind samples, including a local annotator HTML; the packet-quality report is packet_ready with 0 failed checks and is ready for annotation; it is not paper evidence until human labels are completed. The blind annotator package is package_ready with 0 failed checks, excludes private reference files, and excludes reference labels. The blind annotator archive is archive_ready with 0 failed checks, 53634 bytes, with SHA-256 recorded. The returned-annotation intake is awaiting_return with 1 failed checks; no returned CSV is present yet, 0/200 labels are filled, and it is not ready for agreement evaluation. The agreement evaluator is pending with 0/200 labels completed. | Complete the prepared human soft-label audit, or add a second model/provider pilot replication; ideally do both before claiming robust multi-agent reasoning behavior. |

## Next Actions

1. Complete the 500-decision ToM full-split provider batch and materialize both raw ToM metrics and schema-repair metrics before upgrading claims beyond the pilot.
2. Run schema repair and verifier analysis on the full-split ToM outputs, preserving selectedActionId exactly as in the pilot ablation.
3. Add a second provider/model pilot replication or a small human audit of soft labels to reduce single-provider and verifier-subjectivity attacks.
4. Update the AAMAS draft only after the new evidence exists; keep current broad claims scoped to the 50-decision diagnostic pilot.
