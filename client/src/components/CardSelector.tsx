import React, { useState, useMemo } from 'react'
import { type AnyCard, type Card, type Rank, type Suit, type CardState, ALL_RANKS, ALL_SUITS, RANK_ORDER, isJoker } from '@guandan/shared'
import { CardsIcon, AutoplayIcon } from './Icons'

// 用中文写注释，增加代码可读性
// 花色符号与颜色映射
const SUIT_SYMBOL: Record<Suit, string> = {
  spade: '♠', heart: '♥', diamond: '♦', club: '♣',
}

const SUIT_COLOR: Record<Suit, string> = {
  spade: '#1f2937', heart: '#ef4444', diamond: '#ef4444', club: '#1f2937',
}

interface CardSelectorProps {
  cardStates: CardState[]
  trumpRank: Rank
  selectedCards: AnyCard[]
  onSelectionChange: (cards: AnyCard[]) => void
  mode?: 'full' | 'quick'
  onModeToggle?: () => void
}

export const CardSelector: React.FC<CardSelectorProps> = ({
  cardStates,
  trumpRank,
  selectedCards,
  onSelectionChange,
  mode = 'full',
  onModeToggle,
}) => {
  const [quickPopup, setQuickPopup] = useState<{ rank: Rank; x: number; y: number } | null>(null)

  const availableCards = useMemo(() => {
    return cardStates.filter(s => s.status === 'in_my_hand')
  }, [cardStates])

  const playedCardIds = useMemo(() => {
    return new Set(
      cardStates
        .filter(s => s.status === 'in_play' || s.status === 'archived')
        .map(s => s.id)
    )
  }, [cardStates])

  const selectedIds = useMemo(() => {
    return new Set(selectedCards.map(c => cardId(c)))
  }, [selectedCards])

  const toggleCard = (card: AnyCard) => {
    const id = cardId(card)
    if (selectedIds.has(id)) {
      onSelectionChange(selectedCards.filter(c => cardId(c) !== id))
    } else {
      onSelectionChange([...selectedCards, card])
    }
  }

  if (mode === 'quick') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>
            <AutoplayIcon size={16} color="#4f46e5" style={{ marginRight: 6 }} />
            快捷选牌
          </span>
          {onModeToggle && (
            <button style={styles.modeBtn} onClick={onModeToggle}>全牌面</button>
          )}
        </div>
        <QuickModeGrid
          availableCards={availableCards}
          playedCardIds={playedCardIds}
          trumpRank={trumpRank}
          selectedIds={selectedIds}
          onToggle={toggleCard}
          onPopup={setQuickPopup}
        />
        {quickPopup && (
          <QuickPopup
            rank={quickPopup.rank}
            availableCards={availableCards}
            selectedIds={selectedIds}
            onToggle={toggleCard}
            onClose={() => setQuickPopup(null)}
          />
        )}
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>
          <CardsIcon size={16} color="#4f46e5" style={{ marginRight: 6 }} />
          选牌器
        </span>
        {onModeToggle && (
          <button style={styles.modeBtn} onClick={onModeToggle}>快捷</button>
        )}
      </div>
      <FullModeGrid
        availableCards={availableCards}
        playedCardIds={playedCardIds}
        trumpRank={trumpRank}
        selectedIds={selectedIds}
        onToggle={toggleCard}
      />
    </div>
  )
}

