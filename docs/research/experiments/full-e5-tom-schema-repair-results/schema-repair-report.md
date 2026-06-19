# ToM Schema Repair Report

Condition: `tom-schema-repair-full`

| Metric | Value |
| --- | ---: |
| Total decision points | 500 |
| Parsed traces after repair | 384 |
| Pass-through traces | 306 |
| Repaired traces | 78 |
| Not repairable | 116 |
| Hard verifier failures after repair | 41 |

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

- `full-e1-384-turn-1-player-0`: Raw output file is missing.
- `full-e1-385-turn-1-player-0`: Raw output file is missing.
- `full-e1-386-turn-2-player-1`: Raw output file is missing.
- `full-e1-387-turn-1-player-0`: Raw output file is missing.
- `full-e1-388-turn-1-player-0`: Raw output file is missing.
- `full-e1-389-turn-1-player-0`: Raw output file is missing.
- `full-e1-390-turn-1-player-0`: Raw output file is missing.
- `full-e1-391-turn-2-player-1`: Raw output file is missing.
- `full-e1-392-turn-1-player-0`: Raw output file is missing.
- `full-e1-393-turn-1-player-0`: Raw output file is missing.
- `full-e1-394-turn-1-player-0`: Raw output file is missing.
- `full-e1-395-turn-1-player-0`: Raw output file is missing.
- `full-e1-396-turn-2-player-1`: Raw output file is missing.
- `full-e1-397-turn-1-player-0`: Raw output file is missing.
- `full-e1-398-turn-1-player-0`: Raw output file is missing.
- `full-e1-399-turn-1-player-0`: Raw output file is missing.
- `full-e1-400-turn-1-player-0`: Raw output file is missing.
- `full-e1-401-turn-2-player-1`: Raw output file is missing.
- `full-e1-402-turn-1-player-0`: Raw output file is missing.
- `full-e1-403-turn-1-player-0`: Raw output file is missing.
- `full-e1-404-turn-1-player-0`: Raw output file is missing.
- `full-e1-405-turn-1-player-0`: Raw output file is missing.
- `full-e1-406-turn-2-player-1`: Raw output file is missing.
- `full-e1-407-turn-1-player-0`: Raw output file is missing.
- `full-e1-408-turn-1-player-0`: Raw output file is missing.
- `full-e1-409-turn-1-player-0`: Raw output file is missing.
- `full-e1-410-turn-1-player-0`: Raw output file is missing.
- `full-e1-411-turn-2-player-1`: Raw output file is missing.
- `full-e1-412-turn-1-player-0`: Raw output file is missing.
- `full-e1-413-turn-1-player-0`: Raw output file is missing.
- `full-e1-414-turn-1-player-0`: Raw output file is missing.
- `full-e1-415-turn-1-player-0`: Raw output file is missing.
- `full-e1-416-turn-2-player-1`: Raw output file is missing.
- `full-e1-417-turn-1-player-0`: Raw output file is missing.
- `full-e1-418-turn-1-player-0`: Raw output file is missing.
- `full-e1-419-turn-1-player-0`: Raw output file is missing.
- `full-e1-420-turn-1-player-0`: Raw output file is missing.
- `full-e1-421-turn-2-player-1`: Raw output file is missing.
- `full-e1-422-turn-1-player-0`: Raw output file is missing.
- `full-e1-423-turn-1-player-0`: Raw output file is missing.
- `full-e1-424-turn-1-player-0`: Raw output file is missing.
- `full-e1-425-turn-1-player-0`: Raw output file is missing.
- `full-e1-426-turn-2-player-1`: Raw output file is missing.
- `full-e1-427-turn-1-player-0`: Raw output file is missing.
- `full-e1-428-turn-1-player-0`: Raw output file is missing.
- `full-e1-429-turn-1-player-0`: Raw output file is missing.
- `full-e1-430-turn-1-player-0`: Raw output file is missing.
- `full-e1-431-turn-2-player-1`: Raw output file is missing.
- `full-e1-432-turn-1-player-0`: Raw output file is missing.
- `full-e1-433-turn-1-player-0`: Raw output file is missing.
- `full-e1-434-turn-1-player-0`: Raw output file is missing.
- `full-e1-435-turn-1-player-0`: Raw output file is missing.
- `full-e1-436-turn-2-player-1`: Raw output file is missing.
- `full-e1-437-turn-1-player-0`: Raw output file is missing.
- `full-e1-438-turn-1-player-0`: Raw output file is missing.
- `full-e1-439-turn-1-player-0`: Raw output file is missing.
- `full-e1-440-turn-1-player-0`: Raw output file is missing.
- `full-e1-441-turn-2-player-1`: Raw output file is missing.
- `full-e1-442-turn-1-player-0`: Raw output file is missing.
- `full-e1-443-turn-1-player-0`: Raw output file is missing.
- `full-e1-444-turn-1-player-0`: Raw output file is missing.
- `full-e1-445-turn-1-player-0`: Raw output file is missing.
- `full-e1-446-turn-2-player-1`: Raw output file is missing.
- `full-e1-447-turn-1-player-0`: Raw output file is missing.
- `full-e1-448-turn-1-player-0`: Raw output file is missing.
- `full-e1-449-turn-1-player-0`: Raw output file is missing.
- `full-e1-450-turn-1-player-0`: Raw output file is missing.
- `full-e1-451-turn-2-player-1`: Raw output file is missing.
- `full-e1-452-turn-1-player-0`: Raw output file is missing.
- `full-e1-453-turn-1-player-0`: Raw output file is missing.
- `full-e1-454-turn-1-player-0`: Raw output file is missing.
- `full-e1-455-turn-1-player-0`: Raw output file is missing.
- `full-e1-456-turn-2-player-1`: Raw output file is missing.
- `full-e1-457-turn-1-player-0`: Raw output file is missing.
- `full-e1-458-turn-1-player-0`: Raw output file is missing.
- `full-e1-459-turn-1-player-0`: Raw output file is missing.
- `full-e1-460-turn-1-player-0`: Raw output file is missing.
- `full-e1-461-turn-2-player-1`: Raw output file is missing.
- `full-e1-462-turn-1-player-0`: Raw output file is missing.
- `full-e1-463-turn-1-player-0`: Raw output file is missing.
- `full-e1-464-turn-1-player-0`: Raw output file is missing.
- `full-e1-465-turn-1-player-0`: Raw output file is missing.
- `full-e1-466-turn-2-player-1`: Raw output file is missing.
- `full-e1-467-turn-1-player-0`: Raw output file is missing.
- `full-e1-468-turn-1-player-0`: Raw output file is missing.
- `full-e1-469-turn-1-player-0`: Raw output file is missing.
- `full-e1-470-turn-1-player-0`: Raw output file is missing.
- `full-e1-471-turn-2-player-1`: Raw output file is missing.
- `full-e1-472-turn-1-player-0`: Raw output file is missing.
- `full-e1-473-turn-1-player-0`: Raw output file is missing.
- `full-e1-474-turn-1-player-0`: Raw output file is missing.
- `full-e1-475-turn-1-player-0`: Raw output file is missing.
- `full-e1-476-turn-2-player-1`: Raw output file is missing.
- `full-e1-477-turn-1-player-0`: Raw output file is missing.
- `full-e1-478-turn-1-player-0`: Raw output file is missing.
- `full-e1-479-turn-1-player-0`: Raw output file is missing.
- `full-e1-480-turn-1-player-0`: Raw output file is missing.
- `full-e1-481-turn-2-player-1`: Raw output file is missing.
- `full-e1-482-turn-1-player-0`: Raw output file is missing.
- `full-e1-483-turn-1-player-0`: Raw output file is missing.
- `full-e1-484-turn-1-player-0`: Raw output file is missing.
- `full-e1-485-turn-1-player-0`: Raw output file is missing.
- `full-e1-486-turn-2-player-1`: Raw output file is missing.
- `full-e1-487-turn-1-player-0`: Raw output file is missing.
- `full-e1-488-turn-1-player-0`: Raw output file is missing.
- `full-e1-489-turn-1-player-0`: Raw output file is missing.
- `full-e1-490-turn-1-player-0`: Raw output file is missing.
- `full-e1-491-turn-2-player-1`: Raw output file is missing.
- `full-e1-492-turn-1-player-0`: Raw output file is missing.
- `full-e1-493-turn-1-player-0`: Raw output file is missing.
- `full-e1-494-turn-1-player-0`: Raw output file is missing.
- `full-e1-495-turn-1-player-0`: Raw output file is missing.
- `full-e1-496-turn-2-player-1`: Raw output file is missing.
- `full-e1-497-turn-1-player-0`: Raw output file is missing.
- `full-e1-498-turn-1-player-0`: Raw output file is missing.
- `full-e1-499-turn-1-player-0`: Raw output file is missing.
