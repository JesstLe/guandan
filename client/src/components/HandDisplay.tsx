import React from 'react'
import { type AnyCard, type Card, type Rank, type Suit, RANK_ORDER, isJoker } from '@guandan/shared'

const SUIT_SYMBOL: Record<Suit, string> = {
  spade: '♠', heart: '♥', diamond: '♦', club: '♣',
}

const SUIT_COLOR: Record<Suit, string> = {
  spade: '#1a1a2e', heart: '#e63946', diamond: '#e63946', club: '#1a1a2e',
}

interface HandDisplayProps {
  cards: AnyCard[]
  trumpRank: Rank
  selectedIds?: Set<string>
  onCardClick?: (card: AnyCard) => void
}

export const HandDisplay: React.FC<HandDisplayProps> = ({
  cards,
  trumpRank,
  selectedIds = new Set(),
  onCardClick,
}) => {
  const sorted = [...cards].sort((a, b) => {
    const aVal = getSortValue(a, trumpRank)
    const bVal = getSortValue(b, trumpRank)
    return bVal - aVal
  })

  return (
    <div style={styles.container}>
      <div style={styles.label}>我的手牌 ({cards.length}张)</div>
      <div style={styles.hand}>
        {sorted.map(card => {
          const id = cardIdStr(card)
          const selected = selectedIds.has(id)
          const isTrump = !isJoker(card) && card.isTrump
          const isRedTrump = !isJoker(card) && card.isRedTrump

          return (
            <div
              key={id}
              style={{
                ...styles.card,
                ...(selected ? styles.cardSelected : {}),
                ...(isTrump ? styles.cardTrump : {}),
                ...(isRedTrump ? styles.cardRedTrump : {}),
              }}
              onClick={() => onCardClick?.(card)}
            >
              {isJoker(card) ? (
                <span style={{ color: card.type === 'big' ? '#e63946' : '#1a1a2e' }}>
                  {card.type === 'big' ? '大' : '小'}王
                </span>
              ) : (
                <>
                  <span style={{ color: SUIT_COLOR[card.suit], fontSize: 10 }}>
                    {SUIT_SYMBOL[card.suit]}
                  </span>
                  <span>{card.rank}</span>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getSortValue(card: AnyCard, trumpRank: Rank): number {
  if (isJoker(card)) return card.type === 'big' ? 200 : 199
  const base = RANK_ORDER[card.rank]
  const trumpBonus = card.rank === trumpRank ? 100 : 0
  const suitBonus = { spade: 4, heart: 3, club: 2, diamond: 1 }[card.suit]
  return base + trumpBonus + suitBonus * 0.1
}

function cardIdStr(card: AnyCard): string {
  if (isJoker(card)) return `${card.type}-copy${card.copyIndex}`
  return `${card.suit}-${card.rank}-copy${card.copyIndex}`
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 8,
  },
  label: {
    fontSize: 12,
    color: '#868e96',
    marginBottom: 4,
  },
  hand: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
  },
  card: {
    width: 36,
    height: 48,
    border: '1px solid #dee2e6',
    borderRadius: 4,
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.15s',
    userSelect: 'none',
  },
  cardSelected: {
    background: '#d0ebff',
    borderColor: '#339af0',
    transform: 'translateY(-4px)',
  },
  cardTrump: {
    borderColor: '#ff6b6b',
    borderWidth: 2,
  },
  cardRedTrump: {
    borderColor: '#e63946',
    borderWidth: 2,
    background: '#fff5f5',
  },
}
