import React, { useState, useMemo } from 'react'
import { type AnyCard, type Card, type Rank, type Suit, type CardState, ALL_RANKS, ALL_SUITS, RANK_ORDER, isJoker } from '@guandan/shared'

const SUIT_SYMBOL: Record<Suit, string> = {
  spade: '♠', heart: '♥', diamond: '♦', club: '♣',
}

const SUIT_COLOR: Record<Suit, string> = {
  spade: '#1a1a2e', heart: '#e63946', diamond: '#e63946', club: '#1a1a2e',
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
          <span style={styles.title}>快捷选牌</span>
          {onModeToggle && (
            <button style={styles.modeBtn} onClick={onModeToggle}>切换全牌面</button>
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
        <span style={styles.title}>选牌器</span>
        {onModeToggle && (
          <button style={styles.modeBtn} onClick={onModeToggle}>切换快捷</button>
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
                      {rank}
                      {card.copyIndex === 2 ? '²' : ''}
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
    background: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: 8,
    padding: 12,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  modeBtn: {
    fontSize: 12,
    padding: '4px 8px',
    border: '1px solid #adb5bd',
    borderRadius: 4,
    background: '#fff',
    cursor: 'pointer',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  suitRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  },
  suitLabel: {
    width: 24,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  rankCell: {
    display: 'flex',
    gap: 1,
  },
  cardBtn: {
    width: 32,
    height: 28,
    border: '1px solid #ced4da',
    borderRadius: 4,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    transition: 'all 0.15s',
  },
  cardBtnSelected: {
    background: '#4dabf7',
    color: '#fff',
    borderColor: '#339af0',
    transform: 'translateY(-3px)',
  },
  cardBtnPlayed: {
    background: '#e9ecef',
    color: '#adb5bd',
    cursor: 'not-allowed',
    textDecoration: 'line-through',
  },
  cardBtnTrump: {
    borderColor: '#ff6b6b',
    borderWidth: 2,
  },
  cardBtnBigJoker: {
    background: '#ff6b6b',
    color: '#fff',
  },
  cardBtnSmallJoker: {
    background: '#845ef7',
    color: '#fff',
  },
  quickGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
  },
  quickRankBtn: {
    padding: '6px 10px',
    border: '1px solid #ced4da',
    borderRadius: 4,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
  quickRankBtnEmpty: {
    background: '#e9ecef',
    color: '#adb5bd',
    cursor: 'not-allowed',
  },
  quickCount: {
    fontSize: 10,
    color: '#868e96',
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
  },
  popup: {
    background: '#fff',
    borderRadius: 8,
    padding: 16,
    minWidth: 200,
  },
  popupTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 16,
  },
  popupSuits: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
  },
  popupSuitBtn: {
    width: 48,
    height: 36,
    border: '1px solid #ced4da',
    borderRadius: 4,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 600,
  },
  popupClose: {
    padding: '4px 12px',
    border: '1px solid #ced4da',
    borderRadius: 4,
    background: '#f1f3f5',
    cursor: 'pointer',
  },
}
