import {
  type CardPool, type CardState, type PlayerInference,
  type CardCombination, type CombinationType, type Rank, type AnyCard,
  type PlayerProfile,
  RANK_ORDER, isJoker,
} from '@guandan/shared'

export interface InferenceContext {
  pool: CardPool
  roundNumber: number
  leadCombination: CardCombination | null
  currentPlayer: number
}

export function inferFromPass(
  ctx: InferenceContext,
  player: number,
  againstType: CombinationType,
): PlayerInference[] {
  const inferences: PlayerInference[] = []

  const profile = ctx.pool.players[player]
  profile.passedRounds.push({ round: ctx.roundNumber, againstType })

  inferences.push({
    description: `玩家${player}对${againstType}过牌，可能没有能压过的牌`,
    confidence: 0.6,
    sourceEventId: `pass_${player}_${ctx.roundNumber}`,
    type: 'pass_inference',
  })

  if (againstType === 'single' && ctx.leadCombination) {
    const leadRank = ctx.leadCombination.mainRank
    if (leadRank) {
      const higherRanks = getHigherRanks(leadRank)
      const missingRanks = higherRanks.filter(r => {
        const count = countRemainingByRank(ctx.pool, r, player)
        return count === 0
      })
      if (missingRanks.length > 0) {
        inferences.push({
          description: `玩家${player}过牌，可能缺少${missingRanks.join('/')}等大牌`,
          confidence: 0.4,
          sourceEventId: `pass_${player}_${ctx.roundNumber}`,
          type: 'pass_inference',
        })
      }
    }
  }

  if (againstType === 'bomb' || againstType === 'joker_bomb') {
    inferences.push({
      description: `玩家${player}对炸弹过牌，可能没有更大的炸弹`,
      confidence: 0.7,
      sourceEventId: `pass_${player}_${ctx.roundNumber}`,
      type: 'pass_inference',
    })
  }

  return inferences
}

export function inferFromPlay(
  ctx: InferenceContext,
  player: number,
  combination: CardCombination,
): PlayerInference[] {
  const inferences: PlayerInference[] = []

  if (combination.type === 'bomb' || combination.type === 'joker_bomb') {
    inferences.push({
      description: `玩家${player}使用了炸弹，手牌可能紧张或需要夺回牌权`,
      confidence: 0.5,
      sourceEventId: `play_${player}_${ctx.roundNumber}`,
      type: 'play_inference',
    })
  }

  if (combination.type === 'single' && combination.mainRank) {
    const rankVal = RANK_ORDER[combination.mainRank]
    if (rankVal >= 14) {
      inferences.push({
        description: `玩家${player}出大牌${combination.mainRank}，可能在清牌或控制`,
        confidence: 0.4,
        sourceEventId: `play_${player}_${ctx.roundNumber}`,
        type: 'play_inference',
      })
    }
  }

  if (combination.wildcards.length > 0) {
    inferences.push({
      description: `玩家${player}使用了逢人配，手牌中红桃主牌已消耗`,
      confidence: 0.9,
      sourceEventId: `play_${player}_${ctx.roundNumber}`,
      type: 'play_inference',
    })
  }

  return inferences
}

export function inferFromHandCount(
  ctx: InferenceContext,
  player: number,
): PlayerInference[] {
  const inferences: PlayerInference[] = []
  const handCount = ctx.pool.players[player].handCount

  if (handCount <= 2) {
    inferences.push({
      description: `玩家${player}仅剩${handCount}张牌，即将出完`,
      confidence: 0.9,
      sourceEventId: `count_${player}_${ctx.roundNumber}`,
      type: 'count_inference',
    })
  }

  if (handCount === 0) {
    inferences.push({
      description: `玩家${player}已出完所有牌`,
      confidence: 1.0,
      sourceEventId: `count_${player}_${ctx.roundNumber}`,
      type: 'count_inference',
    })
  }

  return inferences
}

function getHigherRanks(rank: Rank): Rank[] {
  const val = RANK_ORDER[rank]
  return Object.entries(RANK_ORDER)
    .filter(([, v]) => v > val)
    .map(([r]) => r as Rank)
}

function countRemainingByRank(pool: CardPool, rank: Rank, excludePlayer: number): number {
  return pool.allCardStates.filter(s => {
    if (isJoker(s.card)) return false
    if (s.card.rank !== rank) return false
    if (s.status === 'in_play' || s.status === 'archived') return false
    if (s.status === 'in_my_hand' && excludePlayer === 0) return false
    return true
  }).length
}
