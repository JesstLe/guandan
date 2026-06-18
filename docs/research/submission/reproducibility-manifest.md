# Reproducibility Manifest

Generated at: `2026-06-18T00:50:07.843Z`

Missing entries are audit findings, not experimental results.

| Artifact | Status | Kind | Path | Files | Bytes | Digest |
| --- | --- | --- | --- | ---: | ---: | --- |
| Project Record | `present` | file | `PROJECT.md` |  | 4064 | `8961346e8dbe64acb8ff24cf1a2794a316953e7045ea2d9b43f0365694c757b3` |
| Material Passport | `present` | file | `material_passport.md` |  | 65493 | `ed43a1593cbeebdf1602db93d3a703a351740d57a99917e587dbd7b0c9bb0c68` |
| Literature Matrix | `present` | file | `notes/literature_matrix.csv` |  | 9888 | `1c856c86d71af878c259b7776e032f9d31954a57f79add1fe52e4cdd01a8acc6` |
| Evaluation Schemas | `present` | directory | `schemas` | 3 | 14490 | tree:`214a03e20180e8be3dcc7cd9ed6f6df46def24d6e9de66eb8b66302b74104fe6` |
| Prompt Templates | `present` | directory | `prompts` | 3 | 3798 | tree:`2e92f558075bc6a445d758e9b9556e74f5593da2d73183eff610956816d4ab2e` |
| Pilot Dataset Manifest | `present` | file | `experiments/pilot-e1/manifest.json` |  | 3051 | `a222ca259c2d800ab5c960b5b3d0b27dfcc64df3a377817cdd37e82e9d039ab4` |
| Pilot Decision Points | `present` | directory | `experiments/pilot-e1/decisions` | 50 | 135870 | tree:`c008587e4156659db8c291f8807b8e1226df55963722a15f94c333eb2d35b71d` |
| Full Evaluation Dataset Manifest | `present` | file | `experiments/full-e1/manifest.json` |  | 25502 | `22951c6f9231826cafbfb0e90f8074a1519ce8f3c18a92b35038205b6767f909` |
| Full Evaluation Decision Points | `present` | directory | `experiments/full-e1/decisions` | 500 | 1357700 | tree:`d88a8f61615bb77b48a86a314fd716412136cad0da076253ea810f644bec29d6` |
| Legal-First Baseline Metrics | `present` | file | `experiments/pilot-e2-heuristic-verifier/metrics.json` |  | 5973 | `abe1e67c7183b04ee6f071410bfcbb6482ba58f5f5523d91e1dfd28e9dc37626` |
| Strategic Baseline Metrics | `present` | file | `experiments/pilot-e3-strategic-heuristic/metrics.json` |  | 5972 | `350c2ed84a146d2d9e6ad0f5ada55d66f12792e014bed7fae6a3a86a1ce90271` |
| Plain LLM Prompt Packets | `present` | directory | `experiments/pilot-e4-plain-llm-prompts/packets` | 50 | 197230 | tree:`e6e3861dadb1087aaf689595668595a612e95bcd024f263db9599321bb98da22` |
| Candidate-Constrained Prompt Packets | `present` | directory | `experiments/pilot-e5-candidate-constrained-prompts/packets` | 50 | 276130 | tree:`f2c18d5de7286ce31e214d3b4ff17d08d9bd9c306a952876e554cc365310e7de` |
| Fixture Revision Prompt Packets | `present` | directory | `experiments/pilot-e6-verifier-revision-fixture-prompts/packets` | 50 | 409850 | tree:`24c2f42791c5192c7a3d6daaab8a2901c4b89338c0a2bea0fc8a9c4f00f1804d` |
| Plain OpenAI Batch Input | `present` | file | `experiments/pilot-e4-plain-llm-batch/openai/openai-batch-input.jsonl` |  | 188880 | `15583ed3d45dbf1768238b3c334f0c344ea348d98c727044ef648c503b993775` |
| Candidate OpenAI Batch Input | `present` | file | `experiments/pilot-e5-candidate-constrained-batch/openai/openai-batch-input.jsonl` |  | 266180 | `f81386553dcf8b64e71b26230c36c3cbcfcb8a565e9074a8d68a4ba3b972577f` |
| Fixture Revision OpenAI Batch Input | `present` | file | `experiments/pilot-e6-verifier-revision-fixture-batch/openai/openai-batch-input.jsonl` |  | 399850 | `ba76709a0f51220f6b5b86c3806f62f0b321c8caad98e800b29ce8a4b012236a` |
| Provider Run Handoff | `present` | file | `submission/provider-run-handoff.md` |  | 6078 | `1d978083fb957321ef28f61bbea48bc3bedfe7a77f590496cac90c94cc891678` |
| Provider Handoff Audit | `present` | file | `submission/provider-handoff-audit/provider-handoff-audit.json` |  | 3623 | `3008bc68665c687677dd1d4106c39b01d32f979d9d8bf645b22d20bc206c70cc` |
| Plain Raw Output Audit | `present` | file | `experiments/pilot-e4-plain-llm-batch/raw-output-audit.json` |  | 2397 | `9fe4a04e32c41fa67bb54adb02b23e1ffc46f9a603aeaafada79191c2a2d9cde` |
| Candidate Raw Output Audit | `present` | file | `experiments/pilot-e5-candidate-constrained-batch/raw-output-audit.json` |  | 2421 | `c52951771531742a1641e97fc391c81c69b30ca605c6094a3d12619c7b41c5f9` |
| Revision Raw Output Audit | `present` | file | `experiments/pilot-e6-verifier-revision-fixture-batch/raw-output-audit.json` |  | 2879 | `44e92c125a1d974ec8bc2aab3a136d98635bab128d65f0746b39b9ad8c75d40c` |
| Plain Provider Results | `missing` | missing | `experiments/provider-results/plain-llm.jsonl` |  | 0 |  |
| Candidate Provider Results | `missing` | missing | `experiments/provider-results/candidate-constrained-llm.jsonl` |  | 0 |  |
| Verifier Revision Provider Results | `missing` | missing | `experiments/provider-results/verifier-revision-llm.jsonl` |  | 0 |  |
| Pilot Metrics Summary | `present` | file | `experiments/pilot-metrics-summary/pilot-metrics-summary.json` |  | 3238 | `86b836e8f66bc7db9a2bded2691bda5890b8281b40afd30d03d2e1fafab38640` |
| Revision Comparison | `present` | file | `experiments/pilot-revision-comparison/revision-comparison.json` |  | 2602 | `b790ce216268155d229155906de7b3a1089443efaca4a458ca72f3e4613719f4` |
| Verifier Ablation Summary | `present` | file | `experiments/pilot-ablation-summary/ablation-summary.json` |  | 3444 | `d601f51a62cb4ab6c8b9d610c651ecf4dac101fe8232df9a83f8438f34fb42ea` |
| Paper Table Sources | `present` | directory | `tables` | 5 | 4764 | tree:`99e84e653a08a75aa75cc9ee90ab9cfdddc86ab5ae53c470930699aa014c88d5` |
| Figure Sources | `present` | directory | `figures` | 2 | 1253 | tree:`ea476cdd21e94be0a6dd2aa830b402453c6542004a893f2ffe535ca02e5c2a3c` |
| Normalized Bibliography | `present` | file | `submission/references.bib` |  | 5918 | `86f88c35847b07cb41386b5d5b19e63535f2dbb5a8f5b1d11f9a3ded174badf1` |
| Bibliography Integrity Report | `present` | file | `submission/citation-integrity/bibliography-integrity-report.json` |  | 255 | `0fba8f813933e6926e179be97b70ed97e3a0e29513e61b98cbfd9ea6dddf9d2e` |
| Assembled Manuscript | `present` | file | `submission/manuscript/manuscript-draft.md` |  | 22291 | `2c03ea61cf15f90cfef04d4436f6ece8fc99153017c681b522b7466657bc3119` |
| Manuscript Status | `present` | file | `submission/manuscript/manuscript-status.json` |  | 831 | `abbb6e070407085f29a17250fe5bff3066f936d50c45be600ebc6d4aab9fc9fb` |
| Submission Gate Report | `present` | file | `submission/gate-report/submission-gate-report.json` |  | 2716 | `436b93e83a4625a678a6cdd0a028bce9b57c8c44501481bd7d42008d1d6bdf9d` |
| Submission Marker Inventory | `present` | file | `submission/marker-inventory/submission-marker-inventory.json` |  | 10204 | `8ad706f47db6a6345fa7e75ed070472bfe0a12c073f54bc2674ddb16a56bc5b9` |
| Experiment Resolution Ledger | `present` | file | `submission/experiment-resolution-ledger/experiment-resolution-ledger.json` |  | 39324 | `a2bc4e818dad2be72e717e31fdf74c7fc6ecb8c175e0f0cfda1fc24a31609f2b` |
| Research Preflight Report | `present` | file | `submission/preflight/research-preflight-report.json` |  | 2009 | `69288e0b7b62ada87193f9c7c3cb32f1df7b443aedd030c43384090d213afdb8` |
| Local Research Pipeline Report | `present` | file | `submission/local-pipeline/local-research-pipeline-report.json` |  | 8344 | `fd502bd9fba34e81734eaf5cbc89a1789ba1f677a01265038ff85d4817989cf2` |
| Submission Checklist | `present` | file | `submission/submission_checklist.md` |  | 8025 | `d7ee66a3a522a6bfc4e25c827ef644faea1d873f35898d63575a180200bc2aa1` |
| Working Submission Profile | `present` | file | `submission/submission-profile.md` |  | 4191 | `4830c603c5293d3c08afa112d014aa0779c4ff21d483ee221ba4c055b8f66a27` |
| Author Decision Brief | `present` | file | `submission/author-decision-brief.md` |  | 5696 | `7ec62cfb0801c72324e449605ac89fe389641456bed6d65719eab6be59939184` |
| AI-Use Disclosure | `present` | file | `submission/ai-use-disclosure.md` |  | 2270 | `9037ef3f33c6389aa0926398df5d7aab8af148e22e0da26a829d1af62db8cf24` |
