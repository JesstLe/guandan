import {
  type AnyCard, type Card, type CardCombination,
  type CombinationType, type DetectionResult, type WildcardEntry,
  type Rank, type Suit,
  RANK_ORDER, isJoker, cardId,
} from '@guandan/shared'

const RANKS_FOR_SEQUENCES: Rank[] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

function rankValue(rank: Rank): number {
  return RANK_ORDER[rank]
}

function groupByRank(cards: AnyCard[]): Map<string, AnyCard[]> {
  const map = new Map<string, AnyCard[]>()
  for (const card of cards) {
    const key = isJoker(card) ? card.type : card.rank
    const group = map.get(key) || []
    group.push(card)
    map.set(key, group)
  }
  return map
}

function isConsecutive(ranks: Rank[]): boolean {
  for (let i = 1; i < ranks.length; i++) {
    if (rankValue(ranks[i]) - rankValue(ranks[i - 1]) !== 1) return false
  }
  return true
}

function hasTrump(cards: AnyCard[]): boolean {
  return cards.some(c => !isJoker(c) && c.isTrump)
}

function isRedTrumpWildcard(card: AnyCard): boolean {
  return !isJoker(card) && card.isRedTrump
}

function findWildcards(cards: AnyCard[]): Card[] {
  return cards.filter(c => isRedTrumpWildcard(c)) as Card[]
}

function removeCards(allCards: AnyCard[], toRemove: AnyCard[]): AnyCard[] {
  const removeIds = new Set(toRemove.map(c => cardId(c)))
  return allCards.filter(c => !removeIds.has(cardId(c)))
}

function detectJokerBomb(cards: AnyCard[]): CardCombination | null {
  const jokers = cards.filter(isJoker)
  const smallJokers = jokers.filter(c => c.type === 'small')
  const bigJokers = jokers.filter(c => c.type === 'big')
  if (smallJokers.length === 2 && bigJokers.length === 2 && cards.length === 4) {
    return { type: 'joker_bomb', cards, isTrump: true, wildcards: [] }
  }
  return null
}

function detectBomb(cards: AnyCard[], groups: Map<string, AnyCard[]>): CardCombination | null {
  if (cards.length < 4) return null
  for (const [, group] of groups) {
    if (group.length === cards.length && !group.some(isJoker)) {
      const rank = (group[0] as Card).rank
      return {
        type: 'bomb',
        cards,
        mainRank: rank,
        isTrump: hasTrump(cards),
        length: cards.length,
        wildcards: [],
      }
    }
  }
  return null
}

function detectSameSuitStraight(cards: AnyCard[]): CardCombination | null {
  if (cards.length < 5) return null
  if (cards.some(isJoker)) return null
  const cs = cards as Card[]
  if (cs.some(c => c.rank === '2')) return null
  const suit = cs[0].suit
  if (!cs.every(c => c.suit === suit)) return null
  const ranks = cs.map(c => c.rank).sort((a, b) => rankValue(a) - rankValue(b))
  if (!isConsecutive(ranks)) return null
  return {
    type: 'same_suit_straight',
    cards,
    mainRank: ranks[ranks.length - 1],
    isTrump: hasTrump(cards),
    length: cards.length,
    wildcards: [],
  }
}

function detectStraight(cards: AnyCard[]): CardCombination | null {
  if (cards.length < 5) return null
  if (cards.some(isJoker)) return null
  const cs = cards as Card[]
  if (cs.some(c => c.rank === '2')) return null
  const ranks = cs.map(c => c.rank).sort((a, b) => rankValue(a) - rankValue(b))
  if (!isConsecutive(ranks)) return null
  return {
    type: 'straight',
    cards,
    mainRank: ranks[ranks.length - 1],
    isTrump: hasTrump(cards),
    length: cards.length,
    wildcards: [],
  }
}

function detectPairStraight(cards: AnyCard[], groups: Map<string, AnyCard[]>): CardCombination | null {
  if (cards.length < 6 || cards.length % 2 !== 0) return null
  if (cards.some(isJoker)) return null
  const pairs: Rank[] = []
  for (const [key, group] of groups) {
    if (group.length !== 2) return null
    if (key === '2') return null
    pairs.push(key as Rank)
  }
  pairs.sort((a, b) => rankValue(a) - rankValue(b))
  if (pairs.length < 3) return null
  if (!isConsecutive(pairs)) return null
  return {
    type: 'pair_straight',
    cards,
    mainRank: pairs[pairs.length - 1],
    isTrump: hasTrump(cards),
    length: pairs.length,
    wildcards: [],
  }
}

