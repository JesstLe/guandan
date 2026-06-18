export type Rank = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2'

export type Suit = 'spade' | 'heart' | 'diamond' | 'club'

export type TrumpRank = Rank

export const ALL_RANKS: Rank[] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2']

export const ALL_SUITS: Suit[] = ['spade', 'heart', 'diamond', 'club']

export const RANK_ORDER: Record<Rank, number> = {
  '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15,
}

export const SUIT_ORDER: Record<Suit, number> = {
  'spade': 4, 'heart': 3, 'diamond': 1, 'club': 2,
}

export interface Card {
  rank: Rank
  suit: Suit
  copyIndex: 1 | 2
  isTrump: boolean
  isRedTrump: boolean
}

export interface JokerCard {
  type: 'small' | 'big'
  copyIndex: 1 | 2
}

export type AnyCard = Card | JokerCard

export function isJoker(card: AnyCard): card is JokerCard {
  return 'type' in card && (card.type === 'small' || card.type === 'big')
}

export function cardId(card: AnyCard): string {
  if (isJoker(card)) {
    return `${card.type}-copy${card.copyIndex}`
  }
  return `${card.suit}-${card.rank}-copy${card.copyIndex}`
}

export type CombinationType =
  | 'single'             // 单张
  | 'pair'               // 对子
  | 'triple'             // 三张（如333，不带）
  | 'triple_with_pair'   // 三带二（三打二，如33344）
  | 'straight'           // 顺子（五张及以上单顺）
  | 'pair_straight'      // 连对（三对及以上，如334455）
  | 'airplane'           // 钢板（两组连续三条，如333444）
  | 'bomb'               // 炸弹（四张及以上同点数）
  | 'same_suit_straight' // 同花顺（同花色五张顺子）
  | 'joker_bomb'         // 天王炸（双大王+双小王）

export interface WildcardEntry {
  card: Card
  substitute: Rank
  substituteSuit?: Suit
}

export interface CardCombination {
  type: CombinationType
  cards: AnyCard[]
  mainRank?: Rank
  isTrump: boolean
  length?: number
  wildcards: WildcardEntry[]
}

export type CompareResult = 'greater' | 'equal' | 'lesser' | 'incomparable'

export type CardStatus =
  | 'in_opponent_hand'
  | 'in_teammate_hand'
  | 'in_my_hand'
  | 'in_play'
  | 'tribute_out'
  | 'tribute_returned'
  | 'archived'

export interface OwnershipInference {
  possibleOwner: number
  probability: number
  evidence: string
  sourceEventId: string
}

export interface PlayHistoryEntry {
  playedBy: number
  playedAtRound: number
  playedInCombo: CardCombination
  timestamp: number
}

export interface TributeHistoryEntry {
  type: 'tribute' | 'tribute_return'
  from: number
  to: number
  round: number
}

export interface CardState {
  card: AnyCard
  id: string
  status: CardStatus
  currentHolder?: number
  playHistory: PlayHistoryEntry[]
  tributeHistory: TributeHistoryEntry[]
  ownershipInferences: OwnershipInference[]
  isTrump: boolean
  isRedTrump: boolean
}

export interface PlayerProfile {
  seat: number
  handCount: number
  playedCards: PlayHistoryEntry[]
  passedRounds: { round: number; againstType: CombinationType }[]
  inferences: PlayerInference[]
}

export interface PlayerInference {
  description: string
  confidence: number
  sourceEventId: string
  type: 'pass_inference' | 'play_inference' | 'count_inference'
}

export interface CardPool {
  total: 108
  trumpRank: TrumpRank
  allCardStates: CardState[]
  players: Record<number, PlayerProfile>
}

export interface Round {
  roundNumber: number
  leadPlayer: number
  leadCombination: CardCombination | null
  plays: RoundPlay[]
  winner: number | null
  windReceiver?: number
  isWindRound: boolean
  playerFinished?: number
}

export interface RoundPlay {
  player: number
  action: 'play' | 'pass'
  cards?: AnyCard[]
  combination?: CardCombination
}

export interface DetectionResult {
  combinations: CardCombination[]
  ambiguous: boolean
  preferred: CardCombination
}

export interface GameMode {
  type: 'single' | 'multi'
  tributeEnabled: boolean
  tripleWithSingle: boolean
  initialTrumpRank: Rank
}

export interface TributeEntry {
  from: number
  to: number
  card: AnyCard | null
  returned: AnyCard | null
  antiTribute: boolean
}

export interface TributeState {
  required: boolean
  tributeType: 'single' | 'double'
  tributes: TributeEntry[]
  phase: 'tribute' | 'return' | 'done' | 'disabled'
}

export type FirstPlayerReason =
  | 'red_heart_trump'
  | 'tribute_side'
  | 'tribute_side_next'
  | 'loser'
  | 'anti_tribute'

export interface GameEvent {
  id: string
  type: 'play' | 'pass' | 'tribute' | 'tribute_return' | 'new_game' | 'set_hand'
  data: EventData
  timestamp: number
  derivedInferences: PlayerInference[]
}

export interface EventData {
  player?: number
  cards?: AnyCard[]
  combination?: CardCombination
  trumpRank?: TrumpRank
  handCards?: AnyCard[]
  gameMode?: GameMode
  seats?: SeatConfig
}

export interface SeatConfig {
  me: number
  teammate: number
  opponentA: number
  opponentB: number
}

export interface WSMessage {
  id: string
  correlationId?: string
  type: string
  timestamp: number
  payload: unknown
}

export interface WSError {
  code: string
  message: string
  detail?: unknown
}

