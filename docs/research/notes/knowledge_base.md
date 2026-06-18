# Knowledge Base

This file summarizes verified-source entries from the literature matrix. Read status is deliberately conservative: `abstract_read` and `html_snippet_read` entries should not support final novelty claims until the full text is reviewed.

## agashe2023llmcoordination

Source: https://arxiv.org/abs/2310.03903  
Local full-text extraction: `papers/agashe2023llmcoordination.txt`  
Read status: pdf_read

LLM-Coordination studies LLMs in pure coordination games. It introduces Agentic Coordination and CoordinationQA tasks, covering environment comprehension, theory-of-mind reasoning, and joint planning across games such as Overcooked and Hanabi. The paper also includes an answer verification step for Hanabi, where an LLM checks whether an action follows game rules and avoids immediate game-ending mistakes.

Novelty consequence: this project cannot claim that ToM reasoning, coordination QA, or verification-aided LLM game agents are new. The distinction must be precise: LLM-Coordination uses a pure-coordination setting and LLM-style action verification, while this project uses deterministic verifier labels over structured reasoning traces in mixed-motive Guandan decision points with dynamic legal actions.

## ramesh2026hanabi

Source: https://arxiv.org/abs/2601.18077  
Local full-text extraction: `papers/ramesh2026hanabi.txt`  
Read status: pdf_read

This work evaluates 17 LLMs as Hanabi agents under incomplete information across 2-5 player settings. It studies prompt scaffolds such as Watson, Sherlock, and Mycroft, and introduces HanabiLogs and HanabiRewards with full trajectories and dense move-level utility annotations. Mycroft-style settings ask agents to track deductions and record reasoning over turns, making this a close neighbor for reasoning traces in cooperative card games.

Novelty consequence: this project cannot claim first use of LLM reasoning traces, move-level utility annotations, or hidden-information card games for cooperative reasoning. The distinction is that Hanabi is fully cooperative and includes game-defined clue communication, whereas this project targets mixed-motive team-vs-team decision points and deterministic verifier labels for legal action, public-state consistency, hidden-information discipline, and reasoning-action consistency.

## xie2026m3bench

Source: https://arxiv.org/html/2601.08462v2  
Read status: html_read

M3-BENCH is the strongest broad mixed-motive process-aware neighbor. It introduces 24 mixed-motive games and evaluates LLM social behavior through Behavioral Trajectory Analysis, Reasoning Process Analysis, and Communication Content Analysis. The abstract and contents explicitly emphasize that outcome-only evaluation misses process signals and that reasoning and communication views can expose hidden risks.

Novelty consequence: this project cannot claim that process-aware mixed-motive evaluation is new. The defensible gap is narrower: deterministic game-rule verification of structured reasoning traces in a dynamic legal-action imperfect-information team game. Our verifier should be positioned as a rule-grounded diagnostic complement to broad RPA/CCA-style social evaluation, not as the first process-aware mixed-motive benchmark.

## aaai2025mixedexplain

Source: https://arxiv.org/html/2407.15255v2  
Read status: html_read

This AAAI paper studies explanations for agents in mixed-motive games. It explicitly addresses inter-agent competition, cheap-talk, and implicit communication by actions, and evaluates explanation methods across no-press Diplomacy, COP, and Risk-like settings. It is relevant because it already treats action-based implicit communication as part of the explanation problem.

Novelty consequence: this project should not claim that implicit communication in mixed-motive games is unstudied. The distinction is that we are not primarily producing human-facing explanations; we require LLM agents to emit structured traces that are checked by rule-grounded verifier labels against legal actions, public histories, hidden-information discipline, and selected actions.

## yim2024tomguandan

Source: https://arxiv.org/abs/2408.02559  
Local full-text extraction: `papers/yim2024tomguandan.txt`  
Read status: pdf_read

This is the closest Guandan-LLM paper. The paper evaluates open-source and API-based LLM agents in Guandan under imperfect information and collaboration, proposes Theory-of-Mind planning, and adds an RL-based action recommender to handle dynamic and extensive legal action lists. The full text also states that the experiments use a setting with imperfect information, absence of communication, and collaborative dynamics.

Novelty consequence: this project must not claim first LLM Guandan, first zero-communication LLM Guandan, first ToM Guandan, or first treatment of dynamic Guandan action spaces. The defensible novelty is the diagnostic target: structured trace generation plus deterministic verifier labels for legal action, table-beating, public-history consistency, hidden-information discipline, reasoning-action consistency, and conservative partner/opponent public-tag consistency.

## lu2022danzero

Source: https://arxiv.org/abs/2210.17087  
Local full-text extraction: `papers/lu2022danzero.txt`  
Read status: pdf_read

DanZero trains a strong Guandan AI using distributed self-play reinforcement learning and Deep Monte Carlo updates over state-action features. The paper emphasizes Guandan's large state/action space, long episodes, mixed cooperation and competition, and changing player counts after players finish their hands. It evaluates against eight heuristic rule-based agents and reports human evaluation after 30 days of training.