function detectAirplane(cards: AnyCard[], groups: Map<string, AnyCard[]>): CardCombination | null {
  // 掼蛋规则：钢板必须是纯连续三条，如333444，不支持带翅膀
  if (cards.some(isJoker)) return null
  const triples: Rank[] = []
  for (const [, group] of groups) {
    if (group.length === 3) {
      if ((group[0] as Card).rank === '2') return null
      triples.push((group[0] as Card).rank)
    } else {
      return null // 必须全部是三条组合，不能有剩余杂牌
    }
  }
  if (triples.length < 2) return null
  triples.sort((a, b) => rankValue(a) - rankValue(b))
  if (!isConsecutive(triples)) return null
  return {
    type: 'airplane',
    cards,
    // 以最大的那组三条点数作为比较基准
    mainRank: triples[triples.length - 1],
    isTrump: hasTrump(cards),
    length: triples.length,
    wildcards: [],
  }
}

function detectTripleWithPair(cards: AnyCard[], groups: Map<string, AnyCard[]>): CardCombination | null {
  if (cards.length !== 5) return null
  if (cards.some(isJoker)) return null
  let tripleRank: Rank | null = null
  let pairRank: Rank | null = null
  for (const [key, group] of groups) {
    if (group.length === 3) tripleRank = key as Rank
    else if (group.length === 2) pairRank = key as Rank
    else return null
  }
  if (!tripleRank || !pairRank) return null
  return {
    type: 'triple_with_pair',
    cards,
    mainRank: tripleRank,
    isTrump: hasTrump(cards),
    wildcards: [],
  }
}

function detectTriple(cards: AnyCard[], groups: Map<string, AnyCard[]>): CardCombination | null {
  // 掼蛋规则：支持纯三张（三条，如333，不带牌）
  if (cards.length !== 3) return null
  if (cards.some(isJoker)) return null
  for (const [key, group] of groups) {
    if (group.length === 3) {
      return {
        type: 'triple',
        cards,
        mainRank: key as Rank,
        isTrump: hasTrump(cards),
        wildcards: [],
      }
    }
  }
  return null
}

function detectPair(cards: AnyCard[], groups: Map<string, AnyCard[]>): CardCombination | null {
  if (cards.length !== 2) return null
  if (cards.some(isJoker)) return null
  for (const [key, group] of groups) {
    if (group.length === 2) {
      return {
        type: 'pair',
        cards,
        mainRank: key as Rank,
        isTrump: hasTrump(cards),
        wildcards: [],
      }
    }
  }
  return null
}

function detectSingle(cards: AnyCard[]): CardCombination | null {
  if (cards.length !== 1) return null
  const card = cards[0]
  return {
    type: 'single',
    cards,
    mainRank: isJoker(card) ? undefined : card.rank,
    isTrump: !isJoker(card) && card.isTrump,
    wildcards: [],
  }
}

function detectWithWildcard(cards: AnyCard[]): CardCombination[] {
  const wildcards = findWildcards(cards)
  if (wildcards.length === 0) return []

  const results: CardCombination[] = []
  const nonWildcardCards = removeCards(cards, [wildcards[0]])
  const wildcardCard = wildcards[0]

  const substitutionTargets: { rank: Rank; suit?: Suit }[] = []
  for (const rank of RANKS_FOR_SEQUENCES) {
    for (const suit of ['spade', 'heart', 'diamond', 'club'] as Suit[]) {
      if (rank === wildcardCard.rank && suit === wildcardCard.suit) continue
      substitutionTargets.push({ rank, suit })
    }
  }
  substitutionTargets.push({ rank: '2' })
  for (const suit of ['spade', 'heart', 'diamond', 'club'] as Suit[]) {
    if (wildcardCard.rank === '2' && suit === wildcardCard.suit) continue
    substitutionTargets.push({ rank: '2', suit })
  }

  const seenKeys = new Set<string>()
  for (const target of substitutionTargets) {
    const key = target.suit ? `${target.rank}_${target.suit}` : target.rank
    if (seenKeys.has(key)) continue
    seenKeys.add(key)

    const substituted: AnyCard = {
      rank: target.rank,
      suit: target.suit || 'spade',
      copyIndex: 1,
      isTrump: target.rank === wildcardCard.rank,
      isRedTrump: false,
    }

    const virtualCards = [...nonWildcardCards, substituted]
    const virtualGroups = groupByRank(virtualCards)

    const wc: WildcardEntry = {
      card: wildcardCard,
      substitute: target.rank,
      substituteSuit: target.suit,
    }

    const tryAdd = (combo: CardCombination | null) => {
      if (!combo) return
      combo.wildcards = [wc]
      combo.cards = cards
      if (combo.type === 'bomb' && target.suit) {
        const allSameSuit = (nonWildcardCards as Card[]).every(
          c => !isJoker(c) && c.suit === target.suit
        )
        if (allSameSuit) {
          // 同花色炸弹保持bomb类型
        }
      }
      results.push(combo)
    }

    if (virtualCards.length >= 4) {
      tryAdd(detectJokerBomb(virtualCards))
      tryAdd(detectBomb(virtualCards, virtualGroups))
    }
    if (virtualCards.length >= 5) {
      tryAdd(detectSameSuitStraight(virtualCards))
      tryAdd(detectStraight(virtualCards))
    }
    if (virtualCards.length >= 6) {
      tryAdd(detectPairStraight(virtualCards, virtualGroups))
    }
    tryAdd(detectAirplane(virtualCards, virtualGroups))
    tryAdd(detectTripleWithPair(virtualCards, virtualGroups))
    tryAdd(detectTriple(virtualCards, virtualGroups))
    tryAdd(detectPair(virtualCards, virtualGroups))
    tryAdd(detectSingle(virtualCards))
  }

  return results
}

