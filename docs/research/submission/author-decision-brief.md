# Author Decision Brief

Status: working submission profile adopted for local pipeline progress.

This brief records the reasoning behind the working defaults now summarized in
`submission/submission-profile.md`. The paper is still not submission-ready:
provider outputs, verifier-revision results, ablations, and final manuscript
evidence remain incomplete.

## Source-Grounded Venue Facts

Authoritative source checked: CCF official Artificial Intelligence recommended
conference list, https://www.ccf.org.cn/Academic_Evaluation/AI/

- AAAI is listed as a CCF AI A-class conference.
- IJCAI is listed as a CCF AI A-class conference.
- AAMAS is listed as a CCF AI B-class conference.
- ECAI is listed as a CCF AI B-class conference.
- ICAPS is listed as a CCF AI B-class conference.

## Recommendation

Primary target: AAMAS.

Rationale: the current contribution is most naturally framed as multi-agent
reasoning, mixed-motive cooperation, action-only implicit coordination, and
verifiable reasoning traces. AAMAS is therefore the safest CCF B+ target for
the present evidence plan.

Stretch targets: IJCAI or AAAI.

Rationale: IJCAI/AAAI become reasonable only if the real LLM experiments show a
clear verifier benefit beyond legality filtering, include strong ablations, and
survive reviewer-style attacks about game specificity and outcome relevance.

Backup or adjacent targets: ECAI or ICAPS.

Rationale: ECAI is plausible if the paper is positioned as a general AI
evaluation/method paper. ICAPS is plausible only if the final framing emphasizes
structured decision making, planning-like action constraints, and verifier-aided
policy improvement.

Not recommended as the primary target: IUI.

Rationale: IUI would require a stronger human-facing interaction or explanation
evaluation story than the current agent-verifier benchmark provides.

## Decision Items

### 1. Target Venue

Recommended decision: set AAMAS as the primary CCF B target and IJCAI/AAAI as
stretch targets.

Operational consequence: the paper should foreground multi-agent systems,
implicit coordination, mixed-motive team play, and verifier-grounded agent
reasoning rather than selling itself as a stronger Guandan bot.

Marker addressed after confirmation:

`PROJECT.md`: Primary target venue: AAMAS vs IJCAI/AAAI vs ECAI/ICAPS vs IUI.

### 2. OpenGuanDan External Baseline

Recommended decision: defer OpenGuanDan integration until the first real LLM
pilot is complete.

Operational consequence: the current local benchmark is sufficient for harness
validation and pilot evidence. OpenGuanDan should become an optional external
simulator or robustness baseline only if the first result table is promising.
Adding it now increases integration risk before the core verifier claim has
provider outputs.

Marker addressed after confirmation:

`PROJECT.md`: Whether to use OpenGuanDan as an external simulator/baseline in
addition to the local project.

### 3. LLM Provider and Cost

Recommended decision: run one cost-controlled model first for three conditions:
plain, candidate-constrained, and verifier-revision. Add a stronger second model
only after the local ingestion and audit path works end to end.

Current prepared package: OpenAI-compatible batch JSONL files exist for
`gpt-4.1-mini` with temperature 0, max completion tokens 1200, and JSON object
response format. No upload or provider API call has been performed.

Operational consequence: this keeps the first empirical unblock small while
preserving a clean path to stronger-model robustness checks.

Marker addressed after confirmation:

`PROJECT.md`: Which LLMs to evaluate and whether API costs are acceptable.

### 4. Human or Expert Labels

Recommended decision: include a small expert annotation subset only if targeting
AAMAS, IJCAI, or AAAI and time permits.

Suggested minimum: 30-50 decision points labeled for legality, hidden-information
discipline, partner/opponent belief plausibility from public information, and
reasoning-action consistency.

Operational consequence: expert labels would strengthen verifier-validity
claims, but they are not required to run the first model pilot. They become
important if reviewers are likely to ask whether the rule-grounded verifier
matches human strategic judgment.

Marker addressed after confirmation:

`PROJECT.md`: Whether to include human/expert labels for a small subset of
decisions.

### 5. AI-Use Disclosure

Recommended decision: keep the current disclosure as a draft, then adapt it to
the selected venue after the target is confirmed.

Operational consequence: disclosure wording should not be finalized before the
venue is selected because AI-use policies differ by conference and year.

Marker addressed after confirmation:

`submission/ai-use-disclosure.md`: Before submission, adapt this draft to the
target venue's current policy.

## Adopted Working Defaults

The local pipeline proceeds with the following defaults:

1. Primary target is AAMAS; IJCAI/AAAI are stretch targets; ECAI/ICAPS are
   backups.
2. OpenGuanDan is deferred until after the first real LLM pilot.
3. First LLM run uses the prepared cost-controlled batch configuration; no
   additional model is required for the first unblock.
4. Expert labels are optional for the first pilot and considered for a stronger
   submission version.
5. AI-use disclosure is finalized only after the venue is chosen.

## Remaining Non-Author Blockers

Even if all decisions above are confirmed, the submission gate should remain
not ready until provider outputs are materialized, verifier-revision results are
computed from real LLM traces, ablations are run, and manuscript
`[NEED_EXPERIMENT]` markers are removed with evidence.
