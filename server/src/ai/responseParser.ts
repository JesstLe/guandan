import {
  type AISuggestion, type AISuggestionOption, type CombinationType,
  type Rank, type Suit, type WildcardEntry,
} from '@guandan/shared'

export interface ParseResult {
  success: boolean
  suggestion?: AISuggestion
  error?: string
  raw?: string
}

export function parseAIResponse(raw: string): ParseResult {
  const jsonStr = extractJSON(raw)
  if (!jsonStr) {
    return { success: false, error: 'AI响应中未找到有效JSON', raw }
  }

  try {
    const parsed = JSON.parse(jsonStr)
    const suggestion = validateAndConvert(parsed)
    if (!suggestion) {
      return { success: false, error: 'AI响应JSON结构不符合预期', raw }
    }
    return { success: true, suggestion, raw }
  } catch (e) {
    return { success: false, error: `JSON解析失败: ${(e as Error).message}`, raw }
  }
}

function extractJSON(text: string): string | null {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) return codeBlockMatch[1].trim()

  const braceMatch = text.match(/\{[\s\S]*\}/)
  if (braceMatch) return braceMatch[0]

  return null
}

function validateAndConvert(parsed: unknown): AISuggestion | null {
  if (!parsed || typeof parsed !== 'object') return null

  const obj = parsed as Record<string, unknown>
  const primary = validateOption(obj.primary)
  if (!primary) return null

  const alternative = obj.alternative ? validateOption(obj.alternative) || undefined : undefined
  const warnings = Array.isArray(obj.warnings) ? obj.warnings as string[] : []
  const isDilemma = typeof obj.isDilemma === 'boolean' ? obj.isDilemma : false

  return { primary, alternative, warnings, isDilemma }
}

function validateOption(opt: unknown): AISuggestionOption | null {
  if (!opt || typeof opt !== 'object') return null

  const obj = opt as Record<string, unknown>

  const action = obj.action as string
  if (action !== 'play' && action !== 'pass') return null

  const cards = validateCards(obj.cards)
  if (!cards) return null

  const combinationType = obj.combinationType as CombinationType
  const validTypes: CombinationType[] = [
    'single', 'pair', 'triple_with_pair', 'triple_with_single',
    'triple_pair', 'airplane', 'airplane_with_wings',
    'straight', 'pair_straight', 'bomb', 'same_suit_straight', 'joker_bomb',
  ]
  if (!validTypes.includes(combinationType)) return null

  const wildcards = validateWildcards(obj.wildcards)
  const totalScore = typeof obj.totalScore === 'number' ? obj.totalScore : 0.5
  const confidence = typeof obj.confidence === 'number' ? obj.confidence : 0.5
  const dimensions = validateDimensions(obj.dimensions)
  const reasoning = typeof obj.reasoning === 'string' ? obj.reasoning : ''

  return {
    action: action as 'play' | 'pass',
    cards,
    combinationType,
    wildcards,
    totalScore,
    confidence,
    dimensions,
    reasoning,
  }
}

function validateCards(cards: unknown): AISuggestionOption['cards'] | null {
  if (!Array.isArray(cards)) return null

  return cards.map((c: Record<string, unknown>) => ({
    rank: c.rank as Rank,
    suit: c.suit as Suit,
    copyIndex: c.copyIndex as 1 | 2,
  }))
}

function validateWildcards(wildcards: unknown): WildcardEntry[] {
  if (!Array.isArray(wildcards)) return []
  return wildcards as WildcardEntry[]
}

function validateDimensions(dimensions: unknown): AISuggestionOption['dimensions'] {
  const defaults: AISuggestionOption['dimensions'] = {
    efficiency: 0.5, situation: 0.5, inference: 0.5,
    control: 0.5, cooperation: 0.5, endgame: 0.5,
  }

  if (!dimensions || typeof dimensions !== 'object') return defaults

  const d = dimensions as Record<string, unknown>
  return {
    efficiency: clamp01(d.efficiency),
    situation: clamp01(d.situation),
    inference: clamp01(d.inference),
    control: clamp01(d.control),
    cooperation: clamp01(d.cooperation),
    endgame: clamp01(d.endgame),
  }
}

function clamp01(val: unknown): number {
  if (typeof val !== 'number') return 0.5
  return Math.max(-1, Math.min(1, val))
}
