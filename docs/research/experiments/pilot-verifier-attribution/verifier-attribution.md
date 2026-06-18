# Paired Verifier Attribution

Status: `metrics_available`

Before: `candidate-constrained-llm`

After: `verifier-revision-llm`

Paired decisions: 32

Excluded parse failures outside revision subset: 18

## Hard-Failure Attribution

Hard failures: 35 -> 10 (-25)

Decision-level hard failures: 29 -> 9 (-20)

Bootstrap 95% CI for hard-failure-count delta: [-32, -18]

Decision-level McNemar exact p-value: <0.001

## Label Burden Deltas

| Label | Before Burden | After Burden | Delta | 95% CI | McNemar before-only/after-only | p |
| --- | ---: | ---: | ---: | --- | --- | ---: |
| legalAction | 0 | 0 | 0 | [0, 0] | 0/0 | n/a |
| beatsTable | 0 | 0 | 0 | [0, 0] | 0/0 | n/a |
| publicHistoryConsistent | 29 | 9 | -20 | [-25, -15] | 20/0 | <0.001 |
| hiddenInfoDisciplined | 6 | 1 | -5 | [-9, -1] | 5/0 | 0.063 |
| partnerConsistent | 29 | 26 | -3 | [-7, 0] | 3/0 | 0.250 |
| opponentConsistent | 22 | 20 | -2 | [-7, 3] | 4/2 | 0.688 |
| reasonActionConsistent | 1 | 0 | -1 | [-3, 0] | 1/0 | 1.000 |
| teamObjectiveValid | 19 | 18 | -1 | [-3, 0] | 1/0 | 1.000 |

## Hard-Component Attribution

| Component Label | Before Fail | After Fail | Fail Delta | Share of Hard-Failure Drop |
| --- | ---: | ---: | ---: | ---: |
| legalAction | 0 | 0 | 0 | n/a |
| beatsTable | 0 | 0 | 0 | n/a |
| publicHistoryConsistent | 29 | 9 | -20 | 80% |
| hiddenInfoDisciplined | 6 | 1 | -5 | 20% |

## Qualitative Case Pack

| Case | Decision | Action Changed | Primary Reason Changed | Key Statuses | Issues |
| --- | --- | --- | --- | --- | --- |
| public_history_repaired | pilot-e1-002-turn-1-player-0 | no | no | publicHistoryConsistent: fail->pass; partnerConsistent: fail->pass | before UNKNOWN_PUBLIC_EVIDENCE,PARTNER_BELIEF_OMITS_PUBLIC_TAG |
| hidden_info_repaired | pilot-e1-013-turn-1-player-0 | no | yes | publicHistoryConsistent: fail->pass; hiddenInfoDisciplined: fail->pass | before UNKNOWN_PUBLIC_EVIDENCE,HIDDEN_INFO_ASSERTED_AS_FACT |
| remaining_hard_failure | pilot-e1-004-turn-1-player-0 | no | no | n/a | before UNKNOWN_PUBLIC_EVIDENCE; after UNKNOWN_PUBLIC_EVIDENCE |
| parse_failure_outside_revision | pilot-e1-000-turn-1-player-0 | n/a | n/a | n/a | Parsed JSON does not match the required reasoning trace shape. |

Notes: All deltas are after minus before on paired decision ids. Failure burden is fail + unknown. Bootstrap CIs resample paired decisions with replacement and are descriptive pilot uncertainty estimates.
