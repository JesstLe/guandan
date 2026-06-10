import {
  type AnyCard, type Card, type CardPool, type CardCombination,
  type GameMode, type Round, type RoundPlay, type TrumpRank,
  type SeatConfig, type TributeState, type FirstPlayerReason,
  type Rank, type GameEvent,
  RANK_ORDER, isJoker, cardId,
} from '@guandan/shared'
import { createCardPool, setMyHand, setOtherPlayersHandCount, playCards as poolPlayCards, verifyCardCount, createFullDeck } from './cardPool'
import { detectCombination } from './combinationDetector'
import { canBeat } from './combinationCompare'
import { inferFromPass, inferFromPlay, inferFromHandCount, type InferenceContext } from './inference'
import { Timeline } from './timeline'

export type GamePhase =
  | 'waiting'
  | 'dealing'
  | 'tribute'
  | 'tribute_return'
  | 'playing'
  | 'round_end'
  | 'game_over'

export interface GameResult {
  type: 'double_down' | 'single_down'
  winner: 'us' | 'them'
}

export interface GameState {
  phase: GamePhase
  mode: GameMode
  trumpRank: TrumpRank
  seats: SeatConfig
  pool: CardPool
  currentRound: Round | null
  rounds: Round[]
  roundNumber: number
  currentPlayer: number
  finishedPlayers: number[]
  tributeState: TributeState
  firstPlayerReason: FirstPlayerReason | null
  gameResult: GameResult | null
}

export class GameSession {
  private state: GameState
  private timeline: Timeline
  public simulatedHands?: Record<number, AnyCard[]>

  constructor() {
    this.timeline = new Timeline()
    this.state = this.createInitialState()
  }

  private createInitialState(): GameState {
    return {
      phase: 'waiting',
      mode: { type: 'single', tributeEnabled: false, tripleWithSingle: false, initialTrumpRank: '7' },
      trumpRank: '7',
      seats: { me: 0, teammate: 2, opponentA: 1, opponentB: 3 },
      pool: createCardPool('7'),
      currentRound: null,
      rounds: [],
      roundNumber: 0,
      currentPlayer: 0,
      finishedPlayers: [],
      tributeState: { required: false, tributeType: 'single', tributes: [], phase: 'disabled' },
      firstPlayerReason: null,
      gameResult: null,
    }
  }

  getState(): Readonly<GameState> {
    return this.state
  }

  getTimeline(): Readonly<Timeline> {
    return this.timeline
  }

