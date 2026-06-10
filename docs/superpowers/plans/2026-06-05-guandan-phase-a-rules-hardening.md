# Guandan Phase A Rules Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the existing Guandan rules layer so card-type detection, combination comparison, wildcard handling, and table validation produce stable, test-backed results.

**Architecture:** Keep rule logic in focused server modules. `combinationDetector.ts` remains responsible for recognizing legal combinations, `combinationCompare.ts` remains responsible for ordering recognized combinations, and validators convert rule results into user-facing structured validation outcomes. This phase does not introduce strategy scoring or UI changes.

**Tech Stack:** TypeScript, Vitest, existing npm workspaces, existing `@guandan/shared` types.

---

## Scope

This plan implements phase A from `docs/superpowers/specs/2026-06-05-guandan-high-win-system-design.md`.

It covers:

- Exact same-suit-straight detection.
- Sequence length and type boundaries.
- Red-heart-trump wildcard constraints.
- Bomb ordering regressions.
- Structured table validation errors.
- Card-count validation detail suitable for later UI correction flows.

It does not implement candidate move generation, scoring, replay analysis, or UI improvements.

## File Structure

- Modify: `server/src/engine/combinationDetector.ts`
  - Enforce exact and bounded combination rules.
  - Keep wildcard substitution legal and deduplicated.
- Modify: `server/src/engine/combinationDetector.test.ts`
  - Add focused tests for same-suit-straight exact length, max sequence boundaries, and wildcard restrictions.
- Modify: `server/src/engine/combinationCompare.ts`
  - Make bomb power use `length` consistently and keep same-suit-straight between four-card bombs and five-card bombs.
- Modify: `server/src/engine/combinationCompare.test.ts`
  - Add regression tests for bomb ordering and incomparable same-type length mismatches.
- Create: `server/src/validator/validationErrors.ts`
  - Define local structured validation error shape for validators.
- Modify: `server/src/validator/tableValidator.ts`
  - Add structured `issues` while preserving current `errors: string[]`.
- Modify: `server/src/validator/tableValidator.test.ts`
  - Assert stable issue codes and compare results.
- Modify: `server/src/engine/cardPool.ts`
  - Add structured card-count validation alongside the existing string detail.
- Modify: `server/src/engine/cardPool.test.ts`
  - Assert hand-count conservation failures expose machine-readable detail.

Use path-specific commits because the current worktree already contains unrelated staged and unstaged changes.

---

### Task 1: Add Structured Table Validation Issues

**Files:**
- Create: `server/src/validator/validationErrors.ts`
- Modify: `server/src/validator/tableValidator.ts`
- Test: `server/src/validator/tableValidator.test.ts`

- [ ] **Step 1: Write the failing tests**

Append these tests inside `describe('validateTablePlay', () => { ... })` in `server/src/validator/tableValidator.test.ts`.

```ts
    it('should expose a structured issue for equal same-type plays', () => {
      const lead: CardCombination = {
        type: 'pair',
        cards: [
          { rank: '7', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
          { rank: '7', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        ],
        mainRank: '7',
        isTrump: false,
        wildcards: [],
      };
      const play: CardCombination = {
        type: 'pair',
        cards: [
          { rank: '7', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
          { rank: '7', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
        ],
        mainRank: '7',
        isTrump: false,
        wildcards: [],
      };

      const result = validateTablePlay(play, lead);

      expect(result.valid).toBe(false);
      expect(result.compareResult).toBe('equal');
      expect(result.issues).toEqual([
        {
          code: 'TABLE_EQUAL_STRENGTH',
          message: '出牌与台面相同大小，无法压过',
          severity: 'error',
          detail: { playType: 'pair', leadType: 'pair', compareResult: 'equal' },
        },
      ]);
      expect(result.errors).toEqual(['出牌与台面相同大小，无法压过']);
    });

    it('should expose a structured issue for mismatched non-bomb types', () => {
      const lead: CardCombination = {
        type: 'pair',
        cards: [],
        mainRank: '7',
        isTrump: false,
        wildcards: [],
      };
      const play: CardCombination = {
        type: 'straight',
        cards: [],
        mainRank: 'A',
        isTrump: false,
        length: 5,
        wildcards: [],
      };

      const result = validateTablePlay(play, lead);

      expect(result.valid).toBe(false);
      expect(result.compareResult).toBe('incomparable');
      expect(result.issues[0]).toEqual({
        code: 'TABLE_TYPE_MISMATCH',
        message: '牌型不匹配: 出straight对台面pair，且非炸弹',
        severity: 'error',
        detail: { playType: 'straight', leadType: 'pair', compareResult: 'incomparable' },
      });
    });
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm run test:server -- server/src/validator/tableValidator.test.ts
```