const FullModeGrid: React.FC<{
  availableCards: CardState[]
  playedCardIds: Set<string>
  trumpRank: Rank
  selectedIds: Set<string>
  onToggle: (card: AnyCard) => void
}> = ({ availableCards, playedCardIds, trumpRank, selectedIds, onToggle }) => {
  const cardsBySuit = useMemo(() => {
    const map = new Map<Suit, Map<Rank, AnyCard[]>>()
    for (const suit of ALL_SUITS) {
      map.set(suit, new Map())
      for (const rank of ALL_RANKS) {
        map.get(suit)!.set(rank, [])
      }
    }
    for (const state of availableCards) {
      if (isJoker(state.card)) continue
      const card = state.card as Card
      map.get(card.suit)?.get(card.rank)?.push(card)
    }
    return map
  }, [availableCards])

  return (
    <div style={styles.grid}>
      {ALL_SUITS.map(suit => (
        <div key={suit} style={styles.suitRow}>
          <span style={{ ...styles.suitLabel, color: SUIT_COLOR[suit] }}>
            {SUIT_SYMBOL[suit]}
          </span>
          {ALL_RANKS.map(rank => {
            const cards = cardsBySuit.get(suit)?.get(rank) || []
            const isTrump = rank === trumpRank
            return (
              <div key={`${suit}-${rank}`} style={styles.rankCell}>
                {cards.map(card => {
                  const id = cardId(card)
                  const selected = selectedIds.has(id)
                  const played = playedCardIds.has(id)
                  return (
                    <button
                      key={id}
                      style={{
                        ...styles.cardBtn,
                        ...(selected ? styles.cardBtnSelected : {}),
                        ...(played ? styles.cardBtnPlayed : {}),
                        ...(isTrump ? styles.cardBtnTrump : {}),
                      }}
                      onClick={() => !played && onToggle(card)}
                      disabled={played}
                    >
                      <span style={{ color: SUIT_COLOR[suit], fontSize: 8, lineHeight: 1 }}>
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
        <span style={{ ...styles.suitLabel, color: '#4b5563', fontSize: 12 }}>王牌</span>
        {availableCards
          .filter(s => isJoker(s.card))
          .map(state => {
            const card = state.card
            const id = cardId(card)
            const selected = selectedIds.has(id)
            const isBig = !isJoker(card) ? false : card.type === 'big'
            return (
              <button
                key={id}
                style={{
                  ...styles.cardBtn,
                  ...(selected ? styles.cardBtnSelected : {}),
                  ...(isBig ? styles.cardBtnBigJoker : styles.cardBtnSmallJoker),
                }}
                onClick={() => onToggle(card)}
              >
                {isBig ? '大王' : '小王'}
                {isJoker(card) && card.copyIndex === 2 ? '²' : ''}
              </button>
            )
          })}
      </div>
    </div>
  )
}

const QuickModeGrid: React.FC<{
  availableCards: CardState[]
  playedCardIds: Set<string>
  trumpRank: Rank
  selectedIds: Set<string>
  onToggle: (card: AnyCard) => void
  onPopup: (popup: { rank: Rank; x: number; y: number } | null) => void
}> = ({ availableCards, playedCardIds, trumpRank, selectedIds, onToggle, onPopup }) => {
  const countByRank = useMemo(() => {
    const map = new Map<Rank, { total: number; available: number }>()
    for (const rank of ALL_RANKS) {
      const total = availableCards.filter(s => !isJoker(s.card) && s.card.rank === rank).length
      const played = availableCards.filter(
        s => !isJoker(s.card) && s.card.rank === rank && (s.status === 'in_play' || s.status === 'archived')
      ).length
      map.set(rank, { total, available: total - played })
    }
    return map
  }, [availableCards])

  return (
    <div style={styles.quickGrid}>
      {ALL_RANKS.map(rank => {
        const info = countByRank.get(rank) || { total: 0, available: 0 }
        const isTrump = rank === trumpRank
        return (
          <button
            key={rank}
            style={{
              ...styles.quickRankBtn,
              ...(info.available === 0 ? styles.quickRankBtnEmpty : {}),
              ...(isTrump ? styles.cardBtnTrump : {}),
            }}
            onClick={(e) => {
              if (info.available > 0) {
                onPopup({ rank, x: e.clientX, y: e.clientY })
              }
            }}
            disabled={info.available === 0}
          >
            {rank}
            <span style={styles.quickCount}>({info.available})</span>
          </button>
        )
      })}
    </div>
  )
}

const QuickPopup: React.FC<{
  rank: Rank
  availableCards: CardState[]
  selectedIds: Set<string>
  onToggle: (card: AnyCard) => void
  onClose: () => void
}> = ({ rank, availableCards, selectedIds, onToggle, onClose }) => {
  const cardsForRank = availableCards.filter(
    s => !isJoker(s.card) && s.card.rank === rank && s.status === 'in_my_hand'
  )

  return (
    <div style={styles.popupOverlay} onClick={onClose}>
      <div style={styles.popup} onClick={e => e.stopPropagation()}>
        <div style={styles.popupTitle}>{rank} 花色选择</div>
        <div style={styles.popupSuits}>
          {ALL_SUITS.map(suit => {
            const cards = cardsForRank.filter(s => !isJoker(s.card) && (s.card as Card).suit === suit)
            if (cards.length === 0) return null
            return cards.map(state => {
              const card = state.card as Card
              const id = cardId(card)
              const selected = selectedIds.has(id)
              return (
                <button
                  key={id}
                  style={{
                    ...styles.popupSuitBtn,
                    ...(selected ? styles.cardBtnSelected : {}),
                    color: SUIT_COLOR[suit],
                  }}
                  onClick={() => onToggle(card)}
                >
                  {SUIT_SYMBOL[suit]}{rank}
                </button>
              )
            })
          })}
        </div>
        <button style={styles.popupClose} onClick={onClose}>关闭</button>
      </div>
    </div>
  )
}

function cardId(card: AnyCard): string {
  if (isJoker(card)) return `${card.type}-copy${card.copyIndex}`
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
    marginBottom: 12,
  },
  title: {
    fontWeight: 700,
    fontSize: 14,
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center',
  },
  modeBtn: {
    fontSize: 12,
    padding: '4px 12px',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    borderRadius: 6,
    background: '#f3f4f6',
    color: '#4b5563',
    cursor: 'pointer',
    transition: 'all 0.15s',
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
    width: 24,
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
    height: 34,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    borderRadius: 6,
    background: '#f9fafb',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    transition: 'all 0.15s ease',
    userSelect: 'none',
    padding: 2,
  },
  cardBtnSelected: {
    background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
    color: '#fff',
    borderColor: '#4f46e5',
    transform: 'translateY(-3px)',
    boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
  },
  cardBtnPlayed: {
    background: '#f3f4f6',
    color: '#9ca3af',
    cursor: 'not-allowed',
    textDecoration: 'line-through',
    borderColor: '#e5e7eb',
  },
  cardBtnTrump: {
    borderColor: '#f59f00',
    borderWidth: 2,
    boxShadow: '0 0 8px rgba(245,159,0,0.15)',
  },
  cardBtnBigJoker: {
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: '#fff',
    borderColor: '#ef4444',
  },
  cardBtnSmallJoker: {
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: '#fff',
    borderColor: '#6366f1',
  },
  quickGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickRankBtn: {
    padding: '8px 12px',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    borderRadius: 6,
    background: '#f9fafb',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    color: '#1f2937',
    transition: 'all 0.15s ease',
  },
  quickRankBtnEmpty: {
    background: '#f3f4f6',
    color: '#9ca3af',
    cursor: 'not-allowed',
    borderColor: '#e5e7eb',
  },
  quickCount: {
    fontSize: 10,
    color: '#6b7280',
    marginLeft: 2,
  },
  popupOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  popup: {
    background: '#ffffff',
    borderRadius: 12,
    padding: 20,
    minWidth: 220,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
  },
  popupTitle: {
    fontWeight: 'bold',
    marginBottom: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  popupSuits: {
    display: 'flex',
    gap: 10,
    marginBottom: 14,
  },
  popupSuitBtn: {
    width: 52,
    height: 40,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    borderRadius: 6,
    background: '#f9fafb',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 600,
    transition: 'all 0.15s ease',
  },
  popupClose: {
    padding: '6px 16px',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    borderRadius: 6,
    background: '#f3f4f6',
    color: '#4b5563',
    cursor: 'pointer',
  },
}
