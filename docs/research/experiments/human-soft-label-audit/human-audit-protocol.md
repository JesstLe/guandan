# Human Soft-Label Audit Protocol

This packet contains 40 blind samples drawn from repaired full-split ToM traces.

## Task

For each row in `human-audit-annotation-sheet.csv`, assign one of `pass`, `fail`, or `uncertain` for:

- `humanPartnerConsistent`: whether the partner belief is plausible from public state and scenario tags.
- `humanOpponentConsistent`: whether the opponent belief is plausible from public state and scenario tags.
- `humanTeamObjectiveValid`: whether the stated team objective fits the selected action and situation.
- `humanHiddenInfoDisciplined`: whether the trace avoids asserting hidden cards as facts.
- `humanReasonActionConsistent`: whether the rationale supports the selected action.

## Labeling Rubric

Use `pass` when the statement is directly supported by visible public facts, scenario tags, selected action, or a cautious probabilistic hedge.

Use `fail` when the statement contradicts visible public facts, treats hidden cards or private intentions as certain, or gives a rationale/objective that does not support the selected action.

Use `uncertain` when the visible row does not contain enough evidence to decide. Do not guess from Guandan expertise beyond the public fields shown in the row.

Field-specific guidance:

- Partner belief: pass if the belief is a plausible public-state inference about the teammate; fail if it asserts the partner has specific hidden cards or ignores a clear public scenario tag.
- Opponent belief: pass if the belief is a plausible public-state inference about opponents; fail if it asserts exact opponent holdings or intentions without public evidence.
- Team objective: pass if the objective fits team identity, hand counts, scenario tags, and the selected action; fail if the objective points in a different strategic direction than the action.
- Hidden-information discipline: pass if hidden cards and intentions are hedged as uncertain; fail if unobserved cards, suits, ranks, or private plans are stated as facts.
- Reason-action consistency: pass if the rationale explains why the selected action follows from the visible state; fail if it justifies a different action or omits the selected action logic.

Annotators should use only the visible row fields and should not inspect `human-audit-answer-key.jsonl` until annotation is complete.

Do not add, delete, reorder, or edit `sampleId` values. The agreement evaluator checks the completed annotation file against the answer-key sample ids and will keep the audit in `partial` status if any expected sample is missing, duplicated, or replaced by an unexpected id.

The local helper UI `human-audit-annotator.html` can be opened directly in a browser. It stores draft labels in browser local storage, can import a previously exported CSV, and exports `human-audit-completed-annotations.csv` with the same columns as `human-audit-annotation-sheet.csv`.

## Completion Criteria

A completed audit should save `human-audit-completed-annotations.csv` beside this packet and report agreement with verifier labels from `human-audit-answer-key.jsonl`.

Run the agreement report after annotation:

```bash
npx tsx server/src/research/writeHumanAuditAgreementCli.ts \
  --annotations docs/research/experiments/human-soft-label-audit/human-audit-completed-annotations.csv \
  --answer-key docs/research/experiments/human-soft-label-audit/human-audit-answer-key.jsonl \
  --out docs/research/experiments/human-soft-label-audit
```

The report remains `pending` until human labels are filled, `partial` if any labels are missing or invalid, and `completed` only when every required label is valid.
