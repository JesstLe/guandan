# Experiments

## Experiment Contract

No result table may be added without:

- data source,
- code commit or script path,
- command,
- model and version,
- seed where applicable,
- date,
- machine/runtime notes,
- known exclusions.

## Planned Experiment Pipeline

### E1: Decision-Point Export Pilot

Goal:

Export 50-100 Guandan decision points from handcrafted or simulated states.

Evidence:

- JSON files validating against `schemas/decision-point.schema.json`.
- Coverage across at least five scenario tags.

Current implementation status:

- [x] First exporter API implemented at `server/src/research/decisionPointExporter.ts`.
- [x] Unit coverage added at `server/src/research/decisionPointExporter.test.ts`.
- [x] Dataset export command for 50 decision points:
  `npx tsx server/src/research/exportPilotDatasetCli.ts --out docs/research/experiments/pilot-e1 --count 50 --prefix pilot-e1`.
- [x] JSON schema validation over exported files:
  `python3 - <<'PY' ... Draft202012Validator(decision-point.schema.json) ... PY`.
- [x] Coverage across five scenario tags:
  `lead_opening`, `follow_beat_or_pass`, `partner_near_finish`, `opponent_near_finish`, `endgame_race`.

Current artifact:

- `docs/research/experiments/pilot-e1/manifest.json`
- `docs/research/experiments/pilot-e1/decisions/*.json`

### E2: Hard Verifier Pilot

Goal:

Label hard reasoning failures:

- legal action,
- beats table,
- public-history consistency,
- hidden-information discipline.

Evidence:

- Unit tests on handcrafted states.
- Verifier result JSON validating against `schemas/verifier-result.schema.json`.

Current implementation status:

- [x] First hard verifier API implemented at `server/src/research/reasoningVerifier.ts`.
- [x] Unit coverage added at `server/src/research/reasoningVerifier.test.ts`.
- [x] Hard labels currently covered: legal action, beats table, public-history consistency, hidden-information discipline.
- [x] Soft labels currently covered: reason-action consistency, team-objective validity, partner public-tag consistency, opponent public-tag consistency.
- [x] Verifier result JSON schema validation over sample outputs:
  `docs/research/experiments/pilot-e2-heuristic-verifier/results/*.json`.
- [x] Conservative soft-label protocol v0.2 documented at `docs/research/experiments/soft-label-protocol.md`.
- [ ] Counterfactual partner/opponent intent quality remains deferred.

Current artifact:

- `docs/research/experiments/pilot-e2-heuristic-verifier/metrics.json`
- `docs/research/experiments/pilot-e2-heuristic-verifier/traces/*.json`
- `docs/research/experiments/pilot-e2-heuristic-verifier/results/*.json`

Current metrics note:

- Agent: `heuristic-legal-first`.
- Scope: pipeline validation only; this is not an LLM condition.
- Hard failures: 0 / 50.
- Reason-action consistency: 50 / 50 pass.
- Team-objective validity: 50 / 50 pass.
- Partner consistency: 10 / 50 pass, 40 / 50 unknown.
- Opponent consistency: 20 / 50 pass, 30 / 50 unknown.

### E2b: Strategic Heuristic Baseline

Goal:

Add a transparent non-LLM baseline beyond `heuristic-legal-first`.

Evidence:

- Deterministic trace agent implemented at `server/src/research/baselineTraceAgents.ts`.
- Unit tests in `server/src/research/baselineTraceAgents.test.ts`.
- Trace JSON validating against `schemas/reasoning-trace.schema.json`.
- Verifier result JSON validating against `schemas/verifier-result.schema.json`.

Current implementation status:

- [x] `strategic-heuristic` chooses a lowest-strength legal play when contesting the table or racing to finish.
- [x] 50 traces exported at `docs/research/experiments/pilot-e3-strategic-heuristic/traces/*.json`.
- [x] 50 verifier results exported at `docs/research/experiments/pilot-e3-strategic-heuristic/results/*.json`.
- [x] Metrics exported at `docs/research/experiments/pilot-e3-strategic-heuristic/metrics.json`.
- [x] Baseline summary written at `docs/research/experiments/pilot-baseline-summary.md`.
- [x] Partner/opponent public-tag consistency labels validated over pilot baselines.

### E3: LLM Prompt Pilot

Goal:

Compare plain LLM and candidate-constrained LLM on a small decision-point set.

Evidence:

- reasoning traces validating against `schemas/reasoning-trace.schema.json`,
- parse success rate,
- legality rate,
- hallucination rate.

Current implementation status:

