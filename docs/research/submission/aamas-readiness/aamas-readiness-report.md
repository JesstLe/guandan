# AAMAS Full-Paper Readiness Report

Generated at: `2026-06-18T21:15:57.996Z`

Paper: **Verifiable Multi-Agent Reasoning for LLM Agents in Zero-Communication Mixed-Motive Games**

Local submission hygiene: `ready`
AAMAS full-paper readiness: `not_ready`

The package is pilot-complete and within the AAMAS body-page budget, but it is not yet an AAMAS full-paper empirical package because full-split LLM evidence and completed replication or human-audit evidence remain missing.

## Key Facts

| Item | Value |
| --- | --- |
| Submission gate | `ready` |
| Manifest | 107 entries, 0 missing |
| Local pipeline | `completed`, 46 steps |
| AAMAS page count | 9 total, 8 body |
| Plain pilot parse | 26/50 |
| Candidate pilot parse | 32/50 |
| ToM pilot parse | 36/50 |
| ToM after schema repair | 49/50 |
| Verifier revision parse | 32/32 |
| Full split deterministic hard failures | 0 |
| Full split plain raw outputs | 0/500 present |
| Full split candidate raw outputs | 0/500 present |
| Full split ToM raw outputs | 384/500 present |
| Full split ToM provider run | 384/500 successful, 0 errors, 116 pending |
| Full split ToM parse | 306/500 |
| Full split ToM after schema repair | 384/500 |

## Gate Audit

| Gate | Status | Finding | Required action |
| --- | --- | --- | --- |
| Local Artifact Hygiene | `pass` | Local gate is ready, manifest has 107 entries with 0 missing, and the local pipeline status is completed. | Keep regenerating this report after every experiment or manuscript edit. |
| Pilot Evidence and Denominator Accounting | `pass` | The pilot now separates provider completion, raw parse yield, schema repair, and verifier failures: ToM raw parse is 36/50, schema repair yields 49/50, and verifier revision reports 32/32. | Keep the paper wording scoped to a 50-decision diagnostic pilot unless larger LLM evidence is added. |
| Schema vs. Reasoning Attribution | `pass` | Schema repair passes through 36, repairs 13, leaves 1 unrepaired, and preserves the remaining hard verifier failure count at 1. | Use this as a reviewer-facing defense against the claim that all gains are formatting gains. |
| 500-Decision Substrate | `pass` | The 500-decision substrate is locally executable for deterministic baselines: legal-first hard failures 0, strategic hard failures 0. | Treat these rows as infrastructure validation only; do not use them as LLM evidence. |
| 500-Decision LLM Evidence | `needs_experiment` | Full-split raw output audits show plain 0/500 present, candidate 0/500 present, and ToM 384/500 present; ToM metrics are 306/500 and deterministic full-ToM schema repair currently yields 384/500. The latest kimi-cli using kimi-code/kimi-for-coding run reports 384/500 successful, 0 errors, 116 pending. | Complete and materialize both the 500-decision ToM provider metrics and the matching schema-repair metrics before broad AAMAS full-paper claims. |
| Replication and Human Audit | `needs_experiment` | A human soft-label audit packet is prepared with 40 blind samples, including a local annotator HTML; the packet-quality report is packet_ready with 0 failed checks and is ready for annotation; it is not paper evidence until human labels are completed. The blind annotator package is package_ready with 0 failed checks, excludes private reference files, and excludes reference labels. The blind annotator archive is archive_ready with 0 failed checks, 53634 bytes, with SHA-256 recorded. The returned-annotation intake is awaiting_return with 1 failed checks; no returned CSV is present yet, 0/200 labels are filled, and it is not ready for agreement evaluation. The agreement evaluator is pending with 0/200 labels completed. | Complete the prepared human soft-label audit, or add a second model/provider pilot replication; ideally do both before claiming robust multi-agent reasoning behavior. |
| AAMAS Page Budget | `pass` | AAMAS-style PDF has 9 total pages, with the main body ending on page 8 and references allowed on additional pages. | Preserve the 8-page body budget by replacing protocol/scaffolding material when adding full-split results. |

## Next Actions

1. Complete the 500-decision ToM full-split provider batch and materialize both raw ToM metrics and schema-repair metrics before upgrading claims beyond the pilot.
2. Run schema repair and verifier analysis on the full-split ToM outputs, preserving selectedActionId exactly as in the pilot ablation.
3. Add a second provider/model pilot replication or a small human audit of soft labels to reduce single-provider and verifier-subjectivity attacks.
4. Update the AAMAS draft only after the new evidence exists; keep current broad claims scoped to the 50-decision diagnostic pilot.
