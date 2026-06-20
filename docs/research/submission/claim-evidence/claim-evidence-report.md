# Claim-Evidence Report

Generated at: `2026-06-19T12:36:20.334Z`

Status: `pass`

Manuscript: `submission/aamas-latex/main.tex`

## Facts

- Claims: 8
- Supported: 1
- Scope-limited: 7
- Needs evidence: 0
- Mentions decision-point scope: yes
- Mentions full-game follow-up: yes

## Claims

| ID | Location | Status | Claim | Evidence | Scope Boundary | Required Action |
| --- | --- | --- | --- | --- | --- | --- |
| `problem-outcomes-and-fluent-explanations` | abstract | `scope_limited` | Final outcomes and fluent explanations do not guarantee valid multi-agent reasoning. | `experiments/pilot-metrics-summary/pilot-metrics-summary.json`<br>`experiments/pilot-verifier-attribution/verifier-attribution.json`<br>`submission/aamas-latex/main.tex` | Supported as a decision-point diagnostic claim; the paper does not claim full-game outcome correlation. | Keep the limitation that outcome correlation is future work. |
| `framework-structured-decision-points` | abstract | `supported` | The framework evaluates LLM agents through structured decision points and reasoning traces. | `schemas/decision-point.schema.json`<br>`schemas/reasoning-trace.schema.json`<br>`experiments/pilot-e1/manifest.json`<br>`experiments/full-e1/manifest.json` | Supported as a framework and artifact claim. | Preserve schema paths and dataset manifests in the reproducibility package. |
| `verifier-rule-grounded-labels` | abstract | `scope_limited` | A rule-grounded verifier checks legal action constraints, public history, hidden-information discipline, and reasoning-action consistency. | `server/src/research/reasoningVerifier.ts`<br>`server/src/research/reasoningVerifier.test.ts`<br>`experiments/pilot-e2-heuristic-verifier/metrics.json`<br>`experiments/pilot-e3-strategic-heuristic/metrics.json` | Supported for implemented hard checks and conservative soft labels; not a proof of strategic optimality. | Keep hard and soft labels separated in text and tables. |
| `guandan-testbed-properties` | abstract | `scope_limited` | Guandan instantiates a four-player imperfect-information partnership game with dynamic legal actions and action-only implicit signaling. | `notes/knowledge_base.md`<br>`notes/literature_matrix.csv`<br>`submission/references.bib`<br>`experiments/pilot-e1/manifest.json` | Supported as a testbed property claim; the contribution is not claiming Guandan itself is new. | Do not frame Guandan, zero communication, or ToM prompting as the novelty. |
| `pilot-parse-and-revision-numbers` | abstract | `scope_limited` | The 50-decision pilot reports parse yields and a paired hard-failure reduction from 35 to 10 on 32 eligible revision traces. | `experiments/pilot-e4-plain-llm-results/metrics.json`<br>`experiments/pilot-e5-candidate-constrained-results/metrics.json`<br>`experiments/pilot-e7-tom-prompted-results/metrics.json`<br>`experiments/pilot-e6-verifier-revision-results/metrics.json`<br>`experiments/pilot-revision-comparison/revision-comparison.json`<br>`experiments/pilot-verifier-attribution/verifier-attribution.json` | Supported for the current pilot and paired eligible subset; not an end-to-end full-game result. | Always report the 32-trace denominator alongside the 35 to 10 hard-failure reduction. |
| `posthoc-label-ablation-attribution` | abstract | `scope_limited` | A post-hoc label ablation attributes the paired label-burden reduction to public-history consistency and hidden-information discipline. | `experiments/pilot-ablation-summary/ablation-summary.json`<br>`tables/table-3-verifier-ablation.md` | Supported as post-hoc accounting, not as a prompt-level rerun with removed feedback components. | Keep the table caption explicit that this is not a rerun with modified feedback prompts. |
| `full-split-tom-scale-evidence` | introduction | `scope_limited` | The evaluation substrate and ToM condition scale beyond the 50-decision pilot to a completed 500-decision ToM full split. | `experiments/full-e4-tom-prompted-results/metrics.json`<br>`experiments/full-e5-tom-schema-repair-results/metrics.json`<br>`experiments/full-llm-summary/full-llm-summary.json`<br>`tables/table-6-full-baseline.md` | Supported for ToM full-split evidence; full plain/candidate baselines remain partial strengthening evidence. | Do not imply that full plain/candidate LLM baselines are complete. |
| `diagnostic-layer-not-bot` | introduction | `scope_limited` | The contribution is a diagnostic layer for reasoning validity, not a stronger Guandan-playing bot. | `submission/aamas-latex/main.tex`<br>`submission/aamas-self-review/aamas-self-review-report.json`<br>`submission/visual-evidence/visual-evidence-report.json` | Supported by manuscript scope language and self-review; strategic optimality and win rate are outside the current claim. | Preserve limitations and reviewer-boundary language when editing Abstract/Introduction. |
