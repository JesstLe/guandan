# Figure 1: Verifier-Grounded Multi-Agent Reasoning Teaser

Source inputs:

- Verifier attribution: `docs/research/experiments/pilot-verifier-attribution/verifier-attribution.json`

Panel roles:

| Panel | Role | Reviewer-facing claim |
| --- | --- | --- |
| A | Hidden-state game | The acting agent must infer partner and opponent intent from public actions only; no direct messages or hidden cards are available. |
| B | Commitment card | The LLM exposes decision-relevant beliefs and rationales as field-level claims rather than free-form prose. |
| C | Verifier labels | Hard labels check rules and information boundaries; soft labels diagnose strategic plausibility without claiming optimality. |
| D | Paired evidence accounting | Revision is reported on the same parseable decision ids, keeping parse failures and hard-failure reductions separate. |

Caption draft:

> Verifier-grounded multi-agent reasoning in a zero-communication mixed-motive decision point. Guandan supplies hidden partner and opponent state, while the framework converts LLM rationales into auditable commitments, checks them with rule-grounded hard labels and conservative soft labels, and reports same-id revision evidence on 32 eligible traces.
