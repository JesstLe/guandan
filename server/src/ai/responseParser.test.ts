import { describe, it, expect } from 'vitest'
import { parseAIResponse } from './responseParser'

describe('responseParser', () => {
  describe('parseAIResponse', () => {
    it('should parse valid JSON in code block', () => {
      const raw = `
Here is my recommendation:
\`\`\`json
{
  "primary": {
    "action": "play",
    "cards": [
      { "rank": "3", "suit": "spade", "copyIndex": 1 },
      { "rank": "4", "suit": "spade", "copyIndex": 1 }
    ],
    "combinationType": "pair",
    "totalScore": 0.8,
    "confidence": 0.9,
    "dimensions": {
      "efficiency": 0.7,
      "situation": 0.8,
      "inference": 0.6,
      "control": 0.7,
      "cooperation": 0.8,
      "endgame": 0.5
    },
    "reasoning": "This is the best play"
  },
  "isDilemma": false
}
\`\`\`
      `

      const result = parseAIResponse(raw)

      expect(result.success).toBe(true)
      expect(result.suggestion).toBeDefined()
      expect(result.suggestion?.primary.action).toBe('play')
      expect(result.suggestion?.primary.combinationType).toBe('pair')
      expect(result.suggestion?.isDilemma).toBe(false)
    })

    it('should parse valid JSON with alternative option', () => {
      const raw = `
\`\`\`json
{
  "primary": {
    "action": "play",
    "cards": [{ "rank": "3", "suit": "spade", "copyIndex": 1 }],
    "combinationType": "single",
    "totalScore": 0.7,
    "confidence": 0.8,
    "dimensions": {
      "efficiency": 0.6,
      "situation": 0.7,
      "inference": 0.5,
      "control": 0.6,
      "cooperation": 0.7,
      "endgame": 0.4
    },
    "reasoning": "Primary choice"
  },
  "alternative": {
    "action": "pass",
    "cards": [],
    "combinationType": "single",
    "totalScore": 0.3,
    "confidence": 0.5,
    "dimensions": {
      "efficiency": 0.3,
      "situation": 0.4,
      "inference": 0.3,
      "control": 0.4,
      "cooperation": 0.5,
      "endgame": 0.2
    },
    "reasoning": "Alternative choice"
  },
  "isDilemma": true
}
\`\`\`
      `

      const result = parseAIResponse(raw)

      expect(result.success).toBe(true)
      expect(result.suggestion?.alternative).toBeDefined()
      expect(result.suggestion?.isDilemma).toBe(true)
    })

    it('should parse valid JSON without code block', () => {
      const raw = '{"primary":{"action":"play","cards":[{"rank":"3","suit":"spade","copyIndex":1}],"combinationType":"single","totalScore":0.8,"confidence":0.9,"dimensions":{"efficiency":0.7,"situation":0.8,"inference":0.6,"control":0.7,"cooperation":0.8,"endgame":0.5},"reasoning":"Test"},"isDilemma":false}'

      const result = parseAIResponse(raw)

      expect(result.success).toBe(true)
    })

    it('should include warnings when present', () => {
      const raw = `
\`\`\`json
{
  "primary": {
    "action": "play",
    "cards": [{ "rank": "3", "suit": "spade", "copyIndex": 1 }],
    "combinationType": "single",
    "totalScore": 0.8,
    "confidence": 0.9,
    "dimensions": {
      "efficiency": 0.7,
      "situation": 0.8,
      "inference": 0.6,
      "control": 0.7,
      "cooperation": 0.8,
      "endgame": 0.5
    },
    "reasoning": "Test"
  },
  "warnings": ["Warning 1", "Warning 2"],
  "isDilemma": false
}
\`\`\`
      `

      const result = parseAIResponse(raw)

      expect(result.success).toBe(true)
      expect(result.suggestion?.warnings).toHaveLength(2)
      expect(result.suggestion?.warnings).toContain('Warning 1')
    })

    it('should return error for invalid JSON', () => {
      const raw = 'not valid json at all'

      const result = parseAIResponse(raw)

      expect(result.success).toBe(false)
      expect(result.error).toContain('JSON')
    })

    it('should return error for missing primary', () => {
      const raw = '{"alternative":{"action":"play","cards":[],"combinationType":"single","totalScore":0.8,"confidence":0.9,"dimensions":{"efficiency":0.7,"situation":0.8,"inference":0.6,"control":0.7,"cooperation":0.8,"endgame":0.5},"reasoning":"Test"}}'

      const result = parseAIResponse(raw)

      expect(result.success).toBe(false)
      expect(result.error).toContain('结构')
    })

    it('should return error for invalid action', () => {
      const raw = '{"primary":{"action":"invalid","cards":[],"combinationType":"single","totalScore":0.8,"confidence":0.9,"dimensions":{"efficiency":0.7,"situation":0.8,"inference":0.6,"control":0.7,"cooperation":0.8,"endgame":0.5},"reasoning":"Test"}}'

      const result = parseAIResponse(raw)

      expect(result.success).toBe(false)
    })

    it('should return error for invalid combination type', () => {
      const raw = '{"primary":{"action":"play","cards":[],"combinationType":"invalid_type","totalScore":0.8,"confidence":0.9,"dimensions":{"efficiency":0.7,"situation":0.8,"inference":0.6,"control":0.7,"cooperation":0.8,"endgame":0.5},"reasoning":"Test"}}'

      const result = parseAIResponse(raw)

      expect(result.success).toBe(false)
    })

    it('should return error for empty response', () => {
      const result = parseAIResponse('')

      expect(result.success).toBe(false)
    })

    it('should preserve raw response', () => {
      const raw = 'some raw text with json { "primary": { "action": "play" } }'

      const result = parseAIResponse(raw)

      expect(result.raw).toBe(raw)
    })

    it('should handle all valid combination types', () => {
      const combinationTypes = [
        'single', 'pair', 'triple', 'triple_with_pair',
        'straight', 'pair_straight', 'airplane', 'bomb', 'same_suit_straight', 'joker_bomb',
      ]

      for (const type of combinationTypes) {
        const raw = `{"primary":{"action":"play","cards":[],"combinationType":"${type}","totalScore":0.8,"confidence":0.9,"dimensions":{"efficiency":0.7,"situation":0.8,"inference":0.6,"control":0.7,"cooperation":0.8,"endgame":0.5},"reasoning":"Test"}}`

        const result = parseAIResponse(raw)

        expect(result.success).toBe(true)
        expect(result.suggestion?.primary.combinationType).toBe(type)
      }
    })

    describe('wildcards', () => {
      it('should parse wildcards when present', () => {
        const raw = `
\`\`\`json
{
  "primary": {
    "action": "play",
    "cards": [
      { "rank": "7", "suit": "heart", "copyIndex": 1 },
      { "rank": "8", "suit": "spade", "copyIndex": 1 }
    ],
    "combinationType": "straight",
    "wildcards": [
      { "card": { "rank": "7", "suit": "heart", "copyIndex": 1, "isTrump": true, "isRedTrump": true }, "substitute": "6", "substituteSuit": "spade" }
    ],
    "totalScore": 0.8,
    "confidence": 0.9,
    "dimensions": {
      "efficiency": 0.7,
      "situation": 0.8,
      "inference": 0.6,
      "control": 0.7,
      "cooperation": 0.8,
      "endgame": 0.5
    },
    "reasoning": "Test"
  },
  "isDilemma": false
}
\`\`\`
        `

        const result = parseAIResponse(raw)

        expect(result.success).toBe(true)
        expect(result.suggestion?.primary.wildcards).toHaveLength(1)
        expect(result.suggestion?.primary.wildcards?.[0].substitute).toBe('6')
      })

      it('should allow missing wildcards', () => {
        const raw = '{"primary":{"action":"play","cards":[],"combinationType":"single","totalScore":0.8,"confidence":0.9,"dimensions":{"efficiency":0.7,"situation":0.8,"inference":0.6,"control":0.7,"cooperation":0.8,"endgame":0.5},"reasoning":"Test"}}'

        const result = parseAIResponse(raw)

        expect(result.success).toBe(true)
        expect(result.suggestion?.primary.wildcards).toEqual([])
      })
    })

    describe('dimensions clamping', () => {
      it('should clamp dimensions to valid range', () => {
        const raw = `
\`\`\`json
{
  "primary": {
    "action": "play",
    "cards": [],
    "combinationType": "single",
    "totalScore": 0.8,
    "confidence": 0.9,
    "dimensions": {
      "efficiency": 5.0,
      "situation": -2.0,
      "inference": 0.6,
      "control": 0.7,
      "cooperation": 0.8,
      "endgame": 0.5
    },
    "reasoning": "Test"
  },
  "isDilemma": false
}
\`\`\`
        `

        const result = parseAIResponse(raw)

        expect(result.success).toBe(true)
        expect(result.suggestion?.primary.dimensions.efficiency).toBe(1)
        expect(result.suggestion?.primary.dimensions.situation).toBe(-1)
      })

      it('should use defaults for missing dimensions', () => {
        const raw = '{"primary":{"action":"play","cards":[],"combinationType":"single","totalScore":0.8,"confidence":0.9,"reasoning":"Test"}}'

        const result = parseAIResponse(raw)

        expect(result.success).toBe(true)
        expect(result.suggestion?.primary.dimensions.efficiency).toBe(0.5)
        expect(result.suggestion?.primary.dimensions.situation).toBe(0.5)
      })
    })

    describe('default values', () => {
      it('should use default totalScore when missing', () => {
        const raw = '{"primary":{"action":"play","cards":[],"combinationType":"single","confidence":0.9,"dimensions":{"efficiency":0.7,"situation":0.8,"inference":0.6,"control":0.7,"cooperation":0.8,"endgame":0.5},"reasoning":"Test"}}'

        const result = parseAIResponse(raw)

        expect(result.success).toBe(true)
        expect(result.suggestion?.primary.totalScore).toBe(0.5)
      })

      it('should use default confidence when missing', () => {
        const raw = '{"primary":{"action":"play","cards":[],"combinationType":"single","totalScore":0.8,"dimensions":{"efficiency":0.7,"situation":0.8,"inference":0.6,"control":0.7,"cooperation":0.8,"endgame":0.5},"reasoning":"Test"}}'

        const result = parseAIResponse(raw)

        expect(result.success).toBe(true)
        expect(result.suggestion?.primary.confidence).toBe(0.5)
      })
    })
  })
})