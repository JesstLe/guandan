# Soft-Label Protocol v0.2

## Purpose

This protocol defines conservative soft verifier labels for reasoning traces.
The goal is diagnostic consistency, not proof of strategic optimality.

## Implemented Labels

### `reasonActionConsistent`

Question:

Does the free-text rationale describe the same action type as
`selectedActionId`?

Pass examples:

- selected action is `play`, and the rationale describes playing, beating,
  contesting, or gaining control.
- selected action is `pass`, and the rationale describes passing, saving
  resources, or skipping.

Fail examples:

- selected action is `pass`, but the rationale says the agent beats the table.
- selected action is `play`, but the rationale says the agent passes or saves
  resources by not acting.

Unknown:

- selected action is missing or illegal, so consistency cannot be evaluated.

### `teamObjectiveValid`

Question:

Is the declared team objective compatible with the selected action and public
decision context?

Conservative rules:

- `gain_lead` passes only when there is a table lead and the selected action is
  `play`.
- `keep_lead` passes only when there is no table lead and the selected action is
  `play`.
- `finish_hand` passes only when the acting player has at most two cards and
  the selected action is `play`.
- `save_resources` passes when the selected action is `pass`; with a play
  action it remains `unknown`.
- `protect_partner` passes only when the decision point has
  `partner_near_finish`.
- `suppress_opponent` passes only when the decision point has
  `opponent_near_finish`.
- Other objectives remain `unknown` until a stronger public-state rubric is
  defined.

### `partnerConsistent`

Question:

When the public decision point has `partner_near_finish`, does the partner
belief mention that the partner may be close to finishing or has a low public
hand count?

Pass examples:

- `partner_near_finish` is present and the summary mentions close to finishing,
  few cards, low hand count, or equivalent Chinese phrasing.

Fail examples:

- `partner_near_finish` is present but the summary only says the partner state
  is uncertain and omits the public low-card signal.

Unknown:

- `partner_near_finish` is absent, so this conservative check does not apply.

### `opponentConsistent`

Question:

When the public decision point has `opponent_near_finish`, does the opponent
belief mention that an opponent may be close to finishing or has a low public
hand count?

Pass examples:

- `opponent_near_finish` is present and the summary mentions close to finishing,
  few cards, low hand count, or equivalent Chinese phrasing.

Fail examples:

- `opponent_near_finish` is present but the summary only says opponent state is
  uncertain and omits the public low-card signal.

Unknown:

- `opponent_near_finish` is absent, so this conservative check does not apply.

## Deferred Scope

The v0.2 partner/opponent labels do not judge whether the inferred intent is
globally correct, whether the selected action maximizes team value, or whether
the belief is a good counterfactual model. They only check whether a trace
acknowledges public near-finish tags when those tags are present.

## Issue Severity

- Hard labels add `hardFailures`.
- Soft labels add `softWarnings`.
- Soft warnings should be reported separately from legality or schema failures.

## Current Evidence

- Implementation: `server/src/research/reasoningVerifier.ts`
- Tests: `server/src/research/reasoningVerifier.test.ts`
- Pilot metrics:
  - `docs/research/experiments/pilot-e2-heuristic-verifier/metrics.json`
  - `docs/research/experiments/pilot-e3-strategic-heuristic/metrics.json`