- [x] Plain LLM prompt template fixed at `docs/research/prompts/plain-llm-v0.1.md`.
- [x] Candidate-constrained LLM prompt template fixed at `docs/research/prompts/candidate-constrained-llm-v0.1.md`.
- [x] Prompt packet exporter implemented at `server/src/research/llmPromptPackets.ts`.
- [x] Raw-output ingestion and verifier runner implemented at `server/src/research/llmOutputIngest.ts`.
- [x] Plain prompt packets exported at `docs/research/experiments/pilot-e4-plain-llm-prompts`.
- [x] Candidate-constrained prompt packets exported at `docs/research/experiments/pilot-e5-candidate-constrained-prompts`.
- [x] Provider-neutral JSONL batch exporter implemented at `server/src/research/llmBatchFiles.ts`.
- [x] Raw-output completeness audit implemented at `server/src/research/llmBatchFiles.ts`.
- [x] Provider-result materializer implemented at `server/src/research/llmProviderResults.ts`.
- [x] One-command post-provider condition runner implemented at `server/src/research/postProviderConditionRunner.ts`.
- [x] OpenAI Batch JSONL exporter implemented at `server/src/research/openAIBatchExport.ts`.
- [x] Plain batch artifacts exported at `docs/research/experiments/pilot-e4-plain-llm-batch`.
- [x] Candidate-constrained batch artifacts exported at `docs/research/experiments/pilot-e5-candidate-constrained-batch`.
- [x] OpenAI-ready plain and candidate batch files exported under each condition's `openai/` directory.
- [x] Raw-output audit currently records 0 / 50 present and 50 / 50 missing for both LLM conditions, as expected before a real model run.
- [x] Pilot metrics summary generator implemented at `server/src/research/experimentMetricsSummary.ts`.
- [x] Current pilot metrics summary generated at `docs/research/experiments/pilot-metrics-summary`.
- [x] Runbook written at `docs/research/experiments/llm-pipeline-runbook.md`.
- [ ] First model run.
- [ ] Raw outputs.
- [ ] Parsed traces.
- [ ] Verifier metrics.

### E4: Verifier-in-the-Loop Pilot

Goal:

Test whether verifier feedback reduces hard failures and reasoning-action mismatch.

Evidence:

- before/after verifier labels,
- correction success rate,
- examples of corrected reasoning/action.

Current implementation status:

- [x] Verifier revision prompt template fixed at `docs/research/prompts/verifier-revision-llm-v0.1.md`.
- [x] Revision packet exporter implemented at `server/src/research/verifierRevisionPackets.ts`.
- [x] Revision packet CLI implemented at `server/src/research/exportVerifierRevisionPacketsCli.ts`.
- [x] Fixture-only revision prompt packets exported at `docs/research/experiments/pilot-e6-verifier-revision-fixture-prompts`.
- [x] Fixture-only revision batch artifacts exported at `docs/research/experiments/pilot-e6-verifier-revision-fixture-batch`.
- [x] Fixture-only OpenAI-ready revision batch exported at `docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/openai`.
- [x] Revision raw-output audit currently records 0 / 50 present and 50 / 50 missing.
- [x] Before/after comparison writer implemented and current readiness artifact exported at `docs/research/experiments/pilot-revision-comparison`.
- [ ] Real verifier-revision LLM raw outputs.
- [ ] Before/after verifier comparison using LLM traces.
- [ ] Correction success table.

### E5: Full Evaluation

Goal:

Run full decision-point evaluation over 500-2,000 decision points.

Evidence:

- metrics tables,
- ablation tables,
- failure taxonomy,
- case studies.

## Expected Result Table Shapes

### Table 1: Reasoning Reliability

| Agent | Legal Action | Public Consistency | Hidden-Info Discipline | Reason-Action Consistency | Parse Success |
| --- | --- | --- | --- | --- | --- |
| Plain LLM | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] |
| Candidate-Constrained LLM | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] |
| ToM-Prompted LLM | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] |
| Verifier-in-the-Loop LLM | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] |

### Table 2: Team Decision Metrics

| Agent | Partner Support | Opponent Suppression | Bomb Efficiency | Pass Regret | Team Score Proxy |
| --- | --- | --- | --- | --- | --- |
| Heuristic | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] |
| Plain LLM | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] |
| Verifier-in-the-Loop LLM | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] | [NEED_EXPERIMENT] |

## Reproducibility Checklist

- [x] Fixed decision-point schema.
- [ ] Fixed reasoning trace schema.
- [x] Fixed verifier result schema.
- [x] Versioned dataset export command.
- [x] Versioned prompt templates.
- [ ] Logged model name and date.
- [ ] Logged temperature and sampling settings.
- [ ] Stored raw outputs.
- [x] Stored parsed outputs for non-LLM baseline traces.
- [x] Stored verifier labels for heuristic baseline artifacts.
- [ ] Reported failures and exclusions.
