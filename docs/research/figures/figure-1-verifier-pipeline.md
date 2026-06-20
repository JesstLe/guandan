# Figure 1: Verifier-Grounded Multi-Agent Reasoning Teaser

Source inputs:

- Verifier attribution: `docs/research/experiments/pilot-verifier-attribution/verifier-attribution.json`

Panel roles:

| Panel | Role | Reviewer-facing claim |
| --- | --- | --- |
| A | Cooperation contrast | The figure first contrasts explicit communication with zero-communication team play so reviewers see why intent inference is the core object rather than card strength. |
| B | Hidden team play | Guandan turns teammate intent into a latent variable: only public actions, legal candidates, roles, and hand-count signals are observable. |
| C | Trace contract and verifier | The LLM must expose field-level commitments, and the verifier map `V(d_t,r_t,a_t)` separates hard rule/evidence failures from diagnostic soft labels. |
| D | Paired evidence accounting | Verifier feedback is evaluated on the same parseable decision ids, while schema failures and end-to-end reliability stay visible. |

Caption draft:

> Verifiable multi-agent reasoning under zero communication. Unlike explicit team messages, Guandan exposes partner intent only through public actions. The framework converts an LLM action and rationale into auditable commitments, checks them with rule/evidence labels, and reports same-id revision evidence on 32 eligible paired traces while keeping schema failures visible.
