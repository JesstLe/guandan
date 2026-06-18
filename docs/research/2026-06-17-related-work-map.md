# Related Work Map

## 1. Purpose

This document records nearby work for the topic:

**Verifiable Multi-Agent Reasoning for LLM Agents in Zero-Communication Mixed-Motive Games**

The goal is to avoid a weak novelty claim. The paper should not claim that it is the first to study LLMs in games, LLM coordination, Guandan AI, zero-communication Guandan, ToM Guandan, or mixed-motive process-aware evaluation. The defensible gap is:

> deterministic trace verification for LLM agents in zero-explicit-communication mixed-motive games with dynamic legal action spaces.

## 2. Nearby Work

### 2.1 LLM Coordination

**LLM-Coordination: Evaluating and Analyzing Multi-agent Coordination Abilities in Large Language Models**  
URL: https://arxiv.org/abs/2310.03903

What it covers:

- LLMs in pure coordination games.
- Agentic coordination and coordination QA.
- Environment comprehension, ToM reasoning, and joint planning.

Why it is close:

- It studies LLM multi-agent coordination.
- It evaluates ToM and joint planning.

Gap for this project:

- It focuses on pure coordination, not mixed-motive team-vs-team games.
- It does not center zero-communication implicit signaling.
- It does not provide a rule-grounded verifier for reasoning-action consistency in a complex card game.

### 2.2 LLMs in Hanabi

**Sparks of Cooperative Reasoning: LLMs as Strategic Hanabi Agents**  
URL: https://arxiv.org/abs/2601.18077

What it covers:

- LLMs as Hanabi agents.
- Cooperative reasoning under incomplete information.
- Working memory, scaffolding, and dense move-level value annotations.

Why it is close:

- Hanabi is an imperfect-information cooperative card game.
- It evaluates ToM-like cooperation and strategic reasoning.

Gap for this project:

- Hanabi is fully cooperative, while Guandan is two-vs-two mixed-motive.
- Hanabi has game-defined limited communication, while this project targets zero explicit communication and action-only implicit signaling.
- The proposed paper emphasizes verifiable reasoning traces, not only performance and move utilities.

### 2.3 Mixed-Motive LLM Agents

**M3-BENCH: Process-Aware Evaluation of LLM Agents Social Behaviors in Mixed-Motive Games**  
URL: https://arxiv.org/abs/2601.08462

What it covers:

- Mixed-motive game benchmark.
- Process-aware evaluation of social behaviors such as cooperation, deception, and collusion.
- Behavioral trajectory analysis, reasoning process analysis, and communication content analysis.

Why it is close:

- It directly studies LLM agents in mixed-motive games.
- It includes process-aware reasoning analysis.

Gap for this project:

- It includes broad reasoning and communication analyses; this project focuses on deterministic rule verification over structured traces.
- It studies social behavior profiles broadly; this project studies legal-action, public-history, hidden-information, and action-reasoning consistency in a high-constraint environment.
- It does not focus on dynamic legal action generation and card-game rule verification.

**Explaining Decisions of Agents in Mixed-Motive Games**  
URL: https://arxiv.org/html/2407.15255v2

What it covers:

- Explanation methods for agents in mixed-motive games.
- Includes settings such as no-press Diplomacy.

Why it is close:

- It studies explanations for mixed-motive decisions.

Gap for this project:

- The proposed project is not only explanation generation; it verifies reasoning claims against game rules and public state.
- It targets rule-grounded structured trace verification rather than human-facing explanation methods.

### 2.4 Communication-Centric Multi-Agent LLMs

**Communicating Activations Between Language Model Agents**  
URL: https://arxiv.org/html/2501.14082v2

What it covers:

- Inter-model communication via activations.
- Compares communication settings to zero-communication baselines.

Why it is close:

- It discusses communication among LLM agents and zero-communication comparison.

Gap for this project:

- It improves communication mechanisms; this project asks what reasoning is possible when communication is forbidden.
- It is not focused on mixed-motive games with deterministic rule verification.

### 2.5 Guandan AI

**DanZero: Mastering GuanDan Game with Reinforcement Learning**  
URL: https://arxiv.org/abs/2210.17087

What it covers:

- Reinforcement learning for Guandan.
- Large state/action space and long episodes.
- Self-play training and comparison with heuristic agents.

Why it is close:

- It is a foundational Guandan AI paper.

Gap for this project:

- DanZero targets game-playing strength, not LLM reasoning verifiability.
- It does not evaluate natural-language reasoning, partner/opponent belief consistency, or reasoning-action mismatch.

**Evaluating and Enhancing LLMs Agent based on Theory of Mind in Guandan**  
URL: https://arxiv.org/abs/2408.02559

What it covers:

- LLM agents in Guandan.
- Theory-of-mind planning under imperfect information.
- External tools for dynamic action spaces.
- Absence-of-communication Guandan experiments.

Why it is very close:

- It already combines Guandan, LLM agents, ToM, and imperfect information.

Gap for this project:

- The proposed paper should not claim "first LLM Guandan", "first ToM Guandan", or "first zero-communication Guandan."
- The novelty must be narrower: deterministic verifier-grounded reasoning evaluation and reasoning-action consistency metrics in dynamic legal-action decision points.

**OpenGuanDan: A Large-Scale Imperfect Information Game Benchmark**  
URL: https://arxiv.org/html/2602.00676v1

What it covers:

- Efficient Guandan simulator.
- Benchmark for learning-based and rule-based Guandan agents.

Why it is close:

- It may provide an external benchmark and baseline ecosystem.

Gap for this project:

- It is a benchmark for game AI performance, not a verifier for LLM reasoning traces.
- This project can use or compare with OpenGuanDan but should contribute reasoning verification.

## 3. Novelty Boundary

The paper should avoid these weak claims:

- "We introduce Guandan as an AI benchmark."
- "We are the first to use LLMs for Guandan."
- "We are the first to study zero-communication Guandan."
- "We show LLMs can coordinate in games."
- "We propose ToM prompting for Guandan."
- "We explain mixed-motive decisions."
- "We are the first to notice outcome metrics hide social reasoning failures."

The paper should defend these stronger claims:

- "We define a rule-grounded trace-verification task for zero-explicit-communication mixed-motive games."
- "We build a verifier that checks LLM reasoning against rules, public history, legal actions, and team objectives."
- "We show outcome metrics hide systematic reasoning failures."
- "We show verifier feedback reduces invalid reasoning and reasoning-action mismatch."
- "We provide a failure taxonomy for LLM agents in action-only implicit coordination."

## 4. Positioning Sentence

Compared with LLM-Coordination and Hanabi-based work, this project targets mixed-motive team-vs-team play with dynamic legal actions. Compared with M3-BENCH and mixed-motive explanation work, it grounds reasoning evaluation in deterministic rule verification rather than broad social-process scoring or human-facing explanations. Compared with DanZero, ToM-Guandan, and OpenGuanDan, it studies the verifiability of structured LLM reasoning traces rather than game-playing strength, ToM prompting, action recommendation, or simulator scale.
