import {
  type GuandanDecisionPoint,
  type LLMReasoningTrace,
  type VerifierCheckLabel,
  type VerifierIssue,
  type VerifierResult,
} from '@guandan/shared'

export function verifyReasoningTrace(
  decision: GuandanDecisionPoint,
  trace: LLMReasoningTrace,
): VerifierResult {
  const hardFailures: VerifierIssue[] = []
  const softWarnings: VerifierIssue[] = []
  const selectedAction = decision.legalActions.find(action => action.actionId === trace.selectedActionId)

  const legalAction = selectedAction
    ? pass(`Selected action ${trace.selectedActionId} is in legalActions.`)
    : fail(`Selected action ${trace.selectedActionId} is not in legalActions.`)

  if (!selectedAction) {
    hardFailures.push({
      code: 'LEGAL_ACTION_NOT_FOUND',
      message: `Selected action ${trace.selectedActionId} is not legal for this decision point.`,
      path: 'selectedActionId',
    })
  }

  const beatsTable = evaluateBeatsTable(decision, selectedAction)
  if (beatsTable.status === 'fail') {
    hardFailures.push({
      code: 'ACTION_DOES_NOT_BEAT_TABLE',
      message: 'Selected play action does not beat the current table lead.',
      path: 'selectedActionId',
    })
  }

  const publicHistoryConsistent = evaluateEvidence(decision, trace)
  if (publicHistoryConsistent.status === 'fail') {
    hardFailures.push({
      code: 'UNKNOWN_PUBLIC_EVIDENCE',
      message: 'Reasoning trace cites evidence not present in public history.',
      path: 'partnerBelief.evidence',
    })
  }

  const hiddenInfoDisciplined = evaluateHiddenInfoDiscipline(trace)
  if (hiddenInfoDisciplined.status === 'fail') {
    hardFailures.push({
      code: 'HIDDEN_INFO_ASSERTED_AS_FACT',
      message: 'Reasoning trace asserts hidden cards or holdings as facts.',
      path: 'opponentBelief.summary',
    })
  }

  const reasonActionConsistent = evaluateReasonActionConsistency(selectedAction, trace)
  if (reasonActionConsistent.status === 'fail') {
    softWarnings.push({
      code: 'REASON_ACTION_MISMATCH',
      message: 'Reasoning text conflicts with the selected action type.',
      path: 'actionRationale.primaryReason',
    })
  }

  const teamObjectiveValid = evaluateTeamObjectiveValidity(decision, selectedAction, trace)
  if (teamObjectiveValid.status === 'fail') {
    softWarnings.push({
      code: 'TEAM_OBJECTIVE_ACTION_MISMATCH',
      message: 'Team objective is not compatible with the selected action and decision context.',
      path: 'teamObjective.type',
    })
  }

  const partnerConsistent = evaluateTaggedBeliefConsistency(
    decision,
    trace.partnerBelief.summary,
    'partner_near_finish',
    'Partner',
  )
  if (partnerConsistent.status === 'fail') {
    softWarnings.push({
      code: 'PARTNER_BELIEF_OMITS_PUBLIC_TAG',
      message: 'Partner belief does not reflect a public partner_near_finish tag.',
      path: 'partnerBelief.summary',
    })
  }

  const opponentConsistent = evaluateTaggedBeliefConsistency(
    decision,
    trace.opponentBelief.summary,
    'opponent_near_finish',
    'Opponent',
  )
  if (opponentConsistent.status === 'fail') {
    softWarnings.push({
      code: 'OPPONENT_BELIEF_OMITS_PUBLIC_TAG',
      message: 'Opponent belief does not reflect a public opponent_near_finish tag.',
      path: 'opponentBelief.summary',
    })
  }

  return {
    schemaVersion: '0.1.0',
    decisionId: decision.decisionId,
    agentId: trace.agentId,
    selectedActionId: trace.selectedActionId,
    labels: {
      legalAction,
      beatsTable,
      publicHistoryConsistent,
      hiddenInfoDisciplined,
      partnerConsistent,
      opponentConsistent,
      reasonActionConsistent,
      teamObjectiveValid,
    },
    hardFailures,
    softWarnings,
    summary: hardFailures.length === 0
      ? 'Hard verifier checks passed.'
      : `Hard verifier found ${hardFailures.length} failure(s).`,
  }
}

function evaluateBeatsTable(
  decision: GuandanDecisionPoint,
  selectedAction: GuandanDecisionPoint['legalActions'][number] | undefined,
): VerifierCheckLabel {
  if (!selectedAction) return unknown('Selected action is missing, so table-beating validity cannot be checked.')
  if (selectedAction.action === 'pass') return notApplicable('Pass actions do not need to beat the table.')
  if (!decision.tableLead) return notApplicable('Lead actions do not need to beat an existing table lead.')
  if (selectedAction.metadata?.beatsTable) {
    return pass('Selected action metadata says it beats the table lead.')
  }
  return fail('Selected play action does not beat the table lead according to legal action metadata.')
}

function evaluateEvidence(decision: GuandanDecisionPoint, trace: LLMReasoningTrace): VerifierCheckLabel {
  const publicIds = new Set(decision.publicHistory.map(event => event.eventId))
  const cited = [...trace.partnerBelief.evidence, ...trace.opponentBelief.evidence]
  const unknownIds = cited.filter(id => !publicIds.has(id))

  if (unknownIds.length > 0) {
    return fail(`Unknown public evidence ids: ${unknownIds.join(', ')}`)
  }
  return pass('All cited evidence ids are present in public history.')
}

