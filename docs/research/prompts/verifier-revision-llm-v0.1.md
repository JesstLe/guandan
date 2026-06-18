# Verifier Revision LLM Prompt v0.1

Purpose: revise a structured Guandan reasoning trace after verifier feedback.

The model receives:

- the original decision point,
- the previous reasoning trace,
- the verifier result for that trace.

The model must return JSON only, matching `docs/research/schemas/reasoning-trace.schema.json`.

Required behavior:

- keep `decisionId` unchanged,
- set `agentId` to `verifier-revision-llm`,
- select exactly one `selectedActionId` from the decision point's `legalActions`,
- resolve hard verifier failures when possible,
- address soft warnings when possible,
- preserve probabilistic language for hidden partner/opponent cards,
- do not invent private cards, unseen actions, or non-public evidence,
- if no correction is needed, preserve the selected action but improve the rationale and evidence discipline.

This prompt template defines the E4 verifier-in-the-loop revision condition. It does not itself contain model results.
