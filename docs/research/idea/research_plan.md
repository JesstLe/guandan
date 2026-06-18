# Research Plan

## Problem Importance

LLM agents are increasingly evaluated as decision makers in multi-agent environments, but many benchmarks still emphasize final outcomes or natural-language plausibility. In zero-communication mixed-motive settings, this can hide important failures: an agent may select a legal and even successful action while its explanation hallucinates hidden information, misreads a partner's intent, or contradicts the chosen action.

Guandan provides a compact but demanding environment for this problem. It has two-vs-two cooperation, opponent competition, imperfect information, dynamic legal actions, and no explicit partner communication. Because ToM-Guandan and OpenGuanDan already use Guandan as an LLM/game-AI environment, this project treats Guandan as a verifier-checkable diagnostic setting rather than as the main novelty.

## Existing Method Families

1. **LLM coordination benchmarks**  
   Evaluate whether LLM agents can coordinate in pure cooperation settings.

2. **LLM game agents under imperfect information**  
   Evaluate LLM agents in games such as Hanabi or Guandan, often focusing on performance, theory of mind, or prompting.

3. **Mixed-motive LLM agent benchmarks**  
   Study cooperation, competition, deception, collusion, communication, and social behavior profiles.

4. **Game-specific RL agents**  
   Train strong policies for a target game, such as DanZero for Guandan.

5. **Rule/verifier-backed agents**  
   Use symbolic or deterministic checks to constrain outputs, but often focus on final action validity rather than multi-agent reasoning consistency.

## Hypothesized Gap

Existing work has not fully isolated **deterministic verifier-grounded reasoning-action consistency** in **zero-explicit-communication mixed-motive games with dynamic legal action spaces**.

In particular, nearby work often answers one of these questions:

- Can agents coordinate?
- Can agents win?
- Can agents communicate?
- Can agents explain decisions?

This project asks:

- Are the agent's multi-agent beliefs and reasons verifiable against public state and rules?
- Does the action follow from the stated reasoning?
- Does verifier feedback reduce reasoning failures that win rate alone misses?

## Candidate Contribution

The candidate contribution is a framework with three parts:

1. **Decision-point benchmark**  
   Extract Guandan decision points with legal actions, public history, hand counts, inference summaries, and strategic tags.

2. **Structured reasoning trace**  
   Require LLM agents to output selected action, team objective, partner belief, opponent belief, action rationale, risk assessment, and confidence.

3. **Reasoning verifier**  
   Label each trace with action legality, table-beating validity, public-history consistency, hidden-information discipline, partner consistency, opponent consistency, reasoning-action consistency, and team-objective validity.

## Minimal Viable Evidence

Minimum publishable evidence:

- 500-2,000 decision points across strategic tags.
- 3-5 agent conditions:
  - heuristic baseline,
  - plain LLM,
  - candidate-constrained LLM,
  - ToM-prompted LLM,
  - verifier-in-the-loop LLM.
- Structured verifier labels for all decisions.
- At least one result showing verifier feedback reduces hard failures or reasoning-action mismatch.
- Case studies showing outcome metrics hide reasoning failures.

## Kill Criteria

Stop or pivot if any of these occur:

- The verifier cannot label reasoning beyond trivial legality checks.
- Most decision points are too easy and do not expose partner/opponent reasoning failures.
- Existing ToM-Guandan, OpenGuanDan, or M3-BENCH work already includes equivalent deterministic verifier-grounded trace labels for legal action, public history, hidden-information discipline, and reasoning-action consistency.
- Verifier feedback only improves parse/legality but not meaningful reasoning consistency.
- LLM outputs are too unstable to compare despite structured JSON constraints.

## Next 3 Tasks

1. Run the first real LLM condition using exported prompt packets and record model/provider/sampling settings.
2. Run candidate-constrained and verifier-in-the-loop conditions on the same pilot decision points.
3. Compute verifier-metric tables and extract failure cases that distinguish hard rule failures from soft strategic warnings.
