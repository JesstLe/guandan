# Figure 3: ToM Schema-Repair Flow

Source metrics:

- Raw ToM metrics: `docs/research/experiments/pilot-e7-tom-prompted-results/metrics.json`
- Schema-repair metrics: `docs/research/experiments/pilot-e8-tom-schema-repair-results/metrics.json`

| Stage | Count |
| --- | ---: |
| Provider outputs | 50 |
| Raw schema-valid traces | 36 |
| Raw schema failures | 14 |
| Pass-through traces | 36 |
| Schema-repaired traces | 13 |
| Not repairable | 1 |
| Final verifier-eligible traces | 49 |
| Hard verifier failures after repair | 1 |

Caption draft:

> Schema-repair flow for the ToM-prompted pilot. The deterministic repair layer preserves the model-selected action, passes through 36 already valid traces, repairs 13 non-conforming outputs, leaves one tool-call-like output unrepaired, and keeps the true hard verifier failure visible.