export const ERROR_CODES = {
  VALIDATION_001: '出牌不合法（牌型不合规）',
  VALIDATION_002: '手牌中没有这些牌',
  VALIDATION_003: '无法压过台面牌型',
  VALIDATION_004: '不是你的回合',
  VALIDATION_005: '主牌规则违反',
  VALIDATION_006: '逢人配使用不合法',
  VALIDATION_007: '手牌总数不守恒',
  GAME_001: '游戏会话不存在',
  GAME_002: '游戏已结束',
  AI_001: 'AI 服务不可用',
  AI_002: 'AI 响应超时',
  AI_003: 'AI 建议校验失败',
  TRIBUTE_001: '进贡牌不合规',
  TRIBUTE_002: '还贡牌不合规',
  TRIBUTE_003: '抗贡条件不满足',
} as const

export type ErrorCode = keyof typeof ERROR_CODES

export interface AISuggestion {
  primary: AISuggestionOption
  alternative?: AISuggestionOption
  warnings?: string[]
  isDilemma: boolean
}

export interface AISuggestionOption {
  action: 'play' | 'pass'
  cards: { rank: Rank | 'BJ' | 'SJ'; suit: Suit | 'joker'; copyIndex: 1 | 2 }[]
  combinationType: CombinationType
  wildcards?: WildcardEntry[]
  totalScore: number
  confidence: number
  dimensions: {
    efficiency: number
    situation: number
    inference: number
    control: number
    cooperation: number
    endgame: number
  }
  reasoning: string
}

export interface GameRecord {
  id: string
  date: number
  mode: GameMode
  trumpRank: TrumpRank
  events: GameEvent[]
  result: {
    rankings: [number, number, number, number]
    winner: 'us' | 'them'
    isDoubleDown: boolean
    rankChange: number
  }
  aiSuggestions: { round: number; suggestion: string; adopted: boolean }[]
  crossGameMemory?: {
    opponentStyles: Record<number, string[]>
    opponentPatterns: Record<number, string[]>
  }
}

export type ResearchDecisionPhase = 'lead' | 'follow' | 'tribute' | 'return_tribute' | 'endgame'

export type ResearchScenarioTag =
  | 'lead_opening'
  | 'follow_beat_or_pass'
  | 'partner_near_finish'
  | 'opponent_near_finish'
  | 'bomb_decision'
  | 'wildcard_decision'
  | 'lead_transfer'
  | 'sacrifice_for_partner'
  | 'endgame_race'
  | 'ambiguous_pass_dilemma'

export interface ResearchTableLead {
  player: number
  combination: CardCombination
  passCount: number
}

export interface ResearchPublicEvent {
  eventId: string
  type: GameEvent['type']
  player?: number
  combination?: CardCombination
}

export interface ResearchPlayedCardSummary {
  playedCount: number
  trumpPlayed: number
  bombsPlayed: number
  bigCardsPlayed: number
}

export interface ResearchInference {
  player: number
  description: string
  confidence: number
  type: PlayerInference['type']
}

export interface ResearchLegalAction {
  actionId: string
  action: 'play' | 'pass'
  cards: AnyCard[]
  combinationType: CombinationType
  metadata?: {
    usesBomb?: boolean
    usesWildcard?: boolean
    breaksStructure?: boolean
    beatsTable?: boolean
  }
}

export interface GuandanDecisionPoint {
  schemaVersion: '0.1.0'
  gameId: string
  decisionId: string
  turnIndex: number
  roundNumber?: number
  currentPlayer: number
  teamId: 0 | 1
  phase: ResearchDecisionPhase
  trumpRank: TrumpRank
  privateHand?: AnyCard[]
  tableLead: ResearchTableLead | null
  publicHistory: ResearchPublicEvent[]
  handCounts: [number, number, number, number]
  playedCardSummary: ResearchPlayedCardSummary
  inferences?: ResearchInference[]
  legalActions: ResearchLegalAction[]
  actualActionId?: string | null
  outcome?: {
    winnerTeam?: 0 | 1
    finishOrder?: number[]
    teamScoreDelta?: number
  } | null
  scenarioTags: ResearchScenarioTag[]
}

export interface LLMReasoningTrace {
  schemaVersion: '0.1.0'
  decisionId: string
  agentId: string
  selectedActionId: string
  teamObjective: {
    type:
      | 'gain_lead'
      | 'keep_lead'
      | 'transfer_lead_to_partner'
      | 'protect_partner'
      | 'suppress_opponent'
      | 'save_resources'
      | 'finish_hand'
      | 'minimize_loss'
    explanation: string
  }
  partnerBelief: {
    summary: string
    confidence: number
    evidence: string[]
  }
  opponentBelief: {
    summary: string
    confidence: number
    evidence: string[]
  }
  actionRationale: {
    primaryReason: string
    whyNotAlternatives: { actionId: string; reason: string }[]
  }
  riskAssessment: {
    risks: string[]
    mitigation: string
  }
  confidence: number
  notes?: string
}

export type VerifierLabelStatus = 'pass' | 'fail' | 'unknown' | 'not_applicable'

export interface VerifierCheckLabel {
  status: VerifierLabelStatus
  score: number
  evidence: string[]
}

export interface VerifierIssue {
  code: string
  message: string
  path?: string
}

export interface VerifierResult {
  schemaVersion: '0.1.0'
  decisionId: string
  agentId: string
  selectedActionId: string
  labels: {
    legalAction: VerifierCheckLabel
    beatsTable: VerifierCheckLabel
    publicHistoryConsistent: VerifierCheckLabel
    hiddenInfoDisciplined: VerifierCheckLabel
    partnerConsistent: VerifierCheckLabel
    opponentConsistent: VerifierCheckLabel
    reasonActionConsistent: VerifierCheckLabel
    teamObjectiveValid: VerifierCheckLabel
  }
  hardFailures: VerifierIssue[]
  softWarnings: VerifierIssue[]
  summary: string
}
