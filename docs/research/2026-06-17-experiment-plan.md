# Experiment Plan

## 1. Goal

Build evidence for the claim:

> Verifier-grounded reasoning improves the reliability and decision quality of LLM agents in zero-communication mixed-motive games.

The first experimental target is Guandan. Secondary transfer experiments can be added only after the Guandan benchmark and verifier are stable.

## 2. Dataset / Benchmark Construction

### 2.1 Decision Point Dataset

Extract or generate decision points from complete Guandan games.

Each decision point should contain:

- game id,
- turn index,
- current player,
- team identity,
- private hand of current player,
- public play history,
- current lead combination,
- legal candidate actions,
- hand counts of all players,
- played card summary,
- pass/play/count inferences,
- game outcome after actual action,
- optional expert/heuristic label.

### 2.2 Scenario Tags

Tag decision points by strategic type:

- lead opening,
- follow/beat/pass,
- partner near finish,
- opponent near finish,
- bomb decision,
- wildcard decision,
- lead transfer,
- sacrifice for partner,
- endgame race,
- ambiguous/pass dilemma.

### 2.3 Difficulty Buckets

Use buckets to prevent easy states from dominating:

- **Rule-simple:** legal action is obvious.
- **Tactical:** multiple legal actions, local best action matters.
- **Team-aware:** partner/opponent hand counts change the best action.
- **Belief-heavy:** public history matters.
- **Sacrifice-heavy:** locally costly action can improve team outcome.

## 3. Agent Conditions

### C0: Heuristic Baseline

Rule-based legal-action chooser with simple scoring.

### C1: Plain LLM

LLM receives game state and is asked to choose an action with reasoning.

### C2: Candidate-Constrained LLM

LLM receives only legal candidate actions and must choose among them.

### C3: ToM-Prompted LLM

LLM explicitly reasons about partner intention and opponent threat.

### C4: Verifier-in-the-Loop LLM

LLM produces structured reasoning and action. The verifier returns errors/warnings. The LLM revises before final action.

### C5: Ablated Verifier Variants

Remove one verification family at a time:

- no hidden-information check,
- no partner consistency check,
- no opponent threat check,
- no reasoning-action consistency check,
- no legal-action verifier.

## 4. Verifier Labels

Each LLM output receives structured labels:

- `legal_action`: selected action is legal.
- `beats_table`: selected action can beat the current table when required.
- `public_history_consistent`: no contradiction with visible history.
- `hidden_info_disciplined`: does not assert unknown cards as facts.
- `partner_consistent`: action supports stated partner objective.
- `opponent_consistent`: action addresses stated opponent threat.
- `reason_action_consistent`: action follows from reasoning.
- `team_objective_valid`: stated objective matches team situation.

## 5. Metrics

### 5.1 Reasoning Reliability

- legal action rate,
- public-history consistency rate,
- hidden-information hallucination rate,
- reasoning-action consistency rate,
- verifier warning rate,
- correction success rate after verifier feedback.

### 5.2 Game Performance

- win rate,
- finishing rank,
- team promotion score,
- average turns to finish,
- bomb efficiency,
- pass regret rate,
- illegal recommendation rate.

### 5.3 Team Reasoning

- partner support success,
- lead transfer success,
- opponent suppression success,
- sacrifice utility,
- endgame protection success.

## 6. Core Hypotheses

**H1:** Plain LLM agents will produce plausible but unverifiable reasoning in many difficult states.

**H2:** Candidate-constrained prompting will reduce illegal actions but will not fully solve belief or partner-consistency failures.

**H3:** ToM prompting will improve partner/opponent reasoning text, but may increase hidden-information hallucination.

**H4:** Verifier-in-the-loop prompting will reduce invalid reasoning and reasoning-action mismatch.

**H5:** Reasoning reliability metrics will predict team performance better than natural-language explanation length or confidence.

## 7. Case Studies

The paper should include 4-6 qualitative cases:

1. LLM wins but reasons incorrectly.
2. LLM gives a plausible explanation but chooses an action that contradicts it.
3. ToM prompt hallucinates hidden cards.
4. Verifier catches an illegal or strategically inconsistent action.
5. Verifier feedback changes action and improves rollout outcome.
6. A sacrifice action looks bad locally but supports partner/team objective.

## 8. Implementation Milestones

### Milestone 1: Research Harness

- Define decision-point JSON schema.
- Export decision points from current `GameSession` and `Timeline`.
- Add legal candidate action generation placeholder if full generator is not ready.
- Store LLM prompt/output/verifier result per decision.

### Milestone 2: Rule Verifier

- Implement legality checks using existing combination detector/comparator.
- Implement public-history consistency checks.
- Implement hidden-information discipline checks.
- Implement reasoning-action consistency checks from structured output.

### Milestone 3: Baseline Agents

- Add heuristic baseline.
- Add plain LLM prompt.
- Add candidate-constrained prompt.
- Add ToM prompt.
- Add verifier-in-the-loop prompt.

### Milestone 4: Evaluation

- Run fixed-seed decision-point evaluation.
- Run full-game simulation if stable.
- Produce tables for reasoning metrics and outcome metrics.
- Run ablations.

### Milestone 5: Paper Draft

- Abstract.
- Introduction.
- Related work.
- Method.
- Benchmark.
- Results.
- Failure taxonomy.
- Limitations.

## 9. Immediate Engineering Tasks

1. Add `docs/research/schemas/decision-point.schema.json`.
2. Add a server-side exporter from `Timeline` to decision-point records.
3. Add a structured LLM output schema for reasoning traces.
4. Add verifier result types to shared models.
5. Write unit tests for verifier labels on handcrafted states.

## 10. Risk Register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Existing Guandan LLM-ToM work is too close | Weak novelty | Emphasize verifier-grounded reasoning and zero-communication implicit signaling |
| Full-game simulation is unstable | Delays results | Start with decision-point benchmark before full-game self-play |
| LLM output is hard to parse | Noisy labels | Require structured JSON reasoning trace |
| Verifier overclaims strategic truth | Invalid evaluation | Separate hard rule checks from soft strategic consistency checks |
| Human labels are expensive | Hard to validate | Use small expert-labeled subset plus rule-verifiable labels |
| Win rate is noisy | Weak statistics | Use decision-point metrics and fixed-seed rollouts |

## 11. Minimum Publishable Result

The minimum viable paper needs:

- 500-2,000 decision points across strategic tags,
- 3-5 LLMs or agent conditions,
- verifier metrics with clear failure taxonomy,
- at least one verifier-in-the-loop improvement result,
- comparisons to plain LLM and candidate-constrained LLM,
- case studies showing failures not visible from outcome metrics.
