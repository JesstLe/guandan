import {
  type AnyCard, type Card, type TrumpRank, type WildcardEntry,
  isJoker,
} from '@guandan/shared'

export interface TrumpValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateTrumpUsage(
  cards: AnyCard[],
  combination: { wildcards: WildcardEntry[] },
  trumpRank: TrumpRank,
): TrumpValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const wildcardCount = combination.wildcards.length
  if (wildcardCount > 1) {
    errors.push('每次出牌最多使用1张逢人配')
  }

  for (const wc of combination.wildcards) {
    if (!wc.card.isRedTrump) {
      errors.push(`逢人配必须是红桃主牌，但${wc.card.suit}-${wc.card.rank}不是红桃主牌`)
    }

    if (wc.substitute === '2' && wc.substituteSuit === undefined) {
      warnings.push('逢人配替代2时建议指定花色')
    }
  }

  const trumpCards = cards.filter(c => !isJoker(c) && (c as Card).rank === trumpRank)
  const nonWildcardTrumps = trumpCards.filter(c => {
    return !combination.wildcards.some(wc => cardId(wc.card) === cardId(c))
  })

  if (nonWildcardTrumps.length > 0 && combination.wildcards.length > 0) {
    warnings.push('同时使用了主牌和逢人配，注意逢人配作为替代时失去主牌优先级')
  }

  return { valid: errors.length === 0, errors, warnings }
}

function cardId(card: AnyCard): string {
  if (isJoker(card)) return `${card.type}-copy${card.copyIndex}`
  return `${card.suit}-${card.rank}-copy${card.copyIndex}`
}
