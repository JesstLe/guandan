# Page Budget Snapshot

Date: 2026-06-18

This file estimates how much paper space the current manuscript can plausibly occupy after formatting. It is a planning artifact, not a substitute for compiling in a target venue template.

## Current Local Length

- Assembled manuscript: `docs/research/submission/manuscript/manuscript-draft.md`
- Current word count: 3724
- Current generated table sources: Table 0, Table 1, Table 2, Table 3, Table 4
- Main evidence artifacts now include the paired verifier-attribution report under `docs/research/experiments/pilot-verifier-attribution`.

## Official Page Limits Checked

| Venue | Current official rule checked | Planning implication |
| --- | --- | --- |
| AAMAS 2026 main technical track | At most 8 pages, with additional pages for bibliographic references. Source: https://cyprusconferences.org/aamas2026/submission-instructions/ | Best fit for the current AAMAS-first profile. Target 7.5-8 pages main body. |
| IJCAI-ECAI 2026 main track | 9 pages total: 7 pages body + 2 pages references. Source: https://2026.ijcai.org/ijcai-ecai-2026-call-for-papers-main-track/ | Need keep body within 7 pages; our current material is close after case studies. |
| AAAI-26 main technical track | Up to 7 pages of technical content plus additional pages for references and reproducibility checklist. Source: https://aaai.org/conference/aaai/aaai-26/submission-instructions/ | Similar pressure to IJCAI; main text must be tighter than AAMAS. |

## Current Page Estimate

Compiled AAMAS-style skeleton status:

- Source: `submission/aamas-latex/main.tex`
- PDF: `submission/aamas-latex/main.pdf`
- Build command: `tectonic main.tex`
- Actual compiled length on 2026-06-18 after the Figure 4 three-panel result refresh: 9 pages total in `sigconf,anonymous,review` mode.
- The main body and conclusion end on page 8; references begin in the lower part of page 8 and continue on page 9. The upgraded Figure 1 now appears at the top of rendered page 2, Figure 2 appears as a three-panel verifier-revision architecture diagram on rendered page 4, and Figure 4 appears as a three-panel source-backed result summary on rendered page 6. The full-evaluation protocol now includes human-audit packet quality as readiness evidence, while preserving the 0/200 human-label blocker.
- Interpretation: the current LaTeX version is no longer a short skeleton. It contains formal setup, trace schema, verifier label taxonomy, verifier-revision architecture, end-to-end accounting, paired attribution, qualitative cases, provenance, limitations, a full-split sanity check, and a full-evaluation protocol. The remaining quality gap should be closed by full-split LLM results and ablations, not filler prose.

Rule of thumb for two-column AI conference styles:

- Dense prose without many floats: about 650-800 words per page.
- Tables, equations, section headings, and references reduce usable prose density.
- A paper with 3724 words plus 5 tables is likely around 7.5-8.0 main-body pages in the current AAMAS layout after adding the core result figures.

Current estimate after the case-study paragraph, before full LaTeX expansion:

| Template target | Estimated main-body pages | Notes |
| --- | ---: | --- |
| AAMAS style | 7.8-8.0 | Current compiled body reaches page 8 and references begin at the bottom of page 8; full-split LLM results should replace protocol/scaffolding material rather than simply adding new space. |
| IJCAI style | 6.8-7.2 | Needs compression because IJCAI has a 7-page body target and the current AAMAS version already fills 8 total pages. |
| AAAI style | 6.8-7.2 | Similar compression pressure to IJCAI, with separate reproducibility checklist after references. |

## Practical Plan

For AAMAS-first submission:

1. Keep the main body at 7.5-8 pages after full-split LLM evidence is added.
2. Preserve the verifier pipeline figure, trace schema, and paired attribution evidence.
3. Keep the qualitative case pack as a small table plus short paragraph.
4. Replace the protocol table with actual 500-decision LLM and ablation results when available.
5. Move raw prompt examples, full case details, and extra artifacts to supplementary material.
6. Run a page-budget pass before adding more empirical content; likely compression targets are the full-evaluation protocol table, repeated prose around Table 4/Figure 4, and the qualitative case table wording.

Current full-split evidence:

- Dataset: `docs/research/experiments/full-e1/decisions`, 500 decision points.
- Local deterministic baselines: `full-e2-heuristic-verifier` and `full-e3-strategic-heuristic`.
- Summary: `docs/research/experiments/full-baseline-summary/full-baseline-summary.md`.
- Result: both deterministic baselines parse 500/500 traces with 0 hard verifier failures.
- Boundary: this validates the substrate and verifier plumbing, not LLM reasoning quality.

Current ToM baseline status:

- Prompt template: `docs/research/prompts/tom-prompted-llm-v0.1.md`.
- Pilot prompt/batch artifacts: `docs/research/experiments/pilot-e7-tom-prompted-prompts` and `docs/research/experiments/pilot-e7-tom-prompted-batch`.
- Pilot provider results: `docs/research/experiments/provider-results/tom-prompted-llm.jsonl`, 50 / 50 provider outputs.
- Pilot parsed traces: `docs/research/experiments/pilot-e7-tom-prompted-results`, 36 / 50 parsed traces, 14 / 50 parse failures, and 1 hard verifier failure among parsed traces.
- Full prompt/batch artifacts: `docs/research/experiments/full-e4-tom-prompted-prompts` and `docs/research/experiments/full-e4-tom-prompted-batch`.
- Boundary: the ToM pilot result is now reported; the 500-decision full-split ToM model result is still pending.

For IJCAI/AAAI stretch submission:

1. Target exactly 6.8-7.0 pages of body text.
2. Keep only Table 0, Table 1, Table 2, and one small figure in the main paper.
3. Move Table 3 ablation scaffolding and long case details to appendix/supplement.
4. Preserve the paired verifier-attribution result because it is central to the reviewer defense.
