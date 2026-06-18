# Source Verification Report

Date: 2026-06-17

## Overall Assessment

Sources reviewed in this pass: 14

- Verified or plausibly verified by arXiv/AAAI full-text, abstract page, or repository page: 14
- Rejected as fabricated: 0
- Flagged for novelty risk: 10

This is a source-existence and claim-alignment pass, not a complete systematic review.
arXiv DOI metadata was checked for LLM-Coordination, Hanabi LLM agents, DanZero, and ToM-Guandan.

## Source Quality Matrix

| Source | Level | Venue | Method | Currency | COI | Overall |
|---|---:|---|---|---|---|---|
| LLM-Coordination | VI | arXiv/NAACL pass | benchmark with coordination QA and verification ablation | current | not assessed | high relevance |
| Hanabi LLM agents | VI | arXiv pass | LLM Hanabi benchmark plus datasets | current | not assessed | high relevance |
| ToM-Guandan | VI | arXiv pass | empirical game-agent study | current | not assessed | high relevance |
| DanZero | VI | arXiv pass | distributed self-play RL for Guandan | current | not assessed | high relevance |
| M3-BENCH | VI | arXiv pass | benchmark and process-aware evaluation | current | not assessed | high relevance |
| OpenGuanDan | VI | arXiv pass | simulator benchmark and agent evaluation | current | not assessed | high relevance |
| Explaining Decisions of Agents in Mixed-Motive Games | VI | AAAI/arXiv pass | explanation methods plus user studies | current | not assessed | high relevance |
| Communicating Activations Between Language Model Agents | VI | arXiv pass | communication method and experiments | current | not assessed | medium relevance |
| CodeAgents | VI | arXiv pass | structured prompting framework | current | not assessed | medium relevance |
| Strat-Reasoner | VI | arXiv pass | RL for strategic LLM reasoning in multi-agent games | current | not assessed | high relevance |
| ToolPoker | VI | arXiv pass | poker reasoning traces and solver-assisted tool use | current | not assessed | high relevance |
| Game Reasoning Arena | V | GitHub repository | OpenSpiel-based LLM game-evaluation framework | current | not assessed | medium relevance |
| Game Theory Meets Large Language Models | V | arXiv pass | survey/taxonomy | current | not assessed | background |
| Say One Thing Do Another | VI | arXiv pass | mobile-agent reasoning-execution diagnostic | current | not assessed | terminology risk |

## Claim Alignment Notes

### LLM-Coordination

Verified source: https://arxiv.org/abs/2310.03903  
Local text: `papers/agashe2023llmcoordination.txt`

Claim alignment:

- Supports: LLM coordination, ToM reasoning, and joint planning are already benchmarked in pure coordination games.
- Supports: a verification-aided LLM game-agent scaffold exists, including an answer verification step for Hanabi safety.
- Blocks: any novelty claim based only on adding a verification step to an LLM game agent.
- Does not block: deterministic rule-grounded labels over structured traces in mixed-motive Guandan decision points.

### Hanabi LLM Agents

Verified source: https://arxiv.org/abs/2601.18077  
Local text: `papers/ramesh2026hanabi.txt`

Claim alignment:

- Supports: LLM agents have been evaluated at scale in an imperfect-information cooperative card game.
- Supports: reasoning traces, multi-turn memory, legal candidate actions, and move-level utility annotations are used in Hanabi.
- Blocks: any novelty claim based only on LLM card-game reasoning traces or move-level utilities.
- Does not block: mixed-motive team-vs-team verifier labels for hidden-information discipline and reasoning-action consistency.

### ToM-Guandan

Verified source: https://arxiv.org/abs/2408.02559  
Local text: `papers/yim2024tomguandan.txt`

Claim alignment:

- Supports: LLM Guandan under imperfect information and collaboration already exists.
- Supports: ToM prompting/planning in Guandan already exists.
- Supports: an external RL-based tool for dynamic/extensive legal actions already exists.
- Supports: the experiments are described as absence-of-communication collaborative Guandan.
- Blocks: any novelty claim based on "first LLM Guandan", "first zero-communication Guandan", "first ToM Guandan", or "first dynamic action-space treatment."

### M3-BENCH

Verified source: https://arxiv.org/html/2601.08462v2

Claim alignment:

