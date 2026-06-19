# Table 3: Verifier Label Ablation

Status: `metrics_available`
Analysis mode: `post_hoc_label_ablation`
Paired decisions: 32

Rows remove one label group from paired label-burden accounting over existing before/after traces; this is not a rerun with modified feedback prompts.

| Variant | Status | Removed Component | Target Before | Target After | Target Delta | Residual Delta Without Target | Share of Observed Reduction |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| No Public-History Check | metrics_available | public-history consistency | 29 | 9 | -20 | -12 | 63% |
| No Hidden-Info Check | metrics_available | hidden-information discipline | 6 | 1 | -5 | -27 | 16% |
| No Partner Check | metrics_available | partner consistency | 29 | 26 | -3 | -29 | 9% |
| No Opponent Check | metrics_available | opponent consistency | 22 | 20 | -2 | -30 | 6% |
| No Reason-Action Check | metrics_available | reason-action consistency | 1 | 0 | -1 | -31 | 3% |
| No Team-Objective Check | metrics_available | team-objective validity | 19 | 18 | -1 | -31 | 3% |
