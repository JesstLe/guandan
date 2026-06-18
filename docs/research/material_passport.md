# Material Passport

## Passport Metadata

- Project: Verifiable Multi-Agent Reasoning for LLM Agents in Zero-Communication Mixed-Motive Games
- Created: 2026-06-17
- Root: `docs/research`
- Status: planning, pre-experiment drafting, and pilot harness implementation

## Current Artifacts

### Research Setup

- `PROJECT.md`
- `AGENTS.md`
- `README.md`

### Planning

- `idea/research_plan.md`
- `2026-06-17-research-proposal.md`
- `2026-06-17-related-work-map.md`
- `2026-06-17-experiment-plan.md`

### Literature

- `notes/literature_matrix.csv`
- `notes/knowledge_base.md`
- `notes/gap_map.md`
- `notes/source_verification_report.md`
- `notes/related_work_comparison.md`
- `notes/citation_integrity_audit.md`
- `submission/references.bib`
- `submission/citation-integrity/bibliography-integrity-report.json`
- `submission/citation-integrity/bibliography-integrity-report.md`
- `papers/yim2024tomguandan.pdf`
- `papers/yim2024tomguandan.txt`
- `papers/agashe2023llmcoordination.pdf`
- `papers/agashe2023llmcoordination.txt`
- `papers/ramesh2026hanabi.pdf`
- `papers/ramesh2026hanabi.txt`
- `papers/lu2022danzero.pdf`
- `papers/lu2022danzero.txt`

### Schemas

- `schemas/decision-point.schema.json`
- `schemas/reasoning-trace.schema.json`
- `schemas/verifier-result.schema.json`

### Experiment Contract

- `experiments/README.md`
- `experiments/full-e1/manifest.json`
- `experiments/full-e1/decisions/*.json`
- `experiments/pilot-baseline-summary.md`
- `experiments/llm-pipeline-runbook.md`
- `submission/provider-run-handoff.md`
- `submission/provider-handoff-audit/provider-handoff-audit.json`
- `submission/provider-handoff-audit/provider-handoff-audit.md`
- `experiments/pilot-llm-batch-summary.md`
- `experiments/verifier-revision-protocol.md`
- `experiments/pilot-metrics-summary/pilot-metrics-summary.json`
- `experiments/pilot-metrics-summary/pilot-metrics-summary.md`
- `experiments/pilot-ablation-summary/ablation-summary.json`
- `experiments/pilot-ablation-summary/ablation-summary.md`
- `experiments/soft-label-protocol.md`

### Prompt Templates

- `prompts/plain-llm-v0.1.md`
- `prompts/candidate-constrained-llm-v0.1.md`
- `prompts/verifier-revision-llm-v0.1.md`

### Draft

- `drafts/paper-as-code/00_claims.md`
- `drafts/paper-as-code/01_introduction.md`
- `drafts/paper-as-code/02_related_work.md`
- `drafts/paper-as-code/03_method.md`
- `drafts/paper-as-code/04_experiments.md`
- `drafts/paper-as-code/05_discussion_limitations.md`
- `drafts/paper-as-code/06_abstract.md`

### Review and Submission Gates

- `reviews/reviewer_report.md`
- `submission/submission_checklist.md`
- `submission/reproducibility-manifest.json`
- `submission/reproducibility-manifest.md`
- `submission/preflight/research-preflight-report.json`
- `submission/preflight/research-preflight-report.md`
- `submission/marker-inventory/submission-marker-inventory.json`
- `submission/marker-inventory/submission-marker-inventory.md`
- `submission/experiment-resolution-ledger/experiment-resolution-ledger.json`
- `submission/experiment-resolution-ledger/experiment-resolution-ledger.md`
- `submission/local-pipeline/local-research-pipeline-report.json`
- `submission/local-pipeline/local-research-pipeline-report.md`
- `submission/citation-integrity/bibliography-integrity-report.json`
- `submission/citation-integrity/bibliography-integrity-report.md`
- `submission/author-decision-brief.md`
- `submission/submission-profile.md`
- `submission/provider-run-handoff.md`
- `submission/provider-handoff-audit/provider-handoff-audit.json`
- `submission/provider-handoff-audit/provider-handoff-audit.md`

## Active Markers

- `[NEED_SOURCE]`: 0 blocking markers.
- `[UNCERTAIN]`: 0 blocking markers.
- `[NEED_EXPERIMENT]`: 8 blocking manuscript markers.
- `[DO_NOT_SUBMIT]`: 0 blocking markers.
- `[AUTHOR_DECISION]`: 0 blocking markers.

## Next Stage

Build the pilot research harness:

1. decision-point exporter: first API and unit tests complete.
2. hard verifier: first API and unit tests complete.
3. pilot dataset: 50 decision points exported and schema-validated at `experiments/pilot-e1`.
3a. full evaluation dataset: 500 controlled `GameSession` decision points exported and schema-validated at `experiments/full-e1`; manifest records `datasetConstruction=controlled_game_session_states`.
4. verifier artifacts: 50 legal-first traces/results and 50 strategic-heuristic traces/results exported.
5. soft verifier: reason-action, team-objective, partner public-tag, and opponent public-tag labels implemented; counterfactual partner/opponent intent quality deferred.
6. prompt templates and prompt packet exporter: plain and candidate-constrained v0.1 fixed.
7. raw-output ingest pipeline: implemented and fixture-checked; no real LLM run yet.
8. provider-neutral LLM batch export and raw-output audit: implemented; plain and candidate-constrained batch artifacts exported with 50 missing raw outputs each.
9. provider-result materialization: implemented for downloaded provider JSONL outputs with provenance recording; no provider output has been materialized yet.
10. post-provider condition runner: implemented to materialize, audit, and ingest completed provider result JSONL files only when raw-output audit is complete.
11. OpenAI Batch export: implemented and generated for plain, candidate-constrained, and fixture-only verifier-revision conditions; no upload or API call has been made.
12. verifier-in-the-loop revision protocol: implemented and fixture-checked with strategic-heuristic traces; revision LLM raw outputs not started.
13. revision comparison artifact: implemented as a readiness/result table writer; current artifact is marked `missing_raw_outputs`.
14. pilot metrics summary: generated from heuristic metrics and LLM raw-output audits; LLM-condition rows are marked `missing_raw_outputs`.
14a. verifier ablation summary: implemented as a readiness/result table writer; current artifact is marked `missing_metrics` with five planned ablation variants.
15. submission gate: implemented and generated; current status is `not_ready`.
16. AI-use disclosure: draft exists, but target-venue adaptation remains an author decision.
17. manuscript assembly: full Markdown draft generated from paper-as-code sections; current status is not ready for submission.
18. figure/table source drafts: method pipeline Mermaid figure and two compact paper table sources exist; final rendering and empirical reconciliation remain pending.
19. reproducibility manifest: implemented and generated; current manifest records artifact presence, full-evaluation dataset artifacts, and missing provider-result JSONL files.
20. research preflight report: implemented and generated; current status is `waiting_for_provider_results`.
21. submission marker inventory: implemented and generated; current inventory records exact marker file/line locations for submission-relevant files.
22. experiment resolution ledger: implemented and generated; all 8 remaining blocking manuscript `[NEED_EXPERIMENT]` markers are mapped to missing evidence artifacts and unblock commands.
23. local rebuild pipeline: implemented and generated; `npm run research:local-pipeline` refreshes local downstream research artifacts without external provider calls.
24. bibliography integrity: normalized BibTeX draft and local structural integrity report implemented; final venue formatting and page/section alignment remain pending.
25. working submission profile: AAMAS-first default, OpenGuanDan deferral, cost-controlled first LLM run, optional expert labels, and AAMAS 2026 AI-use policy adaptation recorded.
26. provider run handoff: exact first-pass upload files, provider-result return paths, post-provider ingestion commands, and real verifier-revision regeneration sequence recorded.
27. provider handoff audit: implemented and generated; first-pass upload/mapping custom ids align, while real verifier-revision is correctly blocked until first-pass LLM traces exist.
28. first LLM run: not started.
29. closest-neighbor source audit: ToM-Guandan, LLM-Coordination, Hanabi LLM agents, and DanZero PDF-read; M3-BENCH, OpenGuanDan, mixed-motive explanation, activation communication, CodeAgents, LLM/game-theory survey, and reasoning-execution gap neighbors added or upgraded in the literature matrix.

