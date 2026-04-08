import React, { useMemo, useCallback } from 'react'
import { type AnyCard, type Card, type JokerCard, type Rank, type Suit, ALL_RANKS, ALL_SUITS } from '@guandan/shared'

const SUIT_SYMBOL: Record<Suit, string> = {
  spade: '♠', heart: '♥', diamond: '♦', club: '♣',
}

const SUIT_COLOR: Record<Suit, string> = {
  spade: '#1a1a2e', heart: '#e63946', diamond: '#e63946', club: '#1a1a2e',
}

interface HandPickerProps {
  trumpRank: Rank
  selectedCards: AnyCard[]
  onSelectionChange: (cards: AnyCard[]) => void
  maxCards?: number
}

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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>选择手牌</span>
        <span style={{
          ...styles.counter,
          color: selectedCards.length === maxCards ? '#2b8a3e' : '#495057',
        }}>
          {selectedCards.length} / {maxCards}
        </span>
      </div>

      <div style={styles.grid}>
        {ALL_SUITS.map(suit => (
          <div key={suit} style={styles.suitRow}>
            <span style={{ ...styles.suitLabel, color: SUIT_COLOR[suit] }}>
              {SUIT_SYMBOL[suit]}
            </span>
            {ALL_RANKS.map(rank => {
              const isTrump = rank === trumpRank
              const isRedTrump = rank === trumpRank && suit === 'heart'
              return (
                <div key={`${suit}-${rank}`} style={styles.rankCell}>
                  {[1, 2].map(copyIndex => {
                    const card: Card = {
                      rank, suit, copyIndex: copyIndex as 1 | 2,
                      isTrump, isRedTrump,
                    }
                    const id = cId(card)
                    const selected = selectedIds.has(id)
                    const disabled = !selected && isFull
                    return (
                      <button
                        key={id}
                        style={{
                          ...styles.cardBtn,
                          ...(selected ? styles.cardBtnSelected : {}),
                          ...(disabled ? styles.cardBtnDisabled : {}),
                          ...(isTrump ? styles.cardBtnTrump : {}),
                          ...(isRedTrump ? styles.cardBtnRedTrump : {}),
                        }}
                        onClick={() => toggle(card)}
                        disabled={disabled}
                      >
                        <span style={{ color: SUIT_COLOR[suit], fontSize: 9, lineHeight: 1 }}>
                          {SUIT_SYMBOL[suit]}
                        </span>
                        <span style={{ fontSize: 11, lineHeight: 1 }}>{rank}</span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}

        <div style={styles.suitRow}>
          <span style={styles.suitLabel}>🃏</span>
          {(['small', 'big'] as const).flatMap(type =>
            ([1, 2] as const).map(copyIndex => {
              const card: JokerCard = { type, copyIndex }
              const id = cId(card)
              const selected = selectedIds.has(id)
              const disabled = !selected && isFull
              const isBig = type === 'big'
              return (
                <button
                  key={id}
                  style={{
                    ...styles.cardBtn,
                    ...styles.jokerBtn,
                    ...(selected ? styles.cardBtnSelected : {}),
                    ...(disabled ? styles.cardBtnDisabled : {}),
                    ...(isBig ? styles.bigJoker : styles.smallJoker),
                  }}
                  onClick={() => toggle(card)}
                  disabled={disabled}
                >
                  <span style={{ fontSize: 10, lineHeight: 1 }}>
                    {isBig ? '大' : '小'}
                  </span>
                  <span style={{ fontSize: 9, lineHeight: 1 }}>王</span>
                </button>
              )
            })
          )}
        </div>
      </div>

      {isFull && (
        <div style={styles.fullHint}>✅ 已选满 {maxCards} 张牌</div>
      )}

      <div style={styles.actions}>
        <button style={styles.clearBtn} onClick={() => onSelectionChange([])}>
          清空
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
    background: '#fff',
    border: '1px solid #dee2e6',
    borderRadius: 8,
    padding: 16,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#343a40',
  },
  counter: {
    fontSize: 14,
    fontWeight: 700,
    padding: '2px 10px',
    background: '#f1f3f5',
    borderRadius: 12,
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  suitRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
  },
  suitLabel: {
    width: 22,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    flexShrink: 0,
  },
  rankCell: {
    display: 'flex',
    gap: 2,
  },
  cardBtn: {
    width: 34,
    height: 38,
    border: '1px solid #dee2e6',
    borderRadius: 4,
    background: '#fff',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    transition: 'all 0.12s',
    userSelect: 'none',
    padding: 2,
  },
  cardBtnSelected: {
    background: '#d0ebff',
    borderColor: '#339af0',
    borderWidth: 2,
    transform: 'translateY(-3px)',
    boxShadow: '0 2px 6px rgba(51,154,240,0.3)',
  },
  cardBtnDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  },
  cardBtnTrump: {
    borderColor: '#ff6b6b',
    borderWidth: 2,
  },
  cardBtnRedTrump: {
    borderColor: '#e63946',
    borderWidth: 2,
    background: '#fff5f5',
  },
  jokerBtn: {
    width: 38,
  },
  bigJoker: {
    background: '#fff5f5',
    borderColor: '#e63946',
  },
  smallJoker: {
    background: '#f8f0fc',
    borderColor: '#845ef7',
  },
  fullHint: {
    textAlign: 'center',
    color: '#2b8a3e',
    fontSize: 13,
    fontWeight: 600,
    marginTop: 8,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  clearBtn: {
    padding: '4px 14px',
    border: '1px solid #ced4da',
    borderRadius: 4,
    background: '#f1f3f5',
    cursor: 'pointer',
    fontSize: 12,
    color: '#495057',
  },
}
