# AAMAS LaTeX Build Status

Date: 2026-06-19

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
- Figure 1 now functions as the front-door teaser: it uses a four-panel problem-to-evidence path covering the zero-communication decision point, commitment card, verifier labels, and paired evidence accounting. Rendered page 2 was refreshed and visually checked after adding a reviewer-facing headline, shortening panel titles, and removing low-value microtext that competed with the feedback loop.
- Figure 2 now uses a full-width three-panel verifier-grounded revision architecture diagram: first-pass trace, verifier feedback, and bounded revision. Rendered page 4 was refreshed and checked for arrow/label overlap and awkward line breaks.
- The old page-4 pipeline figure was removed rather than duplicated, keeping the draft at 9 total pages.
- The qualitative case table was replaced with Figure 5, a two-by-two verifier-attribution case-flow diagram showing two repaired semantic failures, one unrepaired hard failure, and one schema failure outside the paired subset. Rendered page 8 was refreshed and visually checked after shortening in-panel notes and confirming that the draft remains 9 pages.
- A compact full-evaluation protocol table now appears before the references rather than floating into the bibliography page as a wide table.
- The new full-split sanity table is readable on page 7 and clearly labeled as a deterministic non-LLM substrate check.
- The ToM-prompted pilot baseline is now reported as a model result; pages 4 and 5 were visually checked after adding the ToM rows to the accounting and reliability tables.
- Figure 4 now uses a three-layer source-backed result summary with an explicit headline: end-to-end parse yield, paired verifier-revision before/after counts, and semantic hard-failure attribution. Page 6 was visually checked after adding the headline and caption refresh.
- A post-hoc verifier-label ablation table is now included in the main draft. It reports paired label-burden accounting over the existing 32 before/after traces, attributes 63% of the observed label-burden reduction to public-history consistency and 16% to hidden-information discipline, and explicitly states that this is not a prompt-level component-removal rerun. Rendered pages 6 and 7 were visually checked after insertion.
- The provenance and full-split sanity sections now explicitly treat the partial ToM full-split provider artifact as operational progress only, not as final AAMAS main evidence. The current audit-only materialization gives 306/500 direct ToM parses and 384/500 deterministic schema-repair traces.
- The full-evaluation protocol now records that the human soft-label audit packet has passed structural quality checks for 40 blind samples across five strata. A blind annotator package under `experiments/human-soft-label-audit/annotator-package` is ready for external annotation and excludes private reference files/labels, while the agreement evidence remains pending with 0/200 human labels completed.
- The current draft still uses 8 body pages, with references starting at the bottom of page 8 and continuing onto page 9. A later page-budget pass should tighten the body before adding full-split LLM results.

## Next Expansion Targets

To reach a submission-strength AAMAS full paper, expand evidence rather than prose:

1. Run the 500-decision full split and add the resulting main table.
2. Extend the ToM-prompted LLM baseline from the 50-decision pilot to the 500-decision full split.
3. Extend the pilot post-hoc verifier-label ablation to prompt-level component-removal reruns on the full split.
4. Add a small human audit for soft partner/opponent consistency labels.
5. Decide whether to keep or remove the full-evaluation protocol table once real full-evaluation results are available.

Current full-split status:

- 500-decision full split exists under `docs/research/experiments/full-e1/decisions`.
- Deterministic `heuristic-legal-first` and `strategic-heuristic` baselines both parse 500/500 traces with 0 hard verifier failures.
- These results validate the evaluation substrate only; they do not replace full-split LLM results.
- ToM-prompted pilot provider results are present: 50/50 provider outputs, 36/50 parsed traces, 14 parse failures, and 1 hard verifier failure among parsed traces.
- ToM-prompted full-split prompt/batch artifacts are generated and tracked. The current provider artifact is partial: 384/500 successful outputs are present, 0 retained provider-error rows are recorded, and 116 decisions still need successful provider outputs before the full-split LLM evidence gate can pass. For audit only, the partial raw ToM materialization directly parses 306/500 traces with 38 hard verifier failures, while deterministic schema repair raises usable traces to 384/500 with 41 hard verifier failures; neither row is final full-split LLM evidence.

The IJCAI/AAAI 7-page body version should use a tighter variant after the AAMAS version is complete.
