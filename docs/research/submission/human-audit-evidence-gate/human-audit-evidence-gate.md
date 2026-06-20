# Human Audit Evidence Gate

Generated at: `2026-06-20T02:49:48.008Z`

Status: `awaiting_returns`

## Facts

| Item | Value |
| --- | ---: |
| Launch status | `ready_to_send` |
| Samples | 40 |
| Completed labels | 0/200 |
| Annotator A present | no |
| Annotator B present | no |
| Paired labels | 0/200 |
| Inter-annotator macro agreement | n/a |
| Disagreements | 0 |
| Adjudicated status | `awaiting_returns` |
| Adjudicated CSV written | no |
| Human-verifier agreement status | `pending` |
| Human-verifier macro agreement | n/a |
| Ready for paper evidence | no |

## Checks

| Check | Status | Finding |
| --- | --- | --- |
| launch-ready | `pass` | launch status=ready_to_send |
| two-annotator-returns-present | `pending` | annotator A present=false, annotator B present=false |
| inter-annotator-structural-complete | `pending` | inter-annotator status=awaiting_returns, failed checks=2 |
| all-paired-labels-complete | `pending` | paired labels=0/200 |
| adjudicated-csv-complete | `pending` | adjudicated status=awaiting_returns, completed=0/200, written=false |
| agreement-complete | `pending` | agreement status=pending, completed=0/200, structural issues=40 |

## Acceptance Criteria

1. The blind package launch checklist is ready_to_send or evidence_ready.
2. Two independent annotator CSVs are returned with the expected sample ids and accepted label values.
3. Inter-annotator report reaches completed with all paired labels present.
4. All disagreements, if any, are adjudicated without exposing the verifier answer key to annotators.
5. The adjudicated CSV is written with all expected labels resolved.
6. The human-verifier agreement evaluator reaches completed and readyForPaperEvidence=true.

## Next Actions

1. Send the blind archive to two independent annotators, save their returned CSVs under the expected filenames, then run the inter-annotator and adjudication commands.