function evaluateHiddenInfoDiscipline(trace: LLMReasoningTrace): VerifierCheckLabel {
  const fields = [
    trace.partnerBelief.summary,
    trace.opponentBelief.summary,
    trace.actionRationale.primaryReason,
    ...trace.riskAssessment.risks,
  ]

  const badField = fields.find(field => {
    const text = field.toLowerCase()
    const assertsHiddenFact = /\b(definitely|certainly|must have|has the|has a|holds|is holding)\b/.test(text)
    const hedged = /\b(may|might|could|likely|probably|possibly|可能|也许|大概)\b/.test(text)
    return assertsHiddenFact && !hedged
  })

  if (badField) {
    return fail(`Trace asserts hidden information without uncertainty markers: ${badField}`)
  }
  return pass('Hidden information is hedged or not asserted.')
}

function evaluateReasonActionConsistency(
  selectedAction: GuandanDecisionPoint['legalActions'][number] | undefined,
  trace: LLMReasoningTrace,
): VerifierCheckLabel {
  if (!selectedAction) return unknown('Selected action is missing, so reasoning-action consistency cannot be checked.')

  const text = [
    trace.actionRationale.primaryReason,
    trace.teamObjective.explanation,
    trace.riskAssessment.mitigation,
  ].join(' ').toLowerCase()

  const talksLikePlay = /\b(play|beat|beats|contest|gain control|win lead|selected a legal play|出牌|压过|管上)\b/.test(text)
  const talksLikePass = /\b(pass|passing|skip|save resources|selected a legal pass|过牌|不要|保存)\b/.test(text)

  if (selectedAction.action === 'pass' && talksLikePlay && !talksLikePass) {
    return fail('Trace rationale describes a play/beat action while selectedActionId is pass.')
  }
  if (selectedAction.action === 'play' && talksLikePass && !talksLikePlay) {
    return fail('Trace rationale describes passing while selectedActionId is a play action.')
  }
  return pass('Trace rationale is compatible with the selected action type.')
}

function evaluateTeamObjectiveValidity(
  decision: GuandanDecisionPoint,
  selectedAction: GuandanDecisionPoint['legalActions'][number] | undefined,
  trace: LLMReasoningTrace,
): VerifierCheckLabel {
  if (!selectedAction) return unknown('Selected action is missing, so team objective validity cannot be checked.')

  const objective = trace.teamObjective.type
  const isPlay = selectedAction.action === 'play'
  const isPass = selectedAction.action === 'pass'
  const currentHandCount = decision.handCounts[decision.currentPlayer]

  if (objective === 'gain_lead') {
    if (decision.tableLead && isPlay) return pass('gain_lead is compatible with playing into an existing table lead.')
    return fail('gain_lead requires a play action against an existing table lead.')
  }
  if (objective === 'keep_lead') {
    if (!decision.tableLead && isPlay) return pass('keep_lead is compatible with leading a new trick.')
    return fail('keep_lead requires a leading play when no table lead exists.')
  }
  if (objective === 'finish_hand') {
    if (currentHandCount <= 2 && isPlay) return pass('finish_hand is compatible with playing from an endgame hand.')
    return fail('finish_hand requires an endgame hand and a play action.')
  }
  if (objective === 'save_resources') {
    if (isPass) return pass('save_resources is compatible with a pass action.')
    return unknown('save_resources with a play action may be valid but needs strategic context.')
  }
  if (objective === 'protect_partner') {
    if (decision.scenarioTags.includes('partner_near_finish')) return pass('protect_partner is grounded in partner_near_finish tag.')
    return unknown('protect_partner needs partner-state soft evidence not available to this verifier.')
  }
  if (objective === 'suppress_opponent') {
    if (decision.scenarioTags.includes('opponent_near_finish')) return pass('suppress_opponent is grounded in opponent_near_finish tag.')
    return unknown('suppress_opponent needs opponent-state soft evidence not available to this verifier.')
  }

  return unknown(`Objective ${objective} needs strategic soft evidence not available to this verifier.`)
}

function evaluateTaggedBeliefConsistency(
  decision: GuandanDecisionPoint,
  summary: string,
  tag: 'partner_near_finish' | 'opponent_near_finish',
  label: 'Partner' | 'Opponent',
): VerifierCheckLabel {
  if (!decision.scenarioTags.includes(tag)) {
    return unknown(`${label} consistency needs a public scenario tag before this conservative check applies.`)
  }

  const text = summary.toLowerCase()
  const mentionsNearFinish = /\b(close|near|finish|finishing|few cards|hand count|low hand|last cards)\b/.test(text)
    || /快走完|快出完|手牌少|剩牌|手数/.test(summary)

  if (mentionsNearFinish) {
    return pass(`${label} belief reflects the public ${tag} scenario tag.`)
  }
  return fail(`${label} belief omits the public ${tag} scenario tag.`)
}

function pass(message: string): VerifierCheckLabel {
  return { status: 'pass', score: 1, evidence: [message] }
}

function fail(message: string): VerifierCheckLabel {
  return { status: 'fail', score: 0, evidence: [message] }
}

function unknown(message: string): VerifierCheckLabel {
  return { status: 'unknown', score: 0.5, evidence: [message] }
}

function notApplicable(message: string): VerifierCheckLabel {
  return { status: 'not_applicable', score: 1, evidence: [message] }
}
