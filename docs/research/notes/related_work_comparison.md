# Related Work Comparison Table

This table is a reviewer-facing positioning aid. It should be converted into a compact paper table after the remaining full-text reads are complete.

| Work | Communication Setting | Motive Structure | Environment | Reasoning Signal | Verifier Type | Dynamic Legal Actions | Direct Novelty Risk |
|---|---|---|---|---|---|---|---|
| LLM-Coordination | varies by task; coordination-oriented | pure coordination | coordination games and QA | coordination reasoning and ToM-style abilities | LLM answer verification plus benchmark scoring | no | medium-high |
| Hanabi LLM agents | game-defined communication | fully cooperative | Hanabi | reasoning traces, working memory, move-level utilities | task/game scoring and dense move utility annotations | yes but game-specific | high |
| M3-BENCH | includes no-communication and communication-enabled settings | mixed-motive | 24 mixed-motive games | BTA/RPA/CCA process signals | benchmark metrics and LLM/process analyses | generally no Guandan-style legal action verifier | high |
| Explaining Decisions of Agents in Mixed-Motive Games | no-press and natural-language communication settings | mixed-motive | Diplomacy, COP, Risk-like settings | explanation levels and implicit action communication | explanation algorithms plus user studies | no Guandan-style dynamic action verifier | high |
| DanZero | no natural-language communication | mixed cooperation/competition | Guandan | policy performance | game outcome | yes | medium |
| ToM-Guandan | absence of communication | mixed cooperation/competition | Guandan | ToM planning text and game performance | performance evaluation plus action recommender | yes, handled by RL recommender | very high |
| OpenGuanDan | API supports independent player agents and LLM integration | mixed cooperation/competition | Guandan benchmark | agent performance | simulator/game metrics | yes | high |
| Activation Communication | explicit activation communication vs silent baseline | cooperative coordination | coordination games and reasoning benchmarks | communication effectiveness | accuracy and compute metrics | no | medium |
| CodeAgents | multi-agent prompting with structured interaction | general multi-agent planning | GAIA, HotpotQA, VirtualHome | codified reasoning programs | task success and token metrics | no game-rule legal verifier | medium |
| Strat-Reasoner | multi-agent game interaction | strategic competition | two-player alternating Markov games | reasoning trace plus observable action | RL reward and centralized CoT comparison | not Guandan-style dynamic legal-action verification | high |
| ToolPoker | no team communication; opponent modeling through poker state | competitive imperfect information | poker | reasoning traces and solver-supported explanations | CFR/GTO solver and reasoning-quality metrics | poker action abstractions rather than Guandan combinations | high |
| Game Reasoning Arena | varies by game and backend | mixed set: zero-sum, cooperation, social dilemma | OpenSpiel games including Kuhn poker and prisoners' dilemma | game-playing logs and optional LLM reasoning | game outcomes/framework metrics | no structured Guandan trace verifier | medium |
| Say One Thing Do Another | single-agent execution setting | not multi-agent | mobile-use GUI agents | reasoning-execution gap | ground-truth alignment metrics | GUI actions not card legal actions | terminology risk |
| This project | zero explicit communication; action-only implicit signals | mixed-motive team-vs-team | Guandan decision points | structured LLM reasoning traces | deterministic hard labels plus conservative soft labels | yes | target contribution |

## Defensible Distinction

The paper's contribution should be stated as:

> A rule-grounded diagnostic framework for structured LLM reasoning traces in zero-explicit-communication mixed-motive decision points with dynamic legal actions.

The paper should not claim:

- first LLM Guandan,
- first zero-communication Guandan,
- first ToM Guandan,
- first process-aware mixed-motive evaluation,
- first implicit-action explanation in mixed-motive games,
- first reasoning-action consistency metric,
- first use of verification in LLM game agents,
- first use of LLM reasoning traces in imperfect-information card games.
- first strategic reasoning improvement for LLM game agents,
- first knowing-doing gap diagnosis in hidden-information games,
- first generic LLM strategic-game evaluation framework.

## Table-to-Paper Plan

Paper table columns should be shortened to:

1. setting,
2. communication,
3. environment,
4. reasoning label,
5. verifier grounding,
6. dynamic legal actions.

The table should include at least M3-BENCH, mixed-motive explanations,
ToM-Guandan, OpenGuanDan, Strat-Reasoner, ToolPoker, CodeAgents, and this
project.
