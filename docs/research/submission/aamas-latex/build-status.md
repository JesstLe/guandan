# AAMAS LaTeX Build Status

Date: 2026-06-21

## Current Build

- Source: `docs/research/submission/aamas-latex/main.tex`
- PDF: `docs/research/submission/aamas-latex/main.pdf`
- Build command: `tectonic main.tex`
- Build status: compiled successfully with warnings
- Page count: 9 pages total in `sigconf,anonymous,review` ACM/AAMAS-style layout
- Body/reference boundary: the main body and conclusion end on page 8; references begin in the lower part of page 8 and continue on page 9 after upgrading and moving the verifier-grounded teaser figure.

## Visual QA Notes

- Page 1 is readable and uses anonymous review formatting.
- Red line numbers appear because the draft uses the `review` option.
- Table and figure placement was checked from rendered PNG pages under `submission/aamas-latex/page-renders/`; the latest pass used PyMuPDF because `pdftoppm` was not installed locally.
- Figure 1 now functions as the front-door teaser with a two-layer accepted-paper-style structure: the top layer contrasts explicit communication with zero-communication Guandan team play, and the bottom layer traces decision packet -> structured trace -> rule-grounded verifier -> same-id paired evidence. Rendered page 2 was refreshed after the update; no text clipping or page-count change was observed, and the draft remains 9 pages.
- A follow-up figure overflow QA pass shortened and reflowed in-box labels across Figures 1, 2, 4, and 5. The SVG text-overflow heuristic reports 0 candidate overflow issues, Figure 1 was re-rendered to PNG at the original 1500x700 aspect ratio, page 2 was visually checked from the rebuilt PDF, and the draft remains 9 pages.
- A second visual pass fixed the in-paper TikZ Figure 2 layout: the schema-failure box now stays inside the Trace contract panel, the parse-to-verifier connector uses a contained elbow path, and the external in-figure denominator note was removed because the caption already states the denominator rule. Rendered page 5 was refreshed and the draft remains 9 pages.
- A third visual pass fixed the in-paper TikZ Figure 4 layout: the paired-revision before/after labels now stay inside their metric boxes, and the attribution legend is split into two compact lines to avoid crowding. Rendered page 6 was refreshed and the draft remains 9 pages.
- Figure 2 now uses a full-width four-panel trace-contract verifier architecture diagram: decision-point evidence, structured trace contract, verifier label map, and same-id revision accounting. Rendered page 5 was refreshed and checked for arrow/label overlap, awkward line breaks, and page-count stability; the draft remains 9 pages.
- The old page-4 pipeline figure was removed rather than duplicated, keeping the draft at 9 total pages.
- The qualitative case table was replaced with Figure 5, a two-by-two verifier-attribution case-flow diagram showing two repaired semantic failures, one unrepaired hard failure, and one schema failure outside the paired subset. Rendered page 8 was refreshed and visually checked after shortening in-panel notes and confirming that the draft remains 9 pages.
- Figure 5 now also has source-backed standalone artifacts generated from `experiments/pilot-verifier-attribution/verifier-attribution.json`: `figures/figure-5-qualitative-case-pack.svg` and `figures/figure-5-qualitative-case-pack.md`. The visual evidence report counts 11/11 generated figure source files, and the reproducibility manifest records both new Figure 5 artifacts.
- A compact full-evaluation protocol table now appears before the references rather than floating into the bibliography page as a wide table.
- The new full-split sanity table is readable on page 7 and clearly labeled as a deterministic non-LLM substrate check.
- The ToM-prompted pilot baseline is now reported as a model result; pages 4 and 5 were visually checked after adding the ToM rows to the accounting and reliability tables.
- Figure 4 now uses a three-layer source-backed result summary with an explicit headline: end-to-end parse yield, paired verifier-revision before/after counts, and semantic hard-failure attribution. Page 6 was visually checked after adding the headline and caption refresh.
- A post-hoc verifier-label ablation table is now included in the main draft. It reports paired label-burden accounting over the existing 32 before/after traces, attributes 63% of the observed label-burden reduction to public-history consistency and 16% to hidden-information discipline, and explicitly states that this is not a prompt-level component-removal rerun. Rendered pages 6 and 7 were visually checked after insertion.
- The provenance and full-split sections now report the completed ToM full-split provider artifact as larger-scale AAMAS evidence: 500/500 provider outputs, 0 retained provider-error rows, 404/500 direct ToM parses with 48 hard verifier failures, and 500/500 deterministic schema-repair traces with 52 hard verifier failures.
- Rendered pages 7 and 8 were refreshed after integrating the full-split ToM rows. Table 7, Table 8, and Table 9 remain readable, and the main body still ends on page 8.
- The local pipeline now includes optional post-provider ingest for full-split plain and candidate-constrained runs. Plain has a clean 50/500 prefix run with 39/500 parsed structured traces and 31 hard verifier failures; candidate-constrained has a clean 50/500 prefix run with 39/500 parsed structured traces and 33 hard verifier failures. Both rows remain partial strengthening evidence only, and the full summary labels them `partial_metrics_available`.
- Rendered pages 7 and 8 were refreshed again after adding the plain/candidate 50-prefix status to the provenance table and full-evaluation protocol. The added row remains readable, and the main body still ends on page 8.
- The full-evaluation protocol now records that the human soft-label audit packet has passed structural quality checks for 40 blind samples across five strata. A blind annotator package under `experiments/human-soft-label-audit/annotator-package` is ready for external annotation and excludes private reference files/labels, while the agreement evidence remains pending with 0/200 human labels completed.
- The current draft still uses 8 body pages, with references starting at the bottom of page 8 and continuing onto page 9. A later page-budget pass should tighten the body before adding full-split plain/candidate comparisons or human-audit results.

## Next Expansion Targets

To reach a submission-strength AAMAS full paper, expand evidence rather than prose:

1. Extend the full-split evidence with plain and candidate-constrained LLM comparisons if budget allows.
2. Extend the pilot post-hoc verifier-label ablation to prompt-level component-removal reruns on the full split.
3. Add a small human audit for soft partner/opponent consistency labels.
4. Decide whether to keep or remove the full-evaluation protocol table once real full-evaluation results are available.

Current full-split status:

- 500-decision full split exists under `docs/research/experiments/full-e1/decisions`.
- Deterministic `heuristic-legal-first` and `strategic-heuristic` baselines both parse 500/500 traces with 0 hard verifier failures.
- These deterministic results validate the evaluation substrate only; the completed ToM rows now supply the current larger-scale LLM evidence.
- ToM-prompted pilot provider results are present: 50/50 provider outputs, 36/50 parsed traces, 14 parse failures, and 1 hard verifier failure among parsed traces.
- ToM-prompted full-split provider results are complete: 500/500 successful outputs, 0 retained provider-error rows, and 0 pending outputs. Raw ToM materialization directly parses 404/500 traces with 48 hard verifier failures, while deterministic schema repair raises usable traces to 500/500 with 52 hard verifier failures.
- Plain full-split provider results are partial strengthening evidence only: 50/500 successful outputs, 0 retained provider-error rows, 450 pending full-split outputs, 39/500 parsed traces, and 31 hard verifier failures. These values are excluded from the main paper claims until the row reaches full coverage.
- Candidate-constrained full-split provider results are partial strengthening evidence only: 50/500 successful outputs, 0 retained provider-error rows, 450 pending outputs, 39/500 parsed traces, and 33 hard verifier failures. These values are excluded from the main paper claims until the row reaches full coverage.

The IJCAI/AAAI 7-page body version should use a tighter variant after the AAMAS version is complete.
