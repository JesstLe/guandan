import React from 'react'
import { type AnyCard, type Rank, RANK_ORDER, isJoker } from '@guandan/shared'
import { PlayingCard } from './PlayingCard'

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
      <div style={styles.label}>🃏 我的手牌 ({cards.length}张)</div>
      <div style={styles.hand}>
        {sorted.map(card => {
          const id = cardIdStr(card)
          const selected = selectedIds.has(id)

          return (
            <PlayingCard
              key={id}
              card={card}
              selected={selected}
              onClick={() => onCardClick?.(card)}
            />
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
    padding: 12,
    background: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    backdropFilter: 'blur(8px)',
  },
  label: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
    fontWeight: 600,
  },
  hand: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
  },
}
