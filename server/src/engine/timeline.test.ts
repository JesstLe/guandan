import { describe, it, expect, beforeEach } from 'vitest'
import { Timeline } from './timeline'
import { type AnyCard, type Rank, type Suit, type CombinationType } from '@guandan/shared'

describe('timeline', () => {
  let timeline: Timeline

  beforeEach(() => {
    timeline = new Timeline()
  })

  describe('initial state', () => {
    it('should start with length 0', () => {
      expect(timeline.length).toBe(0)
    })

    it('should have empty all array', () => {
      expect(timeline.all).toEqual([])
    })

    it('should have undefined last', () => {
      expect(timeline.last).toBeUndefined()
    })
  })

  describe('push', () => {
    it('should add event to timeline', () => {
      const event = timeline.push('new_game', { trumpRank: '7' })

      expect(timeline.length).toBe(1)
      expect(event.type).toBe('new_game')
    })

    it('should assign unique id to each event', () => {
      const event1 = timeline.push('new_game', {})
      const event2 = timeline.push('play', {})

      expect(event1.id).not.toBe(event2.id)
    })

    it('should set timestamp', () => {
      const before = Date.now()
      const event = timeline.push('new_game', {})
      const after = Date.now()

      expect(event.timestamp).toBeGreaterThanOrEqual(before)
      expect(event.timestamp).toBeLessThanOrEqual(after)
    })

    it('should include derived inferences', () => {
      const inferences = [{ description: 'test', confidence: 0.5, sourceEventId: 'x', type: 'pass_inference' as const }]
      const event = timeline.push('new_game', {}, inferences)

      expect(event.derivedInferences).toHaveLength(1)
    })

    it('should update last property', () => {
      timeline.push('new_game', {})
      timeline.push('play', {})

      expect(timeline.last?.type).toBe('play')
    })
  })

  describe('undo', () => {
    it('should remove and return last event', () => {
      timeline.push('new_game', {})
      timeline.push('play', {})

      const undone = timeline.undo()

      expect(undone?.type).toBe('play')
      expect(timeline.length).toBe(1)
    })

    it('should return null when empty', () => {
      const undone = timeline.undo()

      expect(undone).toBeNull()
    })

    it('should return events in reverse order', () => {
      timeline.push('new_game', {})
      timeline.push('play', { player: 0 })
      timeline.push('play', { player: 1 })

      const first = timeline.undo()
      const second = timeline.undo()
      const third = timeline.undo()

      expect(first?.data.player).toBe(1)
      expect(second?.data.player).toBe(0)
      expect(third?.type).toBe('new_game')
    })
  })

  describe('getEventsByType', () => {
    it('should filter events by type', () => {
      timeline.push('new_game', {})
      timeline.push('play', {})
      timeline.push('play', {})
      timeline.push('pass', {})

      const playEvents = timeline.getEventsByType('play')

      expect(playEvents).toHaveLength(2)
      expect(playEvents.every(e => e.type === 'play')).toBe(true)
    })

    it('should return empty array when no matches', () => {
      timeline.push('new_game', {})

      const passEvents = timeline.getEventsByType('pass')

      expect(passEvents).toHaveLength(0)
    })
  })

  describe('getEventsByPlayer', () => {
    it('should filter events by player', () => {
      timeline.push('play', { player: 0 })
      timeline.push('play', { player: 1 })
      timeline.push('play', { player: 0 })
      timeline.push('pass', { player: 1 })

      const player0Events = timeline.getEventsByPlayer(0)

      expect(player0Events).toHaveLength(2)
      expect(player0Events.every(e => e.data.player === 0)).toBe(true)
    })
  })

  describe('getPlayEvents', () => {
    it('should return only play events', () => {
      timeline.push('new_game', {})
      timeline.push('play', {})
      timeline.push('pass', {})
      timeline.push('play', {})

      const playEvents = timeline.getPlayEvents()

      expect(playEvents).toHaveLength(2)
      expect(playEvents.every(e => e.type === 'play')).toBe(true)
    })
  })

  describe('getPassEvents', () => {
    it('should return only pass events', () => {
      timeline.push('new_game', {})
      timeline.push('pass', {})
      timeline.push('play', {})
      timeline.push('pass', {})

      const passEvents = timeline.getPassEvents()

      expect(passEvents).toHaveLength(2)
      expect(passEvents.every(e => e.type === 'pass')).toBe(true)
    })
  })

  describe('getEventsFrom', () => {
    it('should return events from index onwards', () => {
      timeline.push('new_game', {})
      timeline.push('play', {})
      timeline.push('play', {})
      timeline.push('pass', {})

      const events = timeline.getEventsFrom(2)

      expect(events).toHaveLength(2)
      expect(events[0].type).toBe('play')
      expect(events[1].type).toBe('pass')
    })

    it('should return empty when index exceeds length', () => {
      timeline.push('new_game', {})

      const events = timeline.getEventsFrom(5)

      expect(events).toHaveLength(0)
    })
  })

  describe('replayFrom', () => {
    it('should call callback for each event from index', () => {
      timeline.push('new_game', {})
      timeline.push('play', {})
      timeline.push('play', {})

      const called: string[] = []
      timeline.replayFrom(1, (event) => {
        called.push(event.type)
      })

      expect(called).toEqual(['play', 'play'])
    })
  })

  describe('clear', () => {
    it('should remove all events', () => {
      timeline.push('new_game', {})
      timeline.push('play', {})

      timeline.clear()

      expect(timeline.length).toBe(0)
      expect(timeline.all).toEqual([])
    })
  })

  describe('snapshot and restore', () => {
    it('should create a snapshot of events', () => {
      timeline.push('new_game', {})
      timeline.push('play', {})

      const snapshot = timeline.snapshot()

      expect(snapshot).toHaveLength(2)
      expect(snapshot[0].type).toBe('new_game')
    })

    it('should create deep copy that is independent', () => {
      timeline.push('new_game', {})
      const snapshot = timeline.snapshot()

      timeline.push('play', {})

      expect(snapshot).toHaveLength(1)
      expect(timeline.length).toBe(2)
    })

    it('should restore events from snapshot', () => {
      timeline.push('new_game', {})
      const snapshot = timeline.snapshot()
      timeline.push('play', {})

      timeline.restore(snapshot)

      expect(timeline.length).toBe(1)
      expect(timeline.last?.type).toBe('new_game')
    })

    it('should deep copy on restore', () => {
      timeline.push('new_game', {})
      const snapshot = timeline.snapshot()
      snapshot[0].type = 'play'

      expect(timeline.last?.type).toBe('new_game')
    })
  })

  describe('all property', () => {
    it('should return copy of events', () => {
      timeline.push('new_game', {})
      const all1 = timeline.all
      const all2 = timeline.all

      expect(all1).not.toBe(all2)
      expect(all1).toEqual(all2)
    })
  })

  describe('event data preservation', () => {
    it('should preserve complex event data', () => {
      const eventData = {
        player: 0,
        cards: [
          { rank: '3' as Rank, suit: 'spade' as Suit, copyIndex: 1, isTrump: false, isRedTrump: false },
        ] as AnyCard[],
        combination: {
          type: 'single' as CombinationType,
          cards: [] as AnyCard[],
          isTrump: false,
          wildcards: [],
        },
      }
      timeline.push('play', eventData)

      const last = timeline.last
      expect(last?.data.player).toBe(0)
      expect(last?.data.cards).toHaveLength(1)
      expect((last?.data.combination as { type: CombinationType })?.type).toBe('single')
    })
  })
})