export function detectCombination(cards: AnyCard[]): DetectionResult {
  if (cards.length === 0) {
    return { combinations: [], ambiguous: false, preferred: null as unknown as CardCombination }
  }

  const groups = groupByRank(cards)
  const results: CardCombination[] = []

  const jokerBomb = detectJokerBomb(cards)
  if (jokerBomb) results.push(jokerBomb)

  const bomb = detectBomb(cards, groups)
  if (bomb) results.push(bomb)

  const sameSuitStraight = detectSameSuitStraight(cards)
  if (sameSuitStraight) results.push(sameSuitStraight)

  const straight = detectStraight(cards)
  if (straight) results.push(straight)

  const pairStraight = detectPairStraight(cards, groups)
  if (pairStraight) results.push(pairStraight)

  const airplane = detectAirplane(cards, groups)
  if (airplane) results.push(airplane)

  const tripleWithPair = detectTripleWithPair(cards, groups)
  if (tripleWithPair) results.push(tripleWithPair)

  const triple = detectTriple(cards, groups)
  if (triple) results.push(triple)

  const pair = detectPair(cards, groups)
  if (pair) results.push(pair)

  const single = detectSingle(cards)
  if (single) results.push(single)

  const wildcardResults = detectWithWildcard(cards)
  results.push(...wildcardResults)

  if (results.length === 0) {
    return { combinations: [], ambiguous: false, preferred: null as unknown as CardCombination }
  }

  const deduped = deduplicateResults(results)
  const preferred = selectPreferred(deduped)
  return {
    combinations: deduped,
    ambiguous: deduped.length > 1,
    preferred,
  }
}

function deduplicateResults(combinations: CardCombination[]): CardCombination[] {
  const seen = new Map<string, CardCombination>()
  for (const combo of combinations) {
    const key = comboKey(combo)
    if (!seen.has(key)) {
      seen.set(key, combo)
    }
  }
  return Array.from(seen.values())
}

function comboKey(combo: CardCombination): string {
  const wcKey = combo.wildcards.length > 0
    ? `_wc:${combo.wildcards.map(w => `${w.substitute}${w.substituteSuit || ''}`).join(',')}`
    : ''
  return `${combo.type}_${combo.mainRank || 'x'}_${combo.length || combo.cards.length}${wcKey}`
}

const TYPE_PRIORITY: Record<CombinationType, number> = {
  joker_bomb: 100,
  bomb: 90,
  same_suit_straight: 80,
  airplane: 65,
  pair_straight: 55,
  triple_with_pair: 50,
  triple: 30, // 三条优先级定在顺子之下、对子之上
  straight: 40,
  pair: 20,
  single: 10,
}

function selectPreferred(combinations: CardCombination[]): CardCombination {
  return combinations.reduce((best, curr) => {
    const bestCards = best.cards.length
    const currCards = curr.cards.length
    if (currCards > bestCards) return curr
    if (currCards === bestCards) {
      if (TYPE_PRIORITY[curr.type] > TYPE_PRIORITY[best.type]) return curr
    }
    return best
  })
}