Expected: FAIL because `result.issues` is undefined.

- [ ] **Step 3: Add the structured error type**

Create `server/src/validator/validationErrors.ts`.

```ts
import type { CompareResult } from '@guandan/shared'

export type ValidationIssueCode =
  | 'TABLE_EQUAL_STRENGTH'
  | 'TABLE_LESSER_STRENGTH'
  | 'TABLE_INCOMPARABLE'
  | 'TABLE_BOMB_TOO_SMALL'
  | 'TABLE_NON_BOMB_VS_BOMB'
  | 'TABLE_TYPE_MISMATCH'
  | 'CARD_COUNT_TOTAL_MISMATCH'
  | 'CARD_COUNT_HAND_MISMATCH'

export interface ValidationIssue {
  code: ValidationIssueCode
  message: string
  severity: 'error' | 'warning'
  detail?: {
    playType?: string
    leadType?: string
    compareResult?: CompareResult
    handCount?: number
    playedCount?: number
    otherCount?: number
    totalCount?: number
    expectedTotal?: number
  }
}
```

- [ ] **Step 4: Update `validateTablePlay` to return issues**

Replace `server/src/validator/tableValidator.ts` with this implementation.

```ts
import {
  type CardCombination, type CompareResult,
} from '@guandan/shared'
import { compareCombinations } from '../engine/combinationCompare'
import type { ValidationIssue, ValidationIssueCode } from './validationErrors'

export interface TableValidationResult {
  valid: boolean
  errors: string[]
  issues: ValidationIssue[]
  compareResult?: CompareResult
}

function issue(
  code: ValidationIssueCode,
  message: string,
  play: CardCombination,
  lead: CardCombination,
  compareResult: CompareResult,
): ValidationIssue {
  return {
    code,
    message,
    severity: 'error',
    detail: {
      playType: play.type,
      leadType: lead.type,
      compareResult,
    },
  }
}

function invalid(
  code: ValidationIssueCode,
  message: string,
  play: CardCombination,
  lead: CardCombination,
  compareResult: CompareResult,
): TableValidationResult {
  return {
    valid: false,
    errors: [message],
    issues: [issue(code, message, play, lead, compareResult)],
    compareResult,
  }
}

export function validateTablePlay(
  play: CardCombination,
  lead: CardCombination | null,
): TableValidationResult {
  if (!lead) {
    return { valid: true, errors: [], issues: [] }
  }

  const playIsBomb = isBombType(play.type)
  const leadIsBomb = isBombType(lead.type)

  if (play.type === lead.type) {
    const result = compareCombinations(play, lead)
    if (result === 'greater') {
      return { valid: true, errors: [], issues: [], compareResult: result }
    }
    if (result === 'equal') {
      return invalid('TABLE_EQUAL_STRENGTH', '出牌与台面相同大小，无法压过', play, lead, result)
    }
    if (result === 'lesser') {
      return invalid('TABLE_LESSER_STRENGTH', '出牌小于台面，无法压过', play, lead, result)
    }
    return invalid('TABLE_INCOMPARABLE', '牌型无法比较', play, lead, 'incomparable')
  }

  if (playIsBomb && !leadIsBomb) {
    return { valid: true, errors: [], issues: [], compareResult: 'greater' }
  }

  if (playIsBomb && leadIsBomb) {
    const result = compareCombinations(play, lead)
    if (result === 'greater') {
      return { valid: true, errors: [], issues: [], compareResult: result }
    }
    return invalid('TABLE_BOMB_TOO_SMALL', '炸弹不够大，无法压过台面炸弹', play, lead, result)
  }

  if (!playIsBomb && leadIsBomb) {
    return invalid('TABLE_NON_BOMB_VS_BOMB', '非炸弹牌型无法压过炸弹', play, lead, 'lesser')
  }

  const message = `牌型不匹配: 出${play.type}对台面${lead.type}，且非炸弹`
  return invalid('TABLE_TYPE_MISMATCH', message, play, lead, 'incomparable')
}

function isBombType(type: CardCombination['type']): boolean {
  return type === 'joker_bomb' || type === 'bomb' || type === 'same_suit_straight'
}
```

