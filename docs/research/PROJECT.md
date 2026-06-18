# PROJECT

## Target

- Target tier: CCF B+ first submission path.
- Working primary venue: AAMAS main technical track.
- Stretch targets: IJCAI / AAAI if the verifier and experiments become strong enough.
- Backup targets: ECAI / ICAPS if the contribution is reframed toward general AI evaluation or planning-like constrained decision making.
- Primary area: LLM agents, multi-agent reasoning, mixed-motive games, imperfect-information decision making, verifiable reasoning.
- Secondary area: human-interpretable agent evaluation and game-based diagnostics.

## Working Title

**Verifiable Multi-Agent Reasoning for LLM Agents in Zero-Communication Mixed-Motive Games**

Chinese working title:

**零通信混合动机博弈中 LLM 智能体的可验证多智能体推理方法**

## Research Question

Can LLM agents produce and act on verifiable multi-agent reasoning in a zero-communication mixed-motive game, and does verifier feedback reduce failures that are invisible to outcome-only evaluation?

## Current Materials

- Existing Guandan application codebase with rules, validation, inference, timeline, AI prompting, and UI components.
- Research framing:
  - `README.md`
  - `2026-06-17-research-proposal.md`
  - `2026-06-17-related-work-map.md`
  - `2026-06-17-experiment-plan.md`
- Schemas:
  - `schemas/decision-point.schema.json`
  - `schemas/reasoning-trace.schema.json`
  - `schemas/verifier-result.schema.json`

## Expected Contribution Type

1. Diagnostic benchmark/evaluation framework.
2. Rule-grounded reasoning verifier.
3. Failure taxonomy for LLM agents in zero-communication mixed-motive games.
4. Verifier-in-the-loop scaffold evaluated against plain LLM and candidate-constrained baselines.

## Known Constraints

- Do not claim novelty for Guandan AI itself; DanZero, OpenGuanDan, and ToM-Guandan already exist.
- Do not claim novelty for generic LLM coordination or mixed-motive evaluation; LLM-Coordination, Hanabi LLM work, M3-BENCH, and mixed-motive explanation work are close.
- The defensible gap is narrow: deterministic verifier-grounded reasoning/action consistency for structured LLM traces under zero explicit communication, imperfect information, and dynamic legal action constraints.
- Do not claim novelty for zero-communication Guandan itself; ToM-Guandan already uses absence-of-communication Guandan experiments.
- Do not claim novelty for process-aware mixed-motive evaluation itself; M3-BENCH already makes this a central benchmark theme.
- Do not claim novelty for generic verification-aided LLM game agents; LLM-Coordination already includes an answer-verification step.
- Do not claim novelty for reasoning traces in imperfect-information card games; recent Hanabi LLM work includes reasoning traces, multi-turn memory, and move-level utility annotations.
- No empirical performance claims until decision-point data and verifier experiments are produced.

## Working Submission Profile

The current local pipeline uses `submission/submission-profile.md` as the
working decision record.

- Primary target: AAMAS main technical track.
- OpenGuanDan: cite as closest benchmark/simulator context; defer integration
  until after the first real LLM pilot.
- First LLM run: use the prepared cost-controlled OpenAI-compatible batch
  configuration for `plain-llm`, `candidate-constrained-llm`, and
  `verifier-revision-llm`; no provider API call has been made by this pipeline.
- Expert labels: optional for the first pilot, recommended for a stronger
  AAMAS/IJCAI/AAAI version if time permits.
- AI-use disclosure: adapt against AAMAS 2026 policy snapshot recorded in the
  submission profile.

## Stage

Current stage: Research OS Stage 2-4 bridge.

The project has a scoped research question, narrowed closest-neighbor related-work audit, experiment plan, schemas, decision-point exporter, verifier prototype, deterministic baselines, prompt packets, and paper-as-code skeleton. It is not publication-ready. The next concrete stage is a real LLM pilot run followed by verifier-metric comparison and failure taxonomy.
