# Working Submission Profile

Date: 2026-06-17

This profile records the working defaults used to continue the paper pipeline.
It is not a claim that the paper is submission-ready; it only removes
unresolved decision ambiguity from the local build.

## Venue Target

Primary target: AAMAS main technical track.

Reason: the contribution is most naturally a multi-agent systems paper: LLM
agents, mixed-motive team play, zero explicit communication, structured
reasoning traces, and verifier-grounded evaluation.

Stretch targets: IJCAI or AAAI only if the final experiments show a clear
verifier benefit beyond legality filtering, include convincing ablations, and
survive reviewer objections about Guandan specificity.

Backup targets: ECAI or ICAPS if the paper is reframed toward general AI
evaluation or planning-like constrained decision making.

Recommended AAMAS area tags from the 2026 call:

- Generative and Agentic AI, because the paper evaluates LLM/agentic systems,
  cooperation and coordination of generative agents, and verification/safety of
  LLM agents.
- Representation and Reasoning, because the paper centers reasoning about
  beliefs, goals, actions, uncertainty, and verification in multi-agent systems.
- Engineering and Analysis of Multiagent Systems, if the final paper emphasizes
  the reproducible verifier and benchmark pipeline.

## External Simulator/Baseline Default

OpenGuanDan is cited as the closest Guandan benchmark and simulator context, but
it is not a blocking dependency for the first complete submission package.

Default plan:

1. Complete the local verifier-grounded LLM pilot first.
2. Treat OpenGuanDan integration as a robustness extension if the first LLM
   result table is promising.
3. Do not make a claim that requires OpenGuanDan results until those results are
   actually produced and recorded in the manifest.

## LLM Run Default

The first empirical unblock uses the prepared OpenAI-compatible batch packages:

- model field: `gpt-4.1-mini`
- temperature: `0`
- max completion tokens: `1200`
- response format: `json_object`
- first-pass conditions: `plain-llm` and `candidate-constrained-llm`
- revision condition: `verifier-revision-llm`

No provider upload or external model API call has been made by this repository
pipeline. Before any provider run, the downloaded provider JSONL outputs must be
stored under `docs/research/experiments/provider-results/` and materialized with
the existing provenance template.

## Human/Expert Label Default

Expert labels are optional for the first LLM pilot and recommended for a
stronger AAMAS/IJCAI/AAAI version if time permits.

Minimum useful subset: 30-50 decision points labeled for legality,
hidden-information discipline, public partner/opponent belief plausibility, and
reasoning-action consistency.

The first submission package may proceed without expert labels only if the
paper's verifier-validity claims stay narrow: rule-grounded diagnostics, not
human-level strategic judgment.

## AI-Use Disclosure Default

Working policy target: AAMAS 2026.

Source checked:

- `https://cyprusconferences.org/aamas2026/submission-instructions/`
- `https://cyprusconferences.org/aamas2026/policy-on-ai-assisted-technologies/`

Policy-relevant notes from the checked pages:

- AI-assisted technologies cannot be listed as authors or co-authors.
- AI assistance is permissible for polishing, formatting, and creating code or
  scripts used in proof-of-concept, demonstration, and experiments.
- If AI is used in creating hypotheses or methodologies, including experimental
  design, the methods section should include detailed information such as the
  prompt, tool, and version.
- Authors remain accountable for accuracy, plagiarism checks, source citation,
  and bias review.

Operational consequence for this project:

1. Keep AI assistance disclosed in the submission package.
2. Add a short method/appendix paragraph describing AI-assisted research
   engineering and manuscript preparation.
3. Record provider-model runs separately from AI-assisted writing/code help.
4. Preserve double-blind constraints by excluding acknowledgements and author
   identity from the review submission.
