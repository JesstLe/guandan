# Reviewer Attack Report: Post-Pilot Submission Stress Test

Date: 2026-06-18

Paper: **Verifiable Multi-Agent Reasoning for LLM Agents in Zero-Communication Mixed-Motive Games**

This report treats the current manuscript and artifacts as a near-submission package and reviews them as a skeptical CCF B+ or above reviewer panel would. It is intentionally stricter than the local submission gate: the gate checks artifact completeness and marker hygiene, while this report asks whether the empirical story would survive external review.

## Evidence Base

Primary manuscript:

- `docs/research/submission/manuscript/manuscript-draft.md`
- `docs/research/submission/manuscript/manuscript-status.json`

Primary result artifacts:

- `docs/research/tables/table-1-reasoning-reliability.md`
- `docs/research/tables/table-2-verifier-revision-effect.md`
- `docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json`
- `docs/research/experiments/pilot-revision-comparison/revision-comparison.json`

Submission checks:

- `docs/research/submission/gate-report/submission-gate-report.json`
- `docs/research/submission/preflight/research-preflight-report.json`

Local status:

- Gate status: `ready`
- Preflight status: `ready_for_submission`
- Manuscript marker counts: `NEED_SOURCE=0`, `UNCERTAIN=0`, `NEED_EXPERIMENT=0`, `DO_NOT_SUBMIT=0`, `AUTHOR_DECISION=0`

Pilot evidence:

- `plain-llm`: 50/50 provider outputs, 26/50 parsed traces, 24 parse failures, 26 hard verifier failures.
- `candidate-constrained-llm`: 50/50 provider outputs, 32/50 parsed traces, 18 parse failures, 35 hard verifier failures.
- `verifier-revision-llm`: 32/32 provider outputs on eligible parsed candidate traces, 32/32 parsed traces, 10 hard verifier failures.
- Revision comparison: hard failures drop from 35 to 10 on the parsed candidate subset; public-history burden drops from 29 to 9; hidden-information burden drops from 6 to 1.

## Editorial Decision

**Major Revision before external submission.**

The work has a defensible contribution shape: it is not trying to be a stronger Guandan bot, but a verifier-grounded diagnostic framework for LLM-agent reasoning in zero-communication, mixed-motive, dynamic-action settings. The current package is substantially stronger than a plan-only paper because it includes provider-complete pilot runs, structured traces, verifier outputs, tables, reproducibility artifacts, and a clean local submission gate.

However, a strong reviewer can still reject the current version as an underpowered pilot with ambiguous causal attribution. The biggest vulnerability is not artifact completeness. It is the inference from "verifier revision improves failures" to "verifier-grounded reasoning is a robust method." The revision result is promising, but it is measured only on the 32 parsed candidate-constrained traces, and the paper has not yet separated schema/format repair from reasoning repair.

## Reviewer Matrix

| Dimension | Area Chair | R1 Methodology | R2 Literature/Domain | R3 Systems/Reproducibility | Devil's Advocate |
| --- | --- | --- | --- | --- | --- |
| Overall | Major Revision | Major Revision | Borderline | Minor-to-Major | Reject unless strengthened |
| Confidence | 4/5 | 5/5 | 4/5 | 4/5 | 5/5 |
| Main strength | Clear verifier-grounded framing | Decomposed labels and artifacts | Careful novelty boundary | Reproducible local pipeline | Real pilot, not only proposal |
| Main weakness | Pilot-level evidence | Selection and attribution | Close prior work pressure | Provider/client disclosure | Could look like prompt engineering |
| Must fix | Add attribution evidence | Paired subset + ablations | Sharpen novelty table | Log run metadata and cases | Show verifier catches nontrivial failures |

## Major Findings

### F1. The revision result is promising but selection-biased.

Severity: **High**

The verifier-revision condition is run only on the 32 candidate-constrained traces that were parseable. This is methodologically reasonable, but the manuscript must make the estimand explicit:

- It does not prove improvement over all 50 decision points.
- It proves improvement on the parsed candidate subset.
- It mixes two different failure channels: parseability and verifier consistency.

