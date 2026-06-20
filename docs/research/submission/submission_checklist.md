# Submission Checklist

Current status:

**Not submission-ready.**

Machine-readable gate report:

- `submission/gate-report/submission-gate-report.json`
- `submission/gate-report/submission-gate-report.md`

Reproducibility manifest:

- `submission/reproducibility-manifest.json`
- `submission/reproducibility-manifest.md`

Normalized bibliography:

- `submission/references.bib`
- `submission/citation-integrity/bibliography-integrity-report.json`
- `submission/citation-integrity/bibliography-integrity-report.md`

Research preflight report:

- `submission/preflight/research-preflight-report.json`
- `submission/preflight/research-preflight-report.md`

Submission marker inventory:

- `submission/marker-inventory/submission-marker-inventory.json`
- `submission/marker-inventory/submission-marker-inventory.md`

Experiment resolution ledger:

- `submission/experiment-resolution-ledger/experiment-resolution-ledger.json`
- `submission/experiment-resolution-ledger/experiment-resolution-ledger.md`

Provider handoff audit:

- `submission/provider-handoff-audit/provider-handoff-audit.json`
- `submission/provider-handoff-audit/provider-handoff-audit.md`

Local rebuild report:

- `submission/local-pipeline/local-research-pipeline-report.json`
- `submission/local-pipeline/local-research-pipeline-report.md`

Provider run handoff:

- `submission/provider-run-handoff.md`
- `submission/provider-handoff-audit/provider-handoff-audit.json`
- `submission/provider-handoff-audit/provider-handoff-audit.md`

Author decision brief:

- `submission/author-decision-brief.md`
- `submission/submission-profile.md`

Latest gate status: `not_ready` with 5 immediate blockers.
Latest provider handoff audit: `ready`; first-pass upload and mapping files
have matching 50-row custom-id sets for both LLM conditions, and the real
verifier-revision package is intentionally blocked until first-pass LLM results
exist.

Latest gate marker scope: submission-relevant files only. Generated readiness
reports, experiment JSON, and placeholder table artifacts are excluded from
submission marker counts so they do not inflate manuscript blockers.
Within submission-relevant files, assembled manuscript markers are treated as
blocking submission markers, while paper-as-code source markers remain visible
as workbench markers in the marker inventory.

Assembled manuscript draft:

- `submission/manuscript/manuscript-draft.md`
- `submission/manuscript/manuscript-status.json`

Latest manuscript status: 2825 words, not ready for submission, with 8 `[NEED_EXPERIMENT]` markers, 0 `[AUTHOR_DECISION]` markers, and 0 `[DO_NOT_SUBMIT]` markers.

## Gate 1: Question Quality

- [x] Problem matters to LLM agent / multi-agent reasoning audience.
- [x] Claim is narrower than the topic.
- [x] Contribution can be falsified.
- [x] Evaluation target is explicit.

Status: pass for planning stage.

## Gate 2: Related Work Integrity

- [x] Every listed work has a real source URL.
- [x] Abstract-only entries are labeled.
- [x] Closest ToM-Guandan paper has been PDF-read.
- [x] LLM-Coordination, Hanabi LLM agents, and DanZero have been PDF-read.
- [x] M3-BENCH, OpenGuanDan, and mixed-motive explanation work have been HTML-read.
- [x] Initial normalized BibTeX draft exists and passes local structural integrity checks.
- [ ] Remaining medium-priority adjacent papers have been fully read or intentionally scoped out.
- [ ] Gap is verified against a wider full-text related-work set.
- [ ] Citation claims are page/section aligned in manuscript-ready form.

Status: partial pass for immediate closest-neighbor risk; not passed for submission.

## Gate 3: Experiment Sufficiency

