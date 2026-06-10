import {
  type TrumpRank, type Rank, type Suit, type CombinationType,
  RANK_ORDER,
} from '@guandan/shared'
import type { StructuredState } from './stateBuilder'
import type { CompressedHistory } from './historyCompressor'

const SUIT_SYMBOL: Record<Suit, string> = {
  spade: '♠', heart: '♥', diamond: '♦', club: '♣',
}

const RANK_DISPLAY: Record<string, string> = {
  '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  '10': '10', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A', '2': '2',
}

export function buildPrompt(
  state: StructuredState,
  history: CompressedHistory,
  question: string,
): string {
  const sections: string[] = []

  sections.push(buildSystemPrompt())
  sections.push(buildGameStateSection(state))
  sections.push(buildMyHandSection(state))
  sections.push(buildOpponentsSection(state))
  sections.push(buildTableSection(state))
  sections.push(buildHistorySection(history))
  sections.push(buildInferenceSection(state))
  sections.push(buildQuestionSection(question))

  return sections.join('\n\n')
}

function buildSystemPrompt(): string {
  return `你是掼蛋AI出牌顾问。根据当前牌局状态，给出最优出牌建议。

规则要点：
- 2副牌108张，4人游戏，对家为队友
- 主牌（级牌）大于普通牌，红桃主牌为逢人配（可替代任意非王牌）
- 牌型：单张、对子、三带二、三带一、三连对、飞机、顺子、连对、炸弹、同花顺、天王炸
- 炸弹和同花顺可以压任何非炸弹牌型
- 同类型牌型只能用同类型且更大的压
- 目标：己方先出完牌，争取双下（1、2名）

输出格式（严格JSON）：
{
  "primary": {
    "action": "play" | "pass",
    "cards": [{"rank": "8", "suit": "spade", "copyIndex": 1}],
    "combinationType": "pair",
    "wildcards": [],
    "totalScore": 0.75,
    "confidence": 0.8,
    "dimensions": {
      "efficiency": 0.7,
      "situation": 0.8,
      "inference": 0.6,
      "control": 0.5,
      "cooperation": 0.7,
      "endgame": 0.4
    },
    "reasoning": "出牌理由"
  },
  "alternative": { ... },
  "warnings": ["风险提示"],
  "isDilemma": false
}`
}

function buildGameStateSection(state: StructuredState): string {
  return `## 当前牌局状态
- 主牌等级: ${state.trumpRank}
- 当前轮次: ${state.roundInfo.roundNumber}
- 已出完玩家: ${state.roundInfo.finishedPlayers.length > 0 ? state.roundInfo.finishedPlayers.join(', ') : '无'}
- 是否接风轮: ${state.roundInfo.isWindRound ? '是' : '否'}
- 主牌已出: ${state.playedCards.trumpPlayed}张 / 剩余: ${state.playedCards.trumpRemaining}张
- 已出炸弹: ${state.playedCards.bombsPlayed}个
- 已出大牌(A/2/王): ${state.playedCards.bigCardsPlayed}张`
}

function buildMyHandSection(state: StructuredState): string {
  const cards = state.myHand.cards
    .sort((a, b) => {
      const rankVal = (r: string) => {
        if (r === 'BJ') return 200
        if (r === 'SJ') return 199
        return (RANK_ORDER as Record<string, number>)[r] ?? 0
      }
      const aVal = a.isTrump ? 100 + rankVal(a.rank) : rankVal(a.rank)
      const bVal = b.isTrump ? 100 + rankVal(b.rank) : rankVal(b.rank)
      return bVal - aVal
    })
    .map(c => {
      if (c.rank === 'BJ') return '大王'
      if (c.rank === 'SJ') return '小王'
      const trump = c.isTrump ? '[主]' : ''
      const wildcard = c.isRedTrump ? '[逢人配]' : ''
      return `${SUIT_SYMBOL[c.suit as Suit]}${c.rank}${trump}${wildcard}`
    })
    .join(' ')

  return `## 我的手牌 (${state.myHand.totalCards}张)
${cards}
${state.myHand.hasWildcard ? '⚠️ 手中有逢人配（红桃主牌）' : ''}
${state.myHand.hasBomb ? '✅ 手中有炸弹' : ''}`
}

function buildOpponentsSection(state: StructuredState): string {
  const lines: string[] = ['## 对手/队友信息']

  for (const opp of state.opponents) {
    lines.push(`- 玩家${opp.seat}(对手): 剩余${opp.handCount}张 | 激进度${(opp.style.aggression * 100).toFixed(0)}% | 炸弹倾向${(opp.style.bombTendency * 100).toFixed(0)}% | 弱点: ${opp.weakRanks.join('/') || '未知'}`)
  }

  const tm = state.teammate
  lines.push(`- 玩家${tm.seat}(队友): 剩余${tm.handCount}张 | 激进度${(tm.style.aggression * 100).toFixed(0)}% | 近期出牌: ${tm.recentPlays.join(', ') || '无'}`)

  return lines.join('\n')
}

function buildTableSection(state: StructuredState): string {
  if (!state.tableLead) {
    return '## 台面\n当前无人出牌，你可以自由出牌（任意合法牌型）'
  }

  const lead = state.tableLead
  const combo = lead.combination
  const cards = combo.cards.map(c => {
    if ('type' in c) return c.type === 'big' ? '大王' : '小王'
    return `${SUIT_SYMBOL[c.suit]}${c.rank}`
  }).join(' ')

  const constraintLines: string[] = []
  constraintLines.push(`- 出牌人: 玩家${lead.player}`)
  constraintLines.push(`- 牌型: ${combo.type}${combo.mainRank ? '(' + combo.mainRank + ')' : ''}`)
  constraintLines.push(`- 牌: ${cards}`)
  constraintLines.push(`- 已过人数: ${lead.passCount}`)
  constraintLines.push('')
  constraintLines.push('⚠️ 约束：你必须出同类型且更大的牌型，或者出炸弹/同花顺/天王炸来压制。如果无法压过，请选择过牌(pass)。')

  return `## 台面\n${constraintLines.join('\n')}`
}

function buildHistorySection(history: CompressedHistory): string {
  if (history.rounds.length === 0) {
    return '## 出牌历史\n暂无历史记录'
  }

  const recentRounds = history.rounds.slice(-5)
  const lines = recentRounds.map(r =>
    `轮${r.roundNumber}: 玩家${r.leadPlayer}出${r.leadType}(${r.leadMainRank || '?'}) → 玩家${r.winner ?? '?'}赢 | ${r.playCount}出${r.passCount}过`
  )

  return `## 近期出牌历史\n${lines.join('\n')}`
}

function buildInferenceSection(state: StructuredState): string {
  if (state.inferences.length === 0) {
    return '## 推断\n暂无推断信息'
  }

  const lines = state.inferences.slice(-10).map(inf =>
    `- [${(inf.confidence * 100).toFixed(0)}%] 玩家${inf.player}: ${inf.description}`
  )

  return `## 推断\n${lines.join('\n')}`
}

function buildQuestionSection(question: string): string {
  return `## 问题\n${question}`
}
