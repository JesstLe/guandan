# Human Audit Returned-Annotation Intake Report

Generated at: `2026-06-19T12:36:15.291Z`

Status: `awaiting_return`

| Item | Value |
| --- | ---: |
| Returned CSV | `human-audit-adjudicated-annotations.csv` |
| Returned CSV present | no |
| Expected returned CSV name | `human-audit-completed-annotations.csv` |
| Blind samples | 40 |
| Returned rows | 0 |
| Completed labels | 0/200 |
| Ready for agreement | no |
| Ready for paper evidence | no |

## Checks

| Check | Status | Detail |
| --- | --- | --- |
| package-ready | `pass` | package status is package_ready |
| package-excludes-reference-file | `pass` | package manifest excludes private reference files |
| package-excludes-reference-labels | `pass` | package manifest excludes reference labels |
| returned-file-present | `fail` | returned annotation CSV is not present yet |
| returned-filename | `fail` | expected human-audit-completed-annotations.csv, got human-audit-adjudicated-annotations.csv |
| required-columns | `pass` | not evaluated until returned CSV is present |
| no-reference-columns | `pass` | no private reference columns in returned CSV |
| row-count | `pass` | not evaluated until returned CSV is present |
| sample-id-match | `pass` | not evaluated until returned CSV is present |
| unique-sample-ids | `pass` | no duplicate returned sample ids |
| label-values | `pass` | all filled labels are pass/fail/uncertain/unknown |

The annotator package is prepared, but the completed CSV has not been returned yet.