## Latest Verification

- `npm run test:run -- server/src/research/decisionPointExporter.test.ts server/src/research/reasoningVerifier.test.ts`: passed.
- `npm run test:run -- server/src/research/pilotDatasetExporter.test.ts`: passed.
- `npx tsx server/src/research/exportPilotDatasetCli.ts --out docs/research/experiments/pilot-e1 --count 50 --prefix pilot-e1`: exported 50 decision points covering five scenario tags.
- `jq empty docs/research/experiments/pilot-e1/manifest.json docs/research/experiments/pilot-e1/decisions/*.json`: passed.
- `python3` JSON Schema validation with `Draft202012Validator` over `schemas/decision-point.schema.json`: validated 50 decision files.
- `npm run test:run -- server/src/research/pilotVerifierRunner.test.ts`: passed.
- `npx tsx server/src/research/runPilotVerifierCli.ts --input docs/research/experiments/pilot-e1/decisions --out docs/research/experiments/pilot-e2-heuristic-verifier`: exported 50 verifier results with 0 hard failures.
- `python3` JSON Schema validation with `Draft202012Validator` over `schemas/verifier-result.schema.json`: validated 50 verifier result files.
- `npm run test:run -- server/src/research/baselineTraceAgents.test.ts`: passed.
- `npx tsx server/src/research/runPilotVerifierCli.ts --input docs/research/experiments/pilot-e1/decisions --out docs/research/experiments/pilot-e3-strategic-heuristic --agent strategic-heuristic`: exported 50 strategic baseline traces/results with 0 hard failures.
- `python3` JSON Schema validation with `Draft202012Validator` over `schemas/reasoning-trace.schema.json`: validated E2/E3 trace files.
- `npm run test:run -- server/src/research/llmPromptPackets.test.ts server/src/research/llmOutputIngest.test.ts`: passed.
- `npm run test:run -- server/src/research/llmBatchFiles.test.ts`: passed.
- `npm run test:run -- server/src/research/experimentMetricsSummary.test.ts`: passed.
- `npm run test:run -- server/src/research/verifierRevisionPackets.test.ts`: passed.
- `npx tsx server/src/research/exportLLMPromptPacketsCli.ts --input docs/research/experiments/pilot-e1/decisions --out docs/research/experiments/pilot-e4-plain-llm-prompts --condition plain-llm`: exported 50 prompt packets.
- `npx tsx server/src/research/exportLLMPromptPacketsCli.ts --input docs/research/experiments/pilot-e1/decisions --out docs/research/experiments/pilot-e5-candidate-constrained-prompts --condition candidate-constrained-llm`: exported 50 prompt packets.
- `npx tsx server/src/research/exportLLMBatchFilesCli.ts --packets docs/research/experiments/pilot-e4-plain-llm-prompts/packets --out docs/research/experiments/pilot-e4-plain-llm-batch`: exported 50 provider-neutral batch rows.
- `npx tsx server/src/research/exportLLMBatchFilesCli.ts --packets docs/research/experiments/pilot-e5-candidate-constrained-prompts/packets --out docs/research/experiments/pilot-e5-candidate-constrained-batch`: exported 50 provider-neutral batch rows.
- `npx tsx server/src/research/auditLLMRawOutputsCli.ts --packets docs/research/experiments/pilot-e4-plain-llm-prompts/packets --raw docs/research/experiments/pilot-e4-plain-llm-batch/raw --out docs/research/experiments/pilot-e4-plain-llm-batch/raw-output-audit.json`: reported 50 missing raw outputs, not ready for ingest.
- `npx tsx server/src/research/auditLLMRawOutputsCli.ts --packets docs/research/experiments/pilot-e5-candidate-constrained-prompts/packets --raw docs/research/experiments/pilot-e5-candidate-constrained-batch/raw --out docs/research/experiments/pilot-e5-candidate-constrained-batch/raw-output-audit.json`: reported 50 missing raw outputs, not ready for ingest.
- `npx tsx server/src/research/writePilotMetricsSummaryCli.ts --out docs/research/experiments/pilot-metrics-summary`: generated the initial 4 summary rows from two heuristic metrics files and two first-pass LLM raw-output audits.
- `npx tsx server/src/research/exportVerifierRevisionPacketsCli.ts --decisions docs/research/experiments/pilot-e1/decisions --traces docs/research/experiments/pilot-e3-strategic-heuristic/traces --results docs/research/experiments/pilot-e3-strategic-heuristic/results --out docs/research/experiments/pilot-e6-verifier-revision-fixture-prompts`: exported 50 fixture-only revision prompt packets.
- `npx tsx server/src/research/exportLLMBatchFilesCli.ts --packets docs/research/experiments/pilot-e6-verifier-revision-fixture-prompts/packets --out docs/research/experiments/pilot-e6-verifier-revision-fixture-batch`: exported 50 provider-neutral revision batch rows.
- `npx tsx server/src/research/auditLLMRawOutputsCli.ts --packets docs/research/experiments/pilot-e6-verifier-revision-fixture-prompts/packets --raw docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/raw --out docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/raw-output-audit.json`: reported 50 missing revision raw outputs, not ready for ingest.
- `npx tsx server/src/research/writePilotMetricsSummaryCli.ts --out docs/research/experiments/pilot-metrics-summary`: regenerated 5 summary rows after adding the verifier-revision condition.
- `npx tsx server/src/research/ingestLLMRawOutputsCli.ts --input docs/research/experiments/pilot-e1/decisions --raw docs/research/experiments/pilot-e4-fixture-raw-outputs --out docs/research/experiments/pilot-e4-fixture-ingest-check --condition plain-llm`: fixture-only ingest check parsed 5 traces and reported 45 missing raw outputs by design.
- `npm run test:run -- server/src/research/reasoningVerifier.test.ts`: passed after adding reason-action and team-objective soft-label checks.
- `npx tsx server/src/research/runPilotVerifierCli.ts --input docs/research/experiments/pilot-e1/decisions --out docs/research/experiments/pilot-e2-heuristic-verifier --agent heuristic-legal-first`: re-exported metrics with 50 / 50 reason-action pass and 50 / 50 objective pass.
- `npx tsx server/src/research/runPilotVerifierCli.ts --input docs/research/experiments/pilot-e1/decisions --out docs/research/experiments/pilot-e3-strategic-heuristic --agent strategic-heuristic`: re-exported metrics with 50 / 50 reason-action pass and 50 / 50 objective pass.
- `npm run test:run -- server/src/research/reasoningVerifier.test.ts`: passed after adding partner/opponent public-tag consistency checks.
- E2/E3 pilot metrics now show partner consistency 10 pass / 40 unknown and opponent consistency 20 pass / 30 unknown for both deterministic baselines.
- `npm run test:run -w server`: passed.
- `npm run typecheck -w shared`: passed.
- `npm run build -w shared && npm run typecheck -w server`: passed.
- `python3` PyMuPDF extraction over `papers/yim2024tomguandan.pdf`: produced `papers/yim2024tomguandan.txt` for local source audit.
- `python3` PyMuPDF extraction over `papers/agashe2023llmcoordination.pdf`, `papers/ramesh2026hanabi.pdf`, and `papers/lu2022danzero.pdf`: produced local text files for source audit.
- `npx tsx server/src/research/writePilotMetricsSummaryCli.ts --out docs/research/experiments/pilot-metrics-summary`: regenerated 5 summary rows covering two deterministic baselines and three LLM-condition raw-output audits.
- `jq empty docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json docs/research/experiments/pilot-e4-plain-llm-batch/raw-output-audit.json docs/research/experiments/pilot-e5-candidate-constrained-batch/raw-output-audit.json docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/raw-output-audit.json docs/research/experiments/pilot-e6-verifier-revision-fixture-prompts/manifest.json docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/batch-manifest.json`: passed.
- `wc -l docs/research/experiments/pilot-e4-plain-llm-batch/batch-input.jsonl docs/research/experiments/pilot-e5-candidate-constrained-batch/batch-input.jsonl docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/batch-input.jsonl`: reported 50 rows for each batch JSONL.
- stale status phrasing check over `docs/research`: no outdated 4-row or two-condition LLM batch wording found.
- `npm run test:run -- server/src/research/baselineTraceAgents.test.ts server/src/research/decisionPointExporter.test.ts server/src/research/reasoningVerifier.test.ts server/src/research/pilotDatasetExporter.test.ts server/src/research/pilotVerifierRunner.test.ts server/src/research/llmPromptPackets.test.ts server/src/research/llmOutputIngest.test.ts server/src/research/llmBatchFiles.test.ts server/src/research/experimentMetricsSummary.test.ts server/src/research/verifierRevisionPackets.test.ts`: passed, 10 test files and 29 tests.
- `npm run typecheck -w shared && npm run typecheck -w server`: passed.
- `npm run test:run -- server/src/research/revisionComparison.test.ts`: passed, 1 test file and 2 tests.
- `npx tsx server/src/research/writeRevisionComparisonCli.ts --out docs/research/experiments/pilot-revision-comparison`: generated a `missing_raw_outputs` verifier-revision comparison readiness artifact.
- `npm run test:run -- server/src/research/baselineTraceAgents.test.ts server/src/research/decisionPointExporter.test.ts server/src/research/reasoningVerifier.test.ts server/src/research/pilotDatasetExporter.test.ts server/src/research/pilotVerifierRunner.test.ts server/src/research/llmPromptPackets.test.ts server/src/research/llmOutputIngest.test.ts server/src/research/llmBatchFiles.test.ts server/src/research/experimentMetricsSummary.test.ts server/src/research/verifierRevisionPackets.test.ts server/src/research/revisionComparison.test.ts`: passed, 11 test files and 31 tests.
- `npm run typecheck -w shared && npm run typecheck -w server`: passed after adding revision comparison.
- `jq empty docs/research/experiments/pilot-revision-comparison/revision-comparison.json docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json docs/research/experiments/pilot-e4-plain-llm-batch/raw-output-audit.json docs/research/experiments/pilot-e5-candidate-constrained-batch/raw-output-audit.json docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/raw-output-audit.json`: passed.
- `npm run test:run -- server/src/research/llmProviderResults.test.ts`: passed, 1 test file and 2 tests.
- `npm run test:run -- server/src/research/baselineTraceAgents.test.ts server/src/research/decisionPointExporter.test.ts server/src/research/reasoningVerifier.test.ts server/src/research/pilotDatasetExporter.test.ts server/src/research/pilotVerifierRunner.test.ts server/src/research/llmPromptPackets.test.ts server/src/research/llmOutputIngest.test.ts server/src/research/llmBatchFiles.test.ts server/src/research/llmProviderResults.test.ts server/src/research/experimentMetricsSummary.test.ts server/src/research/verifierRevisionPackets.test.ts server/src/research/revisionComparison.test.ts`: passed, 12 test files and 33 tests.
- `npm run typecheck -w shared && npm run typecheck -w server`: passed after adding provider-result materialization.
- `jq empty docs/research/experiments/llm-run-provenance-template.json docs/research/experiments/pilot-revision-comparison/revision-comparison.json docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json docs/research/experiments/pilot-e4-plain-llm-batch/raw-output-audit.json docs/research/experiments/pilot-e5-candidate-constrained-batch/raw-output-audit.json docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/raw-output-audit.json`: passed.
- `npm run test:run -- server/src/research/submissionGate.test.ts`: passed, 1 test file and 2 tests.
- `npx tsx server/src/research/writeSubmissionGateReportCli.ts --root docs/research --out docs/research/submission/gate-report`: generated a `not_ready` submission gate report with 11 immediate blockers after adding the AI-use disclosure draft.
- `npm run test:run -- server/src/research/baselineTraceAgents.test.ts server/src/research/decisionPointExporter.test.ts server/src/research/reasoningVerifier.test.ts server/src/research/pilotDatasetExporter.test.ts server/src/research/pilotVerifierRunner.test.ts server/src/research/llmPromptPackets.test.ts server/src/research/llmOutputIngest.test.ts server/src/research/llmBatchFiles.test.ts server/src/research/llmProviderResults.test.ts server/src/research/experimentMetricsSummary.test.ts server/src/research/verifierRevisionPackets.test.ts server/src/research/revisionComparison.test.ts server/src/research/submissionGate.test.ts`: passed, 13 test files and 35 tests.
- `npm run typecheck -w shared && npm run typecheck -w server`: passed after adding submission gate.
- `jq empty docs/research/submission/gate-report/submission-gate-report.json docs/research/experiments/llm-run-provenance-template.json docs/research/experiments/pilot-revision-comparison/revision-comparison.json docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json docs/research/experiments/pilot-e4-plain-llm-batch/raw-output-audit.json docs/research/experiments/pilot-e5-candidate-constrained-batch/raw-output-audit.json docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/raw-output-audit.json`: passed.
- `jq '{overallStatus, blockerCount: (.immediateBlockers | length)}' docs/research/submission/gate-report/submission-gate-report.json`: reported `not_ready` with 11 blockers.
- `npm run test:run -- server/src/research/openAIBatchExport.test.ts`: passed, 1 test file and 2 tests.
- `npx tsx server/src/research/exportOpenAIBatchCli.ts --source docs/research/experiments/pilot-e4-plain-llm-batch/batch-input.jsonl --out docs/research/experiments/pilot-e4-plain-llm-batch/openai --model gpt-4.1-mini --temperature 0 --max-completion-tokens 1200 --response-format json_object`: exported 50 OpenAI Batch chat-completion requests.
- `npx tsx server/src/research/exportOpenAIBatchCli.ts --source docs/research/experiments/pilot-e5-candidate-constrained-batch/batch-input.jsonl --out docs/research/experiments/pilot-e5-candidate-constrained-batch/openai --model gpt-4.1-mini --temperature 0 --max-completion-tokens 1200 --response-format json_object`: exported 50 OpenAI Batch chat-completion requests.
- `npx tsx server/src/research/exportOpenAIBatchCli.ts --source docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/batch-input.jsonl --out docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/openai --model gpt-4.1-mini --temperature 0 --max-completion-tokens 1200 --response-format json_object`: exported 50 fixture-only OpenAI Batch chat-completion requests.
- `wc -l docs/research/experiments/pilot-e4-plain-llm-batch/openai/openai-batch-input.jsonl docs/research/experiments/pilot-e5-candidate-constrained-batch/openai/openai-batch-input.jsonl docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/openai/openai-batch-input.jsonl`: reported 50 rows for each OpenAI-ready batch JSONL.
- `npm run test:run -- server/src/research/baselineTraceAgents.test.ts server/src/research/decisionPointExporter.test.ts server/src/research/reasoningVerifier.test.ts server/src/research/pilotDatasetExporter.test.ts server/src/research/pilotVerifierRunner.test.ts server/src/research/llmPromptPackets.test.ts server/src/research/llmOutputIngest.test.ts server/src/research/llmBatchFiles.test.ts server/src/research/llmProviderResults.test.ts server/src/research/openAIBatchExport.test.ts server/src/research/experimentMetricsSummary.test.ts server/src/research/verifierRevisionPackets.test.ts server/src/research/revisionComparison.test.ts server/src/research/submissionGate.test.ts`: passed, 14 test files and 37 tests.
- `npm run typecheck -w shared && npm run typecheck -w server`: passed after adding OpenAI Batch export.
- `jq empty docs/research/experiments/pilot-e4-plain-llm-batch/openai/openai-batch-manifest.json docs/research/experiments/pilot-e5-candidate-constrained-batch/openai/openai-batch-manifest.json docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/openai/openai-batch-manifest.json docs/research/submission/gate-report/submission-gate-report.json docs/research/experiments/llm-run-provenance-template.json docs/research/experiments/pilot-revision-comparison/revision-comparison.json docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json`: passed.
- OpenAI-ready JSONL structural check over the plain batch first row passed for `custom_id`, `POST`, `/v1/chat/completions`, model, and two chat messages.
- `npx tsx server/src/research/writeSubmissionGateReportCli.ts --root docs/research --out docs/research/submission/gate-report`: regenerated `not_ready` gate status with 11 blockers; OpenAI-ready request packages do not count as experiment results.
- `npm run test:run -- server/src/research/paperTableArtifacts.test.ts`: passed, 1 test file and 1 test.
- `npx tsx server/src/research/writePaperTableArtifactsCli.ts --out docs/research/tables`: generated compact Table 1 and Table 2 Markdown sources from current metrics and revision comparison artifacts.
- `npm run test:run -- server/src/research/baselineTraceAgents.test.ts server/src/research/decisionPointExporter.test.ts server/src/research/reasoningVerifier.test.ts server/src/research/pilotDatasetExporter.test.ts server/src/research/pilotVerifierRunner.test.ts server/src/research/llmPromptPackets.test.ts server/src/research/llmOutputIngest.test.ts server/src/research/llmBatchFiles.test.ts server/src/research/llmProviderResults.test.ts server/src/research/openAIBatchExport.test.ts server/src/research/paperTableArtifacts.test.ts server/src/research/experimentMetricsSummary.test.ts server/src/research/verifierRevisionPackets.test.ts server/src/research/revisionComparison.test.ts server/src/research/submissionGate.test.ts`: passed, 15 test files and 38 tests.
- `npm run typecheck -w shared && npm run typecheck -w server`: passed after adding paper table artifact generation.
- `jq empty docs/research/submission/gate-report/submission-gate-report.json docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json docs/research/experiments/pilot-revision-comparison/revision-comparison.json docs/research/experiments/pilot-e4-plain-llm-batch/openai/openai-batch-manifest.json docs/research/experiments/pilot-e5-candidate-constrained-batch/openai/openai-batch-manifest.json docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/openai/openai-batch-manifest.json`: passed.
- figure/table source presence check passed for `figures/method-pipeline.mmd`, `tables/table-1-reasoning-reliability.md`, and `tables/table-2-verifier-revision-effect.md`.
- `npx tsx server/src/research/writeSubmissionGateReportCli.ts --root docs/research --out docs/research/submission/gate-report`: regenerated `not_ready` gate status with 11 blockers after adding figure/table sources.
- `npm run test:run -- server/src/research/manuscriptAssembler.test.ts`: passed, 1 test file and 1 test.
- `npx tsx server/src/research/assembleManuscriptCli.ts`: generated `submission/manuscript/manuscript-draft.md` and `submission/manuscript/manuscript-status.json`; status reported 2332 words, 11 `[NEED_EXPERIMENT]` markers, 1 `[DO_NOT_SUBMIT]` marker, and `readyForSubmission=false`.
- `npm run test:run -- server/src/research/baselineTraceAgents.test.ts server/src/research/decisionPointExporter.test.ts server/src/research/reasoningVerifier.test.ts server/src/research/pilotDatasetExporter.test.ts server/src/research/pilotVerifierRunner.test.ts server/src/research/llmPromptPackets.test.ts server/src/research/llmOutputIngest.test.ts server/src/research/llmBatchFiles.test.ts server/src/research/llmProviderResults.test.ts server/src/research/openAIBatchExport.test.ts server/src/research/paperTableArtifacts.test.ts server/src/research/manuscriptAssembler.test.ts server/src/research/experimentMetricsSummary.test.ts server/src/research/verifierRevisionPackets.test.ts server/src/research/revisionComparison.test.ts server/src/research/submissionGate.test.ts`: passed, 16 test files and 39 tests.
- `npm run typecheck -w shared && npm run typecheck -w server`: passed after adding manuscript assembly.
- `jq empty docs/research/submission/manuscript/manuscript-status.json docs/research/submission/gate-report/submission-gate-report.json docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json docs/research/experiments/pilot-revision-comparison/revision-comparison.json`: passed.
- `jq '{wordCount, readyForSubmission, markerCounts}' docs/research/submission/manuscript/manuscript-status.json`: confirmed 2332 words, `readyForSubmission=false`, 11 `[NEED_EXPERIMENT]`, and 1 `[DO_NOT_SUBMIT]`.
- `npx tsx server/src/research/writeSubmissionGateReportCli.ts --root docs/research --out docs/research/submission/gate-report`: regenerated `not_ready` gate status with 11 blockers after adding manuscript artifacts.
- `npm run test:run -- server/src/research/postProviderConditionRunner.test.ts`: passed, 1 test file and 2 tests.
- `npm run test:run -- server/src/research/baselineTraceAgents.test.ts server/src/research/decisionPointExporter.test.ts server/src/research/reasoningVerifier.test.ts server/src/research/pilotDatasetExporter.test.ts server/src/research/pilotVerifierRunner.test.ts server/src/research/llmPromptPackets.test.ts server/src/research/llmOutputIngest.test.ts server/src/research/llmBatchFiles.test.ts server/src/research/llmProviderResults.test.ts server/src/research/postProviderConditionRunner.test.ts server/src/research/openAIBatchExport.test.ts server/src/research/paperTableArtifacts.test.ts server/src/research/manuscriptAssembler.test.ts server/src/research/experimentMetricsSummary.test.ts server/src/research/verifierRevisionPackets.test.ts server/src/research/revisionComparison.test.ts server/src/research/submissionGate.test.ts`: passed, 17 test files and 41 tests.
- `npm run typecheck -w shared && npm run typecheck -w server`: passed after adding post-provider condition runner.
- `jq empty docs/research/submission/manuscript/manuscript-status.json docs/research/submission/gate-report/submission-gate-report.json docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json docs/research/experiments/pilot-revision-comparison/revision-comparison.json docs/research/experiments/pilot-e4-plain-llm-batch/openai/openai-batch-manifest.json docs/research/experiments/pilot-e5-candidate-constrained-batch/openai/openai-batch-manifest.json`: passed.
- `npx tsx server/src/research/writeSubmissionGateReportCli.ts --root docs/research --out docs/research/submission/gate-report`: regenerated `not_ready` gate status with 11 blockers after adding post-provider runner.
- `npm run test:run -- server/src/research/reproducibilityManifest.test.ts`: passed, 1 test file and 1 test.
- `npx tsx server/src/research/writeReproducibilityManifestCli.ts --root docs/research --out docs/research/submission`: generated reproducibility manifest with 30 artifact entries and 3 missing provider-result JSONL files.
- `npm run test:run -- server/src/research/baselineTraceAgents.test.ts server/src/research/decisionPointExporter.test.ts server/src/research/reasoningVerifier.test.ts server/src/research/pilotDatasetExporter.test.ts server/src/research/pilotVerifierRunner.test.ts server/src/research/llmPromptPackets.test.ts server/src/research/llmOutputIngest.test.ts server/src/research/llmBatchFiles.test.ts server/src/research/llmProviderResults.test.ts server/src/research/postProviderConditionRunner.test.ts server/src/research/openAIBatchExport.test.ts server/src/research/paperTableArtifacts.test.ts server/src/research/manuscriptAssembler.test.ts server/src/research/reproducibilityManifest.test.ts server/src/research/experimentMetricsSummary.test.ts server/src/research/verifierRevisionPackets.test.ts server/src/research/revisionComparison.test.ts server/src/research/submissionGate.test.ts`: passed, 18 test files and 42 tests.
- `npm run typecheck -w shared && npm run typecheck -w server`: passed after adding reproducibility manifest generation.
- `npx tsx server/src/research/writeSubmissionGateReportCli.ts --root docs/research --out docs/research/submission/gate-report`: regenerated `not_ready` gate status with 11 blockers after adding the reproducibility manifest.
- `npm run test:run -- server/src/research/researchPreflightReport.test.ts`: passed, 1 test file and 1 test.
- `npx tsx server/src/research/writeResearchPreflightReportCli.ts --root docs/research --out docs/research/submission/preflight`: generated preflight status `waiting_for_provider_results`, with 4 external blockers and 7 local blockers.
- `npm run test:run -- server/src/research/baselineTraceAgents.test.ts server/src/research/decisionPointExporter.test.ts server/src/research/reasoningVerifier.test.ts server/src/research/pilotDatasetExporter.test.ts server/src/research/pilotVerifierRunner.test.ts server/src/research/llmPromptPackets.test.ts server/src/research/llmOutputIngest.test.ts server/src/research/llmBatchFiles.test.ts server/src/research/llmProviderResults.test.ts server/src/research/postProviderConditionRunner.test.ts server/src/research/openAIBatchExport.test.ts server/src/research/paperTableArtifacts.test.ts server/src/research/manuscriptAssembler.test.ts server/src/research/reproducibilityManifest.test.ts server/src/research/researchPreflightReport.test.ts server/src/research/experimentMetricsSummary.test.ts server/src/research/verifierRevisionPackets.test.ts server/src/research/revisionComparison.test.ts server/src/research/submissionGate.test.ts`: passed, 19 test files and 43 tests.
- `npm run typecheck -w shared && npm run typecheck -w server`: passed after adding research preflight report generation.
- `npx tsx server/src/research/writeSubmissionGateReportCli.ts --root docs/research --out docs/research/submission/gate-report && npx tsx server/src/research/writeResearchPreflightReportCli.ts --root docs/research --out docs/research/submission/preflight && npx tsx server/src/research/writeReproducibilityManifestCli.ts --root docs/research --out docs/research/submission`: regenerated gate `not_ready` with 11 blockers, preflight `waiting_for_provider_results` with 4 external and 7 local blockers, and reproducibility manifest with 31 entries and 3 missing provider-result files.
- `jq empty docs/research/submission/preflight/research-preflight-report.json docs/research/submission/reproducibility-manifest.json docs/research/submission/gate-report/submission-gate-report.json docs/research/submission/manuscript/manuscript-status.json docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json docs/research/experiments/pilot-revision-comparison/revision-comparison.json docs/research/experiments/pilot-e4-plain-llm-batch/openai/openai-batch-manifest.json docs/research/experiments/pilot-e5-candidate-constrained-batch/openai/openai-batch-manifest.json docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/openai/openai-batch-manifest.json`: passed.
- `npm run test:run -- server/src/research/localResearchPipeline.test.ts`: passed, 1 test file and 2 tests.
- `npx tsx server/src/research/runLocalResearchPipelineCli.ts --report-dir docs/research/submission/local-pipeline`: completed 7 local-only downstream artifact steps with no failed step.
- `npm run research:local-pipeline -- --report-dir docs/research/submission/local-pipeline`: completed 7 local-only downstream artifact steps through the package script entry.
- `npx tsx server/src/research/writeReproducibilityManifestCli.ts --root docs/research --out docs/research/submission`: regenerated reproducibility manifest with 32 entries and 3 missing provider-result files after local pipeline report generation.
- `npm run test:run -- server/src/research/baselineTraceAgents.test.ts server/src/research/decisionPointExporter.test.ts server/src/research/reasoningVerifier.test.ts server/src/research/pilotDatasetExporter.test.ts server/src/research/pilotVerifierRunner.test.ts server/src/research/llmPromptPackets.test.ts server/src/research/llmOutputIngest.test.ts server/src/research/llmBatchFiles.test.ts server/src/research/llmProviderResults.test.ts server/src/research/postProviderConditionRunner.test.ts server/src/research/openAIBatchExport.test.ts server/src/research/paperTableArtifacts.test.ts server/src/research/manuscriptAssembler.test.ts server/src/research/reproducibilityManifest.test.ts server/src/research/researchPreflightReport.test.ts server/src/research/localResearchPipeline.test.ts server/src/research/experimentMetricsSummary.test.ts server/src/research/verifierRevisionPackets.test.ts server/src/research/revisionComparison.test.ts server/src/research/submissionGate.test.ts`: passed, 20 test files and 45 tests.
- `npm run typecheck -w shared && npm run typecheck -w server`: passed after adding local research pipeline runner.
- `jq empty docs/research/submission/local-pipeline/local-research-pipeline-report.json docs/research/submission/preflight/research-preflight-report.json docs/research/submission/reproducibility-manifest.json docs/research/submission/gate-report/submission-gate-report.json docs/research/submission/manuscript/manuscript-status.json docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json docs/research/experiments/pilot-revision-comparison/revision-comparison.json docs/research/experiments/pilot-e4-plain-llm-batch/openai/openai-batch-manifest.json docs/research/experiments/pilot-e5-candidate-constrained-batch/openai/openai-batch-manifest.json docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/openai/openai-batch-manifest.json`: passed.
- `npm run test:run -- server/src/research/submissionGate.test.ts server/src/research/researchPreflightReport.test.ts`: passed after changing submission-gate marker scope to submission-relevant files and excluding generated readiness artifacts from marker counts.
- `npm run research:local-pipeline -- --report-dir docs/research/submission/local-pipeline`: completed after marker-scope correction; gate now reports `not_ready` with 9 blockers, 0 NEED_SOURCE markers, 0 UNCERTAIN markers, 42 NEED_EXPERIMENT markers, 1 DO_NOT_SUBMIT marker, and 5 AUTHOR_DECISION markers in submission-relevant files.
- `npm run test:run -- server/src/research/baselineTraceAgents.test.ts server/src/research/decisionPointExporter.test.ts server/src/research/reasoningVerifier.test.ts server/src/research/pilotDatasetExporter.test.ts server/src/research/pilotVerifierRunner.test.ts server/src/research/llmPromptPackets.test.ts server/src/research/llmOutputIngest.test.ts server/src/research/llmBatchFiles.test.ts server/src/research/llmProviderResults.test.ts server/src/research/postProviderConditionRunner.test.ts server/src/research/openAIBatchExport.test.ts server/src/research/paperTableArtifacts.test.ts server/src/research/manuscriptAssembler.test.ts server/src/research/reproducibilityManifest.test.ts server/src/research/researchPreflightReport.test.ts server/src/research/localResearchPipeline.test.ts server/src/research/experimentMetricsSummary.test.ts server/src/research/verifierRevisionPackets.test.ts server/src/research/revisionComparison.test.ts server/src/research/submissionGate.test.ts`: passed, 20 test files and 46 tests.
- `npm run typecheck -w shared && npm run typecheck -w server`: passed after submission-gate marker-scope correction.
- `jq empty docs/research/submission/local-pipeline/local-research-pipeline-report.json docs/research/submission/preflight/research-preflight-report.json docs/research/submission/reproducibility-manifest.json docs/research/submission/gate-report/submission-gate-report.json docs/research/submission/manuscript/manuscript-status.json docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json docs/research/experiments/pilot-revision-comparison/revision-comparison.json`: passed.
- `npm run test:run -- server/src/research/submissionMarkerInventory.test.ts server/src/research/localResearchPipeline.test.ts`: passed after adding submission marker inventory and wiring it into the local pipeline.
- `npm run research:local-pipeline -- --report-dir docs/research/submission/local-pipeline`: completed 8 local-only downstream artifact steps after adding marker inventory.
- `jq '{counts, itemCount: (.items | length)}' docs/research/submission/marker-inventory/submission-marker-inventory.json`: confirmed marker inventory counts match submission gate counts: 42 NEED_EXPERIMENT, 1 DO_NOT_SUBMIT, 5 AUTHOR_DECISION, 0 NEED_SOURCE, and 0 UNCERTAIN across 48 marker items.
- `npm run test:run -- server/src/research/manuscriptAssembler.test.ts`: passed after changing manuscript assembly so the explanatory draft note no longer injects a permanent `[DO_NOT_SUBMIT]` marker.
- `npm run research:local-pipeline -- --report-dir docs/research/submission/local-pipeline`: completed after manuscript blocker correction; gate now reports `not_ready` with 8 blockers, 0 NEED_SOURCE markers, 0 UNCERTAIN markers, 42 NEED_EXPERIMENT markers, 0 DO_NOT_SUBMIT markers, and 5 AUTHOR_DECISION markers.
- `npm run test:run -- server/src/research/baselineTraceAgents.test.ts server/src/research/decisionPointExporter.test.ts server/src/research/reasoningVerifier.test.ts server/src/research/pilotDatasetExporter.test.ts server/src/research/pilotVerifierRunner.test.ts server/src/research/llmPromptPackets.test.ts server/src/research/llmOutputIngest.test.ts server/src/research/llmBatchFiles.test.ts server/src/research/llmProviderResults.test.ts server/src/research/postProviderConditionRunner.test.ts server/src/research/openAIBatchExport.test.ts server/src/research/paperTableArtifacts.test.ts server/src/research/manuscriptAssembler.test.ts server/src/research/reproducibilityManifest.test.ts server/src/research/researchPreflightReport.test.ts server/src/research/submissionMarkerInventory.test.ts server/src/research/localResearchPipeline.test.ts server/src/research/experimentMetricsSummary.test.ts server/src/research/verifierRevisionPackets.test.ts server/src/research/revisionComparison.test.ts server/src/research/submissionGate.test.ts`: passed, 21 test files and 48 tests.
- `npm run typecheck -w shared && npm run typecheck -w server`: passed after manuscript blocker correction.
- `jq empty docs/research/submission/marker-inventory/submission-marker-inventory.json docs/research/submission/local-pipeline/local-research-pipeline-report.json docs/research/submission/preflight/research-preflight-report.json docs/research/submission/reproducibility-manifest.json docs/research/submission/gate-report/submission-gate-report.json docs/research/submission/manuscript/manuscript-status.json docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json docs/research/experiments/pilot-revision-comparison/revision-comparison.json`: passed.
- `npm run test:run -- server/src/research/submissionMarkerInventory.test.ts server/src/research/submissionGate.test.ts`: passed after adding blocking/workbench marker scopes and making the submission gate use blocking marker counts.
- `npm run research:local-pipeline -- --report-dir docs/research/submission/local-pipeline`: completed after scope-aware marker classification; gate now reports `not_ready` with 8 blockers, 11 blocking NEED_EXPERIMENT markers, 5 blocking AUTHOR_DECISION markers, and marker inventory separately records 31 workbench NEED_EXPERIMENT markers.
- `docs/research/submission/author-decision-brief.md`: added a source-grounded author decision packet recommending AAMAS as the primary CCF B target, IJCAI/AAAI as stretch targets, and ECAI/ICAPS as backups while leaving venue, provider cost, baseline integration, expert labels, and disclosure wording as PI decisions.
- `npm run research:local-pipeline -- --report-dir docs/research/submission/local-pipeline`: completed after adding the author decision brief; gate remains `not_ready` with 8 blockers, 11 blocking NEED_EXPERIMENT markers, and 5 blocking AUTHOR_DECISION markers.
- `npx tsx server/src/research/writeReproducibilityManifestCli.ts --root docs/research --out docs/research/submission`: regenerated through the local pipeline with 34 manifest entries, including `author-decision-brief`, and 3 missing provider-result JSONL files.
- `npm run test:run -- server/src/research/baselineTraceAgents.test.ts server/src/research/decisionPointExporter.test.ts server/src/research/reasoningVerifier.test.ts server/src/research/pilotDatasetExporter.test.ts server/src/research/pilotVerifierRunner.test.ts server/src/research/llmPromptPackets.test.ts server/src/research/llmOutputIngest.test.ts server/src/research/llmBatchFiles.test.ts server/src/research/llmProviderResults.test.ts server/src/research/postProviderConditionRunner.test.ts server/src/research/openAIBatchExport.test.ts server/src/research/paperTableArtifacts.test.ts server/src/research/manuscriptAssembler.test.ts server/src/research/reproducibilityManifest.test.ts server/src/research/researchPreflightReport.test.ts server/src/research/submissionMarkerInventory.test.ts server/src/research/localResearchPipeline.test.ts server/src/research/experimentMetricsSummary.test.ts server/src/research/verifierRevisionPackets.test.ts server/src/research/revisionComparison.test.ts server/src/research/submissionGate.test.ts`: passed, 21 test files and 49 tests.
- `npm run typecheck -w shared && npm run typecheck -w server`: passed after adding the author decision brief to the reproducibility manifest defaults.
- `jq empty docs/research/submission/marker-inventory/submission-marker-inventory.json docs/research/submission/local-pipeline/local-research-pipeline-report.json docs/research/submission/preflight/research-preflight-report.json docs/research/submission/reproducibility-manifest.json docs/research/submission/gate-report/submission-gate-report.json docs/research/submission/manuscript/manuscript-status.json docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json docs/research/experiments/pilot-revision-comparison/revision-comparison.json docs/research/experiments/pilot-e4-plain-llm-batch/openai/openai-batch-manifest.json docs/research/experiments/pilot-e5-candidate-constrained-batch/openai/openai-batch-manifest.json docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/openai/openai-batch-manifest.json`: passed.
- `npm run test:run -- server/src/research/submissionGate.test.ts server/src/research/researchPreflightReport.test.ts`: passed after making first-pass provenance conditional on completed LLM metrics instead of requiring fake pre-run provenance.
- `npm run research:local-pipeline -- --report-dir docs/research/submission/local-pipeline`: completed after conditional provenance gating; gate now reports `not_ready` with 6 blockers: 4 provider-output/revision blockers plus 11 blocking NEED_EXPERIMENT markers and 5 blocking AUTHOR_DECISION markers.
- `docs/research/notes/literature_matrix.csv`, `docs/research/notes/knowledge_base.md`, `docs/research/notes/related_work_comparison.md`, `docs/research/notes/gap_map.md`, `docs/research/notes/source_verification_report.md`, and `docs/research/notes/citation_integrity_audit.md`: expanded the related-work boundary with Strat-Reasoner, ToolPoker, and Game Reasoning Arena so the paper no longer overclaims novelty for strategic LLM game reasoning, hidden-information knowing-doing gaps, or generic LLM game-evaluation infrastructure.
- `server/src/research/paperTableArtifacts.ts`: added generated `tables/table-0-related-work-positioning.md` as a compact paper-ready positioning table backed by the related-work notes.
- `npm run test:run -- server/src/research/paperTableArtifacts.test.ts`: passed after adding Table 0 coverage.
- `npm run research:local-pipeline -- --report-dir docs/research/submission/local-pipeline`: completed after related-work expansion and Table 0 generation; gate remains `not_ready` with 6 blockers.
- `server/src/research/manuscriptAssembler.ts`: now embeds `tables/table-0-related-work-positioning.md` after the Related Work section and demotes artifact headings when inserting them into the manuscript.
- `docs/research/drafts/paper-as-code/03_method.md`: added formal notation for decision points, structured traces, selected actions, verifier labels, and hard/soft check interpretation.
- `npm run test:run -- server/src/research/manuscriptAssembler.test.ts server/src/research/paperTableArtifacts.test.ts`: passed after Table 0 manuscript inclusion and heading-level handling.
- `npm run research:local-pipeline -- --report-dir docs/research/submission/local-pipeline`: completed after manuscript/table integration; assembled manuscript now records `tables/table-0-related-work-positioning.md` in `artifactSources`.
- `npm run test:run -- server/src/research/baselineTraceAgents.test.ts server/src/research/decisionPointExporter.test.ts server/src/research/reasoningVerifier.test.ts server/src/research/pilotDatasetExporter.test.ts server/src/research/pilotVerifierRunner.test.ts server/src/research/llmPromptPackets.test.ts server/src/research/llmOutputIngest.test.ts server/src/research/llmBatchFiles.test.ts server/src/research/llmProviderResults.test.ts server/src/research/postProviderConditionRunner.test.ts server/src/research/openAIBatchExport.test.ts server/src/research/paperTableArtifacts.test.ts server/src/research/manuscriptAssembler.test.ts server/src/research/reproducibilityManifest.test.ts server/src/research/researchPreflightReport.test.ts server/src/research/submissionMarkerInventory.test.ts server/src/research/localResearchPipeline.test.ts server/src/research/experimentMetricsSummary.test.ts server/src/research/verifierRevisionPackets.test.ts server/src/research/revisionComparison.test.ts server/src/research/submissionGate.test.ts`: passed, 21 test files and 50 tests.
- `npm run typecheck -w shared && npm run typecheck -w server`: passed after manuscript/table integration.
- `jq empty docs/research/submission/marker-inventory/submission-marker-inventory.json docs/research/submission/local-pipeline/local-research-pipeline-report.json docs/research/submission/preflight/research-preflight-report.json docs/research/submission/reproducibility-manifest.json docs/research/submission/gate-report/submission-gate-report.json docs/research/submission/manuscript/manuscript-status.json docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json docs/research/experiments/pilot-revision-comparison/revision-comparison.json docs/research/experiments/pilot-e4-plain-llm-batch/openai/openai-batch-manifest.json docs/research/experiments/pilot-e5-candidate-constrained-batch/openai/openai-batch-manifest.json docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/openai/openai-batch-manifest.json`: passed.
- `npx tsx server/src/research/writeBibliographyIntegrityReportCli.ts --bib docs/research/submission/references.bib --out docs/research/submission/citation-integrity`: generated a ready bibliography integrity report with 14 entries and 0 issues.
- `npm run research:local-pipeline -- --report-dir docs/research/submission/local-pipeline`: completed 9 local-only downstream artifact steps after adding bibliography integrity.
- `npm run test:run -- server/src/research/baselineTraceAgents.test.ts server/src/research/decisionPointExporter.test.ts server/src/research/reasoningVerifier.test.ts server/src/research/pilotDatasetExporter.test.ts server/src/research/pilotVerifierRunner.test.ts server/src/research/llmPromptPackets.test.ts server/src/research/llmOutputIngest.test.ts server/src/research/llmBatchFiles.test.ts server/src/research/llmProviderResults.test.ts server/src/research/postProviderConditionRunner.test.ts server/src/research/openAIBatchExport.test.ts server/src/research/paperTableArtifacts.test.ts server/src/research/manuscriptAssembler.test.ts server/src/research/reproducibilityManifest.test.ts server/src/research/researchPreflightReport.test.ts server/src/research/submissionMarkerInventory.test.ts server/src/research/localResearchPipeline.test.ts server/src/research/bibliographyIntegrity.test.ts server/src/research/experimentMetricsSummary.test.ts server/src/research/verifierRevisionPackets.test.ts server/src/research/revisionComparison.test.ts server/src/research/submissionGate.test.ts`: passed, 22 test files and 52 tests.
- `npm run typecheck -w shared && npm run typecheck -w server`: passed after bibliography integrity integration.
- `jq empty docs/research/submission/local-pipeline/local-research-pipeline-report.json docs/research/submission/preflight/research-preflight-report.json docs/research/submission/reproducibility-manifest.json docs/research/submission/gate-report/submission-gate-report.json docs/research/submission/manuscript/manuscript-status.json docs/research/submission/citation-integrity/bibliography-integrity-report.json docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json docs/research/experiments/pilot-revision-comparison/revision-comparison.json docs/research/experiments/pilot-e4-plain-llm-batch/openai/openai-batch-manifest.json docs/research/experiments/pilot-e5-candidate-constrained-batch/openai/openai-batch-manifest.json docs/research/experiments/pilot-e6-verifier-revision-fixture-batch/openai/openai-batch-manifest.json`: passed.
- `docs/research/submission/submission-profile.md`: adopted AAMAS-first working submission defaults and adapted AI-use disclosure against the checked AAMAS 2026 policy.
- `npm run research:local-pipeline -- --report-dir docs/research/submission/local-pipeline`: completed after resolving blocking author-decision markers; gate now reports `not_ready` with 5 blockers, 0 blocking AUTHOR_DECISION markers, and 11 blocking NEED_EXPERIMENT markers.
- `docs/research/submission/provider-run-handoff.md`: added exact first-pass upload files, provider-result return paths, post-provider commands, and real verifier-revision regeneration sequence.
- `npm run research:local-pipeline -- --report-dir docs/research/submission/local-pipeline`: completed after adding provider handoff; reproducibility manifest now records 38 entries including `submission-profile` and `provider-run-handoff`, with 3 missing provider-result files.
- `npm run test:run -- server/src/research/baselineTraceAgents.test.ts server/src/research/decisionPointExporter.test.ts server/src/research/reasoningVerifier.test.ts server/src/research/pilotDatasetExporter.test.ts server/src/research/pilotVerifierRunner.test.ts server/src/research/llmPromptPackets.test.ts server/src/research/llmOutputIngest.test.ts server/src/research/llmBatchFiles.test.ts server/src/research/llmProviderResults.test.ts server/src/research/postProviderConditionRunner.test.ts server/src/research/openAIBatchExport.test.ts server/src/research/paperTableArtifacts.test.ts server/src/research/manuscriptAssembler.test.ts server/src/research/reproducibilityManifest.test.ts server/src/research/researchPreflightReport.test.ts server/src/research/submissionMarkerInventory.test.ts server/src/research/localResearchPipeline.test.ts server/src/research/bibliographyIntegrity.test.ts server/src/research/experimentMetricsSummary.test.ts server/src/research/verifierRevisionPackets.test.ts server/src/research/revisionComparison.test.ts server/src/research/submissionGate.test.ts`: passed, 22 test files and 52 tests.
- `npm run typecheck -w shared && npm run typecheck -w server`: passed after submission profile and provider handoff integration.
- `server/src/research/llmProviderResults.ts`: now rejects OpenAI upload JSONL as a materialization mapping source when `expected_raw_output_file` is absent; `docs/research/submission/provider-run-handoff.md` now passes provider-neutral `batch-input.jsonl` to post-provider commands while still using OpenAI JSONL only for upload.
- `npm run test:run -- server/src/research/llmProviderResults.test.ts server/src/research/postProviderConditionRunner.test.ts`: passed after adding the OpenAI-upload-JSONL rejection case.
- `npm run test:run -- server/src/research/baselineTraceAgents.test.ts server/src/research/decisionPointExporter.test.ts server/src/research/reasoningVerifier.test.ts server/src/research/pilotDatasetExporter.test.ts server/src/research/pilotVerifierRunner.test.ts server/src/research/llmPromptPackets.test.ts server/src/research/llmOutputIngest.test.ts server/src/research/llmBatchFiles.test.ts server/src/research/llmProviderResults.test.ts server/src/research/postProviderConditionRunner.test.ts server/src/research/openAIBatchExport.test.ts server/src/research/paperTableArtifacts.test.ts server/src/research/manuscriptAssembler.test.ts server/src/research/reproducibilityManifest.test.ts server/src/research/researchPreflightReport.test.ts server/src/research/submissionMarkerInventory.test.ts server/src/research/localResearchPipeline.test.ts server/src/research/bibliographyIntegrity.test.ts server/src/research/experimentMetricsSummary.test.ts server/src/research/verifierRevisionPackets.test.ts server/src/research/revisionComparison.test.ts server/src/research/submissionGate.test.ts`: passed, 22 test files and 53 tests.
- `npm run typecheck -w shared && npm run typecheck -w server`: passed after provider-handoff executable-path correction.
- `server/src/research/providerHandoffAudit.ts`: added a local audit for provider-neutral mapping JSONL, OpenAI upload JSONL, custom-id set equality, provider-result return paths, and the expected real verifier-revision blocked state.
- `npx tsx server/src/research/writeProviderHandoffAuditCli.ts --out docs/research/submission/provider-handoff-audit`: generated a ready audit with 3 conditions; `plain-llm` and `candidate-constrained-llm` each have 50 mapping rows, 50 upload rows, and 0 custom-id mismatches; `verifier-revision-llm` is `blocked_by_first_pass_results`.
- `npm run research:local-pipeline -- --report-dir docs/research/submission/local-pipeline`: completed 10 local-only downstream artifact steps after adding provider handoff audit.
- `npm run test:run -- server/src/research/baselineTraceAgents.test.ts server/src/research/decisionPointExporter.test.ts server/src/research/reasoningVerifier.test.ts server/src/research/pilotDatasetExporter.test.ts server/src/research/pilotVerifierRunner.test.ts server/src/research/llmPromptPackets.test.ts server/src/research/llmOutputIngest.test.ts server/src/research/llmBatchFiles.test.ts server/src/research/llmProviderResults.test.ts server/src/research/postProviderConditionRunner.test.ts server/src/research/openAIBatchExport.test.ts server/src/research/paperTableArtifacts.test.ts server/src/research/manuscriptAssembler.test.ts server/src/research/reproducibilityManifest.test.ts server/src/research/researchPreflightReport.test.ts server/src/research/submissionMarkerInventory.test.ts server/src/research/localResearchPipeline.test.ts server/src/research/bibliographyIntegrity.test.ts server/src/research/providerHandoffAudit.test.ts server/src/research/experimentMetricsSummary.test.ts server/src/research/verifierRevisionPackets.test.ts server/src/research/revisionComparison.test.ts server/src/research/submissionGate.test.ts`: passed, 23 test files and 56 tests.
- `npm run typecheck -w shared && npm run typecheck -w server`: passed after provider handoff audit integration.
- `jq empty docs/research/submission/local-pipeline/local-research-pipeline-report.json docs/research/submission/preflight/research-preflight-report.json docs/research/submission/reproducibility-manifest.json docs/research/submission/gate-report/submission-gate-report.json docs/research/submission/manuscript/manuscript-status.json docs/research/submission/citation-integrity/bibliography-integrity-report.json docs/research/submission/provider-handoff-audit/provider-handoff-audit.json docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json docs/research/experiments/pilot-revision-comparison/revision-comparison.json`: passed.
- `npm run test:run -- server/src/research/experimentResolutionLedger.test.ts server/src/research/localResearchPipeline.test.ts server/src/research/submissionMarkerInventory.test.ts`: passed, 3 test files and 5 tests.
- `npx tsx server/src/research/writeExperimentResolutionLedgerCli.ts --root docs/research --out docs/research/submission/experiment-resolution-ledger`: generated 11 ledger items; all are `missing_evidence`.
- `npm run research:local-pipeline -- --report-dir docs/research/submission/local-pipeline`: completed 11 local-only downstream artifact steps after adding the experiment resolution ledger.
- `jq '{items:.counts.totalItems, status:.counts.byStatus, families:.counts.byEvidenceFamily}' docs/research/submission/experiment-resolution-ledger/experiment-resolution-ledger.json`: confirmed 11 blocking experiment markers, 11 `missing_evidence`, and evidence-family counts of 8 first-pass LLM, 6 verifier-revision, 2 full-dataset, 2 ablation, 2 case-study, and 1 generalization.
- `npm run test:run -- server/src/research`: passed, 24 test files and 58 tests.
- `npm run typecheck -w shared`: passed.
- `npm run typecheck -w server`: passed.
- `jq empty docs/research/submission/experiment-resolution-ledger/experiment-resolution-ledger.json docs/research/submission/local-pipeline/local-research-pipeline-report.json docs/research/submission/preflight/research-preflight-report.json docs/research/submission/reproducibility-manifest.json docs/research/submission/gate-report/submission-gate-report.json docs/research/submission/marker-inventory/submission-marker-inventory.json docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json docs/research/experiments/pilot-revision-comparison/revision-comparison.json`: passed.
- `npx tsx server/src/research/exportPilotDatasetCli.ts --out docs/research/experiments/full-e1 --count 500 --prefix full-e1`: exported 500 controlled full-evaluation decision points covering five scenario tags.
- `npx tsx server/src/research/exportPilotDatasetCli.ts --out docs/research/experiments/pilot-e1 --count 50 --prefix pilot-e1`: regenerated the pilot manifest with `datasetConstruction=controlled_game_session_states`.
- `npm run research:local-pipeline -- --report-dir docs/research/submission/local-pipeline`: completed 11 local-only downstream artifact steps after adding `full-e1`; submission gate now reports 9 blocking `[NEED_EXPERIMENT]` markers.
- `python3` JSON Schema validation with `Draft202012Validator` over `schemas/decision-point.schema.json`: validated 500 `experiments/full-e1/decisions/*.json` files.
- `npm run test:run -- server/src/research/pilotDatasetExporter.test.ts server/src/research/experimentResolutionLedger.test.ts server/src/research/submissionGate.test.ts`: passed, 3 test files and 10 tests.
- `jq empty docs/research/experiments/full-e1/manifest.json docs/research/experiments/full-e1/decisions/*.json docs/research/experiments/pilot-e1/manifest.json docs/research/submission/reproducibility-manifest.json docs/research/submission/gate-report/submission-gate-report.json docs/research/submission/experiment-resolution-ledger/experiment-resolution-ledger.json`: passed.
- `jq '{overallStatus, markerCounts, immediateBlockers}' docs/research/submission/gate-report/submission-gate-report.json`: confirmed `overallStatus=not_ready`, 9 blocking `[NEED_EXPERIMENT]` markers, and 5 immediate blockers.
- `docs/research/drafts/paper-as-code/05_discussion_limitations.md`: rewrote the broad Guandan generalization sentence as an explicit limitation; the paper now states that it does not claim empirical generalization beyond Guandan without additional environments.
- `npm run research:local-pipeline -- --report-dir docs/research/submission/local-pipeline`: completed 11 local-only downstream artifact steps after the generalization-limitation rewrite.
- `jq '{overallStatus, markerCounts, immediateBlockers}' docs/research/submission/gate-report/submission-gate-report.json`: confirmed `overallStatus=not_ready`, 8 blocking `[NEED_EXPERIMENT]` markers, and 5 immediate blockers.
- `jq '{items:.counts.totalItems,status:.counts.byStatus,families:.counts.byEvidenceFamily}' docs/research/submission/experiment-resolution-ledger/experiment-resolution-ledger.json`: confirmed 8 blocking experiment markers, 8 `missing_evidence`, and no remaining `generalization` evidence-family blockers.
- `npm run test:run -- server/src/research/ablationSummary.test.ts server/src/research/paperTableArtifacts.test.ts server/src/research/localResearchPipeline.test.ts server/src/research/reproducibilityManifest.test.ts`: passed, 4 test files and 6 tests.
- `npx tsx server/src/research/writeAblationSummaryCli.ts --out docs/research/experiments/pilot-ablation-summary`: generated `ablation-summary.json` and `.md` with status `missing_metrics` and five planned verifier-ablation rows.
- `npm run research:local-pipeline -- --report-dir docs/research/submission/local-pipeline`: completed 12 local-only downstream artifact steps after adding the ablation summary writer and Table 3.
- `jq '{status,rowCount:(.rows|length)}' docs/research/experiments/pilot-ablation-summary/ablation-summary.json`: confirmed status `missing_metrics` and 5 ablation rows.
- `docs/research/tables/table-3-verifier-ablation.md`: generated compact paper table source for verifier ablations; all result cells remain `[NEED_EXPERIMENT]`.
