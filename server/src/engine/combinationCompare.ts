import {
  type CardCombination, type CompareResult, type AnyCard, type Rank, type Suit,
  RANK_ORDER, SUIT_ORDER, isJoker,
} from '@guandan/shared'

function rankValue(rank: Rank): number {
  return RANK_ORDER[rank]
}

function bombPower(combo: CardCombination): number {
  if (combo.type === 'joker_bomb') return 1000
  if (combo.type === 'bomb') {
    const len = combo.cards.length
    const mainVal = combo.mainRank ? rankValue(combo.mainRank) : 0
    // 4张炸弹的威力基础为400，加上牌点数值
    if (len === 4) {
      return 400 + mainVal
    }
    // 5张及以上炸弹的威力进行相应顺延提升，使其强于同花顺
    return (len + 1) * 100 + mainVal
  }
  if (combo.type === 'same_suit_straight') {
    const mainVal = combo.mainRank ? rankValue(combo.mainRank) : 0
    // 同花顺的威力基础定为500，介于4张炸弹与5张炸弹之间
    return 500 + mainVal
  }
  return 0
}

function isBombType(type: CardCombination['type']): boolean {
  return type === 'joker_bomb' || type === 'bomb' || type === 'same_suit_straight'
}

function compareSameType(a: CardCombination, b: CardCombination): CompareResult {
  if (a.type !== b.type) return 'incomparable'

  switch (a.type) {
    case 'single': {
      return compareSingleCards(a.cards[0], b.cards[0])
    }
    case 'pair':
    case 'triple':
    case 'triple_with_pair':
    case 'airplane': {
      if (!a.mainRank || !b.mainRank) return 'incomparable'
      const aVal = rankValue(a.mainRank)
      const bVal = rankValue(b.mainRank)
      if (aVal !== bVal) return aVal > bVal ? 'greater' : 'lesser'
      if (a.isTrump && !b.isTrump) return 'greater'
      if (!a.isTrump && b.isTrump) return 'lesser'
      return 'equal'
    }
    case 'straight':
    case 'pair_straight': {
      if (a.length !== b.length) return 'incomparable'
      if (!a.mainRank || !b.mainRank) return 'incomparable'
      const aVal = rankValue(a.mainRank)
      const bVal = rankValue(b.mainRank)
      if (aVal !== bVal) return aVal > bVal ? 'greater' : 'lesser'
      if (a.isTrump && !b.isTrump) return 'greater'
      if (!a.isTrump && b.isTrump) return 'lesser'
      return compareSuitPriority(a, b)
    }
    case 'same_suit_straight': {
      if (a.length !== b.length) return 'incomparable'
      if (a.isTrump && !b.isTrump) return 'greater'
      if (!a.isTrump && b.isTrump) return 'lesser'
      if (!a.mainRank || !b.mainRank) return 'incomparable'
      const aVal = rankValue(a.mainRank)
      const bVal = rankValue(b.mainRank)
      if (aVal !== bVal) return aVal > bVal ? 'greater' : 'lesser'
      return compareSuitPriority(a, b)
    }
    case 'bomb': {
      if (a.cards.length !== b.cards.length) {
        return a.cards.length > b.cards.length ? 'greater' : 'lesser'
      }
      if (!a.mainRank || !b.mainRank) return 'incomparable'
      const aVal = rankValue(a.mainRank)
      const bVal = rankValue(b.mainRank)
      if (aVal !== bVal) return aVal > bVal ? 'greater' : 'lesser'
      if (a.isTrump && !b.isTrump) return 'greater'
      if (!a.isTrump && b.isTrump) return 'lesser'
      return 'equal'
    }
    case 'joker_bomb':
      return 'equal'
    default:
      return 'incomparable'
  }
}

function compareSingleCards(a: AnyCard, b: AnyCard): CompareResult {
  const aVal = cardValue(a)
  const bVal = cardValue(b)
  if (aVal !== bVal) return aVal > bVal ? 'greater' : 'lesser'
  if (!isJoker(a) && !isJoker(b)) {
    if (a.isTrump && !b.isTrump) return 'greater'
    if (!a.isTrump && b.isTrump) return 'lesser'
    if (a.isRedTrump && !b.isRedTrump) return 'greater'
    if (!a.isRedTrump && b.isRedTrump) return 'lesser'
    return compareSuit(a.suit, b.suit)
  }
  return 'equal'
}

function cardValue(card: AnyCard): number {
  if (isJoker(card)) {
    return card.type === 'big' ? 17 : 16
  }
  return rankValue(card.rank)
}

function compareSuit(a: Suit | undefined, b: Suit | undefined): CompareResult {
  if (!a || !b) return 'equal'
  const aOrd = SUIT_ORDER[a as keyof typeof SUIT_ORDER] ?? 0
  const bOrd = SUIT_ORDER[b as keyof typeof SUIT_ORDER] ?? 0
  if (aOrd !== bOrd) return aOrd > bOrd ? 'greater' : 'lesser'
  return 'equal'
}

function compareSuitPriority(a: CardCombination, b: CardCombination): CompareResult {
  const aNonJoker = a.cards.find(c => !isJoker(c))
  const bNonJoker = b.cards.find(c => !isJoker(c))
  if (!aNonJoker || !bNonJoker) return 'equal'
  if (!isJoker(aNonJoker) && !isJoker(bNonJoker)) {
    return compareSuit(aNonJoker.suit, bNonJoker.suit)
  }
  return 'equal'
}

export function compareCombinations(a: CardCombination, b: CardCombination): CompareResult {
  const aIsBomb = isBombType(a.type)
  const bIsBomb = isBombType(b.type)

  if (aIsBomb && !bIsBomb) return 'greater'
  if (!aIsBomb && bIsBomb) return 'lesser'

  if (aIsBomb && bIsBomb) {
    const aPower = bombPower(a)
    const bPower = bombPower(b)
    if (aPower !== bPower) return aPower > bPower ? 'greater' : 'lesser'
    return compareSameType(a, b)
  }

  return compareSameType(a, b)
}

export function canBeat(play: CardCombination, lead: CardCombination): boolean {
  return compareCombinations(play, lead) === 'greater'
}