- [x] 50-point pilot decision dataset exists.
- [x] 500-point controlled full-evaluation decision dataset exists at `experiments/full-e1` and validates against `decision-point.schema.json`.
- [x] One strategic non-LLM baseline is implemented.
- [x] Provider-neutral LLM batch files and raw-output audits exist for plain, candidate-constrained, and fixture-only verifier-revision pilot conditions.
- [x] Provider-result materialization path and provenance template exist for downloaded model outputs.
- [x] Provider run handoff exists with exact upload files, return paths, and post-provider commands.
- [x] Provider handoff audit checks upload/mapping custom-id consistency before external runs.
- [x] Reproducibility manifest records current artifacts and missing provider-result files.
- [x] Research preflight report separates provider-output blockers from local manuscript/gate blockers.
- [x] Submission marker inventory records exact marker file/line locations for submission-relevant files.
- [x] Experiment resolution ledger maps each blocking manuscript `[NEED_EXPERIMENT]` marker to required evidence artifacts and unblock commands.
- [x] Verifier-ablation summary writer exists and currently emits a non-result `missing_metrics` readiness artifact.
- [x] Local-only rebuild pipeline refreshes metrics summary, revision comparison, ablation summary, paper tables, manuscript, marker inventory, experiment resolution ledger, gate, preflight, and reproducibility manifest.
- [x] Submission gate treats provenance as required evidence after first-pass LLM metrics exist, not as a fake pre-run local artifact.
- [x] Before/after revision comparison writer exists and currently emits a non-result readiness artifact.
- [ ] Metrics are computed for LLM/baseline conditions.
- [ ] Verifier-revision metrics are computed from real first-pass LLM traces and revision outputs.
- [ ] Before/after comparison isolates the verifier-revision effect.
- [ ] Ablations isolate the verifier mechanism.
- [ ] Error analysis explains failures.
- [x] Verifier checks cover more than final action correctness for pilot baselines.

Status: not passed.

## Gate 4: Writing Readiness

- [x] `drafts/paper-as-code/00_claims.md` exists.
- [x] Full manuscript draft is assembled from paper-as-code sections.
- [x] Related-work positioning table is included in the assembled manuscript with proper heading hierarchy.
- [x] Method draft includes formal decision-point, trace, action, verifier-label notation.
- [x] Every major claim has evidence via `submission/claim-evidence/claim-evidence-report.json`.
- [x] Method is reproducible from the paper text via `submission/method-reproducibility/method-reproducibility-report.json`.
- [x] Figure/table source drafts exist, including a related-work positioning table and experiment-result table shapes.
- [ ] Figures/tables are rendered and reconciled with final empirical results.
- [ ] Limitations are explicit and do not undercut the contribution.

Status: not passed.

## Gate 5: Submission Readiness

- [ ] No unresolved `[NEED_SOURCE]` markers.
- [ ] No unresolved `[UNCERTAIN]` markers.
- [ ] No unresolved `[NEED_EXPERIMENT]` markers.
- [ ] No unresolved `[DO_NOT_SUBMIT]` blockers.
- [x] AI-use disclosure draft exists.
- [x] Author decision brief exists for venue, baseline, LLM, annotation, and disclosure choices.
- [x] Working submission profile exists for AAMAS-first targeting.
- [x] AI-use disclosure draft has been adapted to the checked AAMAS 2026 policy.
- [ ] Final bibliography style, anonymization, and page/section alignment are adapted to the target venue.
- [ ] Result provenance available for completed LLM conditions.
- [ ] Reviewer report has no critical blocker.

Status: not passed.

## Immediate Required Work

1. Download or otherwise save provider JSONL outputs for the plain condition.
2. Materialize, audit, and ingest the plain LLM condition.
3. Download or otherwise save provider JSONL outputs for the candidate-constrained condition.
4. Materialize, audit, and ingest the candidate-constrained condition.
5. Export verifier-revision packets from real first-pass LLM traces and verifier results.
6. Write, audit, and ingest verifier-revision raw outputs.
7. Compute heuristic-vs-LLM and before/after verifier-revision metrics tables.
8. Build LLM-driven partner/opponent failure taxonomy after first model run.
9. Decide whether to PDF-read the medium-priority communication/structured-reasoning papers or cite them as background with caveats.
