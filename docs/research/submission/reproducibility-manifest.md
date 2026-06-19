# Reproducibility Manifest

Generated at: `2026-06-18T21:15:59.414Z`

Missing entries are audit findings, not experimental results. Pending entries are expected external-evidence gaps tracked by readiness gates.

| Artifact | Status | Kind | Path | Files | Bytes | Digest |
| --- | --- | --- | --- | ---: | ---: | --- |
| Project Record | `present` | file | `PROJECT.md` |  | 4064 | `8961346e8dbe64acb8ff24cf1a2794a316953e7045ea2d9b43f0365694c757b3` |
| Material Passport | `present` | file | `material_passport.md` |  | 65493 | `ed43a1593cbeebdf1602db93d3a703a351740d57a99917e587dbd7b0c9bb0c68` |
| Literature Matrix | `present` | file | `notes/literature_matrix.csv` |  | 9888 | `1c856c86d71af878c259b7776e032f9d31954a57f79add1fe52e4cdd01a8acc6` |
| Evaluation Schemas | `present` | directory | `schemas` | 3 | 14490 | tree:`214a03e20180e8be3dcc7cd9ed6f6df46def24d6e9de66eb8b66302b74104fe6` |
| Prompt Templates | `present` | directory | `prompts` | 4 | 6192 | tree:`9c710eac6eeb07391ff8c98574b5e8e58174d778fd4427634e9b60e916405dff` |
| Pilot Dataset Manifest | `present` | file | `experiments/pilot-e1/manifest.json` |  | 3051 | `a222ca259c2d800ab5c960b5b3d0b27dfcc64df3a377817cdd37e82e9d039ab4` |
| Pilot Decision Points | `present` | directory | `experiments/pilot-e1/decisions` | 50 | 135870 | tree:`c008587e4156659db8c291f8807b8e1226df55963722a15f94c333eb2d35b71d` |
| Full Evaluation Dataset Manifest | `present` | file | `experiments/full-e1/manifest.json` |  | 25502 | `22951c6f9231826cafbfb0e90f8074a1519ce8f3c18a92b35038205b6767f909` |
| Full Evaluation Decision Points | `present` | directory | `experiments/full-e1/decisions` | 500 | 1357700 | tree:`d88a8f61615bb77b48a86a314fd716412136cad0da076253ea810f644bec29d6` |
| Legal-First Baseline Metrics | `present` | file | `experiments/pilot-e2-heuristic-verifier/metrics.json` |  | 5973 | `abe1e67c7183b04ee6f071410bfcbb6482ba58f5f5523d91e1dfd28e9dc37626` |
| Strategic Baseline Metrics | `present` | file | `experiments/pilot-e3-strategic-heuristic/metrics.json` |  | 5972 | `350c2ed84a146d2d9e6ad0f5ada55d66f12792e014bed7fae6a3a86a1ce90271` |
| Full Split Legal-First Baseline Metrics | `present` | file | `experiments/full-e2-heuristic-verifier/metrics.json` |  | 48634 | `1eba78a7fb1b14a952a0c1d3c6ae4676acff7bcf1760fe996bf988806858f350` |
| Full Split Strategic Baseline Metrics | `present` | file | `experiments/full-e3-strategic-heuristic/metrics.json` |  | 48634 | `9701d0ea3c7a286a8995d26287f193fb122e3b36da1cbe87a324ec7b16fdd3de` |
| Full Split Baseline Summary | `present` | file | `experiments/full-baseline-summary/full-baseline-summary.json` |  | 1547 | `5bf49e6e34ecf7c2e6a091fb3c5da64b8b6eabcb3d1bdd206b88521573ff252f` |
| Plain LLM Prompt Packets | `present` | directory | `experiments/pilot-e4-plain-llm-prompts/packets` | 50 | 197230 | tree:`e6e3861dadb1087aaf689595668595a612e95bcd024f263db9599321bb98da22` |
| Candidate-Constrained Prompt Packets | `present` | directory | `experiments/pilot-e5-candidate-constrained-prompts/packets` | 50 | 276130 | tree:`f2c18d5de7286ce31e214d3b4ff17d08d9bd9c306a952876e554cc365310e7de` |
| ToM-Prompted Pilot Prompt Packets | `present` | directory | `experiments/pilot-e7-tom-prompted-prompts/packets` | 50 | 306430 | tree:`f43d3671aafca6bcce0e4361d678ffcdccb78d0c830ac627221541d6a6f401dc` |
| Full Split Plain Prompt Packets | `present` | directory | `experiments/full-e2-plain-llm-prompts/packets` | 500 | 1969800 | tree:`cdaba3724686a748372202030c058b12a8294ef39408501b5073199a234d9441` |
| Full Split Candidate-Constrained Prompt Packets | `present` | directory | `experiments/full-e3-candidate-constrained-prompts/packets` | 500 | 2759800 | tree:`2f94a8151c62f77f66282436f8832c1034f870fe7c418608fe72d91e8c5f1b99` |
| ToM-Prompted Full Prompt Packets | `present` | directory | `experiments/full-e4-tom-prompted-prompts/packets` | 500 | 3061800 | tree:`72083f197f4c599641ea759f30889f9ca0a878b7c03db1b65306ee3308755c82` |
| Fixture Revision Prompt Packets | `present` | directory | `experiments/pilot-e6-verifier-revision-fixture-prompts/packets` | 50 | 409850 | tree:`24c2f42791c5192c7a3d6daaab8a2901c4b89338c0a2bea0fc8a9c4f00f1804d` |
| Plain OpenAI Batch Input | `present` | file | `experiments/pilot-e4-plain-llm-batch/openai/openai-batch-input.jsonl` |  | 188880 | `15583ed3d45dbf1768238b3c334f0c344ea348d98c727044ef648c503b993775` |
| Candidate OpenAI Batch Input | `present` | file | `experiments/pilot-e5-candidate-constrained-batch/openai/openai-batch-input.jsonl` |  | 266180 | `f81386553dcf8b64e71b26230c36c3cbcfcb8a565e9074a8d68a4ba3b972577f` |
| ToM-Prompted Pilot OpenAI Batch Input | `present` | file | `experiments/pilot-e7-tom-prompted-batch/openai/openai-batch-input.jsonl` |  | 297380 | `03f118b1729ec416cb92b98898f13e8f3dccd05ed8d7a7b38c2a2c97d1865f81` |
| Full Split Plain OpenAI Batch Input | `present` | file | `experiments/full-e2-plain-llm-batch/openai/openai-batch-input.jsonl` |  | 1886800 | `ebcd79e93134a8928aa1fd3b47a02a6689425f2f2c93e1caad7c0c03c265f1dd` |
| Full Split Candidate-Constrained OpenAI Batch Input | `present` | file | `experiments/full-e3-candidate-constrained-batch/openai/openai-batch-input.jsonl` |  | 2660800 | `9a68761d4793d0385cba824e874e49f1bc7b4b0dc94a98fe37762ac6d3a1f3ac` |
| ToM-Prompted Full OpenAI Batch Input | `present` | file | `experiments/full-e4-tom-prompted-batch/openai/openai-batch-input.jsonl` |  | 2971800 | `529fc2182ea5cced73251620f195cedff8e6a084c2a47dd0a577bea819a36659` |
| Fixture Revision OpenAI Batch Input | `present` | file | `experiments/pilot-e6-verifier-revision-fixture-batch/openai/openai-batch-input.jsonl` |  | 399850 | `ba76709a0f51220f6b5b86c3806f62f0b321c8caad98e800b29ce8a4b012236a` |
| Provider Run Handoff | `present` | file | `submission/provider-run-handoff.md` |  | 14171 | `684480bef0ef282fa37bf123d6697dc97cf5e70bdd0645c318a54123d2e4679a` |
| Provider Handoff Audit | `present` | file | `submission/provider-handoff-audit/provider-handoff-audit.json` |  | 6557 | `8f2b48835415c39e00f838b5c34361304a6d23decd002b42bd11cf0c68c004fd` |
| Plain Raw Output Audit | `present` | file | `experiments/pilot-e4-plain-llm-batch/raw-output-audit.json` |  | 2397 | `9fe4a04e32c41fa67bb54adb02b23e1ffc46f9a603aeaafada79191c2a2d9cde` |
| Candidate Raw Output Audit | `present` | file | `experiments/pilot-e5-candidate-constrained-batch/raw-output-audit.json` |  | 2421 | `c52951771531742a1641e97fc391c81c69b30ca605c6094a3d12619c7b41c5f9` |
| ToM-Prompted Pilot Raw Output Audit | `present` | file | `experiments/pilot-e7-tom-prompted-batch/raw-output-audit.json` |  | 400 | `7abcfcfb8db067b978752ef9b0f0abb6bbc722a9f455a68e9406394dc2229734` |
| Full Split Plain Raw Output Audit | `present` | file | `experiments/full-e2-plain-llm-batch/raw-output-audit.json` |  | 19897 | `44875b2792012bf54f52a9a4d8345f6a99e44b4f909d5e8f84b3cc5698f9810c` |
| Full Split Candidate-Constrained Raw Output Audit | `present` | file | `experiments/full-e3-candidate-constrained-batch/raw-output-audit.json` |  | 19921 | `6717378d882ee3a382ab2f6547d77169ae7163cdf2e4ad9a1d038686e8d59eef` |
| ToM-Prompted Full Raw Output Audit | `present` | file | `experiments/full-e4-tom-prompted-batch/raw-output-audit.json` |  | 4929 | `967056332185f1388b89d39e5e08a9c970350b8bfc31ce82a9acc305d1d590f3` |
| Revision Raw Output Audit | `present` | file | `experiments/pilot-e6-verifier-revision-fixture-batch/raw-output-audit.json` |  | 2879 | `44e92c125a1d974ec8bc2aab3a136d98635bab128d65f0746b39b9ad8c75d40c` |
| Plain Provider Results | `present` | file | `experiments/provider-results/plain-llm.jsonl` |  | 79327 | `872234cb1d070856f51f8212fc10693b26960647adeea0d258e9d7dfd9558c12` |
| Candidate Provider Results | `present` | file | `experiments/provider-results/candidate-constrained-llm.jsonl` |  | 88650 | `327f8e01edb869abb5bef46064169fb4c4ccb9b500e4461e3b95be821d7ff454` |
| ToM-Prompted Provider Results | `present` | file | `experiments/provider-results/tom-prompted-llm.jsonl` |  | 131673 | `8a892129f10ac91169b7905f63862576e926c4903751497e12c236b7b1dc410f` |
| ToM-Prompted Provider Merge Report | `present` | file | `experiments/provider-results/tom-prompted-llm-kimi-merge-report.json` |  | 1362 | `ab01a3566a8d9bc760fa918e147efdbbcd40d1422217890ee8d4cec7dc63c8c5` |
| Full Split ToM-Prompted Provider Results | `present` | file | `experiments/provider-results/full-tom-prompted-llm.jsonl` |  | 1070418 | `2bd7fd52552011a0261d6e1abc3652497b66d491df4e3f8456b9a2dc2bc54948` |
| Full Split ToM-Prompted Provider Run Report | `present` | file | `experiments/provider-results/full-tom-prompted-llm-kimi-cli-run-report.json` |  | 654 | `f20101cd1e3c7812fb916b7aa43daf0bfe20da70509a9e47f5d617809e65d984` |
| Verifier Revision Provider Results | `present` | file | `experiments/provider-results/verifier-revision-llm.jsonl` |  | 79343 | `653dcae7dc2ae944094913a59aa80d7837bd4440527845d3f759473261cac44b` |
| ToM-Prompted Pilot Metrics | `present` | file | `experiments/pilot-e7-tom-prompted-results/metrics.json` |  | 8383 | `546a546532de387a434919123ae2e2201007db22f1b982c351465ac74d23b24a` |
| ToM-Prompted Run Provenance | `present` | file | `experiments/pilot-e7-tom-prompted-results/provenance.json` |  | 675 | `d560a3a9681ee609728e11d484d7651222c3871651c5df89d69d084b2de8263a` |
| ToM-Prompted Post-Provider Report | `present` | file | `experiments/pilot-e7-tom-prompted-results/post-provider-report.json` |  | 13059 | `0012555ce3e612b061dca7a6dc42a2db468e0336a8ec5f70dc112ffabe4aaf01` |
| ToM-Prompted Failure Analysis | `present` | file | `experiments/pilot-e7-tom-failure-analysis/tom-failure-analysis.json` |  | 14219 | `8b865c97e95367d9c009f59e87c9f18ec712b76fcb9afd1b6ae9a14664edf010` |
| ToM Schema Repair Metrics | `present` | file | `experiments/pilot-e8-tom-schema-repair-results/metrics.json` |  | 6325 | `326f14ee3784c7e51de5ecd55ecb1064182dd0fbcc1bd96973834319995ec3a9` |
| ToM Schema Repair Report | `present` | file | `experiments/pilot-e8-tom-schema-repair-results/schema-repair-report.json` |  | 31272 | `cff0cf3e02019a38130b1e82df86c79f13e060c079f536558f76d346db4907b2` |
| Full Split ToM-Prompted Metrics | `present` | file | `experiments/full-e4-tom-prompted-results/metrics.json` |  | 76859 | `79e6c5afa5ac60c5bafd20bfe7ac6f35b3cb32b63400110a61243a364ec5f914` |
| Full Split ToM-Prompted Post-Provider Report | `present` | file | `experiments/full-e4-tom-prompted-results/post-provider-report.json` |  | 123209 | `08e7b54df5a7228266f8f9b80ba73db1e1d80a9a9575355cc8cb7bac5276f66b` |
| Full Split ToM Schema Repair Metrics | `present` | file | `experiments/full-e5-tom-schema-repair-results/metrics.json` |  | 64018 | `ff66830d1bd6f5015ca317889de86f00a732ffc7370df5cd7478ba394e5de25a` |
| Full Split ToM Schema Repair Report | `present` | file | `experiments/full-e5-tom-schema-repair-results/schema-repair-report.json` |  | 268351 | `d91e919d4862e25316aed98d33cfaadf1da338f308416320c8fd5ab489ed3355` |
| Full Split LLM Summary | `present` | file | `experiments/full-llm-summary/full-llm-summary.json` |  | 1764 | `20de5ad7c121831f4240a552a15f7b580f58eacfa662d7559d0821f9d4ffa3af` |
| Human Soft-Label Audit Manifest | `present` | file | `experiments/human-soft-label-audit/human-audit-manifest.json` |  | 1168 | `4203d71b73e681f29719432f274279b0c734d58a52fa88d02bbcb0bcf41c50f8` |
| Human Soft-Label Audit Blind Sample | `present` | file | `experiments/human-soft-label-audit/human-audit-blind-sample.jsonl` |  | 71724 | `f3c41e0d160d1de238f90098e953d976a44fd707f033107f21f0b3f2ba02e040` |
| Human Soft-Label Audit Annotation Sheet | `present` | file | `experiments/human-soft-label-audit/human-audit-annotation-sheet.csv` |  | 64755 | `c23cd6669d65e14de5e1f547ff3c3d5e7e3842ca2956816dafe1bcdde46b0272` |
| Human Soft-Label Audit Annotator HTML | `present` | file | `experiments/human-soft-label-audit/human-audit-annotator.html` |  | 91529 | `adf32e168e92438f8bba1ea9854af602f3d7d05914e85788fa0dd8c504594880` |
| Human Soft-Label Audit Answer Key | `present` | file | `experiments/human-soft-label-audit/human-audit-answer-key.jsonl` |  | 81697 | `1b19e864534448ddfbc3a0e8e010722712de0a844b8a3b2ab18d6a86c0c2d1fa` |
| Human Soft-Label Audit Protocol | `present` | file | `experiments/human-soft-label-audit/human-audit-protocol.md` |  | 3622 | `58cda4cdcf7890ae1a3ef65e092da326c1c5a47b7c4c1b201cb623ead7b2090d` |
| Human Soft-Label Audit Packet Quality Report | `present` | file | `experiments/human-soft-label-audit/human-audit-packet-quality-report.json` |  | 3294 | `288fe9bc464499329bbe1058c1a3a55a97bb4caa9795e139c6bbf3ac030e07ef` |
| Human Soft-Label Audit Packet Quality Report Markdown | `present` | file | `experiments/human-soft-label-audit/human-audit-packet-quality-report.md` |  | 2349 | `de09c4618e0f5fc6a6dabf896d6b98b36aee2c41b0df5037f62138d435e1cc4c` |
| Human Soft-Label Audit Blind Annotator Package Manifest | `present` | file | `experiments/human-soft-label-audit/annotator-package/human-audit-annotator-package-manifest.json` |  | 1923 | `7f6a3a8983e637460bf9af1959b0632ae2b0f38208a8b38f522488b951b194c3` |
| Human Soft-Label Audit Blind Annotator Package README | `present` | file | `experiments/human-soft-label-audit/annotator-package/README.md` |  | 891 | `c8b3d1d9114142388403d7abf2e09a7c0e14aaf0e00a9b98046d458ac34f97a3` |
| Human Soft-Label Audit Blind Annotator Package HTML | `present` | file | `experiments/human-soft-label-audit/annotator-package/human-audit-annotator.html` |  | 91529 | `adf32e168e92438f8bba1ea9854af602f3d7d05914e85788fa0dd8c504594880` |
| Human Soft-Label Audit Blind Annotator Package Sheet | `present` | file | `experiments/human-soft-label-audit/annotator-package/human-audit-annotation-sheet.csv` |  | 64755 | `c23cd6669d65e14de5e1f547ff3c3d5e7e3842ca2956816dafe1bcdde46b0272` |
| Human Soft-Label Audit Blind Annotator Package Samples | `present` | file | `experiments/human-soft-label-audit/annotator-package/human-audit-blind-sample.jsonl` |  | 71724 | `f3c41e0d160d1de238f90098e953d976a44fd707f033107f21f0b3f2ba02e040` |
| Human Soft-Label Audit Blind Annotator Package Archive | `present` | file | `experiments/human-soft-label-audit/human-audit-annotator-package.tar.gz` |  | 53634 | `e2df773cf84874ab9f7a86cbd65bcbc23bc8e1417015763586fe679fc7383f87` |
| Human Soft-Label Audit Blind Annotator Package Archive Report | `present` | file | `experiments/human-soft-label-audit/human-audit-annotator-package-archive-report.json` |  | 2429 | `fed6bca17088419dd0746df888bb6effd8c41fd248b76053d60a9d8ab58d0e21` |
| Human Soft-Label Audit Blind Annotator Package Archive Report Markdown | `present` | file | `experiments/human-soft-label-audit/human-audit-annotator-package-archive-report.md` |  | 1352 | `28f366d3f01b55302d84c51d8e82a994e985f837e5910a5c300313bba73500ee` |
| Human Soft-Label Audit Returned Completed Annotations | `pending` | pending | `experiments/human-soft-label-audit/human-audit-completed-annotations.csv` |  | 0 | Pending until external annotators return the completed blind annotation CSV. |
| Human Soft-Label Audit Returned-Annotation Intake Report | `present` | file | `experiments/human-soft-label-audit/human-audit-intake-report.json` |  | 2238 | `55426edff6e23b7ac4e64981885a9b88050077338431ef2686620313821bb0b3` |
| Human Soft-Label Audit Returned-Annotation Intake Report Markdown | `present` | file | `experiments/human-soft-label-audit/human-audit-intake-report.md` |  | 1492 | `aa4b13f40177cc71241d310632473cbbf95ec6d0d0dc6c3d831d01afe030f2af` |
| Human Soft-Label Audit Agreement Report | `present` | file | `experiments/human-soft-label-audit/human-audit-agreement-report.json` |  | 4092 | `3a7ea14aaf6358fb393817785d31b6d2d947dafaa18d3cd05234a4cf8b626e43` |
| Human Soft-Label Audit Agreement Report Markdown | `present` | file | `experiments/human-soft-label-audit/human-audit-agreement-report.md` |  | 1347 | `073c5964e4498548014ef2869d33675824f4cda2f1c7f8081a1ffe2c4197b4b4` |
| Pilot Metrics Summary | `present` | file | `experiments/pilot-metrics-summary/pilot-metrics-summary.json` |  | 4421 | `592b8c5f0854e728d2bf602f8a50581037e38fd88149ad66c0366b1f6a26b09b` |
| Revision Comparison | `present` | file | `experiments/pilot-revision-comparison/revision-comparison.json` |  | 1928 | `1adb7936f98bde01953c960d547e5b66cd1a5450e64cb3a7f26c3d303650f835` |
| Paired Verifier Attribution | `present` | file | `experiments/pilot-verifier-attribution/verifier-attribution.json` |  | 15039 | `ad53299ddd6491b8d6573b7f5524eedbbbdd0c7594e5ea55272cb9bacf797017` |
| Verifier Ablation Summary | `present` | file | `experiments/pilot-ablation-summary/ablation-summary.json` |  | 5296 | `aa96ab43078bf960fea216ef3e2e809ff72d0df14ef3094edc1793c092a314f1` |
| Paper Table Sources | `present` | directory | `tables` | 6 | 5922 | tree:`4c3ed29bf72f6ef02d37b73195bfaffeb247c68efbff3c3cb3b6ce12fd7fd1dc` |
| Figure Sources | `present` | directory | `figures` | 11 | 358247 | tree:`50e1edbfc5940d1e15947786edcd66a4912e9b20fafc88f80d497fd85413894c` |
| Verifier Pipeline Figure | `present` | file | `figures/figure-1-verifier-pipeline.svg` |  | 8811 | `cddb82111d925aaf76cd1200de539bc73d593d0e58792d232cb482dda3c17037` |
| Verifier Pipeline Figure Notes | `present` | file | `figures/figure-1-verifier-pipeline.md` |  | 1227 | `ef9e8873d5c1f47f216df9fad4108500dbd540385e0f93d142e1ddf54db761e9` |
| Verifier-Grounded Revision Architecture Figure | `present` | file | `figures/figure-2-revision-architecture.svg` |  | 7761 | `7bb2fce4f50cc8b67547f3c11cb9135e312ae604d403f1c9d977ff04954ee5aa` |
| Verifier-Grounded Revision Architecture Figure Notes | `present` | file | `figures/figure-2-revision-architecture.md` |  | 1222 | `3e43f1397ea10b61c2c88e34f7cfe169f524c3ef647e38e6d23556d3058665d7` |
| ToM Schema Repair Flow Figure | `present` | file | `figures/figure-3-tom-schema-repair-flow.svg` |  | 4584 | `c1cc05648e25d8eb16db51e32319c7f4e9d88211fb48e4665beef8c9f6288522` |
| ToM Schema Repair Flow Figure Notes | `present` | file | `figures/figure-3-tom-schema-repair-flow.md` |  | 838 | `77c1b530dde6e2b7efea32b0f8821ed4509cab11bd08e4f06cbb131eaaf63448` |
| Main Pilot Results Figure | `present` | file | `figures/figure-4-main-pilot-results.svg` |  | 8758 | `e8ad2998231c8804117a89e744810e4be2dc1af82aa9e5294c46794a5f340fbc` |
| Main Pilot Results Figure Notes | `present` | file | `figures/figure-4-main-pilot-results.md` |  | 1248 | `f10e18801290643c6991a73d3e41f3011410bc90882469016df21cd5c09a919b` |
| Normalized Bibliography | `present` | file | `submission/references.bib` |  | 5918 | `86f88c35847b07cb41386b5d5b19e63535f2dbb5a8f5b1d11f9a3ded174badf1` |
| Bibliography Integrity Report | `present` | file | `submission/citation-integrity/bibliography-integrity-report.json` |  | 255 | `77afdc8ab4dd3ed8f9bc348ed3a74bd9825b0922daf94c9aa891a09904df57c2` |
| Assembled Manuscript | `present` | file | `submission/manuscript/manuscript-draft.md` |  | 29553 | `6f96355c979fba0f5b091a50bea9726b84cc63f28c13c46b3d4ffa18e275447e` |
| Manuscript Status | `present` | file | `submission/manuscript/manuscript-status.json` |  | 830 | `e3b7f01b79e91661635690cafd957641d02264fc950eb8d6e5fbbd5426d4c85d` |
| AAMAS LaTeX Draft | `present` | directory | `submission/aamas-latex` | 22 | 6699222 | tree:`fe136843a707246f3745ad00b40335d4b0c8a4c0b83845d9fd85c63388ac5f06` |
| Submission Gate Report | `present` | file | `submission/gate-report/submission-gate-report.json` |  | 1856 | `3f088cbe513b443424db3273b23b3f6d4f556fd41f1726b44cf6bb29667cbce5` |
| Submission Marker Inventory | `present` | file | `submission/marker-inventory/submission-marker-inventory.json` |  | 562 | `840a067577fbd51ca313a6fbeeec86bf801d926dc673f60af1c429526bab9b92` |
| Experiment Resolution Ledger | `present` | file | `submission/experiment-resolution-ledger/experiment-resolution-ledger.json` |  | 522 | `a2bea975dd9cc5d827746b91c812ff7390217d57e15722a4909c242afec9507c` |
| Research Preflight Report | `present` | file | `submission/preflight/research-preflight-report.json` |  | 3759 | `066eac0ca56cff14cbb58066027ed415c50d97e9eb1bb2b49f507a9bd4e6869d` |
| AAMAS Full-Paper Readiness Report | `present` | file | `submission/aamas-readiness/aamas-readiness-report.json` |  | 8076 | `65de4041fc9dc343be98de8a781def685cf88a76b8d6e4f38f7f9bc0c0539f90` |
| AAMAS Full-Paper Readiness Report Markdown | `present` | file | `submission/aamas-readiness/aamas-readiness-report.md` |  | 4690 | `b827ee09d0a409d1dbd01dd541fce253a25e486986012c08c3f767316467c6c6` |
| Local Research Pipeline Report | `present` | file | `submission/local-pipeline/local-research-pipeline-report.json` |  | 40225 | `05850af3a58f36e1ef28302a20398f628d37ebe41da7eb60c2cabc614a9da276` |
| Submission Checklist | `present` | file | `submission/submission_checklist.md` |  | 8025 | `d7ee66a3a522a6bfc4e25c827ef644faea1d873f35898d63575a180200bc2aa1` |
| Working Submission Profile | `present` | file | `submission/submission-profile.md` |  | 4191 | `4830c603c5293d3c08afa112d014aa0779c4ff21d483ee221ba4c055b8f66a27` |
| Page Budget Snapshot | `present` | file | `submission/page-budget.md` |  | 6035 | `109451411191d2b5f0213f7fbf726f5837594a9a3b4bb2d4cc9f3bb48d34a15f` |
| Author Decision Brief | `present` | file | `submission/author-decision-brief.md` |  | 5696 | `7ec62cfb0801c72324e449605ac89fe389641456bed6d65719eab6be59939184` |
| AI-Use Disclosure | `present` | file | `submission/ai-use-disclosure.md` |  | 2270 | `9037ef3f33c6389aa0926398df5d7aab8af148e22e0da26a829d1af62db8cf24` |