Current text mostly acknowledges this, but a reviewer can still argue that the headline "hard failures drop from 35 to 10" is too easy to overread. The paper should report two views side by side:

- End-to-end condition reliability over all 50 prompts.
- Paired revision reliability over the 32 eligible traces.

### F2. The paper has not yet proven that verifier feedback improves reasoning rather than formatting.

Severity: **High**

The largest observed gain is public-history consistency: burden drops from 29 to 9. Hidden-information burden drops from 6 to 1. These are strong signals, but the current evidence does not yet isolate why the gain happened.

A skeptical reviewer will ask whether the revision prompt simply made the model obey JSON/schema instructions better or copy verifier labels back into the answer, instead of improving the underlying decision reasoning. This is the most important attack to neutralize before CCF B+ submission.

Required response:

- Add a component ablation or paired error analysis showing which verifier labels drive the gain.
- Separate "format/schema repair" from "reasoning-label repair."
- Include qualitative examples where the selected action/rationale changes in a verifier-meaningful way, not only the JSON shape.

### F3. The pilot sample is too small for broad claims.

Severity: **High**

The 50-decision pilot is enough to validate the pipeline and motivate the method. It is not enough to support strong claims about LLM agents in general, Guandan reasoning in general, or zero-communication mixed-motive games in general.

The manuscript currently says this is a pilot and avoids full-game claims. That is good. But for CCF B+ or above, the paper should still add at least one of:

- A full `full-e1` run with the same conditions on 500 decision points.
- A cheaper statistical treatment of the existing 50-decision pilot with bootstrap confidence intervals and paired tests.
- A second model/provider replication on the pilot set.

The lowest-cost useful step is the statistical treatment plus verifier ablation, because it can be done on existing artifacts before new API spending.

### F4. Candidate constraints improve parse rate but not hard failures.

Severity: **Medium-High**

The candidate-constrained condition parses more traces than plain prompting: 32/50 vs. 26/50. But it also has more hard verifier failures: 35 vs. 26. This is not necessarily bad because more parsed traces expose more verifier-checkable failures, but the table can confuse reviewers.

The paper should explicitly explain:

- Parse yield and verifier failures measure different things.
- A condition with more parsed traces can reveal more failures.
- The appropriate comparison for revision is paired on candidate-constrained parsed traces, not raw hard-failure totals across conditions.

Without this explanation, a reviewer may incorrectly conclude that candidate constraints make reasoning worse.

### F5. The related-work boundary is narrow and must stay disciplined.

Severity: **Medium-High**

The manuscript correctly avoids claiming novelty for Guandan LLM agents, ToM prompting, dynamic legal actions, mixed-motive process evaluation, or game-agent verification in general. This restraint is crucial because ToM-Guandan, OpenGuanDan, M3-BENCH, LLM-Coordination, Hanabi LLM agents, Strat-Reasoner, and ToolPoker all occupy nearby space.

The novelty claim should remain:

> A rule-grounded diagnostic verifier for structured LLM reasoning traces in zero-explicit-communication, mixed-motive, dynamic-action team play.

Do not broaden this into "first LLM Guandan benchmark" or "first verification of LLM game reasoning." Those claims are attackable.

### F6. Soft verifier labels need calibration language.

Severity: **Medium**

Hard labels such as legal action, table beating, public-history consistency, and hidden-information discipline are defensible. Soft labels such as partner consistency, opponent consistency, and team-objective validity are more subjective.

The manuscript already separates hard and soft labels, but the next revision should add clearer calibration:

- Soft labels are conservative diagnostics, not proof of optimality.
- Unknown labels are not failures in the same sense as deterministic rule violations.
- Failure burden is `fail + unknown`, so it intentionally penalizes noncommittal or under-specified traces.

This protects the paper from the attack that the verifier is secretly a hand-written strategic judge.

### F7. Reproducibility is strong locally but provider disclosure needs care.

Severity: **Medium**

The code and artifacts are unusually complete for this stage: raw provider outputs, parser outputs, verifier results, summary tables, gate report, preflight, and reproducibility manifest exist. That is a real strength.

But external reviewers will still need:

- Exact provider/client identity.
- Model name or CLI mode.
- Date of runs.
- Temperature or decoding settings when available.
- Prompt template versions.
- A note that API keys are never stored in artifacts.

