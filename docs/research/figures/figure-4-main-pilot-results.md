# Figure 4: Main Pilot Results

Source metrics:

- Pilot metrics summary: `docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json`
- Verifier attribution: `docs/research/experiments/pilot-verifier-attribution/verifier-attribution.json`

| Condition | Parsed | Total | Parse yield | Hard failures |
| --- | ---: | ---: | ---: | ---: |
| plain LLM | 26 | 50 | 52% | 26 |
| candidate constrained | 32 | 50 | 64% | 35 |
| ToM prompted | 36 | 50 | 72% | 1 |
| ToM + schema repair | 49 | 50 | 98% | 1 |
| verifier revision | 32 | 32 | 100% | 10 |

| Paired revision attribution | Before | After | Delta | Share of hard-failure drop |
| --- | ---: | ---: | ---: | ---: |
| publicHistoryConsistent | 29 | 9 | -20 | 80% |
| hiddenInfoDisciplined | 6 | 1 | -5 | 20% |

Caption draft:

> Main pilot results report three reliability layers. Parse yield rises from 26/50 for plain prompting to 36/50 under ToM prompting and 49/50 after deterministic ToM schema repair. On 32 paired candidate traces, verifier revision reduces hard failures from 35 to 10; the hard-failure-count drop is attributed to public-history consistency (80%) and hidden-information discipline (20%).
