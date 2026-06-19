# Verifier Ablation Summary

Status: `metrics_available`

Analysis mode: `post_hoc_label_ablation`

Paired decisions: 32

Full paired label-burden delta: -32


Rows remove one label group from the paired label-burden accounting. This is a post-hoc diagnostic over existing traces, not a rerun with different feedback prompts.

| Variant | Status | Removed Component | Target Label | Target Before | Target After | Target Delta | Residual Delta Without Target | Share of Observed Reduction |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| No Public-History Check | metrics_available | public-history consistency | publicHistoryConsistent | 29 | 9 | -20 | -12 | 63% |
| No Hidden-Info Check | metrics_available | hidden-information discipline | hiddenInfoDisciplined | 6 | 1 | -5 | -27 | 16% |
| No Partner Check | metrics_available | partner consistency | partnerConsistent | 29 | 26 | -3 | -29 | 9% |
| No Opponent Check | metrics_available | opponent consistency | opponentConsistent | 22 | 20 | -2 | -30 | 6% |
| No Reason-Action Check | metrics_available | reason-action consistency | reasonActionConsistent | 1 | 0 | -1 | -31 | 3% |
| No Team-Objective Check | metrics_available | team-objective validity | teamObjectiveValid | 19 | 18 | -1 | -31 | 3% |

Notes: Post-hoc label ablations remove one verifier label from paired burden accounting over the same before/after traces. They attribute observed verifier-label burden reductions but do not replace a future rerun that removes feedback components from the prompt.
