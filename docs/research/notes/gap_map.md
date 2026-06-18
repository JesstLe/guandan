# Gap Map

## What Is Crowded

1. **Generic LLM coordination**  
   LLM coordination in pure cooperation settings is already represented by LLM-Coordination and related work. LLM-Coordination also includes an answer-verification step, so this paper cannot claim novelty for verification-aided LLM game agents in general.

2. **LLM agents in imperfect-information card games**  
   Hanabi and Guandan have active work. Recent Hanabi LLM work includes reasoning traces, working memory, dense move-level utility annotations, and post-training datasets. A paper cannot simply claim that LLMs can play an imperfect-information card game or that card-game traces are new.

3. **Guandan AI performance**  
   DanZero and OpenGuanDan already occupy the game-strength and benchmark space.

4. **Theory-of-mind prompting for Guandan**  
   ToM-Guandan already studies LLM agents in Guandan with imperfect information, collaboration, zero explicit communication, Theory-of-Mind planning, and an RL-based action recommender for dynamic legal action spaces. A new paper must avoid shallow ToM prompt variants and must not treat zero communication itself as sufficient novelty.

5. **Mixed-motive social behavior benchmarks**  
   M3-BENCH already provides a process-aware mixed-motive benchmark with reasoning and communication analyses. Mixed-motive explanation work already addresses inter-agent competition, cheap-talk, and implicit communication by actions.

6. **Reasoning-action consistency terminology**  
   Reasoning-execution or reasoning-action gap diagnosis appears in neighboring agent domains such as mobile-use agents. The paper should not present the phrase itself as new.

7. **Strategic LLM reasoning in games**  
   Strat-Reasoner and ToolPoker show that LLM reasoning traces, strategic game play, hidden-information reasoning, and knowing-doing gaps are active research targets. The paper must not claim novelty for pairing reasoning traces with actions or for observing that LLMs struggle in strategic games.

## What Is Under-Specified

1. **Reasoning-action consistency**  
   Existing evaluations often inspect reasoning text or outcomes, but the deterministic link between stated belief/objective, public game state, legal action constraints, and chosen action remains under-specified in mixed-motive imperfect-information team games.

2. **Hidden-information discipline**  
   LLM agents may assert unknown cards or intentions as facts. This is measurable in a rule-grounded game but not usually separated from general ToM quality.

3. **Zero explicit communication**  
   Many multi-agent LLM settings rely on communication, negotiation, chat, or signaling channels. However, ToM-Guandan already uses an absence-of-communication Guandan setting, so our paper must treat zero explicit communication as part of the evaluation regime rather than as the sole novelty.

4. **Dynamic legal action verification**  
   Legal action spaces in Guandan are structured and state-dependent. ToM-Guandan addresses action-space size with an RL recommender, but not with a trace verifier that labels whether a selected action and the accompanying reasoning are consistent with legal actions, public history, and hidden-information discipline.

## What Is Technically Hard but Evaluable

1. **Verifier labels for reasoning traces**  
   Hard rule checks are easy; strategic consistency labels are harder. The solution is to separate hard checks from soft checks.

2. **Decision-point extraction**  
   Full-game simulation may be complex, but decision-point benchmark extraction is feasible from the current `Timeline` and `GameSession` code.

3. **Reasoning-action mismatch detection**  
   The method needs structured reasoning outputs and stable labels. This is feasible with JSON schemas and verifier rules.

4. **Correlation with team performance**  
   Win rate is noisy. Fixed-seed rollouts and decision-point outcome proxies can make this evaluable.

## What Reviewers Will Call Incremental

Reviewers may reject the work as incremental if it only says:

- "We evaluate LLMs in Guandan."
- "We add a ToM prompt."
- "We add legal action constraints."
- "We build another benchmark."
- "We show LLMs hallucinate in games."
- "We study zero-communication Guandan."
- "We measure reasoning-action consistency."
- "We add verification to an LLM game agent."
- "We collect reasoning traces for a card game."
- "We improve strategic reasoning in LLM games."
- "We diagnose knowing-doing gaps in hidden-information games."

To avoid this, the paper must make the mechanism and metrics explicit:

- verifier-grounded reasoning trace,
- hard vs soft check taxonomy,
- zero-communication implicit signaling as the setting rather than the only contribution,
- reasoning-action consistency,
- deterministic rule checks rather than only LLM-judge process scores,
- evidence that outcome-only evaluation misses failures.

## Candidate Gaps

### Gap A: Verifiable Reasoning-Action Consistency

- Novelty: high
- Feasibility: high
- Evaluation clarity: high

Claim:

> In zero-communication mixed-motive games with dynamic legal actions, LLM agents often produce reasoning traces that are inconsistent with legal actions, public state, hidden-information boundaries, or their selected actions; a rule-grounded verifier can detect and reduce these failures.

### Gap B: Implicit Signaling without Communication

- Novelty: medium-high
- Feasibility: medium
- Evaluation clarity: medium

Claim:

> LLM agents struggle to infer partner intent from action-only signals; conservative verifier-guided belief discipline can identify when traces ignore public partner/opponent urgency signals.

### Gap C: Outcome Metrics Hide Reasoning Failure

- Novelty: medium
- Feasibility: high
- Evaluation clarity: high

Claim:

> Win rate and finishing rank fail to reveal hidden-information hallucination and reasoning-action mismatch; verifier metrics provide complementary diagnostics.

## Recommended Gap

Recommended main gap: **Gap A, with Gap C as the empirical motivation.**

Falsifiable claim:

> Compared with plain and candidate-constrained LLM agents, verifier-in-the-loop agents will reduce hard reasoning failures and reasoning-action mismatches on Guandan decision points, without reducing downstream team-decision proxy metrics.

Required evidence:

- decision-point benchmark,
- hard/soft verifier labels,
- ablation over verifier components,
- outcome or proxy performance metrics,
- qualitative cases showing failures invisible to outcomes.

Kill criterion after source audit:

- If M3-BENCH or ToM-Guandan is found to include deterministic rule-grounded trace labels over legal actions, public-history consistency, hidden-information discipline, and action-reasoning consistency in Guandan-like dynamic legal action spaces, this gap becomes too incremental and the project should pivot to reproducing/extending those labels rather than claiming a new framework.
