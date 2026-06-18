# LLM Failure Analysis

Condition: `tom-prompted-llm`

| Metric | Value |
| --- | ---: |
| Decision points | 50 |
| Parsed traces | 36 |
| Parse failures | 14 |
| Hard verifier failures | 1 |

## Parse-Failure Taxonomy

| Category | Count |
| --- | ---: |
| `nested_reasoning_wrong_schema` | 11 |
| `tool_call_like_output` | 1 |
| `missing_required_trace_fields` | 2 |

## Verifier Hard-Failure Taxonomy

| Code | Count |
| --- | ---: |
| `HIDDEN_INFO_ASSERTED_AS_FACT` | 1 |

## Parse-Failure Examples

| Decision | Category | Missing Fields | Observed Keys |
| --- | --- | --- | --- |
| pilot-e1-000-turn-1-player-0 | `nested_reasoning_wrong_schema` | teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment, confidence | agentId, decisionId, evidence, gameId, reasoning, schemaVersion, selectedActionId |
| pilot-e1-002-turn-1-player-0 | `nested_reasoning_wrong_schema` | schemaVersion, teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment | agentId, confidence, decisionId, reasoning, selectedActionId |
| pilot-e1-003-turn-1-player-0 | `nested_reasoning_wrong_schema` | schemaVersion, teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment | actionId, agentId, confidence, decisionId, hiddenInformationNote, reasoning, selectedActionId, timestamp |
| pilot-e1-010-turn-1-player-0 | `tool_call_like_output` | schemaVersion, decisionId, agentId, selectedActionId, teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment, confidence | action, path, pattern |
| pilot-e1-018-turn-1-player-0 | `nested_reasoning_wrong_schema` | schemaVersion, teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment, confidence | agentId, decisionId, evidence, reasoning, selectedActionId |
| pilot-e1-020-turn-1-player-0 | `nested_reasoning_wrong_schema` | schemaVersion, teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment | agentId, confidence, decisionId, hiddenInformationBeliefs, reasoning, selectedActionId |
| pilot-e1-029-turn-1-player-0 | `nested_reasoning_wrong_schema` | schemaVersion, teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment, confidence | agentId, decisionId, evidence, reasoning, selectedActionId |
| pilot-e1-033-turn-1-player-0 | `nested_reasoning_wrong_schema` | teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment | agentId, confidence, decisionId, gameId, reasoning, schemaVersion, selectedActionId |
| pilot-e1-036-turn-2-player-1 | `nested_reasoning_wrong_schema` | schemaVersion, teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment, confidence | agentId, decisionId, evidence, reasoning, selectedActionId |
| pilot-e1-037-turn-1-player-0 | `nested_reasoning_wrong_schema` | schemaVersion, teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment, confidence | agentId, counterfactuals, decisionId, evidence, opponentIntent, partnerIntent, reasoning, selectedActionId |
| pilot-e1-040-turn-1-player-0 | `missing_required_trace_fields` | schemaVersion, teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment, confidence | actionId, agentId, decisionId, reasoningTrace, selectedActionId |
| pilot-e1-041-turn-2-player-1 | `missing_required_trace_fields` | teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment | agentId, confidence, decisionId, reasoningTrace, schemaVersion, selectedActionId |
| pilot-e1-048-turn-1-player-0 | `nested_reasoning_wrong_schema` | schemaVersion, teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment | agentId, confidence, decisionId, reasoning, selectedActionId |
| pilot-e1-049-turn-1-player-0 | `nested_reasoning_wrong_schema` | teamObjective, partnerBelief, opponentBelief, actionRationale, riskAssessment | agentId, confidence, decisionId, evidence, reasoning, schemaVersion, selectedActionId |

## Hard-Failure Examples

| Decision | Code | Message |
| --- | --- | --- |
| pilot-e1-028-turn-1-player-0 | `HIDDEN_INFO_ASSERTED_AS_FACT` | Reasoning trace asserts hidden cards or holdings as facts. |

