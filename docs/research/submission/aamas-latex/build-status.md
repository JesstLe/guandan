# AAMAS LaTeX Build Status

Date: 2026-06-18

## Current Build

- Source: `docs/research/submission/aamas-latex/main.tex`
- PDF: `docs/research/submission/aamas-latex/main.pdf`
- Build command: `tectonic main.tex`
- Build status: compiled successfully with warnings
- Page count: 9 pages total in `sigconf,anonymous,review` ACM/AAMAS-style layout
- Body/reference boundary: the main body and conclusion end on page 8; references begin on page 9 after adding the main pilot results figure.

## Visual QA Notes

- Page 1 is readable and uses anonymous review formatting.
- Red line numbers appear because the draft uses the `review` option.
- Table and figure placement was checked from rendered PNG pages under `tmp/pdfs/aamas-latex/`.
- Figure 2 is readable and no longer has an arrow crossing node text.
- The qualitative case table was tightened after visual QA to avoid an overly narrow interpretation column.
- A compact full-evaluation protocol table now appears before the references rather than floating into the bibliography page as a wide table.
- The new full-split sanity table is readable on page 7 and clearly labeled as a deterministic non-LLM substrate check.
- The ToM-prompted pilot baseline is now reported as a model result; pages 4 and 5 were visually checked after adding the ToM rows to the accounting and reliability tables.
- Figure 4 adds a source-backed visual summary of parse yield and paired verifier-revision attribution. Page 6 was visually checked after replacing the former reliability table with this figure.
- The current draft now uses 8 body pages plus a references-only page. A later page-budget pass should tighten the body before adding full-split LLM results.

## Next Expansion Targets

To reach a submission-strength AAMAS full paper, expand evidence rather than prose:

1. Run the 500-decision full split and add the resulting main table.
2. Extend the ToM-prompted LLM baseline from the 50-decision pilot to the 500-decision full split.
3. Run verifier-component ablations for revision feedback.
4. Add a small human audit for soft partner/opponent consistency labels.
5. Decide whether to keep or remove the full-evaluation protocol table once real full-evaluation results are available.

Current full-split status:

- 500-decision full split exists under `docs/research/experiments/full-e1/decisions`.
- Deterministic `heuristic-legal-first` and `strategic-heuristic` baselines both parse 500/500 traces with 0 hard verifier failures.
- These results validate the evaluation substrate only; they do not replace full-split LLM results.
- ToM-prompted pilot provider results are present: 50/50 provider outputs, 36/50 parsed traces, 14 parse failures, and 1 hard verifier failure among parsed traces.
- ToM-prompted full-split prompt/batch artifacts are generated and tracked, but full-split provider results are still pending.

The IJCAI/AAAI 7-page body version should use a tighter variant after the AAMAS version is complete.
