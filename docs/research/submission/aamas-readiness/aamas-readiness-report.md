# AAMAS Full-Paper Readiness Report

Generated at: `2026-06-20T19:19:38.725Z`

Paper: **Verifiable Multi-Agent Reasoning for LLM Agents in Zero-Communication Mixed-Motive Games**

Local submission hygiene: `ready`
AAMAS full-paper readiness: `borderline`

The package now has a primary 500-decision ToM full-split LLM path; remaining AAMAS risks are replication, human soft-label audit, and optional stronger full-split baselines.

## Key Facts

| Item | Value |
| --- | --- |
| Submission gate | `ready` |
| Manifest | 146 entries, 0 missing |
| Local pipeline | `completed`, 58 steps |
| AAMAS page count | 9 total, 8 body |
| Plain pilot parse | 26/50 |
| Candidate pilot parse | 32/50 |
| ToM pilot parse | 36/50 |
| ToM after schema repair | 49/50 |
| Verifier revision parse | 32/32 |
| Full split deterministic hard failures | 0 |
| Full split plain raw outputs | 50/500 present |
| Full split candidate raw outputs | 50/500 present |
| Full split ToM raw outputs | 500/500 present |
| Full split ToM provider run | 500/500 successful, 0 errors, 0 pending |
| Full split ToM parse | 404/500 |
| Full split ToM after schema repair | 500/500 |
| Full split ToM integrated in paper | yes |

## Gate Audit

| Gate | Status | Finding | Required action |
| --- | --- | --- | --- |
| Local Artifact Hygiene | `pass` | Local gate is ready, manifest has 146 entries with 0 missing, and the local pipeline status is completed. | Keep regenerating this report after every experiment or manuscript edit. |
| Pilot Evidence and Denominator Accounting | `pass` | The pilot now separates provider completion, raw parse yield, schema repair, and verifier failures: ToM raw parse is 36/50, schema repair yields 49/50, and verifier revision reports 32/32. | Keep the paper wording scoped to a 50-decision diagnostic pilot unless larger LLM evidence is added. |
| Schema vs. Reasoning Attribution | `pass` | Schema repair passes through 36, repairs 13, leaves 1 unrepaired, and preserves the remaining hard verifier failure count at 1. | Use this as a reviewer-facing defense against the claim that all gains are formatting gains. |
| 500-Decision Substrate | `pass` | The 500-decision substrate is locally executable for deterministic baselines: legal-first hard failures 0, strategic hard failures 0. | Treat these rows as infrastructure validation only; do not use them as LLM evidence. |
| 500-Decision LLM Evidence | `pass` | The primary 500-decision ToM full-split condition is present with raw parse 404/500 and schema repair 500/500. Secondary full-split raw audits are plain 50/500 present and candidate 50/500 present. The latest kimi-cli using kimi-code/kimi-for-coding run reports 500/500 successful, 0 errors, 0 pending. | Use the ToM full split as the primary larger-scale result, then decide whether plain/candidate full baselines are needed for a stronger final submission. |
| Replication and Human Audit | `needs_experiment` | Second-provider/model pilot replication is pending_missing_replication with 0 completed replication row(s). Second-provider replication package is package_ready with 0 failed checks, fixed input rows 50/50, prompt packets 50/50, 52 packaged file(s), and is ready for an external run; it is not paper evidence until provider outputs return. Second-provider preflight is blocked_missing_independent_provider_key with fixed inputs 50/50 rows and 50/50 prompt packets, 0 second-provider output row(s), and no independent provider/model key present. blockers: No independent second-provider/model API key is available in the environment or configured env file. Kimi credentials do not count because the primary run already uses Kimi. A human soft-label audit packet is prepared with 40 blind samples, including a local annotator HTML; the packet-quality report is packet_ready with 0 failed checks and is ready for annotation; it is not paper evidence until human labels are completed. The blind annotator package is package_ready with 0 failed checks, excludes private reference files, and excludes reference labels. The blind annotator archive is archive_ready with 0 failed checks, 54786 bytes, with SHA-256 recorded. The human-audit launch checklist is ready_to_send with 0 failed checks, ready to send to annotators, 0/200 labels completed, archive SHA-256 recorded, and is not paper evidence until returned labels are completed. The human-audit evidence gate is awaiting_returns with 0 failed checks and 5 pending checks, 0/200 labels completed, annotator returns not both present, 0/200 paired labels, human-verifier macro agreement n/a, and is not paper evidence yet. The returned-annotation intake is awaiting_return with 2 failed checks; no returned CSV is present yet, 0/200 labels are filled, and it is not ready for agreement evaluation. The inter-annotator agreement report is awaiting_returns, with 0/200 paired labels, macro agreement n/a, 0 disagreements, and not ready for adjudication. The adjudication template is awaiting_returns with 1 failed checks, 0/0 disagreement rows materialized, and is not ready for adjudication. The adjudicated-annotation builder is awaiting_returns with 3 failed checks, 0/40 output rows, 0/200 labels completed, 0 unresolved disagreement(s); the adjudicated CSV is not written, and it is not ready for agreement evaluation. The agreement evaluator is pending with 0/200 labels completed. | Complete the prepared human soft-label audit, or add a second model/provider pilot replication; ideally do both before claiming robust multi-agent reasoning behavior. |
| Figure and Table Evidence Package | `pass` | Visual evidence report is ready_with_external_evidence_pending; figures 5, tables 9, required figure roles 5/5, required table roles 9/9, figure caption load avg 44.4 words / max 60 with 0 long captions, rendered pages 9/9. | After second-provider or human-audit evidence completes, reflect it in the main results/provenance visual package. |
| AAMAS Page Budget | `pass` | AAMAS-style PDF has 9 total pages, with the main body ending on page 8 and references allowed on additional pages. | Preserve the 8-page body budget by replacing protocol/scaffolding material when adding full-split results. |

## Next Actions

1. Complete the prepared human soft-label audit, or add a second model/provider pilot replication; ideally do both before claiming robust multi-agent reasoning behavior.
2. Decide whether to add full-split plain/candidate LLM baselines or keep them as optional strengthening evidence.
3. Preserve the 8-page body budget by replacing protocol/scaffolding material if more evidence moves into the main paper.