- Supports: process-aware mixed-motive LLM-agent evaluation exists.
- Supports: outcome-only evaluation missing process signals is already a central motivation.
- Blocks: any novelty claim based only on "outcome metrics miss reasoning failures" or "mixed-motive process-aware evaluation."

### OpenGuanDan

Verified source: https://arxiv.org/html/2602.00676v1

Claim alignment:

- Supports: Guandan as an imperfect-information benchmark exists.
- Supports: OpenGuanDan covers variable action spaces, cooperation/competition, and LLM integration support.
- Blocks: any novelty claim based on introducing Guandan as a benchmark.

### Explaining Decisions of Agents in Mixed-Motive Games

Verified source: https://arxiv.org/html/2407.15255v2

Claim alignment:

- Supports: mixed-motive explanation work already handles competition, cheap-talk, and implicit communication by actions.
- Blocks: any novelty claim based only on implicit communication by actions.

### CodeAgents and Say One Thing Do Another

Verified sources:

- https://arxiv.org/abs/2507.03254
- https://arxiv.org/html/2510.02204

Claim alignment:

- Supports: structured/verifiable multi-agent reasoning and reasoning-action consistency terminology are nearby.
- Blocks: any novelty claim that the phrase "verifiable multi-agent reasoning" or "reasoning-action consistency" itself is new.

### Strat-Reasoner

Verified source: https://arxiv.org/html/2605.04906v2

Claim alignment:

- Supports: LLM strategic reasoning in multi-agent games is an active research problem.
- Supports: reasoning traces paired with observable actions and reasoning-quality rewards are already used.
- Blocks: any novelty claim based only on improving strategic reasoning of LLMs in games.
- Does not block: deterministic rule-grounded diagnostic verifier labels for Guandan decision points.

### ToolPoker

Verified source: https://arxiv.org/html/2602.00528v1

Claim alignment:

- Supports: LLMs have been evaluated in hidden-information strategic games using gameplay outcomes and reasoning traces.
- Supports: knowing-doing gaps in game reasoning are already reported.
- Blocks: any novelty claim based only on hidden-information reasoning traces or knowing-doing gap diagnosis.
- Does not block: zero-explicit-communication team-vs-team Guandan verification with dynamic legal card-combination actions.

### Game Reasoning Arena

Verified source: https://github.com/SLAMPAI/game_reasoning_arena

Claim alignment:

- Supports: broad LLM game-playing evaluation infrastructure exists across multiple OpenSpiel games and model backends.
- Blocks: any novelty claim based only on creating a generic LLM strategic-game arena.
- Does not block: a Guandan-specific diagnostic trace-verification benchmark.

### DanZero

Verified source: https://arxiv.org/abs/2210.17087  
Local text: `papers/lu2022danzero.txt`

Claim alignment:

- Supports: Guandan is already established as a difficult imperfect-information game with large state/action spaces and mixed cooperation/competition.
- Supports: strong RL-based Guandan agents exist.
- Blocks: any novelty claim based on game strength, Guandan complexity, or first Guandan AI.
- Does not block: LLM reasoning-trace verification.

## Revised Defensible Gap

Current defensible gap:

> Deterministic verifier-grounded evaluation of structured LLM reasoning traces in zero-explicit-communication, mixed-motive, imperfect-information team games with dynamic legal actions.

This gap must be supported empirically by:

1. LLM traces that fail verifier checks despite legal or plausible actions.
2. Differences between outcome/proxy metrics and verifier metrics.
3. A verifier-in-the-loop or candidate-constrained condition that reduces hard and soft failures.
4. Qualitative cases showing nontrivial hidden-information or reasoning-action failures rather than mere JSON formatting mistakes.

## Verification Limitations

- M3-BENCH, OpenGuanDan, mixed-motive explanation, activation communication, Strat-Reasoner, ToolPoker, and survey entries were read from arXiv HTML rather than downloaded PDFs.
- Game Reasoning Arena was read from GitHub rather than an archival paper.
- COI and retraction checks were not completed.
- Semantic Scholar API verification was not performed in this pass.
- DOI metadata verification is partial; arXiv-issued DOIs are recorded for the closest sources and an initial normalized BibTeX file now exists, but non-arXiv venue metadata and page/section citation alignment remain unfinished.
