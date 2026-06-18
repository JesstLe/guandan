# ToM Schema Repair Report

Condition: `tom-schema-repair`

| Metric | Value |
| --- | ---: |
| Total decision points | 50 |
| Parsed traces after repair | 49 |
| Pass-through traces | 36 |
| Repaired traces | 13 |
| Not repairable | 1 |
| Hard verifier failures after repair | 1 |

The repair step is a deterministic schema-normalization ablation. It preserves the model-selected `selectedActionId` and only reconstructs missing reasoning fields from raw ToM-prompted output plus public evidence ids.

## Repaired Examples

- `pilot-e1-000-turn-1-player-0`: teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment
- `pilot-e1-002-turn-1-player-0`: teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment
- `pilot-e1-003-turn-1-player-0`: teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment
- `pilot-e1-018-turn-1-player-0`: teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment
- `pilot-e1-020-turn-1-player-0`: teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment
- `pilot-e1-029-turn-1-player-0`: teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment
- `pilot-e1-033-turn-1-player-0`: teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment
- `pilot-e1-036-turn-2-player-1`: teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment
- `pilot-e1-037-turn-1-player-0`: teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment
- `pilot-e1-040-turn-1-player-0`: teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment

## Not Repairable

- `pilot-e1-010-turn-1-player-0`: Raw output does not contain a usable selectedActionId and reasoning content.
