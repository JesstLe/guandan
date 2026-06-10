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
    background: 'rgba(245,159,0,0.12)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(245,159,0,0.3)',
    borderRadius: 12,
    padding: 14,
    backdropFilter: 'blur(8px)',
  },
  title: {
    fontWeight: 700,
    fontSize: 14,
    marginBottom: 4,
    color: '#f59f00',
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
}
