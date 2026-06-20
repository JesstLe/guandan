# ToM Schema Repair Report

Condition: `tom-schema-repair-full`

| Metric | Value |
| --- | ---: |
| Total decision points | 500 |
| Parsed traces after repair | 500 |
| Pass-through traces | 404 |
| Repaired traces | 96 |
| Not repairable | 0 |
| Hard verifier failures after repair | 52 |

The repair step is a deterministic schema-normalization ablation. It preserves the model-selected `selectedActionId` and only reconstructs missing reasoning fields from raw ToM-prompted output plus public evidence ids.

## Repaired Examples

- `full-e1-019-turn-1-player-0`: teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment
- `full-e1-021-turn-2-player-1`: teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment
- `full-e1-025-turn-1-player-0`: teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment
- `full-e1-029-turn-1-player-0`: teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment
- `full-e1-030-turn-1-player-0`: teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment
- `full-e1-032-turn-1-player-0`: teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment
- `full-e1-033-turn-1-player-0`: teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment
- `full-e1-036-turn-2-player-1`: teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment
- `full-e1-038-turn-1-player-0`: teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment
- `full-e1-040-turn-1-player-0`: teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment

## Not Repairable

All raw outputs were repairable or already valid.
