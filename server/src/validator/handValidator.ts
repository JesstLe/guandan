import {
  type AnyCard, type CardPool,
  isJoker, cardId,
} from '@guandan/shared'

export interface HandValidationResult {
  valid: boolean
  errors: string[]
  missingCards: string[]
}

export function validateHandOwnership(
  pool: CardPool,
  player: number,
  cards: AnyCard[],
): HandValidationResult {
  const errors: string[] = []
  const missingCards: string[] = []

  if (player === 0) {
    const myCardIds = new Set(
      pool.allCardStates
        .filter(s => s.status === 'in_my_hand')
        .map(s => s.id)
    )

    for (const card of cards) {
      const id = cardId(card)
      if (!myCardIds.has(id)) {
        missingCards.push(id)
        errors.push(`手牌中没有: ${id}`)
      }
    }
  } else {
    const playerHandCount = pool.players[player].handCount
    if (cards.length > playerHandCount) {
      errors.push(`玩家${player}手牌仅剩${playerHandCount}张，但选了${cards.length}张`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    missingCards,
  }
}

export function validateNoDuplicateCards(cards: AnyCard[]): HandValidationResult {
  const seen = new Set<string>()
  const errors: string[] = []

  for (const card of cards) {
    const id = cardId(card)
    if (seen.has(id)) {
      errors.push(`重复选牌: ${id}`)
    }
    seen.add(id)
  }

  return { valid: errors.length === 0, errors, missingCards: [] }
}
