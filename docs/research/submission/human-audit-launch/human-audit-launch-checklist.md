# Human Audit Launch Checklist

Generated at: `2026-06-20T19:32:18.818Z`

Status: `ready_to_send`
Ready for annotation: `true`
Ready for paper evidence: `false`
Sample count: `40`
Completed labels: `0/200`

## Package To Send

Send: `docs/research/experiments/human-soft-label-audit/human-audit-annotator-package.tar.gz`
SHA-256: `0b9f0f700db5184dad18a7bd68701b4a9e6742ee54a77af66bcd3d3d66f58a4d`

Do not send:

- `human-audit-answer-key.jsonl`
- `human-audit-manifest.json`
- `human-audit-agreement-report.json`
- `human-audit-agreement-report.md`

Expected return/adjudication files:

- `human-audit-completed-annotations-annotator-a.csv`
- `human-audit-completed-annotations-annotator-b.csv`
- `human-audit-adjudicated-annotations.csv`

## Checks

| Check | Status | Finding |
| --- | --- | --- |
| packet-quality-ready | `pass` | packet-quality status=packet_ready, readyForAnnotation=true |
| blind-package-ready | `pass` | annotator package status=package_ready |
| package-excludes-reference | `pass` | blind package excludes answer key and verifier labels |
| archive-ready | `pass` | archive status=archive_ready |
| archive-digest-present | `pass` | archive sha256=0b9f0f700db5184dad18a7bd68701b4a9e6742ee54a77af66bcd3d3d66f58a4d |
| sample-count-ready | `pass` | sampleCount=40 |
| paper-evidence-not-claimed-before-return | `pass` | agreement status=pending, readyForPaperEvidence=false |

## Next Actions

1. Send the blind archive to two independent annotators.
2. Save returned files as human-audit-completed-annotations-annotator-a.csv and human-audit-completed-annotations-annotator-b.csv.
3. Run inter-annotator, adjudication-template, build-adjudicated, intake, and agreement commands after returns arrive.
