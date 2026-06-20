# Human Audit Handoff

Date: 2026-06-19

This handoff defines the human soft-label audit path for the AAMAS draft. It is
the external-validation fallback when second-provider replication is unavailable
and an additional validation layer when replication is completed.

## Current State

- The blind annotator package is prepared at
  `docs/research/experiments/human-soft-label-audit/annotator-package`.
- The package contains 40 blind samples, a local browser annotator, and a
  spreadsheet-compatible annotation sheet.
- The package intentionally excludes `human-audit-answer-key.jsonl` and any
  verifier labels.
- The archive is prepared at
  `docs/research/experiments/human-soft-label-audit/human-audit-annotator-package.tar.gz`.
- No completed human annotation CSV has been returned yet, so the agreement
  report remains pending and is not paper evidence.
- The preferred AAMAS path is two independent annotators plus an adjudicated
  CSV. A single returned CSV is still usable, but should be reported as a
  single-annotator soft-label audit.

## Files to Send

Send either the archive or the package directory:

```text
docs/research/experiments/human-soft-label-audit/human-audit-annotator-package.tar.gz
```

Do not send these files to annotators:

```text
docs/research/experiments/human-soft-label-audit/human-audit-answer-key.jsonl
docs/research/experiments/human-soft-label-audit/human-audit-manifest.json
docs/research/experiments/human-soft-label-audit/human-audit-agreement-report.json
docs/research/experiments/human-soft-label-audit/human-audit-agreement-report.md
```

## Annotator Instructions

The annotator should open:

```text
human-audit-annotator.html
```

Then label every sample field as `pass`, `fail`, or `uncertain`, export the
completed CSV, and return only:

```text
human-audit-completed-annotations.csv
```

Annotators should use only visible public-state fields. They should not infer
private cards, hidden intentions, or exact holdings beyond the shown evidence.
They should not add, delete, reorder, or edit `sampleId` values.

## Two-Annotator Option

For stronger AAMAS evidence, send the same blind package to two independent
annotators. They should not discuss labels with each other while filling the
packet.

Keep their returned files under explicit names:

```text
docs/research/experiments/human-soft-label-audit/human-audit-completed-annotations-annotator-a.csv
docs/research/experiments/human-soft-label-audit/human-audit-completed-annotations-annotator-b.csv
```

Resolve disagreements without looking at `human-audit-answer-key.jsonl`, then
save the adjudicated file here:

```text
docs/research/experiments/human-soft-label-audit/human-audit-adjudicated-annotations.csv
```

Use the adjudicated file for the final human-verifier agreement report. Keep
the two raw annotator CSVs as audit trail files.

After both raw annotator CSVs are present, compute the inter-annotator report:

```bash
npm run research:human-audit:inter-annotator
```

The report will remain `awaiting_returns` until both raw CSVs exist. When both
are structurally valid, it reports per-field agreement and disagreement rows to
resolve before creating the adjudicated CSV.

If disagreements are present, generate the adjudication template:

```bash
npm run research:human-audit:adjudication-template
```

Fill `adjudicatedLabel` in:

```text
docs/research/experiments/human-soft-label-audit/human-audit-adjudication-template.csv
```

Use only the public context in that template, not
`human-audit-answer-key.jsonl`. After every disagreement row is resolved,
build the final 40-row annotation CSV with:

```bash
npm run research:human-audit:build-adjudicated
```

This writes:

```text
docs/research/experiments/human-soft-label-audit/human-audit-adjudicated-annotations-report.json
docs/research/experiments/human-soft-label-audit/human-audit-adjudicated-annotations-report.md
```

It writes `human-audit-adjudicated-annotations.csv` only when both raw
annotator CSVs are present and every disagreement has a valid
`adjudicatedLabel`. If the report status is `awaiting_returns` or
`needs_adjudication`, do not use the CSV path as paper evidence.

## Researcher Intake

Place the returned CSV here:

```text
docs/research/experiments/human-soft-label-audit/human-audit-completed-annotations.csv
```

For the two-annotator path, use
`human-audit-adjudicated-annotations.csv` as the returned CSV when validating
intake and computing agreement.

Check that the prepared packet is still valid:

```bash
npm run research:human-audit:quality
```

Validate the returned CSV before computing agreement:

```bash
npm run research:human-audit:intake
```

For the adjudicated path, run the intake command directly with the adjudicated
file after `human-audit-adjudicated-annotations-report.json` reports
`status: "ready"`:

```bash
npx tsx server/src/research/writeHumanAuditIntakeCli.ts \
  --returned docs/research/experiments/human-soft-label-audit/human-audit-adjudicated-annotations.csv \
  --package-manifest docs/research/experiments/human-soft-label-audit/annotator-package/human-audit-annotator-package-manifest.json \
  --blind docs/research/experiments/human-soft-label-audit/human-audit-blind-sample.jsonl \
  --out docs/research/experiments/human-soft-label-audit
```

If intake reports `ready_for_agreement`, compute agreement:

```bash
npm run research:human-audit:agreement
```

For the adjudicated path, compute agreement with:

```bash
npx tsx server/src/research/writeHumanAuditAgreementCli.ts \
  --annotations docs/research/experiments/human-soft-label-audit/human-audit-adjudicated-annotations.csv \
  --answer-key docs/research/experiments/human-soft-label-audit/human-audit-answer-key.jsonl \
  --out docs/research/experiments/human-soft-label-audit
```

Then refresh the submission-level reports:

```bash
npm run research:aamas-finalize
```

## Paper Evidence Criteria

The human-audit evidence is usable in the AAMAS draft only when:

- `human-audit-intake-report.json` has `status: "ready_for_agreement"`;
- `human-audit-adjudicated-annotations-report.json` has `status: "ready"`;
- `human-audit-agreement-report.json` has `status: "completed"`;
- `completedLabels` equals `totalLabels`;
- `readyForPaperEvidence` is `true`;
- the AAMAS readiness report is refreshed after agreement is computed.
- for the two-annotator path, both raw annotator CSVs and the adjudicated CSV
  are preserved under `experiments/human-soft-label-audit`.

Until those conditions hold, the human audit may be reported only as a prepared
external-validation packet, not as completed evidence.
