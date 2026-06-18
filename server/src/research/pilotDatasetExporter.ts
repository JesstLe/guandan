import {
  mkdirSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import {
  type AnyCard,
  type GameMode,
  type GuandanDecisionPoint,
  type Rank,
  type ResearchScenarioTag,
  type SeatConfig,
  type Suit,
} from '@guandan/shared'
import { GameSession, type GameState } from '../engine/gameSession'
import { exportDecisionPoint } from './decisionPointExporter'

export interface GeneratePilotDecisionDatasetOptions {
  targetCount: number
  gameIdPrefix?: string
}

export interface WritePilotDecisionDatasetOptions extends GeneratePilotDecisionDatasetOptions {
  outputDir: string
}

export interface PilotDatasetCoverage {
  totalDecisionPoints: number
  scenarioTags: ResearchScenarioTag[]
}

export interface PilotDecisionDataset {
  schemaVersion: '0.1.0'
  decisions: GuandanDecisionPoint[]
  coverage: PilotDatasetCoverage
}

export interface PilotDatasetWriteResult {
  manifestPath: string
  decisionPaths: string[]
  dataset: PilotDecisionDataset
}

type ScenarioFactory = (gameId: string) => GuandanDecisionPoint

const mode: GameMode = {
  type: 'single',
  tributeEnabled: false,
  tripleWithSingle: false,
  initialTrumpRank: '7',
}

const seats: SeatConfig = { me: 0, teammate: 2, opponentA: 1, opponentB: 3 }

export function generatePilotDecisionDataset(
  options: GeneratePilotDecisionDatasetOptions,
): PilotDecisionDataset {
  const gameIdPrefix = options.gameIdPrefix ?? 'research-pilot'
  const scenarios: ScenarioFactory[] = [
    createLeadOpeningDecision,
    createFollowDecision,
    createPartnerNearFinishDecision,
    createOpponentNearFinishDecision,
    createEndgameRaceDecision,
  ]

  const decisions = Array.from({ length: options.targetCount }, (_, index) => {
    const gameId = `${gameIdPrefix}-${index.toString().padStart(3, '0')}`
    return scenarios[index % scenarios.length](gameId)
  })

  return {
    schemaVersion: '0.1.0',
    decisions,
    coverage: {
      totalDecisionPoints: decisions.length,
      scenarioTags: collectScenarioTags(decisions),
    },
  }
}

export function writePilotDecisionDataset(
  options: WritePilotDecisionDatasetOptions,
): PilotDatasetWriteResult {
  const dataset = generatePilotDecisionDataset(options)
  const decisionsDir = join(options.outputDir, 'decisions')

  mkdirSync(decisionsDir, { recursive: true })

  const decisionPaths = dataset.decisions.map(decision => {
    const filename = `${safeFilename(decision.decisionId)}.json`
    const path = join(decisionsDir, filename)
    writeJson(path, decision)
    return path
  })

  const manifestPath = join(options.outputDir, 'manifest.json')
  writeJson(manifestPath, {
    schemaVersion: dataset.schemaVersion,
    generatedBy: 'server/src/research/pilotDatasetExporter.ts',
    datasetConstruction: 'controlled_game_session_states',
    sourceDescription: 'Deterministic scenario templates instantiated through the local GameSession engine; not sampled from logged human games.',
    totalDecisionPoints: dataset.coverage.totalDecisionPoints,
    scenarioTags: dataset.coverage.scenarioTags,
    decisionFiles: decisionPaths.map(path => path.replace(`${options.outputDir}/`, '')),
  })

  return { manifestPath, decisionPaths, dataset }
}

function createLeadOpeningDecision(gameId: string): GuandanDecisionPoint {
  const session = sessionWithHands([
    [card('3', 'spade', 1), card('4', 'spade', 1), card('5', 'spade', 1), card('6', 'spade', 1)],
    [card('8', 'spade', 1), card('9', 'spade', 1), card('10', 'spade', 1)],
    [card('J', 'spade', 1), card('Q', 'spade', 1), card('K', 'spade', 1)],
    [card('A', 'spade', 1), card('2', 'spade', 1), { type: 'small', copyIndex: 1 }],
  ])
  return exportDecisionPoint(session, { gameId })
}

function createFollowDecision(gameId: string): GuandanDecisionPoint {
  const three = card('3', 'heart', 1)
  const session = sessionWithHands([
    [three, card('5', 'heart', 1), card('6', 'heart', 1)],
    [card('4', 'heart', 1), card('9', 'heart', 1), card('10', 'heart', 1)],
    [card('J', 'heart', 1), card('Q', 'heart', 1), card('K', 'heart', 1)],
    [card('A', 'heart', 1), card('2', 'heart', 1), { type: 'big', copyIndex: 1 }],
  ])
  session.play(0, [three])
  syncHandCounts(session)
  return exportDecisionPoint(session, { gameId })
}

function createPartnerNearFinishDecision(gameId: string): GuandanDecisionPoint {
  const session = sessionWithHands([
    [card('3', 'diamond', 1), card('4', 'diamond', 1), card('5', 'diamond', 1), card('6', 'diamond', 1)],
    [card('8', 'diamond', 1), card('9', 'diamond', 1), card('10', 'diamond', 1)],
    [card('A', 'diamond', 1), card('2', 'diamond', 1)],
    [card('J', 'diamond', 1), card('Q', 'diamond', 1), card('K', 'diamond', 1)],
  ])
  return exportDecisionPoint(session, { gameId })
}

function createOpponentNearFinishDecision(gameId: string): GuandanDecisionPoint {
  const session = sessionWithHands([
    [card('3', 'club', 1), card('4', 'club', 1), card('5', 'club', 1), card('6', 'club', 1)],
    [card('A', 'club', 1), card('2', 'club', 1)],
    [card('8', 'club', 1), card('9', 'club', 1), card('10', 'club', 1)],
    [card('J', 'club', 1), card('Q', 'club', 1), card('K', 'club', 1)],
  ])
  return exportDecisionPoint(session, { gameId })
}

function createEndgameRaceDecision(gameId: string): GuandanDecisionPoint {
  const session = sessionWithHands([
    [card('A', 'spade', 2), card('2', 'spade', 2)],
    [card('3', 'heart', 2), card('4', 'heart', 2), card('5', 'heart', 2)],
    [card('6', 'heart', 2), card('8', 'heart', 2), card('9', 'heart', 2)],
    [card('10', 'heart', 2), card('J', 'heart', 2), card('Q', 'heart', 2)],
  ])
  return exportDecisionPoint(session, { gameId })
}

function sessionWithHands(hands: [AnyCard[], AnyCard[], AnyCard[], AnyCard[]]): GameSession {
  const session = new GameSession()
  session.startGame(mode, seats, hands[0])
  session.simulatedHands = {
    0: [...hands[0]],
    1: [...hands[1]],
    2: [...hands[2]],
    3: [...hands[3]],
  }
  syncHandCounts(session)
  return session
}

function syncHandCounts(session: GameSession): void {
  if (!session.simulatedHands) return
  const state = session.getState() as GameState
  for (const player of [0, 1, 2, 3] as const) {
    state.pool.players[player].handCount = session.simulatedHands[player]?.length ?? 0
  }
}

function collectScenarioTags(decisions: GuandanDecisionPoint[]): ResearchScenarioTag[] {
  const tags = new Set<ResearchScenarioTag>()
  for (const decision of decisions) {
    for (const tag of decision.scenarioTags) {
      tags.add(tag)
    }
  }
  return [...tags].sort()
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function safeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function card(rank: Rank, suit: Suit, copyIndex: 1 | 2): AnyCard {
  return {
    rank,
    suit,
    copyIndex,
    isTrump: rank === mode.initialTrumpRank,
    isRedTrump: rank === mode.initialTrumpRank && suit === 'heart',
  }
}
