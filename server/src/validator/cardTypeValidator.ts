import {
  type AnyCard, type Card, type CardCombination, type CombinationType,
  type Rank,
  RANK_ORDER, isJoker,
} from '@guandan/shared'
import { detectCombination } from '../engine/combinationDetector'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  detectedCombination?: CardCombination
}

export function validateCardType(cards: AnyCard[]): ValidationResult {
  if (cards.length === 0) {
    return { valid: false, errors: ['未选择任何牌'], warnings: [] }
  }

  const detection = detectCombination(cards)
  if (detection.combinations.length === 0) {
    return { valid: false, errors: ['选出的牌不构成任何合法牌型'], warnings: [] }
  }

  const warnings: string[] = []
  if (detection.ambiguous) {
    warnings.push(`选出的牌可解读为多种牌型: ${detection.combinations.map(c => c.type).join(', ')}，已自动选择: ${detection.preferred.type}`)
  }

  return {
    valid: true,
    errors: [],
    warnings,
    detectedCombination: detection.preferred,
  }
}

export function isValidCombinationType(type: CombinationType): boolean {
  const validTypes: CombinationType[] = [
    'single', 'pair', 'triple_with_pair', 'triple_with_single',
    'triple_pair', 'airplane', 'airplane_with_wings',
    'straight', 'pair_straight', 'bomb', 'same_suit_straight', 'joker_bomb',
  ]
  return validTypes.includes(type)
}

export function getCombinationRequirements(type: CombinationType): { minCards: number; description: string } {
  switch (type) {
    case 'single': return { minCards: 1, description: '任意1张牌' }
    case 'pair': return { minCards: 2, description: '2张相同点数的牌' }
    case 'triple_with_pair': return { minCards: 5, description: '3张相同点数+1对' }
    case 'triple_with_single': return { minCards: 4, description: '3张相同点数+1张单牌' }
    case 'triple_pair': return { minCards: 6, description: '3对连续点数(如445566)' }
    case 'airplane': return { minCards: 6, description: '2组连续三条(如444555)' }
    case 'airplane_with_wings': return { minCards: 8, description: '飞机+同数量对子' }
    case 'straight': return { minCards: 5, description: '5张以上连续点数(不含2)' }
    case 'pair_straight': return { minCards: 6, description: '3对以上连续对子(不含2)' }
    case 'bomb': return { minCards: 4, description: '4张以上相同点数' }
    case 'same_suit_straight': return { minCards: 5, description: '5张以上同花色连续点数' }
    case 'joker_bomb': return { minCards: 4, description: '4张王牌(2小王+2大王)' }
  }
}