- [ ] **Step 5: Run the table validator tests**

Run:

```bash
npm run test:server -- server/src/validator/tableValidator.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit only this task**

Run:

```bash
git add server/src/validator/validationErrors.ts server/src/validator/tableValidator.ts server/src/validator/tableValidator.test.ts
git commit --only server/src/validator/validationErrors.ts server/src/validator/tableValidator.ts server/src/validator/tableValidator.test.ts -m "feat: add structured table validation issues"
```

Expected: commit succeeds without including unrelated staged files.

---

### Task 2: Harden Same-Suit Straight and Sequence Boundaries

**Files:**
- Modify: `server/src/engine/combinationDetector.ts`
- Test: `server/src/engine/combinationDetector.test.ts`

- [ ] **Step 1: Write the failing tests**

Append these tests in `server/src/engine/combinationDetector.test.ts`.

```ts
  describe('phase A sequence boundaries', () => {
    it('should reject six-card same suit straight as same_suit_straight', () => {
      const cards: AnyCard[] = [
        { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '4', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '6', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '7', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '8', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)

      expect(result.combinations.some(c => c.type === 'same_suit_straight')).toBe(false)
      expect(result.combinations.some(c => c.type === 'straight')).toBe(true)
    })

    it('should detect the longest legal straight from 3 through A', () => {
      const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const
      const cards: AnyCard[] = ranks.map((rank, index) => ({
        rank,
        suit: index % 2 === 0 ? 'spade' : 'heart',
        copyIndex: 1,
        isTrump: false,
        isRedTrump: false,
      }))

      const result = detectCombination(cards)

      expect(result.combinations.some(c => c.type === 'straight' && c.length === 12 && c.mainRank === 'A')).toBe(true)
    })

    it('should reject pair straight longer than ten consecutive pairs', () => {
      const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const
      const cards: AnyCard[] = ranks.flatMap(rank => [
        { rank, suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank, suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
      ])

      const result = detectCombination(cards)

      expect(result.combinations.some(c => c.type === 'pair_straight')).toBe(false)
    })
  })
```

- [ ] **Step 2: Run the detector tests to verify failure**

Run:

```bash
npm run test:server -- server/src/engine/combinationDetector.test.ts
```

Expected: FAIL because six-card same-suit straight is currently accepted as `same_suit_straight`, and pair straights longer than ten pairs are not explicitly rejected.

- [ ] **Step 3: Add exact boundaries to detector helpers**

In `server/src/engine/combinationDetector.ts`, replace the start of `detectSameSuitStraight`, `detectStraight`, `detectPairStraight`, and `detectAirplane` with these boundary checks while keeping the existing body after the checks.

```ts
function detectSameSuitStraight(cards: AnyCard[]): CardCombination | null {
  if (cards.length !== 5) return null
  if (cards.some(isJoker)) return null
  const cs = cards as Card[]
  if (cs.some(c => c.rank === '2')) return null
  const suit = cs[0].suit
  if (!cs.every(c => c.suit === suit)) return null
  const ranks = cs.map(c => c.rank).sort((a, b) => rankValue(a) - rankValue(b))
  if (new Set(ranks).size !== ranks.length) return null
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
  if (cards.length < 5 || cards.length > 12) return null
  if (cards.some(isJoker)) return null
  const cs = cards as Card[]
  if (cs.some(c => c.rank === '2')) return null
  const ranks = cs.map(c => c.rank).sort((a, b) => rankValue(a) - rankValue(b))
  if (new Set(ranks).size !== ranks.length) return null
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
  if (pairs.length < 3 || pairs.length > 10) return null
  pairs.sort((a, b) => rankValue(a) - rankValue(b))
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
  if (cards.some(isJoker)) return null
  const triples: Rank[] = []
  for (const [, group] of groups) {
    if (group.length === 3) {
      if ((group[0] as Card).rank === '2') return null
      triples.push((group[0] as Card).rank)
    } else {
      return null
    }
  }
  if (triples.length < 2 || triples.length > 10) return null
  triples.sort((a, b) => rankValue(a) - rankValue(b))
  if (!isConsecutive(triples)) return null
  return {
    type: 'airplane',
    cards,
    mainRank: triples[triples.length - 1],
    isTrump: hasTrump(cards),
    length: triples.length,
    wildcards: [],
  }
}
```

- [ ] **Step 4: Run detector tests**

Run:

```bash
npm run test:server -- server/src/engine/combinationDetector.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit only this task**

Run:

```bash
git add server/src/engine/combinationDetector.ts server/src/engine/combinationDetector.test.ts
git commit --only server/src/engine/combinationDetector.ts server/src/engine/combinationDetector.test.ts -m "fix: harden sequence combination boundaries"
```

Expected: commit succeeds without including unrelated staged files.

---

### Task 3: Constrain Red-Heart-Trump Wildcard Detection

**Files:**
- Modify: `server/src/engine/combinationDetector.ts`
- Test: `server/src/engine/combinationDetector.test.ts`

- [ ] **Step 1: Write the failing tests**

Append these tests in the existing `describe('wildcard (red trump)', () => { ... })` block.

```ts
    it('should reject combinations that try to use two red trump wildcards', () => {
      const cards: AnyCard[] = [
        { rank: '7', suit: 'heart', copyIndex: 1, isTrump: true, isRedTrump: true },
        { rank: '7', suit: 'heart', copyIndex: 2, isTrump: true, isRedTrump: true },
        { rank: '8', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '9', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '10', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)

      expect(result.combinations.every(c => c.wildcards.length <= 1)).toBe(true)
      expect(result.combinations.some(c => c.wildcards.length === 1)).toBe(false)
    })

    it('should preserve wildcard substitute rank and suit for same suit straight', () => {
      const cards: AnyCard[] = [
        { rank: '7', suit: 'heart', copyIndex: 1, isTrump: true, isRedTrump: true },
        { rank: '8', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '9', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: '10', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
        { rank: 'J', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
      ]

      const result = detectCombination(cards)
      const sameSuit = result.combinations.find(c => c.type === 'same_suit_straight')

      expect(sameSuit?.wildcards).toEqual([
        {
          card: { rank: '7', suit: 'heart', copyIndex: 1, isTrump: true, isRedTrump: true },
          substitute: '7',
          substituteSuit: 'spade',
        },
      ])
    })
```

- [ ] **Step 2: Run the detector tests to verify failure**

Run:

```bash
npm run test:server -- server/src/engine/combinationDetector.test.ts
```

Expected: FAIL because current wildcard detection uses only the first red trump and can still leave another red trump as a normal card in the virtual hand.

- [ ] **Step 3: Update wildcard detection**

In `server/src/engine/combinationDetector.ts`, replace `detectWithWildcard` with this implementation.

```ts
function detectWithWildcard(cards: AnyCard[]): CardCombination[] {
  const wildcards = findWildcards(cards)
  if (wildcards.length === 0) return []
  if (wildcards.length > 1) return []

  const results: CardCombination[] = []
  const wildcardCard = wildcards[0]
  const nonWildcardCards = removeCards(cards, [wildcardCard])

  const substitutionTargets: { rank: Rank; suit?: Suit }[] = []
  for (const rank of RANKS_FOR_SEQUENCES) {
    for (const suit of ['spade', 'heart', 'diamond', 'club'] as Suit[]) {
      if (rank === wildcardCard.rank && suit === wildcardCard.suit) continue
      substitutionTargets.push({ rank, suit })
    }
  }
  for (const suit of ['spade', 'heart', 'diamond', 'club'] as Suit[]) {
    if (wildcardCard.rank === '2' && suit === wildcardCard.suit) continue
    substitutionTargets.push({ rank: '2', suit })
  }

  const seenKeys = new Set<string>()
  for (const target of substitutionTargets) {
    const key = `${target.rank}_${target.suit || 'none'}`
    if (seenKeys.has(key)) continue
    seenKeys.add(key)

    const substituted: AnyCard = {
      rank: target.rank,
      suit: target.suit || wildcardCard.suit,
      copyIndex: wildcardCard.copyIndex,
      isTrump: false,
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
      results.push({
        ...combo,
        cards,
        isTrump: hasTrump(nonWildcardCards),
        wildcards: [wc],
      })
    }

    tryAdd(detectBomb(virtualCards, virtualGroups))
    tryAdd(detectSameSuitStraight(virtualCards))
    tryAdd(detectStraight(virtualCards))
    tryAdd(detectPairStraight(virtualCards, virtualGroups))
    tryAdd(detectAirplane(virtualCards, virtualGroups))
    tryAdd(detectTripleWithPair(virtualCards, virtualGroups))
    tryAdd(detectTriple(virtualCards, virtualGroups))
    tryAdd(detectPair(virtualCards, virtualGroups))
  }

  return results
}
```

- [ ] **Step 4: Run detector and trump validator tests**

Run:

```bash
npm run test:server -- server/src/engine/combinationDetector.test.ts server/src/validator/trumpValidator.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit only this task**

Run:

```bash
git add server/src/engine/combinationDetector.ts server/src/engine/combinationDetector.test.ts
git commit --only server/src/engine/combinationDetector.ts server/src/engine/combinationDetector.test.ts -m "fix: constrain red trump wildcard detection"
```

Expected: commit succeeds without including unrelated staged files.

---

### Task 4: Lock Bomb and Same-Suit-Straight Ordering

**Files:**
- Modify: `server/src/engine/combinationCompare.ts`
- Test: `server/src/engine/combinationCompare.test.ts`

- [ ] **Step 1: Write the failing regression tests**

Append this block inside `describe('compareCombinations', () => { ... })` in `server/src/engine/combinationCompare.test.ts`.

```ts
    describe('phase A bomb ordering', () => {
      it('should rank same suit straight above four-card bomb and below five-card bomb', () => {
        const fourBomb: CardCombination = {
          type: 'bomb',
          cards: [
            { rank: 'A', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'A', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'A', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: 'A', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
          ],
          mainRank: 'A',
          isTrump: false,
          length: 4,
          wildcards: [],
        }
        const sameSuit: CardCombination = {
          type: 'same_suit_straight',
          cards: [
            { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '4', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '5', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '6', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '7', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
          ],
          mainRank: '7',
          isTrump: false,
          length: 5,
          wildcards: [],
        }
        const fiveBomb: CardCombination = {
          type: 'bomb',
          cards: [
            { rank: '3', suit: 'spade', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'heart', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'diamond', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'club', copyIndex: 1, isTrump: false, isRedTrump: false },
            { rank: '3', suit: 'spade', copyIndex: 2, isTrump: false, isRedTrump: false },
          ],
          mainRank: '3',
          isTrump: false,
          length: 5,
          wildcards: [],
        }

        expect(compareCombinations(sameSuit, fourBomb)).toBe('greater')
        expect(compareCombinations(sameSuit, fiveBomb)).toBe('lesser')
      })

      it('should use explicit bomb length when cards are omitted in validator fixtures', () => {
        const fiveBomb: CardCombination = {
          type: 'bomb',
          cards: [],
          mainRank: '3',
          isTrump: false,
          length: 5,
          wildcards: [],
        }
        const fourBomb: CardCombination = {
          type: 'bomb',
          cards: [],
          mainRank: 'A',
          isTrump: false,
          length: 4,
          wildcards: [],
        }

        expect(compareCombinations(fiveBomb, fourBomb)).toBe('greater')
      })
    })
```

- [ ] **Step 2: Run the compare tests to verify failure**

Run:

```bash
npm run test:server -- server/src/engine/combinationCompare.test.ts
```

Expected: FAIL on the explicit-length test because `bombPower` currently reads `combo.cards.length`.

- [ ] **Step 3: Update bomb power to use explicit length**

In `server/src/engine/combinationCompare.ts`, replace `bombPower` with this implementation.

```ts
function bombPower(combo: CardCombination): number {
  if (combo.type === 'joker_bomb') return 1000
  if (combo.type === 'bomb') {
    const len = combo.length ?? combo.cards.length
    const mainVal = combo.mainRank ? rankValue(combo.mainRank) : 0
    if (len === 4) {
      return 400 + mainVal
    }
    return (len + 1) * 100 + mainVal
  }
  if (combo.type === 'same_suit_straight') {
    const mainVal = combo.mainRank ? rankValue(combo.mainRank) : 0
    return 500 + mainVal
  }
  return 0
}
```

In the `case 'bomb'` block of `compareSameType`, replace direct `cards.length` comparisons with explicit length.

```ts
    case 'bomb': {
      const aLength = a.length ?? a.cards.length
      const bLength = b.length ?? b.cards.length
      if (aLength !== bLength) {
        return aLength > bLength ? 'greater' : 'lesser'
      }
      if (!a.mainRank || !b.mainRank) return 'incomparable'
      const aVal = rankValue(a.mainRank)
      const bVal = rankValue(b.mainRank)
      if (aVal !== bVal) return aVal > bVal ? 'greater' : 'lesser'
      if (a.isTrump && !b.isTrump) return 'greater'
      if (!a.isTrump && b.isTrump) return 'lesser'
      return 'equal'
    }
```

- [ ] **Step 4: Run compare and table validator tests**

Run:

```bash
npm run test:server -- server/src/engine/combinationCompare.test.ts server/src/validator/tableValidator.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit only this task**

Run:

```bash
git add server/src/engine/combinationCompare.ts server/src/engine/combinationCompare.test.ts
git commit --only server/src/engine/combinationCompare.ts server/src/engine/combinationCompare.test.ts -m "fix: lock bomb ordering semantics"
```

Expected: commit succeeds without including unrelated staged files.

---

### Task 5: Add Structured Card Count Validation Detail

**Files:**
- Modify: `server/src/engine/cardPool.ts`
- Test: `server/src/engine/cardPool.test.ts`
- Reuse: `server/src/validator/validationErrors.ts`

- [ ] **Step 1: Write the failing tests**

Append this block in `server/src/engine/cardPool.test.ts`.

```ts
describe('verifyCardCount structured detail', () => {
  it('should expose structured hand mismatch data', () => {
    const pool = createCardPool('7')
    pool.players[0].handCount = 27
    pool.players[1].handCount = 26
    pool.players[2].handCount = 27
    pool.players[3].handCount = 27

    const result = verifyCardCount(pool)

    expect(result.valid).toBe(false)
    expect(result.issues).toEqual([
      {
        code: 'CARD_COUNT_HAND_MISMATCH',
        message: '手牌总数107 + 已出0 = 107 ≠ 108',
        severity: 'error',
        detail: {
          handCount: 107,
          playedCount: 0,
          totalCount: 107,
          expectedTotal: 108,
        },
      },
    ])
  })
})
```

- [ ] **Step 2: Run the card pool tests to verify failure**

Run:

```bash
npm run test:server -- server/src/engine/cardPool.test.ts
```

Expected: FAIL because `verifyCardCount` does not return `issues`.

- [ ] **Step 3: Update `verifyCardCount` return shape**

In `server/src/engine/cardPool.ts`, add this import.

```ts
import type { ValidationIssue } from '../validator/validationErrors'
```

Replace `verifyCardCount` with this implementation.

```ts
export function verifyCardCount(pool: CardPool): { valid: boolean; detail: string; issues: ValidationIssue[] } {
  let inHand = 0
  let played = 0
  let unknown = 0
  for (const state of pool.allCardStates) {
    switch (state.status) {
      case 'in_my_hand':
      case 'in_opponent_hand':
      case 'in_teammate_hand':
        inHand++
        break
      case 'in_play':
      case 'archived':
        played++
        break
      default:
        unknown++
    }
  }
  const total = inHand + played + unknown
  if (total !== 108) {
    const detail = `牌数异常: 手牌${inHand} + 已出${played} + 其他${unknown} = ${total} ≠ 108`
    return {
      valid: false,
      detail,
      issues: [{
        code: 'CARD_COUNT_TOTAL_MISMATCH',
        message: detail,
        severity: 'error',
        detail: {
          handCount: inHand,
          playedCount: played,
          otherCount: unknown,
          totalCount: total,
          expectedTotal: 108,
        },
      }],
    }
  }
  let handSum = 0
  for (const p of Object.values(pool.players)) {
    handSum += p.handCount
  }
  if (handSum + played !== 108) {
    const totalCount = handSum + played
    const detail = `手牌总数${handSum} + 已出${played} = ${totalCount} ≠ 108`
    return {
      valid: false,
      detail,
      issues: [{
        code: 'CARD_COUNT_HAND_MISMATCH',
        message: detail,
        severity: 'error',
        detail: {
          handCount: handSum,
          playedCount: played,
          totalCount,
          expectedTotal: 108,
        },
      }],
    }
  }
  return { valid: true, detail: '牌数校验通过', issues: [] }
}
```

- [ ] **Step 4: Run card pool tests**

Run:

```bash
npm run test:server -- server/src/engine/cardPool.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run all server tests touched by phase A**

Run:

```bash
npm run test:server -- server/src/engine/combinationDetector.test.ts server/src/engine/combinationCompare.test.ts server/src/engine/cardPool.test.ts server/src/validator/tableValidator.test.ts server/src/validator/trumpValidator.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit only this task**

Run:

```bash
git add server/src/engine/cardPool.ts server/src/engine/cardPool.test.ts server/src/validator/validationErrors.ts
git commit --only server/src/engine/cardPool.ts server/src/engine/cardPool.test.ts server/src/validator/validationErrors.ts -m "feat: add structured card count validation"
```

Expected: commit succeeds without including unrelated staged files.

---

### Task 6: Phase A Verification

**Files:**
- No code changes expected.

- [ ] **Step 1: Run targeted server tests**

Run:

```bash
npm run test:server -- server/src/engine/combinationDetector.test.ts server/src/engine/combinationCompare.test.ts server/src/engine/cardPool.test.ts server/src/validator/tableValidator.test.ts server/src/validator/trumpValidator.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run server typecheck**

Run:

```bash
npm run typecheck -w server
```

Expected: PASS.

- [ ] **Step 3: Inspect final diff for phase A files**

Run:

```bash
git diff --stat HEAD -- server/src/engine/combinationDetector.ts server/src/engine/combinationDetector.test.ts server/src/engine/combinationCompare.ts server/src/engine/combinationCompare.test.ts server/src/engine/cardPool.ts server/src/engine/cardPool.test.ts server/src/validator/tableValidator.ts server/src/validator/tableValidator.test.ts server/src/validator/validationErrors.ts
```

Expected: no output if each prior task was committed.

---

## Self-Review

Spec coverage:

- Rule and card type hardening maps to Tasks 2 and 3.
- Bomb and same-suit-straight ordering maps to Task 4.
- Structured validation errors maps to Tasks 1 and 5.
- Verification maps to Task 6.
- Candidate generation, scoring, replay, and UI work are intentionally deferred to phases B, C, and D.

Placeholder scan:

- The plan contains no unresolved implementation placeholders.

Type consistency:

- `ValidationIssue` is local to `server/src/validator/validationErrors.ts`.
- `TableValidationResult.issues` and `verifyCardCount(...).issues` use the same `ValidationIssue` type.
- Existing `errors: string[]` and `detail: string` fields remain for compatibility.