The paper can describe the pilot as "Kimi Code CLI outputs" if that is the actual reproducible client, but it should avoid implying a stable public model ID unless one was logged.

## Devil's Advocate Rejection Letter

The paper proposes a verifier for LLM traces in Guandan, but the core experiment is only a 50-decision pilot with one provider/client. The strongest result, verifier revision reducing hard failures from 35 to 10, is measured only after excluding 18 unparseable candidate outputs. The verifier may be teaching the model to satisfy a checklist rather than improving strategic reasoning. Candidate constraints increase parseability but do not clearly improve hard-failure counts. The evaluation does not include full-game outcomes, multi-model replication, confidence intervals, or component ablations. Closely related work already studies LLMs in Guandan, mixed-motive process evaluation, and game reasoning traces. Without stronger empirical attribution, this looks like a useful engineering diagnostic rather than a CCF B+ research contribution.

## Best Author Response

The paper should concede the pilot scope and answer the rejection at the exact weak point:

1. The target is not game-winning strength; it is verifier-visible reasoning reliability.
2. The current pilot establishes that provider-complete outputs still fail structured reasoning checks.
3. Revision is evaluated only on the eligible paired subset, and the paper reports this explicitly.
4. A new ablation and paired analysis show that the gain is not merely schema repair.
5. Qualitative cases show concrete public-history and hidden-information reasoning repairs.

This response turns the weakness into a controlled-scope contribution instead of overclaiming.

## Required Next Experiment

**Run a verifier-attribution experiment on existing artifacts before spending more API budget.**

This is the highest-value next step because it directly addresses the most dangerous reviewer attack and can likely be done without new model calls.

Minimum deliverables:

1. **Paired subset table**
   - Unit: the 32 candidate-constrained traces that have corresponding revision traces.
   - Report before/after for each verifier label.
   - Separate hard deterministic labels from soft labels.
   - Include exact counts and deltas.

2. **Uncertainty estimates**
   - Add bootstrap confidence intervals for the before/after failure-burden delta.
   - Add a paired sign test or McNemar-style test for binary hard-failure presence if the label representation supports it.

3. **Verifier-component ablation**
   - Recompute failure burden with each verifier component removed:
     - public-history consistency,
     - hidden-information discipline,
     - partner consistency,
     - opponent consistency,
     - reasoning-action consistency,
     - team-objective validity.
   - Show which components account for the 35 to 10 hard-failure drop.

4. **Qualitative case pack**
   - One public-history hallucination repaired by verifier revision.
   - One hidden-information failure repaired.
   - One remaining failure after revision.
   - One parse/schema failure that remains outside the revision subset.

5. **End-to-end vs paired framing**
   - Add a small table that distinguishes:
     - all 50 prompts,
     - 32 parsed candidate traces,
     - 32 revised traces.

## Revision Roadmap

### P0: Must do before CCF B+ submission

- Add the verifier-attribution experiment above.
- Add paired subset framing to the manuscript.
- Add uncertainty estimates or explicitly state that the current numbers are descriptive pilot counts.
- Add 3-4 qualitative cases from raw traces and verifier outputs.
- Clarify that revision results are not measured over unparseable candidate outputs.

### P1: Strongly recommended

- Run a second provider/model on the 50-decision pilot, or explain why the pilot is single-provider.
- Run at least one more condition on `full-e1` if budget allows.
- Add a compact "closest work vs this paper" table in the main manuscript, not only notes.
- Add exact run metadata for all provider-backed rows.

### P2: Nice to have

- Add full-game outcome evaluation.
- Add human annotation for a small sample of soft labels.
- Add cross-game transfer beyond Guandan.

## Submission Recommendation

Do not send the current version as the final CCF B+ submission yet. It is locally clean and coherent, but one more narrow experiment will make it much harder to reject.

Recommended next action:

> Implement the verifier-attribution analysis on existing pilot artifacts, update Tables 1-2, add a qualitative case pack, then rerun the submission gate.

This is a better next step than immediately scaling to 500 LLM calls, because it attacks the central causal question first: whether the verifier improves verifiable reasoning, not just output format.