  startGame(mode: GameMode, seats: SeatConfig, handCards: AnyCard[]): GameEvent {
    const trumpRank = mode.initialTrumpRank
    const pool = createCardPool(trumpRank)

    const fullDeck = createFullDeck()
    let finalHandCards = [...handCards]

    // 如果未指定手牌（或为空），则自动为 4 位玩家随机发满 27 张牌
    if (!finalHandCards || finalHandCards.length === 0) {
      const deck = [...fullDeck]
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]]
      }
      const h0 = deck.slice(0, 27)
      const h1 = deck.slice(27, 54)
      const h2 = deck.slice(54, 81)
      const h3 = deck.slice(81, 108)
      finalHandCards = h0
      this.simulatedHands = { 0: [...h0], 1: [...h1], 2: [...h2], 3: [...h3] }
    } else {
      // 否则将玩家手牌提取，并在剩下的 81 张牌中随机分发给另外 3 个玩家
      const remainingCards = [...fullDeck]
      for (const myCard of finalHandCards) {
        const idx = remainingCards.findIndex(c => cardId(c) === cardId(myCard))
        if (idx !== -1) {
          remainingCards.splice(idx, 1)
        }
      }
      for (let i = remainingCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remainingCards[i], remainingCards[j]] = [remainingCards[j], remainingCards[i]]
      }
      const h1 = remainingCards.slice(0, 27)
      const h2 = remainingCards.slice(27, 54)
      const h3 = remainingCards.slice(54, 81)
      this.simulatedHands = { 0: [...finalHandCards], 1: h1, 2: h2, 3: h3 }
    }

    setMyHand(pool, finalHandCards)
    setOtherPlayersHandCount(pool, seats)

    this.state = {
      ...this.state,
      phase: mode.tributeEnabled ? 'tribute' : 'playing',
      mode,
      trumpRank,
      seats,
      pool,
      roundNumber: 1,
      currentPlayer: this.determineFirstPlayer(pool, trumpRank),
      firstPlayerReason: 'red_heart_trump',
      tributeState: mode.tributeEnabled
        ? { required: true, tributeType: 'single', tributes: [], phase: 'tribute' }
        : { required: false, tributeType: 'single', tributes: [], phase: 'disabled' },
    }

    this.startNewRound(this.state.currentPlayer)

    const event = this.timeline.push('new_game', {
      trumpRank,
      gameMode: mode,
      seats,
      handCards: [...finalHandCards],
    })

    return event
  }

  play(player: number, cards: AnyCard[]): { event: GameEvent; combination: CardCombination } | { error: string } {
    if (this.state.phase !== 'playing') {
      return { error: '当前不是出牌阶段' }
    }
    if (player !== this.state.currentPlayer) {
      return { error: '不是你的回合' }
    }

    const detection = detectCombination(cards)
    if (detection.combinations.length === 0) {
      return { error: '无法识别合法牌型' }
    }

    const combination = detection.preferred

    // 获取当前回合中最新的、最大的出牌组合，用于大小校验比对基准
    const highestCombo = getHighestCombination(this.state.currentRound)

    if (this.state.currentRound && highestCombo) {
      if (combination.type !== highestCombo.type) {
        if (!isBombType(combination.type)) {
          return { error: '牌型与台面不一致，且非炸弹/同花顺' }
        }
      }
      if (combination.type === highestCombo.type && !canBeat(combination, highestCombo)) {
        return { error: '出牌无法压过台面' }
      }
    }

    poolPlayCards(this.state.pool, player, cards, this.state.roundNumber)

    // 在模拟手牌中扣除已出掉的牌
    if (this.simulatedHands && this.simulatedHands[player]) {
      const hand = this.simulatedHands[player]
      for (const card of cards) {
        const idx = hand.findIndex(c => cardId(c) === cardId(card))
        if (idx !== -1) {
          hand.splice(idx, 1)
        }
      }
    }

    if (this.state.currentRound) {
      const play: RoundPlay = { player, action: 'play', cards, combination }
      this.state.currentRound.plays.push(play)

      if (!this.state.currentRound.leadCombination) {
        this.state.currentRound.leadCombination = combination
        this.state.currentRound.leadPlayer = player
      }
    }

    const ctx: InferenceContext = {
      pool: this.state.pool,
      roundNumber: this.state.roundNumber,
      // 使用出牌前那一手最大的牌型作为推理上下文
      leadCombination: highestCombo ?? null,
      currentPlayer: this.state.currentPlayer,
    }
    const playInferences = inferFromPlay(ctx, player, combination)
    this.state.pool.players[player].inferences.push(...playInferences)

    const handCount = this.state.pool.players[player].handCount
    if (handCount === 0) {
      this.state.finishedPlayers.push(player)
      if (this.state.currentRound) {
        this.state.currentRound.playerFinished = player
      }
    }

    const event = this.timeline.push('play', {
      player,
      cards,
      combination,
    })

    this.advanceAfterPlay(player)

    return { event, combination }
  }

  pass(player: number): GameEvent | { error: string } {
    if (this.state.phase !== 'playing') {
      return { error: '当前不是出牌阶段' }
    }
    if (player !== this.state.currentPlayer) {
      return { error: '不是你的回合' }
    }
    if (this.state.currentRound) {
      // 首出不能过牌校验（以当前台面是否有牌为准）
      const highestCombo = getHighestCombination(this.state.currentRound)
      if (!highestCombo) {
        return { error: '首出不能过牌' }
      }

      const againstType = highestCombo.type
      const play: RoundPlay = { player, action: 'pass' }
      this.state.currentRound.plays.push(play)

      const ctx: InferenceContext = {
        pool: this.state.pool,
        roundNumber: this.state.roundNumber,
        leadCombination: highestCombo,
        currentPlayer: this.state.currentPlayer,
      }
      const passInferences = inferFromPass(ctx, player, againstType)
      this.state.pool.players[player].inferences.push(...passInferences)
    }

    const event = this.timeline.push('pass', { player })

    this.advanceAfterPass(player)

    return event
  }

  undo(): GameEvent | null {
    const lastEvent = this.timeline.undo()
    if (!lastEvent) return null

    this.rebuildState()
    return lastEvent
  }

  setHand(cards: AnyCard[]): GameEvent {
    setMyHand(this.state.pool, cards)
    return this.timeline.push('set_hand', { handCards: cards, player: 0 })
  }

  private determineFirstPlayer(pool: CardPool, trumpRank: TrumpRank): number {
    for (const state of pool.allCardStates) {
      if (!isJoker(state.card) && state.card.rank === trumpRank && state.card.suit === 'heart' && state.status === 'in_my_hand') {
        return 0
      }
    }
    return 0
  }

  private startNewRound(leadPlayer: number): void {
    this.state.currentRound = {
      roundNumber: this.state.roundNumber,
      leadPlayer,
      leadCombination: null,
      plays: [],
      winner: null,
      isWindRound: false,
    }
  }

  private advanceAfterPlay(player: number): void {
    if (this.state.finishedPlayers.length >= 2) {
      this.checkGameEnd()
      return
    }

    // 牌出完时不立即进行接风结算，而是让当前回合继续比拼大小，直到大家都过牌
    this.advanceToNextPlayer()
  }

  private advanceAfterPass(player: number): void {
    if (!this.state.currentRound) return

    const activePlayers = this.getActivePlayers()
    const plays = this.state.currentRound.plays
    const lastPlayIdx = plays.map((p, i) => p.action === 'play' ? i : -1).filter(i => i >= 0).pop()
    const passesSinceLastPlay = lastPlayIdx !== undefined
      ? plays.slice(lastPlayIdx + 1).filter(p => p.action === 'pass').length
      : plays.filter(p => p.action === 'pass').length

    // 如果除最后出牌者外的所有活跃玩家都选择过牌，则本轮牌局结束
    if (passesSinceLastPlay >= activePlayers.length - 1) {
      const lastPlay = [...plays].reverse().find(p => p.action === 'play')
      if (lastPlay) {
        const winner = lastPlay.player
        const isWinnerFinished = this.state.finishedPlayers.includes(winner)

        this.state.currentRound.winner = winner

        if (isWinnerFinished) {
          // 接风：赢家已经出完所有牌，下一轮首出权交予其队友
          const teammate = this.getTeammate(winner)
          this.state.currentRound.windReceiver = teammate
          this.state.currentRound.isWindRound = true

          this.state.rounds.push({ ...this.state.currentRound })
          this.state.roundNumber++
          this.startNewRound(teammate)
          this.state.currentPlayer = teammate
        } else {
          // 正常结算：赢家获得下一轮首出权
          this.state.rounds.push({ ...this.state.currentRound })
          this.state.roundNumber++
          this.startNewRound(winner)
          this.state.currentPlayer = winner
        }
        return
      }
    }

    this.advanceToNextPlayer()
  }

  private advanceToNextPlayer(): void {
    const activePlayers = this.getActivePlayers()
    const currentIdx = activePlayers.indexOf(this.state.currentPlayer)
    const nextIdx = (currentIdx + 1) % activePlayers.length
    this.state.currentPlayer = activePlayers[nextIdx]
  }

  private getActivePlayers(): number[] {
    const allPlayers = [0, 1, 2, 3]
    return allPlayers.filter(p => !this.state.finishedPlayers.includes(p))
  }

  private getTeammate(player: number): number {
    if (player === this.state.seats.me) return this.state.seats.teammate
    if (player === this.state.seats.teammate) return this.state.seats.me
    if (player === this.state.seats.opponentA) return this.state.seats.opponentB
    return this.state.seats.opponentA
  }

  private checkGameEnd(): void {
    if (this.state.finishedPlayers.length < 2) return

    const first = this.state.finishedPlayers[0]
    const second = this.state.finishedPlayers[1]
    const firstTeam = this.getPlayerTeam(first)
    const secondTeam = this.getPlayerTeam(second)

    if (firstTeam === secondTeam) {
      this.state.phase = 'game_over'
      this.state.gameResult = { type: 'double_down', winner: firstTeam }
    } else {
      this.state.phase = 'game_over'
      this.state.gameResult = { type: 'single_down', winner: firstTeam }
    }
  }

  private getPlayerTeam(player: number): 'us' | 'them' {
    if (player === this.state.seats.me || player === this.state.seats.teammate) return 'us'
    return 'them'
  }

  private rebuildState(): void {
    const savedMode = this.state.mode
    const savedSeats = this.state.seats
    this.state = this.createInitialState()
    this.state.mode = savedMode
    this.state.seats = savedSeats

    for (const event of this.timeline.all) {
      this.applyEvent(event)
    }
  }

  private applyEvent(event: GameEvent): void {
    switch (event.type) {
      case 'new_game': {
        const { trumpRank, gameMode, seats, handCards } = event.data
        if (!trumpRank || !gameMode || !seats || !handCards) break
        const pool = createCardPool(trumpRank)
        setMyHand(pool, handCards)
        setOtherPlayersHandCount(pool, seats)
        this.state.phase = gameMode.tributeEnabled ? 'tribute' : 'playing'
        this.state.mode = gameMode
        this.state.trumpRank = trumpRank
        this.state.seats = seats
        this.state.pool = pool
        this.state.roundNumber = 1
        this.state.currentPlayer = this.determineFirstPlayer(pool, trumpRank)
        this.state.finishedPlayers = []
        this.state.gameResult = null
        this.startNewRound(this.state.currentPlayer)
        break
      }
      case 'play': {
        const { player, cards, combination } = event.data
        if (player === undefined || !cards || !combination) break
        poolPlayCards(this.state.pool, player, cards, this.state.roundNumber)
        
        const round = this.state.currentRound
        if (round) {
          round.plays.push({ player, action: 'play', cards, combination })
          if (!round.leadCombination) {
            round.leadCombination = combination
            round.leadPlayer = player
          }
          // 获取该出牌前（即刚刚推入的这手牌之前）桌面上最大的牌型作为推理基准
          const playsBefore = round.plays.slice(0, -1)
          const lastPlay = [...playsBefore].reverse().find(p => p.action === 'play')
          const prevHighestCombo = lastPlay?.combination ?? null

          const ctx: InferenceContext = {
            pool: this.state.pool,
            roundNumber: this.state.roundNumber,
            leadCombination: prevHighestCombo,
            currentPlayer: this.state.currentPlayer,
          }
          this.state.pool.players[player].inferences.push(...inferFromPlay(ctx, player, combination))
        }

        if (this.state.pool.players[player].handCount === 0) {
          this.state.finishedPlayers.push(player)
        }
        break
      }
      case 'pass': {
        const { player } = event.data
        if (player === undefined) break
        
        const round = this.state.currentRound
        if (round) {
          // 在推入 pass 动作前，获取当前桌面上最大的牌型组合
          const lastPlay = [...round.plays].reverse().find(p => p.action === 'play')
          const prevHighestCombo = lastPlay?.combination ?? null
          
          round.plays.push({ player, action: 'pass' })
          
          if (prevHighestCombo) {
            const ctx: InferenceContext = {
              pool: this.state.pool,
              roundNumber: this.state.roundNumber,
              leadCombination: prevHighestCombo,
              currentPlayer: this.state.currentPlayer,
            }
            this.state.pool.players[player].inferences.push(...inferFromPass(ctx, player, prevHighestCombo.type))
          }
        }
        break
      }
      case 'set_hand': {
        const { handCards } = event.data
        if (handCards) setMyHand(this.state.pool, handCards)
        break
      }
    }
  }

  verifyState(): { valid: boolean; detail: string } {
    return verifyCardCount(this.state.pool)
  }

  // 动态以指定玩家的视角构建结构化状态（用于 AI 决策）
  getStructuredStateForPlayer(player: number): any {
    const pool = this.state.pool
    if (!this.simulatedHands) return null

    // 1. 保存当前所有牌的真实状态与持有权
    const originalStatuses = pool.allCardStates.map(s => ({
      id: s.id,
      status: s.status,
      currentHolder: s.currentHolder,
    }))

    // 2. 根据该玩家的视角动态映射手牌状态
    const mySeat = player
    const teammateSeat = this.getTeammate(player)
    const hands = this.simulatedHands

    const activeHandIds = new Set(hands[mySeat].map(c => cardId(c)))
    const teammateHandIds = new Set(hands[teammateSeat].map(c => cardId(c)))

    for (const state of pool.allCardStates) {
      if (state.status === 'in_play' || state.status === 'archived') {
        continue
      }
      if (activeHandIds.has(state.id)) {
        state.status = 'in_my_hand'
        state.currentHolder = mySeat
      } else if (teammateHandIds.has(state.id)) {
        state.status = 'in_teammate_hand'
        state.currentHolder = teammateSeat
      } else {
        state.status = 'in_opponent_hand'
        state.currentHolder = (mySeat + 1) % 4
      }
    }

    // 3. 构建临时状态
    const { buildStructuredState } = require('../ai/stateBuilder')
    const structuredState = buildStructuredState(
      pool,
      this.state.trumpRank,
      mySeat,
      teammateSeat,
      this.state.currentRound,
      this.state.rounds,
      this.state.finishedPlayers,
    )

    // 4. 恢复原有状态机的数据，避免污染真实推断与记牌器
    for (let i = 0; i < pool.allCardStates.length; i++) {
      pool.allCardStates[i].status = originalStatuses[i].status
      pool.allCardStates[i].currentHolder = originalStatuses[i].currentHolder
    }

    return structuredState
  }
}

// 获取当前回合中最新的且最大的出牌组合（未被过牌清空）
export function getHighestCombination(round: Round | null): CardCombination | null {
  if (!round) return null
  const plays = round.plays
  const lastPlay = [...plays].reverse().find(p => p.action === 'play')
  return lastPlay?.combination ?? null
}

function isBombType(type: CardCombination['type']): boolean {
  return type === 'joker_bomb' || type === 'bomb' || type === 'same_suit_straight'
}
