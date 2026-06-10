import React, { useMemo, useCallback } from 'react'
import { type AnyCard, type Card, type JokerCard, type Rank, ALL_SUITS } from '@guandan/shared'
import { motion } from 'motion/react'
import { PlayingCard } from './PlayingCard'

interface HandPickerProps {
  trumpRank: Rank
  selectedCards: AnyCard[]
  onSelectionChange: (cards: AnyCard[]) => void
  maxCards?: number
}

const ORDERED_RANKS: Rank[] = ['2', 'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3']

export const HandPicker: React.FC<HandPickerProps> = ({
  trumpRank,
  selectedCards,
  onSelectionChange,
  maxCards = 27,
}) => {
  const selectedIds = useMemo(() => new Set(selectedCards.map(cId)), [selectedCards])

  const toggle = useCallback((card: AnyCard) => {
    const id = cId(card)
    if (selectedIds.has(id)) {
      onSelectionChange(selectedCards.filter(c => cId(c) !== id))
    } else if (selectedCards.length < maxCards) {
      onSelectionChange([...selectedCards, card])
    }
  }, [selectedCards, selectedIds, onSelectionChange, maxCards])

  const isFull = selectedCards.length >= maxCards

  // Drag selection state refs
  const isDraggingRef = React.useRef(false)
  const dragActionRef = React.useRef<'select' | 'deselect' | null>(null)
  const processedCardsRef = React.useRef<Set<string>>(new Set())

  const startDrag = useCallback((card: AnyCard) => {
    isDraggingRef.current = true
    const id = cId(card)
    const isAlreadySelected = selectedIds.has(id)
    dragActionRef.current = isAlreadySelected ? 'deselect' : 'select'
    processedCardsRef.current.clear()
    processedCardsRef.current.add(id)
    toggle(card)
  }, [selectedIds, toggle])

  const handleMouseEnterCard = useCallback((card: AnyCard) => {
    if (!isDraggingRef.current || !dragActionRef.current) return
    const id = cId(card)
    if (processedCardsRef.current.has(id)) return
    processedCardsRef.current.add(id)

    const isAlreadySelected = selectedIds.has(id)
    if (dragActionRef.current === 'select' && !isAlreadySelected) {
      if (selectedCards.length < maxCards) {
        // Calculate new selected cards list correctly by appending to current local copy
        onSelectionChange([...selectedCards, card])
      }
    } else if (dragActionRef.current === 'deselect' && isAlreadySelected) {
      onSelectionChange(selectedCards.filter(c => cId(c) !== id))
    }
  }, [selectedCards, selectedIds, onSelectionChange, maxCards])

  const stopDrag = useCallback(() => {
    isDraggingRef.current = false
    dragActionRef.current = null
    processedCardsRef.current.clear()
  }, [])

  const dragHandlers = (card: AnyCard) => ({
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault()
      startDrag(card)
    },
    onMouseEnter: () => {
      handleMouseEnterCard(card)
    }
  })

  return (
    <div
      style={styles.container}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
    >
      <div style={styles.header}>
        <span style={styles.title}>选择手牌</span>
        <span style={{
          ...styles.counter,
          color: selectedCards.length === maxCards ? '#2b8a3e' : '#4b5563',
          background: selectedCards.length === maxCards ? 'rgba(81,207,102,0.15)' : '#f3f4f6',
        }}>
          {selectedCards.length} / {maxCards}
        </span>
      </div>

      <div style={styles.grid}>
        {/* Jokers Column */}
        <div style={styles.rankColumn}>
          <span style={styles.rankColumnLabel}>王牌</span>
          <div style={styles.rankButtonsContainer}>
            {/* Big Joker Row */}
            <div style={styles.jokerRow}>
              {[1, 2].map(copyIndex => {
                const card: JokerCard = { type: 'big', copyIndex: copyIndex as 1 | 2 }
                const id = cId(card)
                const selected = selectedIds.has(id)
                const disabled = !selected && isFull
                return (
                  <PlayingCard
                    key={id}
                    card={card}
                    selected={selected}
                    disabled={disabled}
                    compact
                    dragHandlers={dragHandlers(card)}
                    onClick={() => toggle(card)}
                  />
                )
              })}
            </div>
            {/* Small Joker Row */}
            <div style={styles.jokerRow}>
              {[1, 2].map(copyIndex => {
                const card: JokerCard = { type: 'small', copyIndex: copyIndex as 1 | 2 }
                const id = cId(card)
                const selected = selectedIds.has(id)
                const disabled = !selected && isFull
                return (
                  <PlayingCard
                    key={id}
                    card={card}
                    selected={selected}
                    disabled={disabled}
                    compact
                    dragHandlers={dragHandlers(card)}
                    onClick={() => toggle(card)}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* Regular Ranks Columns */}
        {ORDERED_RANKS.map(rank => {
          const isTrump = rank === trumpRank
          return (
            <div key={rank} style={styles.rankColumn}>
              <span style={{
                ...styles.rankColumnLabel,
                ...(isTrump ? styles.trumpRankLabel : {})
              }}>
                {rank}{isTrump ? '★' : ''}
              </span>
              <div style={styles.rankButtonsContainer}>
                {ALL_SUITS.map(suit => {
                  const isRedTrump = isTrump && suit === 'heart'
                  return (
                    <div key={suit} style={styles.suitButtonsRow}>
                      {[1, 2].map(copyIndex => {
                        const card: Card = {
                          rank, suit, copyIndex: copyIndex as 1 | 2,
                          isTrump, isRedTrump,
                        }
                        const id = cId(card)
                        const selected = selectedIds.has(id)
                        const disabled = !selected && isFull
                        return (
                          <PlayingCard
                            key={id}
                            card={card}
                            selected={selected}
                            disabled={disabled}
                            compact
                            dragHandlers={dragHandlers(card)}
                            onClick={() => toggle(card)}
                          />
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {isFull && (
        <div style={styles.fullHint}>已选满 {maxCards} 张牌</div>
      )}

      <div style={styles.actions}>
        <button style={styles.clearBtn} onClick={() => onSelectionChange([])}>
          清空选择
        </button>
      </div>
    </div>
  )
}

function cId(card: AnyCard): string {
  if ('type' in card) return `${card.type}-copy${card.copyIndex}`
  return `${card.suit}-${card.rank}-copy${card.copyIndex}`
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#ffffff',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontWeight: 700,
    fontSize: 15,
    color: '#1f2937',
  },
  counter: {
    fontSize: 14,
    fontWeight: 700,
    padding: '4px 14px',
    borderRadius: 20,
    transition: 'all 0.2s ease',
  },
  grid: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
    overflowX: 'auto',
    paddingBottom: 8,
  },
  rankColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    background: '#f9fafb',
    padding: '8px 6px',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    flexShrink: 0,
  },
  rankColumnLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#4b5563',
    marginBottom: 4,
    textAlign: 'center',
  },
  trumpRankLabel: {
    color: '#f59f00',
    textShadow: '0 0 8px rgba(245,159,0,0.3)',
  },
  rankButtonsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  suitButtonsRow: {
    display: 'flex',
    gap: 4,
  },
  jokerRow: {
    display: 'flex',
    gap: 4,
  },
  fullHint: {
    textAlign: 'center',
    color: '#16a34a',
    fontSize: 13,
    fontWeight: 700,
    marginTop: 10,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  clearBtn: {
    padding: '6px 18px',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#d1d5db',
    borderRadius: 8,
    background: '#ffffff',
    cursor: 'pointer',
    fontSize: 12,
    color: '#4b5563',
    fontWeight: 600,
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
}
