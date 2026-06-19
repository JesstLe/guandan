# Human Soft-Label Audit Annotator Package

This package contains 40 blind samples for a human soft-label audit.

## Files

- `human-audit-annotator.html`: local browser UI for labeling.
- `human-audit-annotation-sheet.csv`: spreadsheet-compatible backup annotation sheet.
- `human-audit-blind-sample.jsonl`: public-state rows embedded in the annotator UI.

## Instructions

Open `human-audit-annotator.html` in a browser, label every sample field as `pass`, `fail`, or `uncertain`, then export `human-audit-completed-annotations.csv`.

Use only the visible public-state fields in the row. Do not infer private cards, hidden intentions, or exact holdings beyond the shown evidence.

Do not add, delete, reorder, or edit `sampleId` values. The completed CSV must preserve every row so the researcher can compute agreement.

Return only `human-audit-completed-annotations.csv` after labeling.
