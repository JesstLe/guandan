# Pilot Baseline Summary

## Scope

This file summarizes non-LLM baseline artifacts over the 50-point E1 pilot
decision dataset. It is pipeline evidence, not a claim about LLM reasoning
performance.

## Provenance

- Date: 2026-06-17
- Data source: `docs/research/experiments/pilot-e1/decisions/*.json`
- Dataset command:
  `npx tsx server/src/research/exportPilotDatasetCli.ts --out docs/research/experiments/pilot-e1 --count 50 --prefix pilot-e1`
- Legal-first verifier command:
  `npx tsx server/src/research/runPilotVerifierCli.ts --input docs/research/experiments/pilot-e1/decisions --out docs/research/experiments/pilot-e2-heuristic-verifier --agent heuristic-legal-first`
- Strategic heuristic command:
  `npx tsx server/src/research/runPilotVerifierCli.ts --input docs/research/experiments/pilot-e1/decisions --out docs/research/experiments/pilot-e3-strategic-heuristic --agent strategic-heuristic`
- Model and version: no external model; deterministic TypeScript baselines.
- Seed: not applicable for current handcrafted pilot rotation.
- Known exclusions: no LLM condition, no rollout-based team value, no counterfactual partner/opponent intent scoring.

## Baseline Metrics

| Condition | Trace Files | Verifier Results | Legal Action Pass | Public Consistency Pass | Hidden-Info Discipline Pass | Partner Consistency | Opponent Consistency | Reason-Action Pass | Objective Pass | Hard Failures |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `heuristic-legal-first` | 50 | 50 | 50 / 50 | 50 / 50 | 50 / 50 | 10 pass / 40 unknown | 20 pass / 30 unknown | 50 / 50 | 50 / 50 | 0 |
| `strategic-heuristic` | 50 | 50 | 50 / 50 | 50 / 50 | 50 / 50 | 10 pass / 40 unknown | 20 pass / 30 unknown | 50 / 50 | 50 / 50 | 0 |

Partner/opponent labels are public-tag checks under
`soft-label-protocol.md`; they are not counterfactual intent-quality scores.

## Interpretation Boundary

The two baselines demonstrate that the trace schema, hard verifier, artifact
writer, and metrics summarizer are executable. They do not establish the paper's
main empirical claim, because no LLM trace or verifier-in-the-loop condition has
been evaluated yet. [NEED_EXPERIMENT]
