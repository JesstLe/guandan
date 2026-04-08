import {
  type AnyCard, type Card, type CardPool, type CardCombination,
  type GameMode, type Round, type RoundPlay, type TrumpRank,
  type SeatConfig, type TributeState, type FirstPlayerReason,
  type Rank, type GameEvent,
  RANK_ORDER, isJoker, cardId,
} from '@guandan/shared'
import { createCardPool, setMyHand, playCards as poolPlayCards, verifyCardCount } from './cardPool'
import { detectCombination } from './combinationDetector'
import { canBeat } from './combinationCompare'
import { Timeline } from './timeline'

export type GamePhase =
  | 'waiting'
  | 'dealing'
  | 'tribute'
  | 'tribute_return'
  | 'playing'
  | 'round_end'
  | 'game_over'

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
}

export class GameSession {
  private state: GameState
  private timeline: Timeline

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
    setMyHand(pool, handCards)

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
      handCards,
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

    if (this.state.currentRound && this.state.currentRound.leadCombination) {
      if (combination.type !== this.state.currentRound.leadCombination.type) {
        if (!isBombType(combination.type)) {
          return { error: '牌型与台面不一致，且非炸弹/同花顺' }
        }
      }
      if (combination.type === this.state.currentRound.leadCombination.type && !canBeat(combination, this.state.currentRound.leadCombination)) {
        return { error: '出牌无法压过台面' }
      }
    }

    poolPlayCards(this.state.pool, player, cards, this.state.roundNumber)

    if (this.state.currentRound) {
      const play: RoundPlay = { player, action: 'play', cards, combination }
      this.state.currentRound.plays.push(play)

      if (!this.state.currentRound.leadCombination) {
        this.state.currentRound.leadCombination = combination
        this.state.currentRound.leadPlayer = player
      }
    }

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
    if (this.state.currentRound && !this.state.currentRound.leadCombination) {
      return { error: '首出不能过牌' }
    }

    if (this.state.currentRound) {
      const play: RoundPlay = { player, action: 'pass' }
      this.state.currentRound.plays.push(play)
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
      if (!isJoker(state.card) && state.card.rank === trumpRank && state.card.suit === 'heart') {
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

    if (this.state.currentRound?.playerFinished !== undefined) {
      const finishedPlayer = this.state.currentRound.playerFinished
      const teammate = this.getTeammate(finishedPlayer)
      this.state.currentRound.winner = finishedPlayer
      this.state.currentRound.windReceiver = teammate
      this.state.currentRound.isWindRound = true
      this.state.rounds.push({ ...this.state.currentRound })
      this.state.roundNumber++
      this.startNewRound(teammate)
      this.state.currentPlayer = teammate
      return
    }

    this.advanceToNextPlayer()
  }

  private advanceAfterPass(player: number): void {
    if (!this.state.currentRound) return

    const activePlayers = this.getActivePlayers()
    const passCount = this.state.currentRound.plays.filter(
      p => p.action === 'pass'
    ).length

    const playCount = this.state.currentRound.plays.filter(
      p => p.action === 'play'
    ).length

    if (playCount > 0 && passCount >= activePlayers.length - 1) {
      const lastPlay = [...this.state.currentRound.plays].reverse().find(p => p.action === 'play')
      if (lastPlay) {
        this.state.currentRound.winner = lastPlay.player
        this.state.rounds.push({ ...this.state.currentRound })
        this.state.roundNumber++
        this.startNewRound(lastPlay.player)
        this.state.currentPlayer = lastPlay.player
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
    } else {
      this.state.phase = 'game_over'
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
        this.state.phase = gameMode.tributeEnabled ? 'tribute' : 'playing'
        this.state.mode = gameMode
        this.state.trumpRank = trumpRank
        this.state.seats = seats
        this.state.pool = pool
        this.state.roundNumber = 1
        this.state.currentPlayer = 0
        this.state.finishedPlayers = []
        this.startNewRound(0)
        break
      }
      case 'play': {
        const { player, cards, combination } = event.data
        if (player === undefined || !cards || !combination) break
        poolPlayCards(this.state.pool, player, cards, this.state.roundNumber)
        if (this.state.currentRound) {
          this.state.currentRound.plays.push({ player, action: 'play', cards, combination })
          if (!this.state.currentRound.leadCombination) {
            this.state.currentRound.leadCombination = combination
            this.state.currentRound.leadPlayer = player
          }
        }
        if (this.state.pool.players[player].handCount === 0) {
          this.state.finishedPlayers.push(player)
        }
        break
      }
      case 'pass': {
        const { player } = event.data
        if (player === undefined) break
        if (this.state.currentRound) {
          this.state.currentRound.plays.push({ player, action: 'pass' })
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
}

function isBombType(type: CardCombination['type']): boolean {
  return type === 'joker_bomb' || type === 'bomb' || type === 'same_suit_straight'
}
