# Reproducibility Manifest

Generated at: `2026-06-20T19:08:13.614Z`

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
| Provider Run Handoff | `present` | file | `submission/provider-run-handoff.md` |  | 18616 | `87e299bc54e4d0b5d6e9bc83891bc11bbcf4ebbf8560942096f41335bfb72db6` |
| Human Soft-Label Audit Handoff | `present` | file | `submission/human-audit-handoff.md` |  | 6611 | `b4aa25a6f097e5153979960dfdb95029412ec8df80cb5531fa38ae915a368023` |
| Human Soft-Label Audit Launch Checklist | `present` | file | `submission/human-audit-launch/human-audit-launch-checklist.json` |  | 2611 | `44b97bb984db3dc888d30469a2784d0c41033c52538bd15493e0aa2afe276b90` |
| Human Soft-Label Audit Launch Checklist Markdown | `present` | file | `submission/human-audit-launch/human-audit-launch-checklist.md` |  | 1726 | `b554e826ed1f2cd22aa829423ae2271ce6cc84f8ded4a0e080ad60b96ca4ffbb` |
| Human Soft-Label Audit Evidence Gate | `present` | file | `submission/human-audit-evidence-gate/human-audit-evidence-gate.json` |  | 2244 | `2f3e7eb6e51b91be0f92c39ca4fda20a87a312d012e8e41587480c7f0dd5005e` |
| Human Soft-Label Audit Evidence Gate Markdown | `present` | file | `submission/human-audit-evidence-gate/human-audit-evidence-gate.md` |  | 1904 | `c9822c24ece3a627f11e87cb83e8d82ec18dbf44fb976230046d0299c315305e` |
| Provider Handoff Audit | `present` | file | `submission/provider-handoff-audit/provider-handoff-audit.json` |  | 6209 | `a0174cad289960b36f1967890fecbc81c58bce4b8e93a978e433e003373b274a` |
| Plain Raw Output Audit | `present` | file | `experiments/pilot-e4-plain-llm-batch/raw-output-audit.json` |  | 2397 | `9fe4a04e32c41fa67bb54adb02b23e1ffc46f9a603aeaafada79191c2a2d9cde` |
| Candidate Raw Output Audit | `present` | file | `experiments/pilot-e5-candidate-constrained-batch/raw-output-audit.json` |  | 2421 | `c52951771531742a1641e97fc391c81c69b30ca605c6094a3d12619c7b41c5f9` |
| ToM-Prompted Pilot Raw Output Audit | `present` | file | `experiments/pilot-e7-tom-prompted-batch/raw-output-audit.json` |  | 400 | `7abcfcfb8db067b978752ef9b0f0abb6bbc722a9f455a68e9406394dc2229734` |
| Full Split Plain Raw Output Audit | `present` | file | `experiments/full-e2-plain-llm-batch/raw-output-audit.json` |  | 17948 | `fe4878ce57a7cb0b3e58a1b27ff5c3a18cd2a04cf6fdfbfcece010f1d7c51358` |
| Full Split Candidate-Constrained Raw Output Audit | `present` | file | `experiments/full-e3-candidate-constrained-batch/raw-output-audit.json` |  | 17972 | `fe3240b8101cd97a6b438add98622894afceddeb2ace196075bce4d25fa662b5` |
| ToM-Prompted Full Raw Output Audit | `present` | file | `experiments/full-e4-tom-prompted-batch/raw-output-audit.json` |  | 400 | `04c950606782e22eeae5551c340ec762e95669de3c31edd10ac4a90bfa2ac9b3` |
| Revision Raw Output Audit | `present` | file | `experiments/pilot-e6-verifier-revision-fixture-batch/raw-output-audit.json` |  | 2879 | `44e92c125a1d974ec8bc2aab3a136d98635bab128d65f0746b39b9ad8c75d40c` |
| Plain Provider Results | `present` | file | `experiments/provider-results/plain-llm.jsonl` |  | 79327 | `872234cb1d070856f51f8212fc10693b26960647adeea0d258e9d7dfd9558c12` |
| Candidate Provider Results | `present` | file | `experiments/provider-results/candidate-constrained-llm.jsonl` |  | 88650 | `327f8e01edb869abb5bef46064169fb4c4ccb9b500e4461e3b95be821d7ff454` |
| ToM-Prompted Provider Results | `present` | file | `experiments/provider-results/tom-prompted-llm.jsonl` |  | 131673 | `8a892129f10ac91169b7905f63862576e926c4903751497e12c236b7b1dc410f` |
| ToM-Prompted Provider Merge Report | `present` | file | `experiments/provider-results/tom-prompted-llm-kimi-merge-report.json` |  | 1362 | `ab01a3566a8d9bc760fa918e147efdbbcd40d1422217890ee8d4cec7dc63c8c5` |
| Full Split ToM-Prompted Provider Results | `present` | file | `experiments/provider-results/full-tom-prompted-llm.jsonl` |  | 1404336 | `182a4367b4a7c739dd6f402b73fe5fef33e375fe726a2b7645181d25121913b8` |
| Full Split ToM-Prompted Provider Run Report | `present` | file | `experiments/provider-results/full-tom-prompted-llm-kimi-cli-run-report.json` |  | 652 | `394eb99ce1123d3b1fcf2e30b1f90efbea1707a82104143b9ac25772f40ef406` |
| Verifier Revision Provider Results | `present` | file | `experiments/provider-results/verifier-revision-llm.jsonl` |  | 79343 | `653dcae7dc2ae944094913a59aa80d7837bd4440527845d3f759473261cac44b` |
| ToM-Prompted Pilot Metrics | `present` | file | `experiments/pilot-e7-tom-prompted-results/metrics.json` |  | 8383 | `546a546532de387a434919123ae2e2201007db22f1b982c351465ac74d23b24a` |
| ToM-Prompted Run Provenance | `present` | file | `experiments/pilot-e7-tom-prompted-results/provenance.json` |  | 675 | `d560a3a9681ee609728e11d484d7651222c3871651c5df89d69d084b2de8263a` |
| ToM-Prompted Post-Provider Report | `present` | file | `experiments/pilot-e7-tom-prompted-results/post-provider-report.json` |  | 13059 | `0012555ce3e612b061dca7a6dc42a2db468e0336a8ec5f70dc112ffabe4aaf01` |
| ToM-Prompted Failure Analysis | `present` | file | `experiments/pilot-e7-tom-failure-analysis/tom-failure-analysis.json` |  | 14219 | `8b865c97e95367d9c009f59e87c9f18ec712b76fcb9afd1b6ae9a14664edf010` |
| ToM Schema Repair Metrics | `present` | file | `experiments/pilot-e8-tom-schema-repair-results/metrics.json` |  | 6325 | `326f14ee3784c7e51de5ecd55ecb1064182dd0fbcc1bd96973834319995ec3a9` |
| ToM Schema Repair Report | `present` | file | `experiments/pilot-e8-tom-schema-repair-results/schema-repair-report.json` |  | 31272 | `cff0cf3e02019a38130b1e82df86c79f13e060c079f536558f76d346db4907b2` |
| Full Split ToM-Prompted Metrics | `present` | file | `experiments/full-e4-tom-prompted-results/metrics.json` |  | 64651 | `5d959dd8e322875f57498975a3fa4783c1ec9b8c8436371ca440c74a57bf2c79` |
| Full Split ToM-Prompted Post-Provider Report | `present` | file | `experiments/full-e4-tom-prompted-results/post-provider-report.json` |  | 112009 | `0b437092aba3c43e072136076b87fc45ecad44ab7dc9c0cbc5b71fde358689c1` |
| Full Split ToM Schema Repair Metrics | `present` | file | `experiments/full-e5-tom-schema-repair-results/metrics.json` |  | 48817 | `a3e45e3a3460988fb48aaa1861fc6b94713865337a5b32d167e550fbe30a0c93` |
| Full Split ToM Schema Repair Report | `present` | file | `experiments/full-e5-tom-schema-repair-results/schema-repair-report.json` |  | 305197 | `ae7a6bd1bfe341498bf32f373b7b63b9a9cc334566bf9ee5896b93f697a0e71c` |
| Full Split LLM Summary | `present` | file | `experiments/full-llm-summary/full-llm-summary.json` |  | 3242 | `df444e0625289ae83d3599cd4c1e1c9674e94346a6fb8174b54e2be3c646facb` |
| Human Soft-Label Audit Manifest | `present` | file | `experiments/human-soft-label-audit/human-audit-manifest.json` |  | 1168 | `fbfb9a95c5cc16ffcf6d890cf0e8806f551be84cb8d5c87583b92dbd03178fc2` |
| Human Soft-Label Audit Blind Sample | `present` | file | `experiments/human-soft-label-audit/human-audit-blind-sample.jsonl` |  | 73629 | `4f4d91d092c3209b360f8de3b0e64d6ca11d823858a2eb585dfc1d456002a1cf` |
| Human Soft-Label Audit Annotation Sheet | `present` | file | `experiments/human-soft-label-audit/human-audit-annotation-sheet.csv` |  | 66660 | `6310faff48ad48d70f94908e79560b7b74ceb0b98921bb5a0fddb3285bd2bfd2` |
| Human Soft-Label Audit Annotator HTML | `present` | file | `experiments/human-soft-label-audit/human-audit-annotator.html` |  | 93434 | `bb580b28f1b1e46c60faa6037dc0a8b27c83ac225b7ab068ae01a9ffc828ecc2` |
| Human Soft-Label Audit Answer Key | `present` | file | `experiments/human-soft-label-audit/human-audit-answer-key.jsonl` |  | 83599 | `4c105377dba6e596ae53e231fc21f864f01255afe41863c9b65b86c3aa955183` |
| Human Soft-Label Audit Protocol | `present` | file | `experiments/human-soft-label-audit/human-audit-protocol.md` |  | 4963 | `268e4219e183e0aea71376956458a799704af44694443fc38a20e3d8ae4bc2ab` |
| Human Soft-Label Audit Packet Quality Report | `present` | file | `experiments/human-soft-label-audit/human-audit-packet-quality-report.json` |  | 3294 | `2ffcd7c6d5cd44c2c1be50ac14d31728d4306a05dfa2a790c42293e534764a8a` |
| Human Soft-Label Audit Packet Quality Report Markdown | `present` | file | `experiments/human-soft-label-audit/human-audit-packet-quality-report.md` |  | 2349 | `0c8f22bd4edadc53befa53a9f231c070232afd51b3dbcaf50248138551edfa3f` |
| Human Soft-Label Audit Blind Annotator Package Manifest | `present` | file | `experiments/human-soft-label-audit/annotator-package/human-audit-annotator-package-manifest.json` |  | 1923 | `1dcf4677a9e4647364742b710874eaf4a2759f57a29cb96bfa21a862ac59510b` |
| Human Soft-Label Audit Blind Annotator Package README | `present` | file | `experiments/human-soft-label-audit/annotator-package/README.md` |  | 2339 | `db962a0430845f20527d29dc84a96afce93295fcddbbd425ec928fad512900c4` |
| Human Soft-Label Audit Blind Annotator Package HTML | `present` | file | `experiments/human-soft-label-audit/annotator-package/human-audit-annotator.html` |  | 93434 | `bb580b28f1b1e46c60faa6037dc0a8b27c83ac225b7ab068ae01a9ffc828ecc2` |
| Human Soft-Label Audit Blind Annotator Package Sheet | `present` | file | `experiments/human-soft-label-audit/annotator-package/human-audit-annotation-sheet.csv` |  | 66660 | `6310faff48ad48d70f94908e79560b7b74ceb0b98921bb5a0fddb3285bd2bfd2` |
| Human Soft-Label Audit Blind Annotator Package Samples | `present` | file | `experiments/human-soft-label-audit/annotator-package/human-audit-blind-sample.jsonl` |  | 73629 | `4f4d91d092c3209b360f8de3b0e64d6ca11d823858a2eb585dfc1d456002a1cf` |
| Human Soft-Label Audit Blind Annotator Package Archive | `present` | file | `experiments/human-soft-label-audit/human-audit-annotator-package.tar.gz` |  | 54786 | `0b9f0f700db5184dad18a7bd68701b4a9e6742ee54a77af66bcd3d3d66f58a4d` |
| Human Soft-Label Audit Blind Annotator Package Archive Report | `present` | file | `experiments/human-soft-label-audit/human-audit-annotator-package-archive-report.json` |  | 2429 | `e44759e1f48d66cc8beedf28e49bfe3895992c4351b21de044fa4a230d0b188f` |
| Human Soft-Label Audit Blind Annotator Package Archive Report Markdown | `present` | file | `experiments/human-soft-label-audit/human-audit-annotator-package-archive-report.md` |  | 1352 | `b7a0e528bd4e588a1a0cdfd800c73ba5cd82dae4fcef2a2a9760902a742b9db8` |
| Human Soft-Label Audit Returned Completed Annotations | `pending` | pending | `experiments/human-soft-label-audit/human-audit-completed-annotations.csv` |  | 0 | Pending until external annotators return the completed blind annotation CSV. |
| Human Soft-Label Audit Annotator A Completed Annotations | `pending` | pending | `experiments/human-soft-label-audit/human-audit-completed-annotations-annotator-a.csv` |  | 0 | Pending until annotator A returns the completed blind annotation CSV. |
| Human Soft-Label Audit Annotator B Completed Annotations | `pending` | pending | `experiments/human-soft-label-audit/human-audit-completed-annotations-annotator-b.csv` |  | 0 | Pending until annotator B returns the completed blind annotation CSV. |
| Human Soft-Label Audit Adjudicated Annotations | `pending` | pending | `experiments/human-soft-label-audit/human-audit-adjudicated-annotations.csv` |  | 0 | Pending until two returned annotator CSVs are reconciled without the verifier answer key. |
| Human Soft-Label Audit Returned-Annotation Intake Report | `present` | file | `experiments/human-soft-label-audit/human-audit-intake-report.json` |  | 2242 | `4ab34d08069c22d687069547c980b0461a0bc267be3277f897a5552614a0d78d` |
| Human Soft-Label Audit Returned-Annotation Intake Report Markdown | `present` | file | `experiments/human-soft-label-audit/human-audit-intake-report.md` |  | 1496 | `9485e11393117d596a20ae5b7412cde41ea76727750eb78937ebf8100b667649` |
| Human Soft-Label Audit Inter-Annotator Agreement Report | `present` | file | `experiments/human-soft-label-audit/human-audit-inter-annotator-agreement-report.json` |  | 5052 | `748ea076b190973ae52ff7b3913c89d964dc8a6f16a0e9b0fda9f4bed4bc2b30` |
| Human Soft-Label Audit Inter-Annotator Agreement Report Markdown | `present` | file | `experiments/human-soft-label-audit/human-audit-inter-annotator-agreement-report.md` |  | 2216 | `616c2f96cf2b4e616fbd0dd6793faeafc02c2780caf74c53e3fd351040dacaab` |
| Human Soft-Label Audit Adjudication Template | `present` | file | `experiments/human-soft-label-audit/human-audit-adjudication-template.csv` |  | 237 | `569feb0637a79cb416e70649c8bc4d937ecd6a768aa45f87e6449af8dbeaef9a` |
| Human Soft-Label Audit Adjudication Template Report | `present` | file | `experiments/human-soft-label-audit/human-audit-adjudication-template-report.json` |  | 982 | `f09ac6b855b6f52654f06cd0e8afe5b9102d00bb70bfbe4719a0c538a1d0df19` |
| Human Soft-Label Audit Adjudication Template Report Markdown | `present` | file | `experiments/human-soft-label-audit/human-audit-adjudication-template-report.md` |  | 845 | `9533340c531f46db03f1273884e98a6ae801e3aa20562f2035647a26c8f02082` |
| Human Soft-Label Audit Adjudicated Annotation Build Report | `present` | file | `experiments/human-soft-label-audit/human-audit-adjudicated-annotations-report.json` |  | 40423 | `a84f3deed6eaa3ec951ab466c01aefd35b530466917d6dba3fedd043d325e34c` |
| Human Soft-Label Audit Adjudicated Annotation Build Report Markdown | `present` | file | `experiments/human-soft-label-audit/human-audit-adjudicated-annotations-report.md` |  | 1101 | `c43b1ac06f3b53924fe35dbf1fdf19430b4fa541972a49fefe30adc2d6539fcf` |
| Human Soft-Label Audit Agreement Report | `present` | file | `experiments/human-soft-label-audit/human-audit-agreement-report.json` |  | 5020 | `e44c802395f09e3a591ccd3c9346d0c68190275a8ed7c0f417e10f0365de1662` |
| Human Soft-Label Audit Agreement Report Markdown | `present` | file | `experiments/human-soft-label-audit/human-audit-agreement-report.md` |  | 1354 | `5fc70f0658040caf40abc61ea424f2fa82cd98839d438f3e6fceca1ff5e480d4` |
| Pilot Second-Provider Replication Report | `present` | file | `experiments/pilot-replication/pilot-replication-report.json` |  | 2026 | `0ecebb5c5197fcbe1eac884607d307a93d05551aa65270d74338062da8a0e6ec` |
| Pilot Second-Provider Replication Report Markdown | `present` | file | `experiments/pilot-replication/pilot-replication-report.md` |  | 1088 | `4687c233e88c6a7245fd17dc1bf0fb59d2d521935bda0ad6b2121717e141aa56` |
| Second-Provider Replication Package Report | `present` | file | `experiments/pilot-replication/second-provider-replication-package-report.json` |  | 10996 | `74bcf076c7d6cb5e61283d423a2bd8d8aed4d558eb4b6a5a3286d7ad24f3c507` |
| Second-Provider Replication Package Report Markdown | `present` | file | `experiments/pilot-replication/second-provider-replication-package-report.md` |  | 7772 | `b11ef982b6fc21337b8ec455b61b01f45f22d414a18a9085a3fd46d2de213097` |
| Second-Provider Replication Package Manifest | `present` | file | `experiments/pilot-replication/second-provider-replication-package/manifest.json` |  | 10996 | `74bcf076c7d6cb5e61283d423a2bd8d8aed4d558eb4b6a5a3286d7ad24f3c507` |
| Second-Provider Replication Package README | `present` | file | `experiments/pilot-replication/second-provider-replication-package/README.md` |  | 1580 | `eb14807c51bab266d5ec2e4cd8dcef1a4ab2e78d4609d3ffb31021e3ec67ad5d` |
| Second-Provider Replication Package Fixed Input JSONL | `present` | file | `experiments/pilot-replication/second-provider-replication-package/openai-batch-input.jsonl` |  | 297380 | `03f118b1729ec416cb92b98898f13e8f3dccd05ed8d7a7b38c2a2c97d1865f81` |
| Second-Provider Replication Package Prompt Packets | `present` | directory | `experiments/pilot-replication/second-provider-replication-package/prompt-packets` | 50 | 306430 | tree:`f43d3671aafca6bcce0e4361d678ffcdccb78d0c830ac627221541d6a6f401dc` |
| Second-Provider Replication Preflight | `present` | file | `experiments/pilot-replication/second-provider-replication-preflight.json` |  | 2347 | `18cc0c7ce6a9597606f3b5f1437a01ff7436c71fed47f23dd744252c4fdb8c2b` |
| Second-Provider Replication Preflight Markdown | `present` | file | `experiments/pilot-replication/second-provider-replication-preflight.md` |  | 1842 | `d91b8e98f2c63e9a88b13dcb9165271ece5629c2317473641080b83f3157779f` |
| Second-Provider ToM Pilot Provider Results | `pending` | pending | `experiments/provider-results/tom-prompted-llm-second-provider.jsonl` |  | 0 | Pending until a second provider or second model pilot replication is run. |
| Second-Provider ToM Pilot Metrics | `pending` | pending | `experiments/pilot-replication/second-provider-tom-prompted-results/metrics.json` |  | 0 | Pending until second-provider/model provider results are materialized and ingested. |
| Pilot Metrics Summary | `present` | file | `experiments/pilot-metrics-summary/pilot-metrics-summary.json` |  | 4421 | `592b8c5f0854e728d2bf602f8a50581037e38fd88149ad66c0366b1f6a26b09b` |
| Revision Comparison | `present` | file | `experiments/pilot-revision-comparison/revision-comparison.json` |  | 1928 | `1adb7936f98bde01953c960d547e5b66cd1a5450e64cb3a7f26c3d303650f835` |
| Paired Verifier Attribution | `present` | file | `experiments/pilot-verifier-attribution/verifier-attribution.json` |  | 15039 | `ad53299ddd6491b8d6573b7f5524eedbbbdd0c7594e5ea55272cb9bacf797017` |
| Verifier Ablation Summary | `present` | file | `experiments/pilot-ablation-summary/ablation-summary.json` |  | 5296 | `aa96ab43078bf960fea216ef3e2e809ff72d0df14ef3094edc1793c092a314f1` |
| Paper Table Sources | `present` | directory | `tables` | 6 | 5922 | tree:`4c3ed29bf72f6ef02d37b73195bfaffeb247c68efbff3c3cb3b6ce12fd7fd1dc` |
| Figure Sources | `present` | directory | `figures` | 13 | 208022 | tree:`03cfc9ec52c8c0a036a5431448db86079ca18c4db64bb0c532234c34dc70e37c` |
| Verifier Pipeline Figure | `present` | file | `figures/figure-1-verifier-pipeline.svg` |  | 10267 | `a454fdcc8ebb7a7c84940881bd62b5ee348163ca0ec4e44af8edf09d57c0e172` |
| Verifier Pipeline Figure Notes | `present` | file | `figures/figure-1-verifier-pipeline.md` |  | 1370 | `37c9f06616a22663901220a4c2ae7721526d52f37b6b1612caec8a2282da73d5` |
| Trace-Contract Verifier Architecture Figure | `present` | file | `figures/figure-2-revision-architecture.svg` |  | 8166 | `320b59f4a649171b6014e6fe11436a76831f1e0ae8da71ea3ab29cf7bf68dd02` |
| Trace-Contract Verifier Architecture Figure Notes | `present` | file | `figures/figure-2-revision-architecture.md` |  | 1516 | `4c7d38884f73ba6d277817b3865c479d4965eaee8f8b8384c87e1ee32184b235` |
| ToM Schema Repair Flow Figure | `present` | file | `figures/figure-3-tom-schema-repair-flow.svg` |  | 4584 | `c1cc05648e25d8eb16db51e32319c7f4e9d88211fb48e4665beef8c9f6288522` |
| ToM Schema Repair Flow Figure Notes | `present` | file | `figures/figure-3-tom-schema-repair-flow.md` |  | 838 | `77c1b530dde6e2b7efea32b0f8821ed4509cab11bd08e4f06cbb131eaaf63448` |
| Main Pilot Results Figure | `present` | file | `figures/figure-4-main-pilot-results.svg` |  | 9999 | `7a0aa373f2511a865105b1e73fccb41c9fd3f71d1d83c7f9e363d168b2b3839b` |
| Main Pilot Results Figure Notes | `present` | file | `figures/figure-4-main-pilot-results.md` |  | 1181 | `78564e8b7619332bc7c283f2ee1671198411e0f0d1f6007f81a2dfda0dd53fe4` |
| Qualitative Verifier-Attribution Case Pack Figure | `present` | file | `figures/figure-5-qualitative-case-pack.svg` |  | 9062 | `3d94252f3a652531e9cbce3fdf42c69235a401496c28dc63f4d553028b691cfa` |
| Qualitative Verifier-Attribution Case Pack Figure Notes | `present` | file | `figures/figure-5-qualitative-case-pack.md` |  | 1302 | `2b5b43b073875609edbc77d59f49173a7b8402edea0624fae8f1f6543a652b92` |
| Visual Evidence Report | `present` | file | `submission/visual-evidence/visual-evidence-report.json` |  | 9684 | `2c3fa85dad65582631f8a9b963e3aabebd4b4371886eb10788678fa3918f2851` |
| Visual Evidence Report Markdown | `present` | file | `submission/visual-evidence/visual-evidence-report.md` |  | 7059 | `391e2b9e007b84692a525821c85ee6945483abc553516c979781b07d1ef62209` |
| Normalized Bibliography | `present` | file | `submission/references.bib` |  | 5918 | `86f88c35847b07cb41386b5d5b19e63535f2dbb5a8f5b1d11f9a3ded174badf1` |
| Bibliography Integrity Report | `present` | file | `submission/citation-integrity/bibliography-integrity-report.json` |  | 255 | `161ef8c4b0d534c41b40ea7cc113d1d6e966abe8ee5c1899cca9b167a39408c3` |
| Assembled Manuscript | `present` | file | `submission/manuscript/manuscript-draft.md` |  | 29553 | `6f96355c979fba0f5b091a50bea9726b84cc63f28c13c46b3d4ffa18e275447e` |
| Manuscript Status | `present` | file | `submission/manuscript/manuscript-status.json` |  | 830 | `e3b7f01b79e91661635690cafd957641d02264fc950eb8d6e5fbbd5426d4c85d` |
| Claim-Evidence Report | `present` | file | `submission/claim-evidence/claim-evidence-report.json` |  | 6194 | `328264a081640c33ba5a4bd384bb709486f097ae7d1f99765e19e6cd21345182` |
| Claim-Evidence Report Markdown | `present` | file | `submission/claim-evidence/claim-evidence-report.md` |  | 4851 | `e21295428e313665dca6c322838f3de4a40416d42cfeb6ad86be6558361df504` |
| Method Reproducibility Report | `present` | file | `submission/method-reproducibility/method-reproducibility-report.json` |  | 5617 | `1153b832e762990cfb341f2b3d1e9aa4f7744383715a22708b561f556db823ee` |
| Method Reproducibility Report Markdown | `present` | file | `submission/method-reproducibility/method-reproducibility-report.md` |  | 2537 | `afe53113761a80d4494a6adc118a6b5e1aebc8ed6e4edb4a4820e3ce6bd638f0` |
| AAMAS LaTeX Draft | `present` | directory | `submission/aamas-latex` | 22 | 6642542 | tree:`5e2636a1aad40e7ddfca09778f8a721b87247818399c45d83536ccfc1696e76e` |
| Submission Gate Report | `present` | file | `submission/gate-report/submission-gate-report.json` |  | 1856 | `3f088cbe513b443424db3273b23b3f6d4f556fd41f1726b44cf6bb29667cbce5` |
| Submission Marker Inventory | `present` | file | `submission/marker-inventory/submission-marker-inventory.json` |  | 562 | `e524d0dc4b30278acf4c7e4b25d97df89937d248ac5c836e0a26c5ec4b716a44` |
| Experiment Resolution Ledger | `present` | file | `submission/experiment-resolution-ledger/experiment-resolution-ledger.json` |  | 522 | `bec9c60d0d5ed3d88f2a462016f25077e4ab3f30dc95bebb1d8526a5b85c8f37` |
| Research Preflight Report | `present` | file | `submission/preflight/research-preflight-report.json` |  | 5786 | `5b17f87c58c54b0f59649c0492adaac5f0e4bf98d29eb18ff5174c7a5f1fcf7d` |
| AAMAS Full-Paper Readiness Report | `present` | file | `submission/aamas-readiness/aamas-readiness-report.json` |  | 11446 | `25ff622075cedffcde5b628a6c2dd3395de317baf7c0d3f4612966aace48ff81` |
| AAMAS Full-Paper Readiness Report Markdown | `present` | file | `submission/aamas-readiness/aamas-readiness-report.md` |  | 6610 | `2a0808011e81de68c5fefd965aa9df979ba6e88d568150c342b7f11dadcb24fe` |
| AAMAS Adversarial Self-Review Report | `present` | file | `submission/aamas-self-review/aamas-self-review-report.json` |  | 8677 | `5766f5bd7b415aea710bc97712af29a67a424bc308c48f972079bc405b69980a` |
| AAMAS Adversarial Self-Review Report Markdown | `present` | file | `submission/aamas-self-review/aamas-self-review-report.md` |  | 7632 | `fc18b16caaeaef3c008e94aa3a3b28ae23de522faf3a0f2a8696649c352aa4ae` |
| AAMAS Reviewer-Response Matrix | `present` | file | `submission/aamas-reviewer-response/aamas-reviewer-response-matrix.json` |  | 12616 | `5c19d44b4a973f63e9eddcec9a7964fe711e4ad0c0135be5e72301bf7eae5d95` |
| AAMAS Reviewer-Response Matrix Markdown | `present` | file | `submission/aamas-reviewer-response/aamas-reviewer-response-matrix.md` |  | 10378 | `a5b8c67de6b1291f0935c610955a141c86bab96141c9f8ff82a6da15c5006a50` |
| Local Research Pipeline Report | `present` | file | `submission/local-pipeline/local-research-pipeline-report.json` |  | 53721 | `1cd541ff42d8e2edf6973e6fed2597282d88680b727d849f9c52bc9a572559d3` |
| Submission Checklist | `present` | file | `submission/submission_checklist.md` |  | 8159 | `08550a21e494c9358a206afb9a05e2788f6328a6e6d42c53c81781253dcfa64c` |
| Working Submission Profile | `present` | file | `submission/submission-profile.md` |  | 4191 | `4830c603c5293d3c08afa112d014aa0779c4ff21d483ee221ba4c055b8f66a27` |
| Page Budget Snapshot | `present` | file | `submission/page-budget.md` |  | 6035 | `109451411191d2b5f0213f7fbf726f5837594a9a3b4bb2d4cc9f3bb48d34a15f` |
| Author Decision Brief | `present` | file | `submission/author-decision-brief.md` |  | 5696 | `7ec62cfb0801c72324e449605ac89fe389641456bed6d65719eab6be59939184` |
| AI-Use Disclosure | `present` | file | `submission/ai-use-disclosure.md` |  | 2270 | `9037ef3f33c6389aa0926398df5d7aab8af148e22e0da26a829d1af62db8cf24` |
