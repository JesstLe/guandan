import React from 'react'
import { type AnyCard, type Rank, type Suit } from '@guandan/shared'

const SUIT_SYMBOL: Record<Suit, string> = {
  spade: '♠', heart: '♥', diamond: '♦', club: '♣',
}

interface TributePanelProps {
  phase: 'tribute' | 'tribute_return' | 'done' | 'disabled'
  tributeType: 'single' | 'double'
  onTribute: (cards: AnyCard[]) => void
  onReturn: (cards: AnyCard[]) => void
  handCards: AnyCard[]
}

export const TributePanel: React.FC<TributePanelProps> = ({
  phase,
  tributeType,
  onTribute,
  onReturn,
  handCards,
}) => {
  if (phase === 'disabled' || phase === 'done') return null

  const isTribute = phase === 'tribute'
  const title = isTribute ? '进贡' : '还贡'
  const count = tributeType === 'double' ? 2 : 1

  return (
    <div style={styles.container}>
      <div style={styles.title}>{title}（需选{count}张牌）</div>
      <div style={styles.hint}>
        {isTribute
          ? '请选择最大的非主牌进贡'
          : '请选择一张牌还贡给对方'}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#fff3bf',
    border: '1px solid #fcc419',
    borderRadius: 8,
    padding: 12,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#868e96',
  },
}
