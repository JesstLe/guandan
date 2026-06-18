# AAMAS Full-Paper Readiness Report

Generated at: `2026-06-18T10:30:11.958Z`

Paper: **Verifiable Multi-Agent Reasoning for LLM Agents in Zero-Communication Mixed-Motive Games**

Local submission hygiene: `not_ready`
AAMAS full-paper readiness: `not_ready`

The package is locally clean and pilot-complete, but it is not yet an AAMAS full-paper empirical package because full-split LLM evidence and replication/human-audit evidence remain missing.

## Key Facts

| Item | Value |
| --- | --- |
| Submission gate | `ready` |
| Manifest | 80 entries, 1 missing |
| Local pipeline | `completed`, 39 steps |
| AAMAS page count | 8 |
| Plain pilot parse | 26/50 |
| Candidate pilot parse | 32/50 |
| ToM pilot parse | 36/50 |
| ToM after schema repair | 49/50 |
| Verifier revision parse | 32/32 |
| Full split deterministic hard failures | 0 |
| Full split plain raw outputs | 0/500 present |
| Full split candidate raw outputs | 0/500 present |
| Full split ToM raw outputs | 268/500 present |
| Full split ToM parse | missing |
| Full split ToM after schema repair | 268/500 |

## Gate Audit

| Gate | Status | Finding | Required action |
| --- | --- | --- | --- |
| Local Artifact Hygiene | `needs_revision` | Local artifact hygiene is not clean enough to support a submission package. | Fix local blockers before interpreting research readiness. |
| Pilot Evidence and Denominator Accounting | `pass` | The pilot now separates provider completion, raw parse yield, schema repair, and verifier failures: ToM raw parse is 36/50, schema repair yields 49/50, and verifier revision reports 32/32. | Keep the paper wording scoped to a 50-decision diagnostic pilot unless larger LLM evidence is added. |
| Schema vs. Reasoning Attribution | `pass` | Schema repair passes through 36, repairs 13, leaves 1 unrepaired, and preserves the remaining hard verifier failure count at 1. | Use this as a reviewer-facing defense against the claim that all gains are formatting gains. |
| 500-Decision Substrate | `pass` | The 500-decision substrate is locally executable for deterministic baselines: legal-first hard failures 0, strategic hard failures 0. | Treat these rows as infrastructure validation only; do not use them as LLM evidence. |
| 500-Decision LLM Evidence | `needs_experiment` | Full-split raw output audits show plain 0/500 present, candidate 0/500 present, and ToM 268/500 present; deterministic full-ToM schema repair currently yields 268/500. | Run at least one full-split LLM condition, preferably ToM plus schema repair first, before broad AAMAS full-paper claims. |
| Replication and Human Audit | `needs_experiment` | The current package is single-provider at pilot scale and has no human audit artifact for soft strategic labels. | Add either a second model/provider pilot replication or a small human audit of soft labels; ideally do both before claiming robust multi-agent reasoning behavior. |
| AAMAS Page Budget | `pass` | AAMAS-style PDF page count is 8. | Preserve page budget by replacing prose with tables/figures when adding evidence. |

## Next Actions

1. Run the 500-decision ToM full-split provider batch first, because it directly tests whether the strongest current prompt scales beyond the pilot.
2. Run schema repair and verifier analysis on the full-split ToM outputs, preserving selectedActionId exactly as in the pilot ablation.
3. Add a second provider/model pilot replication or a small human audit of soft labels to reduce single-provider and verifier-subjectivity attacks.
4. Update the AAMAS draft only after the new evidence exists; keep current broad claims scoped to the 50-decision diagnostic pilot.
