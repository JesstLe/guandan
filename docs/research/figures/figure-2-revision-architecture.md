# Figure 2: Trace-Contract Verifier Architecture

Source inputs:

- Verifier attribution: `docs/research/experiments/pilot-verifier-attribution/verifier-attribution.json`

Panel roles:

| Panel | Role | Reviewer-facing boundary |
| --- | --- | --- |
| A. Decision point | Defines the acting player, public history, private observation, legal candidates, and scenario tags. | Hidden cards are allowed input but cannot be cited as public evidence. |
| B. Trace contract | Converts an LLM action into auditable fields: action, objective, beliefs, evidence ids, rationale, risk, and confidence. | Provider-complete output is not counted as reliable unless it parses. |
| C. Rule-grounded verifier | Maps the same state, trace, and action to hard labels, soft labels, and issue codes. | The verifier diagnoses commitments but is not an action oracle. |
| D. Same-id revision | Lets the model repair the trace under the same decision state and compares paired labels. | Paired analysis uses only parseable first-pass traces and keeps schema failures visible. |

Caption draft:

> Trace-contract verifier architecture. A decision point is converted into a structured trace with explicit evidence boundaries. The verifier maps the same state, trace, and selected action to hard rule/evidence labels, soft strategic labels, and issue codes; feedback then supports bounded same-state revision without letting the verifier choose the action. In the pilot, 32 eligible paired traces reduce hard verifier failures from 35 to 10.
