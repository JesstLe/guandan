import { type GameEvent, type EventData, type PlayerInference } from '@guandan/shared'
import { v4 as uuid } from 'uuid'

export class Timeline {
  private events: GameEvent[] = []

  get length(): number {
    return this.events.length
  }

  get all(): GameEvent[] {
    return [...this.events]
  }

  get last(): GameEvent | undefined {
    return this.events[this.events.length - 1]
  }

  push(
    type: GameEvent['type'],
    data: EventData,
    inferences: PlayerInference[] = [],
  ): GameEvent {
    const event: GameEvent = {
      id: uuid(),
      type,
      data,
      timestamp: Date.now(),
      derivedInferences: inferences,
    }
    this.events.push(event)
    return event
  }

  undo(): GameEvent | null {
    return this.events.pop() || null
  }

  getEventsByType(type: GameEvent['type']): GameEvent[] {
    return this.events.filter(e => e.type === type)
  }

  getEventsByPlayer(player: number): GameEvent[] {
    return this.events.filter(e => e.data.player === player)
  }

  getPlayEvents(): GameEvent[] {
    return this.events.filter(e => e.type === 'play')
  }

  getPassEvents(): GameEvent[] {
    return this.events.filter(e => e.type === 'pass')
  }

  getEventsFrom(index: number): GameEvent[] {
    return this.events.slice(index)
  }

  replayFrom(index: number, callback: (event: GameEvent) => void): void {
    for (let i = index; i < this.events.length; i++) {
      callback(this.events[i])
    }
  }

  clear(): void {
    this.events = []
  }

  snapshot(): GameEvent[] {
    return JSON.parse(JSON.stringify(this.events))
  }

  restore(events: GameEvent[]): void {
    this.events = JSON.parse(JSON.stringify(events))
  }
}
