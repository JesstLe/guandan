# 06 Abstract Draft

## Draft Abstract

Large language model agents are increasingly evaluated in multi-agent decision settings, but final outcomes and fluent explanations do not guarantee valid reasoning. We study this problem in zero-communication mixed-motive games, where agents must cooperate with partners and compete against opponents without directly exchanging intentions or private information. We propose a verifier-grounded framework for evaluating LLM agents at structured decision points. Each agent outputs a reasoning trace containing its selected action, team objective, partner belief, opponent belief, action rationale, and risk assessment. A rule-grounded verifier checks the trace against legal action constraints, public history, hidden-information discipline, and reasoning-action consistency. We instantiate the framework in Guandan, a four-player imperfect-information partnership card game with dynamic legal actions and action-only implicit signaling. In a 50-decision pilot using Kimi Code CLI outputs, provider-complete LLM runs still expose substantial structured-reasoning failures: the plain condition parses 26/50 traces, the candidate-constrained condition parses 32/50 traces, the ToM-prompted condition parses 36/50 traces with 1 hard verifier failure among parsed traces, and verifier revision parses 32/32 eligible traces while reducing hard verifier failures from 35 to 10. These results support verifier-grounded reasoning as a practical diagnostic layer for LLM agents in structured multi-agent environments, while leaving full-game outcome evaluation and verifier-component ablations as follow-up work.

## Keywords

LLM agents; multi-agent reasoning; mixed-motive games; imperfect information; verifiable reasoning; Guandan; zero communication; reasoning-action consistency.

## Self-Review

- Contribution: Clear target with pilot LLM evidence; full-game outcome and ablation evidence remain future work.
- Writing clarity: Abstract is readable but still plan-like because results are not available.
- Experimental strength: Supported by a cost-controlled pilot, not yet by full-scale outcome evaluation.
- Evaluation completeness: Reasoning metrics are implemented; ablations and full-game outcome metrics are not yet complete.
- Method design soundness: Schema-first design is coherent, but soft verifier labels need careful operational definitions.

## Claim-Evidence Map

Claim: Outcome-only evaluation misses reasoning failures.  
Evidence: Pilot verifier labels over provider-complete LLM outputs.  
Status: supported for decision-point reasoning diagnostics; outcome correlation remains future work.

Claim: The framework checks reasoning against rules, public history, and action consistency.  
Evidence: Schemas, verifier implementation, deterministic baselines, and pilot LLM metrics.  
Status: supported in the current pilot.

Claim: Verifier-in-the-loop improves agent reliability.  
Evidence: Revision comparison reduces hard failures from 35 to 10 on 32 eligible candidate traces.  
Status: supported for the pilot revision subset.
