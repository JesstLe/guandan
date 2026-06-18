# Preliminary Reviewer Report

This is a pre-experiment adversarial review. It evaluates the current research plan and paper-as-code skeleton, not a completed manuscript.

## Area Chair Summary

The project has a promising but narrower defensible direction: verifier-grounded multi-agent reasoning in zero-explicit-communication mixed-motive games with dynamic legal actions. The closest-neighbor audit tightened the framing: ToM-Guandan already covers LLM Guandan, ToM planning, absence of communication, and dynamic action-space support. M3-BENCH already covers process-aware mixed-motive evaluation. The strongest potential contribution is therefore a diagnostic framework that separates game outcome from deterministic rule-verifiable reasoning-trace consistency.

Current decision:

**Reject if submitted now. Encourage continuation after experiments.**

Main reason:

The current materials define a good research program and now include a first hard-verifier API, a 50-point decision dataset, legal-first heuristic artifacts, a strategic non-LLM baseline, prompt packets, provider-neutral LLM batch artifacts, raw-output audits, and a closest-neighbor source audit. However, there are still no real LLM comparison results and no evidence yet that verifier feedback improves reasoning reliability.

## Method Reviewer

### Strengths

- The method decomposes the problem into decision points, structured reasoning traces, and verifier labels.
- The hard/soft verifier distinction is methodologically important and prevents overclaiming.
- The JSON schemas are concrete enough to guide implementation.

### Weaknesses

- The hard verifier has a first implementation. Reason-action, team-objective, and public-tag partner/opponent soft checks are operationalized conservatively; deeper counterfactual partner/opponent intent quality remains deferred.
- Soft checks such as partner consistency and opponent consistency are public-tag checks, not full counterfactual intent-quality labels.
- The legal action generator is a dependency; if it is weak, the full method becomes unstable.

### Required Fixes

1. Extend the hard verifier labels with sample output artifacts:
   - legal action,
   - beats table,
   - public-history consistency,
   - hidden-information discipline.
2. Extend public-tag partner/opponent checks into counterfactual intent-quality rubrics only after LLM pilot failures are observed.
3. Add examples of pass/fail verifier outputs.

## Experiment Reviewer

### Strengths

- Agent conditions are reasonable: plain LLM, candidate-constrained LLM, ToM-prompted LLM, verifier-in-the-loop LLM.
- Metrics separate reasoning reliability from team-decision outcomes.
- The ablation plan is aligned with the main mechanism.
- A deterministic strategic heuristic baseline now exists, which gives the future LLM comparison a nontrivial non-LLM reference point.

### Weaknesses

- A 50-point pilot dataset, deterministic baselines, prompt packets, and provider-neutral batch files exist, but no LLM raw outputs, larger dataset, or sampling protocol exists yet.
- No model list is fixed.
- No sample size calculation or statistical plan is specified.
- No external baseline plan is finalized for OpenGuanDan or ToM-Guandan.

### Required Fixes

1. Expand or freeze the pilot dataset protocol after inspecting coverage quality.
2. Run a small pilot with one LLM against the strategic heuristic baseline.
3. Report parse success, legality rate, and verifier label distribution before attempting full game outcomes.
4. Decide whether OpenGuanDan is required as an external comparison.

## Related-Work Reviewer

### Strengths

- The materials correctly identify close work: LLM-Coordination, Hanabi LLM agents, M3-BENCH, mixed-motive explanations, DanZero, ToM-Guandan, and OpenGuanDan.
- The gap is narrowed to deterministic verifier-grounded reasoning-action consistency in dynamic-action mixed-motive team play.
- ToM-Guandan, LLM-Coordination, Hanabi LLM agents, and DanZero have now been PDF-read. M3-BENCH / OpenGuanDan / mixed-motive explanation work have been read from arXiv HTML.

### Weaknesses

- The immediate closest-neighbor risk is now better covered. Some medium-priority background entries remain less deeply read than the direct competitors.
- The old gap claim was too broad. ToM-Guandan already includes an absence-of-communication Guandan setting, and M3-BENCH already argues for process-aware mixed-motive evaluation.
- LLM-Coordination includes an LLM answer-verification step for Hanabi, and Hanabi LLM agents include reasoning traces and move-level utilities, so the paper must not claim novelty for verification or trace collection in games generally.
- Search coverage for deterministic verifier labels, rule-grounded trace checking, and hidden-information hallucination should be expanded.

### Required Fixes

1. Read full PDFs for the closest four papers.
2. Add direct quotations or page-level notes only where permitted and concise.
3. Add a related-work table comparing: communication setting, motive structure, environment, reasoning labels, verifier type, and dynamic legal actions.

## Skeptical Reviewer

### Likely Rejection Argument

This is a benchmark/scaffold paper over a niche card game. ToM-Guandan already evaluates LLM agents in no-communication Guandan with ToM and action recommendation; M3-BENCH already does process-aware mixed-motive evaluation. The verifier may only check legality, which is already expected in game agents. The strategic labels may be subjective, and without strong empirical gains the paper may look incremental over both works.

### Best Response

The paper must show that:

1. Outcome-only evaluation hides measurable reasoning failures.
2. These failures are not limited to trivial illegal actions.
3. Verifier feedback reduces reasoning-action inconsistency.
4. Deterministic rule-grounded checks reveal failures not captured by broad RPA/CCA scores or ToM-Guandan performance metrics.

## Five-Dimension Self-Review

### 1. Contribution

Status: needs experiment.

The contribution is plausible but unproven. The novelty is defensible only if the verifier labels produce insights beyond legality.

### 2. Writing Clarity

Status: pass for planning stage.

The paper-as-code skeleton has a coherent story and stable terminology. It still needs formal definitions and examples.

### 3. Experimental Strength

Status: needs new experiment.

No empirical evidence exists yet.

### 4. Evaluation Completeness

Status: needs revision.

Baselines and metrics are planned, but external baseline decisions and sample-size protocol are missing.

### 5. Method Design Soundness

Status: needs implementation.

The schema-first design is sound. The main risk is that soft strategic verifier labels become subjective or brittle.

## Blocking Items

- [DO_NOT_SUBMIT] Pilot dataset and heuristic baseline artifacts exist, but no LLM comparison has used them yet.
- [DO_NOT_SUBMIT] LLM batch files exist, but raw-output audits currently show 0 / 50 outputs present for the plain, candidate-constrained, and fixture-only verifier-revision pilot conditions.
- [DO_NOT_SUBMIT] Verifier-revision prompts are fixture-only so far; before/after claims require revision prompts built from real first-pass LLM traces and verifier results.
- [DO_NOT_SUBMIT] Soft-label protocol v0.2 exists, but deeper partner/opponent intent-quality labels and LLM evidence remain missing.
- [DO_NOT_SUBMIT] No empirical result.
- [DO_NOT_SUBMIT] Citation integrity is improved but not manuscript-ready; page/section alignment and metadata verification remain incomplete.
- [DO_NOT_SUBMIT] Citation audit exists, but final BibTeX normalization and page/section alignment are incomplete.

## Recommended Next Step

Implement the pilot research harness:

1. decision-point exporter,
2. hard verifier,
3. one LLM prompt condition,
4. one strategic-heuristic-vs-LLM metrics table,
5. LLM-driven partner/opponent failure taxonomy.
