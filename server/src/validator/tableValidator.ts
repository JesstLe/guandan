import {
  type CardCombination, type CompareResult,
} from '@guandan/shared'
import { compareCombinations } from '../engine/combinationCompare'

export interface TableValidationResult {
  valid: boolean
  errors: string[]
  compareResult?: CompareResult
}

export function validateTablePlay(
  play: CardCombination,
  lead: CardCombination | null,
): TableValidationResult {
  if (!lead) {
    return { valid: true, errors: [] }
  }

  const playIsBomb = isBombType(play.type)
  const leadIsBomb = isBombType(lead.type)

  if (play.type === lead.type) {
    const result = compareCombinations(play, lead)
    if (result === 'greater') {
      return { valid: true, errors: [], compareResult: result }
    }
    if (result === 'equal') {
      return { valid: false, errors: ['出牌与台面相同大小，无法压过'], compareResult: result }
    }
    if (result === 'lesser') {
      return { valid: false, errors: ['出牌小于台面，无法压过'], compareResult: result }
    }
    return { valid: false, errors: ['牌型无法比较'], compareResult: 'incomparable' }
  }

  if (playIsBomb && !leadIsBomb) {
    return { valid: true, errors: [], compareResult: 'greater' }
  }

  if (playIsBomb && leadIsBomb) {
    const result = compareCombinations(play, lead)
    if (result === 'greater') {
      return { valid: true, errors: [], compareResult: result }
    }
    return { valid: false, errors: ['炸弹不够大，无法压过台面炸弹'], compareResult: result }
  }

  if (!playIsBomb && leadIsBomb) {
    return { valid: false, errors: ['非炸弹牌型无法压过炸弹'], compareResult: 'lesser' }
  }

  return { valid: false, errors: [`牌型不匹配: 出${play.type}对台面${lead.type}，且非炸弹`], compareResult: 'incomparable' }
}

function isBombType(type: CardCombination['type']): boolean {
  return type === 'joker_bomb' || type === 'bomb' || type === 'same_suit_straight'
}
