# 03 Method Draft

## Mini-Outline

1. Overview and notation.
2. Decision-point representation.
3. Structured reasoning trace.
4. Rule-grounded verifier.
5. Verifier-in-the-loop agent scaffold.
6. Metrics and label aggregation.

## Pipeline Sketch

Figure source:

- `docs/research/figures/method-pipeline.mmd`

```text
Game / timeline
  -> decision-point exporter
  -> legal action generator
  -> LLM agent prompt
  -> structured reasoning trace
  -> verifier
  -> labels + feedback
  -> revised action (optional)
  -> evaluation metrics
```

## Draft

Our method evaluates LLM agents at decision points rather than only at the end of a game. A decision point contains the acting player, public history, private hand, hand counts, current table lead, legal candidate actions, and strategic scenario tags. This representation makes the evaluation local enough to label precisely while preserving the partner and opponent context needed for mixed-motive reasoning.

Formally, let a decision point be \(d_t = (p_t, h_t, o_t, c_t, A_t, z_t)\), where \(p_t\) is the acting player, \(h_t\) is the public action history, \(o_t\) is the acting player's private observation, \(c_t\) is the current table context, \(A_t\) is the finite set of legal candidate actions, and \(z_t\) contains scenario tags derived only from public state. An agent returns a structured trace \(r_t\) and selected action \(a_t \in A_t\). The verifier maps \((d_t, r_t, a_t)\) to labels \(y_t\) and issues \(e_t\). Labels are intentionally decomposed into hard checks, which can be determined from rules and public/private-state boundaries, and soft checks, which conservatively score whether the stated objective and beliefs are consistent with available public evidence.

The decision-point exporter converts a `GameSession` state and its public timeline prefix into schema-valid records. For each exported turn, the exporter reconstructs the public history up to that point, records the current player's private hand, computes or attaches legal candidate actions, summarizes played cards, and tags the strategic scenario. This produces a standardized input object for all agent conditions, preventing different prompts from receiving incompatible state information.

The structured reasoning trace forces the LLM to expose the parts of its multi-agent reasoning that can be checked. For each decision, the agent must output a selected action, team objective, partner belief, opponent belief, action rationale, risk assessment, and confidence. This design avoids relying on unconstrained free-form explanations and gives the verifier explicit fields to check.

The verifier separates hard rule checks from soft strategic consistency checks. Hard checks include action legality, table-beating validity, public-history consistency, and hidden-information discipline. Soft checks include partner consistency, opponent consistency, team-objective validity, and reasoning-action consistency. This separation is important because deterministic rules can prove some failures, while strategic consistency often requires conservative scoring rather than absolute truth.

Hard failures are submission-critical because they indicate that a trace cannot be valid under the game state. Soft failures are diagnostic rather than dispositive: they flag a mismatch between the trace and a conservative public-state interpretation, but they do not prove that the selected action is strategically dominated. This distinction prevents the verifier from becoming an ungrounded strategic judge and lets the experiments report hard reliability and soft plausibility separately.

The verifier-in-the-loop scaffold uses verification as feedback before finalizing an action. The agent first produces a structured reasoning trace. The verifier returns hard failures and soft warnings. The agent then revises its trace and selected action under the constraint that hard failures must be resolved. The final trace is evaluated against the same verifier labels, allowing a controlled comparison between initial and revised reasoning.

We aggregate verifier labels into reasoning reliability metrics. The current pilot reports legality, public-history consistency, hidden-information discipline, partner/opponent consistency, reasoning-action consistency, team-objective validity, parse failures, and hard verifier failures. These metrics do not certify strategic optimality or full-game team performance; they measure whether verifier feedback reduces identifiable reasoning failures in structured decision-point traces.

## Module Table

| Module | Input | Output | Why Needed | Main Risk |
| --- | --- | --- | --- | --- |
| Decision-point exporter | Game timeline | Schema-valid decision point | Standardizes evaluation states | Missing state reconstruction details |
| Legal action generator | Current hand and table state | Candidate actions | Prevents action-space ambiguity | Full action generation may be complex |
| Structured trace | Prompted LLM output | JSON reasoning trace | Makes reasoning checkable | Parse failures or shallow fields |
| Verifier | Decision point + trace | Labels and issues | Converts reasoning into measurable diagnostics | Soft labels may overclaim |
| Verifier loop | Initial trace + verifier feedback | Revised trace/action | Tests whether feedback improves reliability | May only fix formatting/legality |

## Claim-Evidence Map

Claim: Decision-point evaluation enables precise labels.  
Evidence: Schema design.  
Status: partially supported; needs exporter implementation.

Claim: Structured traces make reasoning checkable.  
Evidence: `schemas/reasoning-trace.schema.json`.  
Status: supported as design; needs parse/eval evidence.

Claim: Verifier-in-the-loop reduces failures.  
Evidence: Planned experiment.  
Status: needs evidence.
