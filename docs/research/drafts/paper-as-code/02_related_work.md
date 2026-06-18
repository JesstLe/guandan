# 02 Related Work Draft

## Mini-Outline

1. LLM coordination and imperfect-information card games.
2. Process-aware evaluation in mixed-motive games.
3. Guandan AI and LLM Guandan agents.
4. Structured and verifiable agent reasoning.
5. Positioning summary.

## Draft

LLM coordination benchmarks establish that language-model agents can be evaluated as decision makers in multi-agent settings. LLM-Coordination studies pure coordination games through Agentic Coordination and CoordinationQA tasks, including environment comprehension, theory-of-mind reasoning, joint planning, and an answer-verification ablation for Hanabi safety. Recent Hanabi work goes further by evaluating LLMs at scale in an imperfect-information cooperative card game, collecting reasoning traces, multi-turn memory, and dense move-level utilities. These settings are close, so our contribution is not the existence of LLM coordination, game-agent verification, or card-game reasoning traces; the distinction is that our verifier deterministically checks structured traces in a team-vs-team mixed-motive game with dynamic legal actions and hidden-information discipline. [Evidence: `notes/knowledge_base.md#agashe2023llmcoordination`; `notes/knowledge_base.md#ramesh2026hanabi`.]

Process-aware mixed-motive evaluation is already an active area. M3-BENCH evaluates LLM social behavior across 24 mixed-motive games using behavioral trajectory, reasoning process, and communication content analyses, and it explicitly argues that outcome-only metrics miss important process signals. Explanation work in mixed-motive games also addresses inter-agent competition, cheap-talk, and implicit communication by actions. These studies are close to our motivation, so our contribution is not that mixed-motive reasoning should be evaluated beyond outcomes; instead, we narrow the evaluation target to rule-grounded verification of structured LLM traces under dynamic legal action constraints. [Evidence: `notes/knowledge_base.md#xie2026m3bench`; `notes/knowledge_base.md#aaai2025mixedexplain`.]

Guandan AI has already been studied as both a reinforcement-learning problem and an LLM-agent problem. DanZero targets strong Guandan play through self-play reinforcement learning, while OpenGuanDan provides a large-scale imperfect-information benchmark with variable action spaces, mixed cooperation and competition, and support for LLM integration. The closest work, ToM-Guandan, evaluates LLM agents in Guandan under imperfect information, collaboration, and absence of communication; it further proposes Theory-of-Mind planning and an RL-based action recommender for the dynamic legal action list. Therefore, this paper must not be framed as introducing Guandan, LLM Guandan agents, zero-communication Guandan, ToM prompting, or action-space reduction. Our distinct target is whether the reasoning trace that accompanies an action is verifiably consistent with game rules, public evidence, hidden-information discipline, and the selected action. [Evidence: `notes/knowledge_base.md#yim2024tomguandan`; `papers/yim2024tomguandan.txt`; `notes/knowledge_base.md#openguandan2026`.]

Structured and verifiable reasoning methods provide useful design patterns but do not directly solve this evaluation setting. CodeAgents turns multi-agent planning into modular pseudocode and describes the resulting plans as interpretable and verifiable, but it evaluates general planning benchmarks rather than mixed-motive imperfect-information games. Strat-Reasoner is closer because it treats LLM game output as reasoning paired with action and optimizes strategic reasoning in multi-agent games, while ToolPoker evaluates poker reasoning traces and addresses knowing-doing gaps under hidden information with solver-assisted tool use. These works make our novelty boundary sharper: we are not the first to study strategic LLM reasoning traces in games, but we target a rule-grounded diagnostic verifier for zero-explicit-communication team play with dynamic legal actions. Related reasoning-execution gap work in mobile-use agents also shows that reasoning-action consistency is a known diagnostic concern in agent evaluation. Our contribution should therefore be stated as a domain-specific verifier formulation: hard checks for legal action, table-beating, public-history consistency, and hidden-information discipline, plus conservative soft checks for reason-action and team-objective consistency. [Evidence: `notes/knowledge_base.md#yang2025codeagents`; `notes/knowledge_base.md#he2026stratreasoner`; `notes/knowledge_base.md#lin2026toolpoker`; `notes/knowledge_base.md#ma2025saydo`; `experiments/soft-label-protocol.md`.]

Overall, the closest prior work supplies nearly all surrounding pieces: LLM coordination, imperfect-information card games, mixed-motive process-aware evaluation, Guandan benchmarks, ToM-based LLM Guandan agents, and structured agent reasoning. The remaining gap is narrower but sharper: a rule-grounded diagnostic benchmark for structured LLM reasoning traces in zero-explicit-communication, mixed-motive, dynamic-action team play. The current pilot supports this positioning by showing that provider-complete LLM outputs still produce structured trace parse failures and verifier-visible reasoning failures, and that verifier revision reduces hard failures on the parsed candidate subset. [Evidence: `notes/gap_map.md`; `experiments/pilot-metrics-summary/pilot-metrics-summary.json`; `experiments/pilot-revision-comparison/revision-comparison.json`.]

## Reverse Outline

- P1: Coordination and hidden-information card-game work motivate the setting but do not provide rule-grounded trace verification in team-vs-team mixed-motive play.
- P2: M3-BENCH and mixed-motive explanation work already cover process-aware social evaluation and implicit-action explanations, so our novelty must be narrower.
- P3: Guandan and ToM-Guandan are very close; our paper cannot claim environment, zero communication, ToM, or action-space novelty.
- P4: Structured/verifiable reasoning, strategic LLM game reasoning, and reasoning-action diagnostics are related, but our verifier target is game-rule grounded.
- P5: Positioning statement and empirical burden.

## Claim-Evidence Map

Claim: M3-BENCH already covers process-aware mixed-motive evaluation beyond outcomes.  
Evidence: `notes/knowledge_base.md#xie2026m3bench`; source URL `https://arxiv.org/html/2601.08462v2`.  
Status: supported by HTML full-text read.

Claim: ToM-Guandan already covers LLM Guandan under imperfect information, collaboration, absence of communication, ToM planning, and dynamic action-space support.  
Evidence: `notes/knowledge_base.md#yim2024tomguandan`; `papers/yim2024tomguandan.txt`; source URL `https://arxiv.org/abs/2408.02559`.  
Status: supported by PDF read.

Claim: LLM-Coordination and Hanabi LLM agents already cover verification-adjacent LLM game agents, cooperative card-game reasoning traces, and move-level utilities.  
Evidence: `notes/knowledge_base.md#agashe2023llmcoordination`; `papers/agashe2023llmcoordination.txt`; `notes/knowledge_base.md#ramesh2026hanabi`; `papers/ramesh2026hanabi.txt`.  
Status: supported by PDF reads.

Claim: No verified prior work in the current corpus combines structured LLM reasoning traces with deterministic verifier labels for legal action, public history, hidden-information discipline, and reasoning-action consistency in Guandan-like zero-explicit-communication dynamic-action team play.  
Evidence: `notes/literature_matrix.csv`; `notes/gap_map.md`.  
Status: strengthened after a wider search that added Strat-Reasoner, ToolPoker, and Game Reasoning Arena; still needs final BibTeX normalization and page/section checks before submission.
