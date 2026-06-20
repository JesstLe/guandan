# Human Soft-Label Audit Annotator Package

This package contains 40 blind samples for a human soft-label audit.
It is self-contained: annotators should use only the files in this package and the visible row fields.

## Files

- `human-audit-annotator.html`: local browser UI for labeling.
- `human-audit-annotation-sheet.csv`: spreadsheet-compatible backup annotation sheet.
- `human-audit-blind-sample.jsonl`: public-state rows embedded in the annotator UI.

## Instructions

Open `human-audit-annotator.html` in a browser, label every sample field as `pass`, `fail`, or `uncertain`, then export `human-audit-completed-annotations.csv`.

Use only the visible public-state fields in the row. Do not inspect outside files, run the game engine, or infer private cards, hidden intentions, or exact holdings beyond the shown evidence.

## Fields To Label

- `humanPartnerConsistent`: partner belief is plausible from public state and scenario tags.
- `humanOpponentConsistent`: opponent belief is plausible from public state and scenario tags.
- `humanTeamObjectiveValid`: team objective fits the selected action and situation.
- `humanHiddenInfoDisciplined`: trace avoids stating hidden cards or private intentions as facts.
- `humanReasonActionConsistent`: rationale supports the selected action.

## Label Rubric

- `pass`: the statement is supported by visible public facts, scenario tags, selected action, or a cautious probabilistic hedge.
- `fail`: the statement contradicts visible public facts, asserts hidden cards or private intentions as certain, or gives a rationale/objective that does not support the action.
- `uncertain`: the visible row does not contain enough evidence to decide. Do not guess from general card-game knowledge.

## Common Pitfalls

- A statement can pass even when it is probabilistic, as long as it is clearly hedged.
- A statement should fail when it names exact unseen cards, suits, ranks, or private plans as facts.
- Hand counts and scenario tags are visible evidence; exact hidden holdings are not.
- Judge the explanation-action link, not whether you personally prefer another legal action.

Do not add, delete, reorder, or edit `sampleId` values. The completed CSV must preserve every row so the researcher can compute agreement.

Return only `human-audit-completed-annotations.csv` after labeling.
