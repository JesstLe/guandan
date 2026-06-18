# Submission Gate Report

Overall status: `not_ready`

## Marker Counts

| Marker | Count |
| --- | ---: |
| NEED_SOURCE | 0 |
| UNCERTAIN | 0 |
| NEED_EXPERIMENT | 8 |
| DO_NOT_SUBMIT | 0 |
| AUTHOR_DECISION | 0 |

## Gates

| Gate | Status | Blockers |
| --- | --- | --- |
| Gate 1: Question Quality | pass | 0 |
| Gate 2: Related Work Integrity | pass | 0 |
| Gate 3: Experiment Sufficiency | fail | 4 |
| Gate 4: Writing Readiness | fail | 1 |
| Gate 5: Submission Readiness | pass | 0 |

## Immediate Blockers

- LLM condition plain-llm has status missing_raw_outputs.
- LLM condition candidate-constrained-llm has status missing_raw_outputs.
- LLM condition verifier-revision-llm has status missing_raw_outputs.
- Verifier-revision comparison status is missing_raw_outputs.
- Submission-relevant files still have 8 NEED_EXPERIMENT markers.

## Evidence

### Gate 1: Question Quality

- PROJECT.md exists.
- idea/research_plan.md exists.
- drafts/paper-as-code/00_claims.md exists.

### Gate 2: Related Work Integrity

- Literature matrix has 14 entries.
- Gap map exists.

### Gate 3: Experiment Sufficiency

- Pilot metrics summary has 5 rows.
- Verifier-revision comparison status is missing_raw_outputs.

### Gate 4: Writing Readiness

- 00_claims.md exists.
- 01_introduction.md exists.
- 02_related_work.md exists.
- 03_method.md exists.
- 04_experiments.md exists.
- 05_discussion_limitations.md exists.
- 06_abstract.md exists.

### Gate 5: Submission Readiness

- experiments/pilot-e4-plain-llm-batch/provenance.json pending because plain-llm status is missing_raw_outputs.
- experiments/pilot-e5-candidate-constrained-batch/provenance.json pending because candidate-constrained-llm status is missing_raw_outputs.
- AI-use disclosure draft exists.
