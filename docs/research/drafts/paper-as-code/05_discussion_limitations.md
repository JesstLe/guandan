# 05 Discussion and Limitations Draft

## Mini-Outline

1. Interpret what verifier labels can and cannot prove.
2. Discuss why zero communication matters.
3. Discuss Guandan as testbed rather than final domain.
4. Limitations around soft labels, dataset size, LLM variability, and external validity.
5. Ethical and reproducibility considerations.

## Draft

Verifier-grounded reasoning should be interpreted as diagnostic evidence rather than proof of strategic optimality. Hard labels can identify illegal actions, table-beating errors, public-history contradictions, and hidden-information hallucinations. Soft labels such as partner consistency and opponent consistency are more limited: they indicate whether the reasoning is plausible under the public state and selected objective, not whether the action is globally optimal.

The zero-communication setting is central to the paper's contribution. When agents can communicate freely, reasoning quality can be evaluated through messages, negotiation, and explicit commitments. In Guandan-like settings, partners cannot directly reveal private cards or intentions, so action choices themselves become the coordination channel. This makes reasoning-action consistency a necessary diagnostic: if the action is the signal, the explanation must align with the signal.

Guandan is used as a compact testbed for structured multi-agent decision problems with imperfect information, dynamic legal actions, public histories, and mixed team objectives. The present paper does not claim empirical generalization beyond this environment; cross-game or cross-domain transfer is left for future work that adds additional environments and transfer experiments. [Evidence: `PROJECT.md`; `submission/submission-profile.md`.]

The main limitation is that verifier labels are only as strong as the rules and consistency checks behind them. Hard checks are deterministic, but soft strategic checks may reflect design assumptions. To avoid overclaiming, the experiments report hard and soft labels separately and use ablations to show which verifier components drive observed changes.

A second limitation is model and prompt sensitivity. LLM agents can vary across model versions, sampling settings, and prompt formats. The evaluation must therefore log model names, dates, temperatures, raw outputs, parsed traces, and verifier labels. Results should be presented as diagnostic patterns under specified settings rather than universal claims about all LLMs.

## Claim-Evidence Map

Claim: Verifier labels are diagnostic rather than optimality proofs.  
Evidence: Design distinction between hard and soft labels.  
Status: supported as limitation.

Claim: Generalization beyond Guandan requires additional environments.  
Evidence: Scope analysis.  
Status: supported as limitation.

Claim: LLM results are model/prompt sensitive.  
Evidence: General known issue; needs citation.  
Status: needs source.
