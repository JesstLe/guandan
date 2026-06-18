# 00 Claims Ledger

## Paper Thesis

Claim:
LLM agents in zero-communication mixed-motive games should be evaluated by verifiable reasoning traces, not only by final game outcomes or natural-language plausibility.

Evidence:
Nearby benchmarks evaluate coordination, mixed-motive behavior, Guandan play, explanations, and reasoning-action gaps in neighboring agent domains. The current literature map indicates that deterministic verifier-grounded reasoning-action consistency remains under-specified for Guandan-like zero-explicit-communication mixed-motive games with dynamic legal action spaces.

Source:
`notes/literature_matrix.csv`; `notes/gap_map.md`.

Experiment:
Pilot verifier metrics compare deterministic baselines, plain LLM prompting, candidate-constrained prompting, and verifier-revision prompting on 50 controlled decision points. The current pilot evaluates reasoning reliability rather than full-game outcome metrics.

Risk:
If related work already includes equivalent rule-grounded verifier labels for structured LLM traces in dynamic legal-action mixed-motive games, the novelty weakens.

Needed action:
Decide whether `abstract_read` / `html_snippet_read` background entries need deeper reading, then run LLM experiments that show verifier labels add signal beyond outcome-only metrics.

## Contribution Claim 1: Task/Formulation

Claim:
We formulate verifiable multi-agent reasoning for zero-communication mixed-motive games as a decision-point evaluation problem with structured state, legal actions, reasoning traces, and verifier labels.

Evidence:
Local schemas define decision points, reasoning traces, and verifier results. The E1 pilot exports 50 decision points that validate against the decision-point schema.

Source:
`schemas/decision-point.schema.json`; `schemas/reasoning-trace.schema.json`; `schemas/verifier-result.schema.json`; `experiments/pilot-e1/manifest.json`.

Experiment:
Schema validation over 50 exported decision points.

Risk:
The formulation may be seen as engineering rather than research unless linked to failure modes and evaluation gains.

Needed action:
Show that the formulation exposes failures not visible in outcome-only evaluation.

## Contribution Claim 2: Verifier

Claim:
A rule-grounded verifier can detect hard reasoning failures such as illegal actions, table-beating errors, public-history contradictions, and hidden-information hallucinations.

Evidence:
Verifier schema, verifier implementation, and unit tests provide a first working structure. E2/E3 pilot artifacts include 100 total verifier result files across two deterministic baseline conditions. The verifier now also labels reason-action consistency, team-objective validity, and public-tag partner/opponent consistency under a conservative soft-label protocol.

Source:
`schemas/verifier-result.schema.json`; `server/src/research/reasoningVerifier.ts`; `server/src/research/reasoningVerifier.test.ts`; `experiments/soft-label-protocol.md`; `experiments/pilot-e2-heuristic-verifier/metrics.json`; `experiments/pilot-e3-strategic-heuristic/metrics.json`.

Experiment:
Unit tests on handcrafted states and schema validation over pilot verifier outputs.

Risk:
Hard checks may be too trivial; soft checks must be separated and carefully validated. Public-tag partner/opponent checks are weaker than counterfactual intent-quality labels.

Needed action:
Run LLM conditions and test whether public-tag and future counterfactual soft labels diagnose nontrivial failures.

## Contribution Claim 3: Verifier-in-the-Loop Scaffold

Claim:
Verifier feedback can reduce reasoning-action mismatch and invalid reasoning compared with plain and candidate-constrained LLM agents.

Evidence:
Pilot LLM experiments with Kimi Code CLI show that verifier revision reduces hard verifier failures on the parsed candidate-trace subset: candidate-constrained prompting has 35 hard failures over 50 decision points, while verifier revision has 10 hard failures over the 32 candidate traces that parsed and were eligible for revision.

Source:
`experiments/pilot-metrics-summary/pilot-metrics-summary.json`; `experiments/pilot-revision-comparison/revision-comparison.json`; `tables/table-1-reasoning-reliability.md`; `tables/table-2-verifier-revision-effect.md`.

Experiment:
Before/after verifier-in-the-loop evaluation on parsed candidate traces.

Risk:
Verifier feedback may only improve formatting or legality, not strategic reasoning.

Needed action:
Report separate hard/soft label improvements and avoid overclaiming strategic optimality.

## Contribution Claim 4: Failure Taxonomy

Claim:
LLM agents exhibit distinct reasoning failures in this setting, including illegal-action hallucination, hidden-information hallucination, partner-intent mismatch, opponent-threat mismatch, and reasoning-action inconsistency.

Evidence:
The verifier labels expose parse failures, public-history inconsistencies, hidden-information failures, partner/opponent consistency warnings, reasoning-action mismatch, and team-objective failures in the pilot LLM conditions.

Source:
`2026-06-17-research-proposal.md`; `2026-06-17-experiment-plan.md`; `experiments/pilot-metrics-summary/pilot-metrics-summary.json`; `experiments/pilot-e4-plain-llm-results/metrics.json`; `experiments/pilot-e5-candidate-constrained-results/metrics.json`; `experiments/pilot-e6-verifier-revision-results/metrics.json`.

Experiment:
Verifier-labeled pilot failure analysis. Manual qualitative case-study writing remains future work.

Risk:
Taxonomy may overlap with existing M3-BENCH process labels.

Needed action:
Align taxonomy with M3-BENCH RPA/CCA and mixed-motive explanation work, and explicitly identify what is unique to deterministic rule-verifiable play rather than generic social-reasoning labels.
