# AAMAS Adversarial Self-Review Report

Generated at: `2026-06-20T19:32:20.800Z`

Paper: **Verifiable Multi-Agent Reasoning for LLM Agents in Zero-Communication Mixed-Motive Games**

Status: `needs_experiment`

## Facts

- AAMAS readiness: `borderline`
- Preflight: `research_not_ready`
- Visual evidence: `ready_with_external_evidence_pending`
- Claim evidence: `pass`
- Method reproducibility: `pass`
- Replication/human-audit gate: `needs_experiment`
- Full-split LLM gate: `pass`
- Page-budget gate: `pass`
- Limitations/reviewer-boundary text present: yes

## Reviewer-Risk Checklist

| Dimension | Status | Question | Reviewer Risk | Required Action | Evidence |
| --- | --- | --- | --- | --- | --- |
| contribution | `pass` | Does the paper make a clear, non-trivial contribution beyond building a Guandan bot? | Reviewers may dismiss the work as a game-specific prompt pipeline unless the diagnostic contribution and full-split evidence stay explicit. | Keep the contribution framed as verifiable reasoning diagnostics under zero communication, not as a stronger card-playing agent. | `Pilot gate: pass`<br>`Schema-vs-reasoning attribution gate: pass`<br>`Full-split LLM evidence gate: pass` |
| writing_clarity | `pass` | Can a knowledgeable reader reproduce the method, figures, tables, and artifact boundaries? | Unclear artifact boundaries would make the pilot/full-split/protocol distinction look like post-hoc storytelling. | Preserve the current denominator, provenance, visual-evidence, and claim-evidence reports whenever the manuscript changes. | `Local artifact hygiene gate: pass`<br>`Visual evidence gate: pass`<br>`Visual evidence report: ready_with_external_evidence_pending with 5 figures and 9 tables`<br>`Claim-evidence report: pass with 0 claims needing evidence`<br>`Method reproducibility report: pass with 6/6 modules passing` |
| experimental_strength | `needs_experiment` | Are the empirical effects strong enough for AAMAS rather than only a pilot note? | The 500-decision ToM evidence is useful, but single-provider/model evidence remains attackable without replication or human validation. | Complete the prepared human soft-label audit, or add a second model/provider pilot replication; ideally do both before claiming robust multi-agent reasoning behavior. | `Full-split LLM evidence gate: pass`<br>`Replication/human-audit gate: needs_experiment`<br>`Second-provider/model pilot replication is pending_missing_replication with 0 completed replication row(s). Second-provider replication package is package_ready with 0 failed checks, fixed input rows 50/50, prompt packets 50/50, 52 packaged file(s), and is ready for an external run; it is not paper evidence until provider outputs return. Second-provider preflight is blocked_missing_independent_provider_key with fixed inputs 50/50 rows and 50/50 prompt packets, 0 second-provider output row(s), and no independent provider/model key present. blockers: No independent second-provider/model API key is available in the environment or configured env file. Kimi credentials do not count because the primary run already uses Kimi. A human soft-label audit packet is prepared with 40 blind samples, including a local annotator HTML; the packet-quality report is packet_ready with 0 failed checks and is ready for annotation; it is not paper evidence until human labels are completed. The blind annotator package is package_ready with 0 failed checks, excludes private reference files, and excludes reference labels. The blind annotator archive is archive_ready with 0 failed checks, 54786 bytes, with SHA-256 recorded. The human-audit launch checklist is ready_to_send with 0 failed checks, ready to send to annotators, 0/200 labels completed, archive SHA-256 recorded, and is not paper evidence until returned labels are completed. The human-audit evidence gate is awaiting_returns with 0 failed checks and 5 pending checks, 0/200 labels completed, annotator returns not both present, 0/200 paired labels, human-verifier macro agreement n/a, and is not paper evidence yet. The returned-annotation intake is awaiting_return with 2 failed checks; no returned CSV is present yet, 0/200 labels are filled, and it is not ready for agreement evaluation. The inter-annotator agreement report is awaiting_returns, with 0/200 paired labels, macro agreement n/a, 0 disagreements, and not ready for adjudication. The adjudication template is awaiting_returns with 1 failed checks, 0/0 disagreement rows materialized, and is not ready for adjudication. The adjudicated-annotation builder is awaiting_returns with 3 failed checks, 0/40 output rows, 0/200 labels completed, 0 unresolved disagreement(s); the adjudicated CSV is not written, and it is not ready for agreement evaluation. The agreement evaluator is pending with 0/200 labels completed.` |
| evaluation_completeness | `needs_experiment` | Are important baselines, ablations, metrics, and validation layers complete? | Reviewers can still ask whether improvements are provider-specific, prompt-specific, or verifier-subjectivity artifacts. | Run the fixed second-provider pilot replication when API access is available, or complete the prepared human audit packet. | `Replication/human-audit gate: needs_experiment`<br>`Pilot ablation and paired attribution are present, but external validation is still pending.` |
| method_design_soundness | `pass` | Does the paper honestly separate verifier validity from strategic optimality and full-game performance? | If the paper overclaims strategic optimality, the domain-specific verifier may look like an oracle or a reward model rather than a diagnostic layer. | Keep the limitation language: verifier labels diagnose reasoning validity, not optimal play or cross-game transfer. | `Page-budget gate: pass`<br>`Limitations and reviewer-boundary text present: yes` |

## Claim-Evidence Map

| Claim | Status | Evidence |
| --- | --- | --- |
| Verifier-grounded reasoning reveals failures hidden by fluent LLM explanations. | `pass` | `experiments/pilot-e4-plain-llm-results/metrics.json`<br>`experiments/pilot-e5-candidate-constrained-results/metrics.json`<br>`experiments/pilot-e7-tom-prompted-results/metrics.json`<br>`experiments/pilot-verifier-attribution/verifier-attribution.json` |
| Verifier feedback improves structured reasoning on paired eligible traces. | `pass` | `experiments/pilot-e6-verifier-revision-results/metrics.json`<br>`experiments/pilot-revision-comparison/revision-comparison.json`<br>`experiments/pilot-verifier-attribution/verifier-attribution.json` |
| The evaluation substrate scales beyond the 50-decision pilot to a 500-decision ToM full split. | `pass` | `experiments/full-e4-tom-prompted-results/metrics.json`<br>`experiments/full-e5-tom-schema-repair-results/metrics.json`<br>`experiments/full-llm-summary/full-llm-summary.json` |
| The paper is robust to single-provider or verifier-subjectivity attacks. | `needs_experiment` | `experiments/pilot-replication/pilot-replication-report.json`<br>`experiments/human-soft-label-audit/human-audit-agreement-report.json` |

## Next Actions

1. Complete the prepared human soft-label audit, or add a second model/provider pilot replication; ideally do both before claiming robust multi-agent reasoning behavior.
2. Run the fixed second-provider pilot replication when API access is available, or complete the prepared human audit packet.
3. Decide whether to add full-split plain/candidate LLM baselines or keep them as optional strengthening evidence.
4. Preserve the 8-page body budget by replacing protocol/scaffolding material if more evidence moves into the main paper.
