# Verifier Revision Comparison

Rows marked `[NEED_EXPERIMENT]` are not model results.

Status: `metrics_available`

First pass: `candidate-constrained-llm`

Revision: `verifier-revision-llm`

Hard failures: 35 -> 10 (-25)

| Label | Before Burden | After Burden | Delta | Before Pass | After Pass |
| --- | ---: | ---: | ---: | ---: | ---: |
| legalAction | 0 | 0 | 0 | 32 | 32 |
| beatsTable | 0 | 0 | 0 | 7 | 7 |
| publicHistoryConsistent | 29 | 9 | -20 | 3 | 23 |
| hiddenInfoDisciplined | 6 | 1 | -5 | 26 | 31 |
| partnerConsistent | 29 | 26 | -3 | 3 | 6 |
| opponentConsistent | 22 | 20 | -2 | 10 | 12 |
| reasonActionConsistent | 1 | 0 | -1 | 31 | 32 |
| teamObjectiveValid | 19 | 18 | -1 | 13 | 14 |

Notes: Failure burden is fail + unknown; lower after-revision values indicate fewer verifier-visible reasoning problems.