Novelty consequence: this project must not compete on being a stronger Guandan bot or on identifying Guandan's complexity. DanZero should be cited as game-strength and environment-complexity context. Our diagnostic benchmark can use DanZero-style agents as performance references, but the paper's contribution is LLM reasoning-trace verification, not RL policy strength.

## openguandan2026

Source: https://arxiv.org/html/2602.00676v1  
Read status: html_read

OpenGuanDan introduces a large-scale imperfect-information Guandan benchmark with an efficient simulator and evaluation of learning-based and rule-based agents. Its abstract identifies imperfect information, large information sets and action spaces, mixed cooperation/competition, long-horizon decision-making, variable action spaces, and dynamic team composition as core challenges. It also states that an independent API supports human-AI interaction and LLM integration.

Novelty consequence: this project should avoid claiming to introduce Guandan as a benchmark. A stronger submission should either use OpenGuanDan as an external simulator/baseline or clearly explain why the local decision-point benchmark is a diagnostic trace-verification benchmark rather than a simulator benchmark.

## ramesh2025activationcomm

Source: https://arxiv.org/html/2501.14082v2  
Read status: html_read

This work studies communication between language model agents through internal activations. It compares communication variants against a silent zero-communication baseline in coordination games and reasoning benchmarks. It is useful contrast because it studies how to add richer communication, while this project studies what can be verified when explicit communication is forbidden and actions are the only observable coordination signal.

## yang2025codeagents

Source: https://arxiv.org/abs/2507.03254  
Read status: abstract_read

CodeAgents codifies multi-agent reasoning into modular pseudocode and argues that this makes multi-agent reasoning more interpretable and verifiable. It is related to our structured-trace design, but its evaluation settings are GAIA, HotpotQA, and VirtualHome rather than zero-communication mixed-motive games with dynamic legal action constraints.

Novelty consequence: this project should cite CodeAgents as structured/verifiable multi-agent reasoning background, not as a direct game benchmark competitor.

## li2025gametheorysurvey

Source: https://arxiv.org/html/2502.09053v2  
Read status: html_read

This survey shows that the intersection of game theory and LLMs is already broad, including game-based evaluation playgrounds, game-theoretic methods for improving LLMs, modeling LLM-related events, and LLMs for advancing game theory. It is useful as a background source for the claim that generic "LLMs in games" is crowded.

## ma2025saydo

Source: https://arxiv.org/html/2510.02204  
Read status: html_snippet_read

This paper diagnoses reasoning-execution gaps in VLM-powered mobile-use agents and uses reasoning-action consistency language. It is not a multi-agent game paper, but it is important because it occupies nearby terminology.

Novelty consequence: this project should not claim first reasoning-action consistency diagnosis. The claim should be that reasoning-action consistency is under-tested in zero-communication, mixed-motive, imperfect-information team games where legal actions and public-state consistency can be deterministically verified.

## he2026stratreasoner

Source: https://arxiv.org/html/2605.04906v2  
Read status: html_read

Strat-Reasoner improves LLM strategic reasoning in multi-agent games through a reinforcement-learning framework. The paper formulates LLM agent output as a reasoning trace paired with an observable action, highlights the credit-assignment difficulty of separating flawed reasoning from ineffective actions, and uses recursive reasoning plus centralized Chain-of-Thought comparison to provide reward signals. It reports improved strategic performance across multi-agent games.

Novelty consequence: this project cannot claim that LLM strategic reasoning in multi-agent games, reasoning traces paired with actions, or training-time reasoning-quality rewards are untouched. The distinction is that Strat-Reasoner optimizes policies in two-player alternating games, while this project evaluates zero-explicit-communication Guandan decision points with deterministic rule-grounded verifier labels for legality, public state, hidden-information discipline, and reasoning-action consistency.

## lin2026toolpoker

Source: https://arxiv.org/html/2602.00528v1  
Read status: html_read

ToolPoker studies LLM strategic reasoning in poker, an incomplete-information game. The paper evaluates both gameplay outcomes and reasoning traces, reports recurring failures including a knowing-doing gap, and proposes solver-assisted tool-integrated reasoning to improve game-theoretic action quality and explanations.

Novelty consequence: this project cannot claim that hidden-information games, reasoning traces, knowing-doing gaps, or solver/verifier-assisted game reasoning are new. The distinction is that poker is opponent-centric and solver-grounded, while this project targets team-vs-team mixed-motive Guandan with action-only implicit coordination and a diagnostic verifier over structured traces rather than a GTO solver used for policy improvement.

## slampai2026gamereasoningarena

Source: https://github.com/SLAMPAI/game_reasoning_arena  
Read status: repo_read

Game Reasoning Arena is an OpenSpiel-based framework for evaluating LLMs through strategic game-playing. Its README lists multi-agent testing modes such as LLM versus random, LLM versus LLM, and self-play; available games include tic-tac-toe, connect four, Kuhn poker, prisoners' dilemma, matching pennies, hex, and chess; and it supports API-based, local GPU, and local CPU LLM backends.

Novelty consequence: this project should not claim novelty for building a generic LLM game-playing arena. Its defensible distinction is a Guandan-specific decision-point diagnostic benchmark with structured reasoning traces and rule-grounded verifier labels.
