# 01 Introduction Draft

## Mini-Outline

1. Establish the general problem: LLM agents are moving into multi-agent decision settings.
2. Narrow to zero-communication mixed-motive games, where outcome-only evaluation is insufficient.
3. Explain why Guandan is a dense testbed.
4. State the technical gap: reasoning traces are not verified against rules, public history, and action consistency.
5. Present the proposed framework and contributions.
6. Preview the pilot evidence and its remaining limitations.

## Draft

Large language model agents are increasingly used as decision makers in multi-agent environments where success depends on reasoning about other agents. Prior work has evaluated LLMs in coordination games, cooperative imperfect-information games, and mixed-motive social settings, showing that language models can sometimes coordinate, explain, or adapt their behavior. However, these evaluations often rely on final outcomes or plausible natural-language explanations, which can obscure whether the agent's reasoning is actually consistent with the observable state, the rules of the environment, and its chosen action.

Zero-communication mixed-motive games expose this weakness in a particularly sharp form. In these games, agents must cooperate with partners and compete against opponents, but they cannot directly exchange intentions or private information. Any coordination must therefore be inferred from public actions such as passes, sacrifices, resource use, or lead transfers. A model that claims to protect its partner while taking an action that blocks the partner, or a model that asserts hidden cards as facts, may still produce a fluent explanation and may even win by chance. Outcome-only evaluation cannot distinguish strategic reasoning from lucky or inconsistent behavior.

We study this problem through Guandan, a four-player partnership card game with imperfect information, dynamic legal actions, and two-vs-two cooperation and competition. Guandan is not used here as a target for building the strongest possible game bot. Instead, it is used as a dense testbed for verifiable multi-agent reasoning: the game contains strict rule constraints that can be checked deterministically, public histories that constrain valid beliefs, and action-only implicit signals that require partner and opponent modeling.

The central technical challenge is to verify LLM reasoning without assuming that free-form explanations are trustworthy. Existing Guandan AI work studies reinforcement learning performance or theory-of-mind prompting, while mixed-motive LLM benchmarks study broader social behavior and communication. What remains under-specified is whether a model's stated beliefs, team objective, and action rationale are consistent with the public state and the selected legal action in a zero-explicit-communication setting.

We propose a verifier-grounded evaluation framework for LLM agents in zero-communication mixed-motive games. The framework represents each game turn as a decision point with public history, hand counts, legal candidate actions, and strategic tags. The LLM agent outputs a structured reasoning trace containing its selected action, partner belief, opponent belief, team objective, action rationale, risk assessment, and confidence. A rule-grounded verifier then labels the trace along hard and soft dimensions, including action legality, table-beating validity, public-history consistency, hidden-information discipline, partner consistency, opponent consistency, and reasoning-action consistency.

This paper asks whether verifier-grounded reasoning reveals failures that fluent explanations hide and whether verifier feedback can improve structured reasoning. In the current pilot, we compare plain LLM prompting, candidate-constrained prompting, ToM-prompted reasoning, and verifier-revision prompting on 50 controlled Guandan decision points. The pilot shows that provider outputs can be complete while structured reasoning still fails: the plain condition yields 26 parsed traces out of 50 outputs, the candidate-constrained condition yields 32 parsed traces out of 50, the ToM-prompted condition yields 36 parsed traces with 1 hard verifier failure among parsed traces, and verifier revision parses all 32 eligible revision traces while reducing hard verifier failures from 35 to 10. The current evidence is a decision-point reasoning pilot rather than a full-game outcome evaluation.

## Claimed Contributions

1. We formulate verifiable multi-agent reasoning in zero-communication mixed-motive games as a decision-point evaluation problem.
2. We introduce structured reasoning traces and verifier labels for checking LLM beliefs, objectives, and actions against rules and public history.
3. We build a Guandan-based benchmark for action-only implicit coordination under imperfect information.
4. We evaluate whether verifier feedback reduces invalid reasoning and reasoning-action mismatch compared with LLM prompting baselines in a cost-controlled pilot.

## Reverse Outline

- P1: LLM multi-agent agents need evaluation beyond outcomes and plausible explanations.
- P2: Zero-communication mixed-motive games make reasoning consistency essential.
- P3: Guandan is the dense testbed, not the final product contribution.
- P4: Existing work leaves reasoning verifiability under-specified.
- P5: Proposed framework: decision points, reasoning traces, verifier labels.
- P6: Experimental plan and contribution preview.

## Claim-Evidence Map

Claim: Outcome-only evaluation can miss invalid reasoning.  
Evidence: Pilot verifier labels identify parse failures, hidden-information violations, public-history inconsistencies, and reasoning-action failures despite provider-complete outputs.  
Status: supported for decision-point reasoning diagnostics; not yet supported for full-game outcome correlation.

Claim: Guandan provides strict verifiable constraints and implicit signaling.  
Evidence: Local game rules and schemas; Guandan literature.  
Status: partially supported.

Claim: Verifier feedback improves reasoning reliability.  
Evidence: Pilot revision comparison reduces hard verifier failures from 35 in candidate-constrained first-pass traces to 10 after verifier revision on the 32 eligible parsed traces.  
Status: supported in the pilot revision subset.
