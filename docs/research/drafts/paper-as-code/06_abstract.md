# 06 Abstract Draft

## Draft Abstract

Large language model agents are increasingly evaluated in multi-agent decision settings, but final outcomes and fluent explanations do not guarantee valid reasoning. We study this problem in zero-communication mixed-motive games, where agents must cooperate with partners and compete against opponents without directly exchanging intentions or private information. We propose a verifier-grounded framework for evaluating LLM agents at structured decision points. Each agent outputs a reasoning trace containing its selected action, team objective, partner belief, opponent belief, action rationale, and risk assessment. A rule-grounded verifier checks the trace against legal action constraints, public history, hidden-information discipline, and reasoning-action consistency. We instantiate the framework in Guandan, a four-player imperfect-information partnership card game with dynamic legal actions and action-only implicit signaling. Planned experiments compare plain LLM agents, candidate-constrained agents, theory-of-mind prompted agents, and verifier-in-the-loop agents on reasoning reliability and team-decision metrics. [NEED_EXPERIMENT] The study aims to show that verifier-grounded reasoning exposes failures hidden by outcome-only evaluation and provides a practical diagnostic layer for LLM agents in structured multi-agent environments. [NEED_EXPERIMENT]

## Keywords

LLM agents; multi-agent reasoning; mixed-motive games; imperfect information; verifiable reasoning; Guandan; zero communication; reasoning-action consistency.

## Self-Review

- Contribution: Clear target, but contribution strength depends on verifier implementation and experiments.
- Writing clarity: Abstract is readable but still plan-like because results are not available.
- Experimental strength: Not yet supported.
- Evaluation completeness: Metrics and conditions are planned.
- Method design soundness: Schema-first design is coherent, but soft verifier labels need careful operational definitions.

## Claim-Evidence Map

Claim: Outcome-only evaluation misses reasoning failures.  
Evidence: Planned experiments and case studies.  
Status: needs evidence.

Claim: The framework checks reasoning against rules, public history, and action consistency.  
Evidence: Schemas and planned verifier.  
Status: partially supported.

Claim: Verifier-in-the-loop improves agent reliability.  
Evidence: Planned experiments.  
Status: needs evidence.
