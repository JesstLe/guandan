import {
  type AnyCard,
  type CardCombination,
  type GameEvent,
  type GuandanDecisionPoint,
  type PlayerProfile,
  type ResearchLegalAction,
  type ResearchPublicEvent,
  type ResearchScenarioTag,
  RANK_ORDER,
  cardId,
  isJoker,
} from '@guandan/shared'
import { canBeat } from '../engine/combinationCompare'
import { detectCombination } from '../engine/combinationDetector'
import { GameSession, getHighestCombination } from '../engine/gameSession'

export interface ExportDecisionPointOptions {
  gameId: string
}

export function exportDecisionPoint(
  session: GameSession,
  options: ExportDecisionPointOptions,
): GuandanDecisionPoint {
  const state = session.getState()
  const timeline = session.getTimeline().all
  const currentPlayer = state.currentPlayer
  const tableLead = getHighestCombination(state.currentRound)
  const privateHand = session.simulatedHands?.[currentPlayer] ?? getVisibleHandForPlayer(session, currentPlayer)
  const publicHistory = buildPublicHistory(timeline)
  const handCounts = buildHandCounts(session, state.pool.players)
  const legalActions = generateLegalActions(privateHand, tableLead)
  const phase = tableLead ? 'follow' : 'lead'
  const scenarioTags = buildScenarioTags(phase, handCounts, state.seats, currentPlayer, legalActions)

  return {
    schemaVersion: '0.1.0',
    gameId: options.gameId,
    decisionId: `${options.gameId}-turn-${timeline.length}-player-${currentPlayer}`,
    turnIndex: timeline.length,
    roundNumber: state.roundNumber,
    currentPlayer,
    teamId: getTeamId(state.seats, currentPlayer),
    phase,
    trumpRank: state.trumpRank,
    privateHand,
    tableLead: tableLead && state.currentRound
      ? {
          player: findLastPlayPlayer(state.currentRound.plays),
          combination: tableLead,
          passCount: countPassesSinceLastPlay(state.currentRound.plays),
        }
      : null,
    publicHistory,
    handCounts,
    playedCardSummary: buildPlayedCardSummary(timeline, state.pool.allCardStates),
    inferences: buildInferenceSummary(state.pool.players),
    legalActions,
    actualActionId: null,
    outcome: null,
    scenarioTags,
  }
}

function getVisibleHandForPlayer(session: GameSession, player: number): AnyCard[] {
  const states = session.getState().pool.allCardStates
  return states
    .filter(state => state.currentHolder === player && state.status === 'in_my_hand')
    .map(state => state.card)
}

function buildPublicHistory(events: GameEvent[]): ResearchPublicEvent[] {
  const actionEvents = events.filter(event => event.type === 'play' || event.type === 'pass' || event.type === 'tribute' || event.type === 'tribute_return')
  const sourceEvents = actionEvents.length > 0
    ? actionEvents
    : events.filter(event => event.type !== 'set_hand')

  return sourceEvents
    .map(event => ({
      eventId: event.id,
      type: event.type,
      player: event.data.player,
      combination: event.data.combination,
    }))
}

function buildHandCounts(
  session: GameSession,
  players: Record<number, PlayerProfile>,
): [number, number, number, number] {
  return [0, 1, 2, 3].map(player => (
    session.simulatedHands?.[player]?.length ?? players[player].handCount
  )) as [number, number, number, number]
}

function generateLegalActions(hand: AnyCard[], tableLead: CardCombination | null): ResearchLegalAction[] {
  const actions: ResearchLegalAction[] = []

  if (tableLead) {
    actions.push({
      actionId: 'pass',
      action: 'pass',
      cards: [],
      combinationType: tableLead.type,
      metadata: { beatsTable: false },
    })
  }

  for (const card of hand) {
    const detection = detectCombination([card])
    if (detection.combinations.length === 0) continue
    const combination = detection.preferred
    const beatsTable = !tableLead || canBeat(combination, tableLead)
    if (!beatsTable) continue

    actions.push({
      actionId: `play-${combination.type}-${cardId(card)}`,
      action: 'play',
      cards: [card],
      combinationType: combination.type,
      metadata: {
        beatsTable,
        usesBomb: false,
        usesWildcard: combination.wildcards.length > 0,
      },
    })
  }

  return actions
}

function getTeamId(seats: { me: number; teammate: number }, player: number): 0 | 1 {
  return player === seats.me || player === seats.teammate ? 0 : 1
}

function findLastPlayPlayer(plays: { player: number; action: 'play' | 'pass' }[]): number {
  const lastPlay = [...plays].reverse().find(play => play.action === 'play')
  return lastPlay?.player ?? -1
}

function countPassesSinceLastPlay(plays: { action: 'play' | 'pass' }[]): number {
  const lastPlayIndex = plays.map((play, index) => play.action === 'play' ? index : -1).filter(index => index >= 0).pop()
  if (lastPlayIndex === undefined) return 0
  return plays.slice(lastPlayIndex + 1).filter(play => play.action === 'pass').length
}

function buildPlayedCardSummary(
  events: GameEvent[],
  allCardStates: { card: AnyCard; isTrump: boolean }[],
): GuandanDecisionPoint['playedCardSummary'] {
  const playEvents = events.filter(event => event.type === 'play')
  const playedCards = playEvents.flatMap(event => event.data.cards ?? [])
  const playedIds = new Set(playedCards.map(card => cardId(card)))
  const trumpPlayed = allCardStates.filter(state => playedIds.has(cardId(state.card)) && state.isTrump).length
  const bombsPlayed = playEvents.filter(event => {
    const type = event.data.combination?.type
    return type === 'bomb' || type === 'joker_bomb'
  }).length
  const bigCardsPlayed = playedCards.filter(card => {
    if (isJoker(card)) return true
    return RANK_ORDER[card.rank] >= 14
  }).length

  return {
    playedCount: playedCards.length,
    trumpPlayed,
    bombsPlayed,
    bigCardsPlayed,
  }
}

function buildInferenceSummary(
  players: Record<number, PlayerProfile>,
): GuandanDecisionPoint['inferences'] {
  return Object.entries(players).flatMap(([player, profile]) =>
    profile.inferences.map(inference => ({
      player: Number(player),
      description: inference.description,
      confidence: inference.confidence,
      type: inference.type,
    })),
  )
}

function buildScenarioTags(
  phase: 'lead' | 'follow',
  handCounts: [number, number, number, number],
  seats: { me: number; teammate: number; opponentA: number; opponentB: number },
  currentPlayer: number,
  legalActions: ResearchLegalAction[],
): ResearchScenarioTag[] {
  const tags: ResearchScenarioTag[] = [phase === 'lead' ? 'lead_opening' : 'follow_beat_or_pass']
  const teammate = currentPlayer === seats.me ? seats.teammate
    : currentPlayer === seats.teammate ? seats.me
      : currentPlayer === seats.opponentA ? seats.opponentB
        : seats.opponentA
  const opponents = currentPlayer === seats.me || currentPlayer === seats.teammate
    ? [seats.opponentA, seats.opponentB]
    : [seats.me, seats.teammate]

  if (handCounts[teammate] <= 2) tags.push('partner_near_finish')
  if (opponents.some(player => handCounts[player] <= 2)) tags.push('opponent_near_finish')
  if (legalActions.some(action => action.metadata?.usesBomb)) tags.push('bomb_decision')
  if (legalActions.some(action => action.metadata?.usesWildcard)) tags.push('wildcard_decision')
  if (handCounts[currentPlayer] <= 2) tags.push('endgame_race')

  return tags
}
