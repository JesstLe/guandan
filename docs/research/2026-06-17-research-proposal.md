# Verifiable Multi-Agent Reasoning for LLM Agents in Zero-Communication Mixed-Motive Games

## 1. Working Title

**Verifiable Multi-Agent Reasoning for LLM Agents in Zero-Communication Mixed-Motive Games**

Chinese title:

**零通信混合动机博弈中 LLM 智能体的可验证多智能体推理方法**

## 2. Core Thesis

Large language model agents are increasingly used as decision makers in multi-agent settings, but their reasoning is usually evaluated by task outcomes or natural-language plausibility. In zero-communication mixed-motive games, this is not enough: an agent may win while giving invalid reasoning, or produce plausible reasoning while taking actions that contradict its stated partner/opponent beliefs.

This project studies how to evaluate and improve LLM agents' multi-agent reasoning when agents cannot directly communicate, must infer partners and opponents from public actions, and must act under strict game rules. Guandan is used as the primary testbed because it combines imperfect information, two-vs-two cooperation, adversarial pressure, dynamic legal actions, and rich implicit signaling. The novelty is not Guandan itself, since ToM-Guandan and OpenGuanDan already cover nearby territory; the novelty must come from rule-grounded verification of structured reasoning traces.

## 3. Research Questions

**RQ1: Can current LLM agents produce strategically valid reasoning in zero-communication mixed-motive games?**

We evaluate whether their stated beliefs about partners, opponents, legal actions, and team objectives are consistent with the observable game state.

**RQ2: Does verifiable reasoning improve decision quality beyond outcome-only prompting?**

We compare plain LLM agents with agents whose reasoning is constrained and checked by a rule/verifier layer.

**RQ3: What kinds of reasoning failures dominate?**

Expected categories include illegal-action hallucination, hidden-information hallucination, partner-intent mismatch, opponent-threat underestimation, reasoning-action inconsistency, and short-horizon selfish play.

**RQ4: Can zero-communication reasoning metrics predict downstream team performance?**

We test whether reasoning validity and reasoning-action consistency correlate with win rate, finishing rank, partner support success, and opponent suppression.

## 4. Main Claim

The central claim should be:

> In zero-communication mixed-motive games with dynamic legal actions, LLM agents should be evaluated not only by game outcomes but also by verifiable reasoning traces. A rule-grounded verifier can expose and reduce failures that are invisible to win-rate metrics or broad process scores, especially hidden-information violations and reasoning-action mismatches.

## 5. Contributions

1. **Problem formulation**  
   We define a trace-verification task for zero-communication mixed-motive game reasoning, separating action validity, public-state consistency, hidden-information discipline, team-intent validity, and reasoning-action consistency.

2. **Verifier design**  
   We design a verifier that checks LLM reasoning against:
   - public game history,
   - legal action rules,
   - current table constraints,
   - hand-count constraints,
   - team relationship,
   - inferred partner/opponent beliefs.

3. **Benchmark/testbed**  
   We build a Guandan-based benchmark with structured game states, candidate actions, LLM reasoning traces, and verifier labels.

4. **Reasoning-aware agent scaffold**  
   We compare outcome-only prompting, theory-of-mind prompting, candidate-action prompting, and verifier-in-the-loop prompting.

5. **Failure taxonomy and metrics**  
   We provide metrics for rule validity, belief consistency, partner support, opponent suppression, implicit signaling, and reasoning-action consistency.

## 6. Why Guandan

Guandan is stronger than a generic game environment for this paper because it offers:

- **Zero explicit communication:** partners cannot directly reveal cards or intentions.
- **Mixed motive:** partner cooperation and opponent competition happen at the same time.
- **Imperfect information:** most cards are hidden.
- **Dynamic action space:** legal actions depend on current cards, table lead, bombs, trump rank, and wildcards.
- **Verifiable structure:** actions and many reasoning claims can be checked by deterministic rules.
- **Implicit signaling:** passes, sacrifices, bombs, low cards, and lead transfers function as indirect messages.

## 7. Non-Goals

- Not claiming to solve Guandan or beat DanZero-style RL systems.
- Not claiming to introduce LLM Guandan, zero-communication Guandan, or ToM prompting for Guandan.
- Not claiming that process-aware mixed-motive evaluation itself is new.
- Not relying on LLM free-form explanations as ground truth.
- Not treating higher win rate as sufficient evidence of reasoning.
- Not building an unrestricted communication environment.
- Not making the paper mainly about UI/product design.

## 8. Method Sketch

### 8.1 State Representation

Each decision point is represented as:

- public history,
- current player,
- team identity,
- current lead combination,
- hand counts,
- visible played cards,
- current trump rank,
- legal candidate actions,
- optional private hand for the acting agent,
- derived inferences from pass/play/count events.

### 8.2 LLM Reasoning Output

The LLM outputs a structured trace:

- selected action,
- believed partner intention,
- believed opponent threat,
- reason for acting or passing,
- team objective,
- expected short-term outcome,
- expected long-term risk.

### 8.3 Verifier

The verifier checks:

- **Action legality:** selected cards form a legal combination and can be played.
- **Observation consistency:** claims do not contradict public history.
- **Hidden-information discipline:** claims about unknown cards are probabilistic, not asserted as facts.
- **Partner consistency:** action supports the stated partner objective when possible.
- **Opponent consistency:** action addresses stated opponent threat when possible.
- **Reasoning-action consistency:** the action follows from the stated reason.

### 8.4 Agent Variants

- Plain LLM agent.
- LLM + rule-generated candidate actions.
- LLM + theory-of-mind prompt.
- LLM + verifier feedback before final action.
- Heuristic/rule baseline.
- Existing RL/rule agents where available.

## 9. Evaluation Metrics

### Outcome Metrics

- win rate,
- finishing rank,
- team promotion score,
- average decision latency,
- illegal action rate.

### Reasoning Metrics

- action legality rate,
- belief consistency rate,
- hidden-information hallucination rate,
- partner-intent consistency,
- opponent-threat consistency,
- reasoning-action consistency,
- verifier intervention rate,
- corrected-action improvement.

### Team Metrics

- partner support success,
- lead transfer success,
- opponent suppression success,
- sacrifice utility,
- bomb efficiency.

## 10. Target Venues

Primary direction:

- **AAMAS**: best topical fit for multi-agent reasoning, cooperation, competition, and games.
- **IJCAI / AAAI**: possible if the verifier and evaluation framework become general enough.
- **ECAI / ICAPS**: CCF B fallbacks if planning/decision framing is strong.

Secondary direction:

- **IUI**: if the paper emphasizes interpretable decision support and human-readable reasoning.

Official CCF directory references:

- CCF AI category lists AAAI, NeurIPS, ACL, CVPR, ICCV, ICML, IJCAI as A-class conferences and ECAI/ICAPS as B-class conferences: https://www.ccf.org.cn/Academic_Evaluation/AI/
- CCF HCI category lists IUI as a B-class conference: https://www.ccf.org.cn/Academic_Evaluation/HCIAndPC/

## 11. First Paper Scope

The first paper should be scoped as an evaluation-and-method paper:

1. Build the verifier.
2. Build a decision-point benchmark from Guandan states.
3. Evaluate multiple LLMs and prompting/scaffold variants.
4. Show that verifier-aware reasoning reduces invalid reasoning and improves team outcomes.
5. Provide failure taxonomy and case studies.

Avoid trying to train a large RL model in the first paper.
