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
    'single', 'pair', 'triple', 'triple_with_pair',
    'straight', 'pair_straight', 'airplane', 'bomb',
    'same_suit_straight', 'joker_bomb',
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

const VALID_RANKS: Set<string> = new Set(['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'])
const VALID_SUITS: Set<string> = new Set(['spade', 'heart', 'diamond', 'club'])

function validateCards(cards: unknown): AISuggestionOption['cards'] | null {
  if (!Array.isArray(cards)) return null

  const result: AISuggestionOption['cards'] = []
  for (const c of cards) {
    if (!c || typeof c !== 'object') return null
    const obj = c as Record<string, unknown>

    const rank = String(obj.rank ?? '')
    const suit = String(obj.suit ?? '')
    const copyIndex = obj.copyIndex

    if (rank === 'BJ' || rank === 'SJ') {
      if (copyIndex !== 1 && copyIndex !== 2) return null
      result.push({ rank, suit: 'joker', copyIndex: copyIndex as 1 | 2 })
    } else if (VALID_RANKS.has(rank) && VALID_SUITS.has(suit)) {
      if (copyIndex !== 1 && copyIndex !== 2) return null
      result.push({ rank: rank as Rank, suit: suit as Suit, copyIndex: copyIndex as 1 | 2 })
    } else {
      return null
    }
  }

  return result
}

function validateWildcards(wildcards: unknown): WildcardEntry[] {
  if (!Array.isArray(wildcards)) return []
  const result: WildcardEntry[] = []
  for (const w of wildcards) {
    if (!w || typeof w !== 'object') continue
    const obj = w as Record<string, unknown>
    const card = obj.card
    const substitute = obj.substitute
    if (!card || typeof card !== 'object' || typeof substitute !== 'string') continue
    const c = card as Record<string, unknown>
    if (typeof c.rank !== 'string' || typeof c.suit !== 'string') continue
    if (!VALID_RANKS.has(c.rank) || !VALID_SUITS.has(c.suit)) continue
    if (c.copyIndex !== 1 && c.copyIndex !== 2) continue
    if (!VALID_RANKS.has(substitute)) continue
    const entry: WildcardEntry = {
      card: { rank: c.rank as Rank, suit: c.suit as Suit, copyIndex: c.copyIndex as 1 | 2, isTrump: false, isRedTrump: false },
      substitute: substitute as Rank,
    }
    if (typeof obj.substituteSuit === 'string' && VALID_SUITS.has(obj.substituteSuit)) {
      entry.substituteSuit = obj.substituteSuit as Suit
    }
    result.push(entry)
  }
  return result
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
