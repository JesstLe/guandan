# Figure 2: Verifier-Grounded Revision Architecture

Source inputs:

- Verifier attribution: `docs/research/experiments/pilot-verifier-attribution/verifier-attribution.json`

Panel roles:

| Panel | Role | Reviewer-facing boundary |
| --- | --- | --- |
| A. First-pass trace | Builds a structured trace and routes it through a schema gate. | Provider-complete output is not counted as reliable unless it parses. |
| B. Verifier feedback | Returns hard labels, soft warnings, and issue codes. | The verifier diagnoses commitments but is not an action oracle. |
| C. Bounded revision | Lets the model repair the trace under the same decision state and compares paired labels. | Paired analysis uses only parseable first-pass traces and keeps schema failures visible. |

Caption draft:

> Verifier-grounded revision architecture. The first-pass trace must clear a schema gate before it can receive diagnostic feedback. The verifier supplies labels and issue codes, but it does not choose the action; paired revision is evaluated only for traces that are parseable before revision, while parse failures remain explicit reliability failures. In the pilot, 32 eligible paired traces reduce hard verifier failures from 35 to 10.
