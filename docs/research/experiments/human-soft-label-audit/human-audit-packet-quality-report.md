# Human Audit Packet Quality Report

Generated at: `2026-06-19T12:36:13.095Z`

Status: `packet_ready`

| Item | Value |
| --- | ---: |
| Manifest | `human-audit-manifest.json` |
| Blind sample | `human-audit-blind-sample.jsonl` |
| Answer key | `human-audit-answer-key.jsonl` |
| Annotation CSV | `human-audit-annotation-sheet.csv` |
| Annotator HTML | `human-audit-annotator.html` |
| Samples | 40 |
| Expected samples | 40 |
| Annotation rows | 40 |
| Answer-key rows | 40 |
| Embedded annotator samples | 40 |
| Ready for annotation | yes |
| Ready for paper evidence | no |

## Strata

| Stratum | Samples |
| --- | ---: |
| follow_beat_or_pass;opponent_near_finish | 8 |
| lead_opening | 8 |
| lead_opening;endgame_race | 8 |
| lead_opening;opponent_near_finish | 8 |
| lead_opening;partner_near_finish | 8 |

## Checks

| Check | Status | Detail |
| --- | --- | --- |
| manifest-status | `pass` | manifest status is annotation_packet_prepared_not_human_completed |
| manifest-count | `pass` | manifest sampleCount=40, blind rows=40 |
| nonempty-sample | `pass` | 40 blind samples |
| unique-blind-sample-ids | `pass` | 40/40 unique blind sample ids |
| answer-key-count | `pass` | 40 answer rows for 40 blind rows |
| answer-key-id-match | `pass` | answer-key sample ids match blind sample ids |
| annotation-row-count | `pass` | 40 annotation rows for 40 blind rows |
| annotation-id-match | `pass` | annotation CSV sample ids match blind sample ids |
| annotation-human-fields | `pass` | annotation CSV contains all human label fields |
| blind-required-fields | `pass` | blind JSONL contains all public annotation fields |
| blind-hides-verifier-labels | `pass` | blind JSONL contains no verifier answer fields |
| answer-key-has-verifier-labels | `pass` | answer key contains all verifier fields |
| annotator-embeds-samples | `pass` | 40 embedded samples for 40 blind rows |
| annotator-id-match | `pass` | annotator embedded sample ids match blind sample ids |
| protocol-rubric | `pass` | protocol contains rubric and all human label names |

## Warnings

- Annotation CSV contains no human labels yet; agreement remains pending until annotation is completed.

## Interpretation

The packet is ready for human annotation, but it is not human-audit evidence until human labels are completed and the agreement report reaches `completed`.
