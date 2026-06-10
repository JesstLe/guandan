import React from 'react'
import { type AnyCard, type Suit, isJoker } from '@guandan/shared'
import { motion } from 'motion/react'

// High-fidelity vector SVG components for suits
export const SuitIcon: React.FC<{ suit: Suit; size?: number; fill?: string }> = ({
  suit,
  size = 14,
  fill,
}) => {
  if (suit === 'spade') {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block' }}>
        <path
          d="M12 2C9.2 6.5 5 9.5 5 13c0 3.86 3.14 7 7 7s7-3.14 7-7c0-3.5-4.2-6.5-7-11zm-1.8 19.3c0-.4.3-.8.7-.9.5-.1 1.2-.2 1.2-.6v-1.1c0-.4-.3-.8-.7-.9H9.2c-.4 0-.7.3-.7.7V21c0 .4.3.7.7.7h5.6c.4 0 .7-.3.7-.7v-2.6c0-.4-.3-.7-.7-.7h-2.2c-.4 0-.7.5-.7.9v1.1c0 .4.7.5 1.2.6.4.1.7.5.7.9H10.2z"
          fill={fill || '#1a1a1a'}
        />
      </svg>
    )
  }
  if (suit === 'heart') {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block' }}>
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={fill || '#e03131'}
        />
      </svg>
    )
  }
  if (suit === 'diamond') {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block' }}>
        <path
          d="M12 2L2 12l10 10 10-10L12 2z"
          fill={fill || '#e03131'}
        />
      </svg>
    )
  }
  if (suit === 'club') {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block' }}>
        <path
          d="M12 8.5c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-4 6.5c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm8 0c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-2.8 5.8c0-.4.3-.8.7-.9.5-.1 1.2-.2 1.2-.6V16.7c0-.4-.3-.8-.7-.9H10.2c-.4 0-.7.3-.7.7v2.6c0 .4.3.7.7.7h3.6c.4 0 .7-.3.7-.7v-2.6c0-.4-.3-.7-.7-.7H11.6c-.4 0-.7.5-.7.9v2.6c0 .4.7.5 1.2.6.4.1.7.5.7.9H11.2z"
          fill={fill || '#1a1a1a'}
        />
      </svg>
    )
  }
  return null
}

const SUIT_COLOR: Record<Suit, string> = {
  spade: '#2b2b2b',
  heart: '#e03131',
  diamond: '#e03131',
  club: '#2b2b2b',
}

interface PlayingCardProps {
  card: AnyCard
  selected?: boolean
  onClick?: () => void
  compact?: boolean
  disabled?: boolean
  dragHandlers?: any
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  selected = false,
  onClick,
  compact = false,
  disabled = false,
  dragHandlers = {},
}) => {
  const isJ = isJoker(card)
  const isTrump = !isJ && card.isTrump
  const isRedTrump = !isJ && card.isRedTrump

  // Calculate premium container styles
  const cardStyle: React.CSSProperties = {
    ...styles.cardBase,
    ...(compact ? styles.cardCompact : styles.cardStandard),
    ...(selected ? styles.cardSelected : {}),
    ...(isTrump ? styles.cardTrump : {}),
    ...(isRedTrump ? styles.cardRedTrump : {}),
    ...(disabled ? styles.cardDisabled : {}),
  }

  // Animation values
  const whileHover = !disabled ? (compact ? { scale: 1.15, zIndex: 10 } : { translateY: -8, scale: 1.05 }) : {}
  const whileTap = !disabled ? { scale: 0.95 } : {}

  if (isJ) {
    const isBig = card.type === 'big'
    const jokerColor = isBig ? '#e03131' : '#5f3dc4'
    const jokerBg = isBig
      ? 'linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%)'
      : 'linear-gradient(135deg, #f8f0fc 0%, #f3e8ff 100%)'

    return (
      <motion.div
        layout
        whileHover={whileHover}
        whileTap={whileTap}
        style={{
          ...cardStyle,
          background: selected ? undefined : jokerBg,
          borderColor: selected ? undefined : jokerColor,
        }}
        onClick={!disabled ? onClick : undefined}
        {...dragHandlers}
      >
        <span style={{
          ...styles.jokerText,
          color: selected ? '#fff' : jokerColor,
          fontSize: compact ? 10 : 12,
        }}>
          {isBig ? '大王' : '小王'}
        </span>
      </motion.div>
    )
  }

  const color = SUIT_COLOR[card.suit]

  return (
    <motion.div
      layout
      whileHover={whileHover}
      whileTap={whileTap}
      style={cardStyle}
      onClick={!disabled ? onClick : undefined}
      {...dragHandlers}
    >
      {compact ? (
        // Compact picker layout
        <div style={styles.compactContent}>
          <SuitIcon suit={card.suit} size={10} fill={selected ? '#fff' : color} />
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            color: selected ? '#fff' : color,
            lineHeight: 1,
          }}>
            {card.rank}
          </span>
        </div>
      ) : (
        // Premium Standard Layout
        <div style={styles.standardContent}>
          {/* Top-left corner rank + tiny suit */}
          <div style={styles.corner}>
            <span style={{ fontSize: 13, fontWeight: 800, color: selected ? '#fff' : color, lineHeight: 1 }}>
              {card.rank}
            </span>
            <SuitIcon suit={card.suit} size={8} fill={selected ? '#fff' : color} />
          </div>
          {/* Center Suit Symbol */}
          <div style={styles.centerIcon}>
            <SuitIcon suit={card.suit} size={18} fill={selected ? '#fff' : color} />
          </div>
        </div>
      )}
    </motion.div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  cardBase: {
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,0.12)',
    cursor: 'pointer',
    userSelect: 'none',
    boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardStandard: {
    width: 44,
    height: 60,
    background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f7 100%)',
    position: 'relative',
  },
  cardCompact: {
    width: 28,
    height: 32,
    background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f7 100%)',
  },
  cardSelected: {
    background: 'linear-gradient(135deg, #339af0 0%, #1c7ed6 100%)',
    borderColor: '#1971c2',
    boxShadow: '0 4px 14px rgba(51, 154, 240, 0.45)',
  },
  cardTrump: {
    borderColor: '#f59f00',
    borderWidth: 2,
    boxShadow: '0 0 10px rgba(245, 159, 0, 0.35)',
  },
  cardRedTrump: {
    borderColor: '#ff6b6b',
    borderWidth: 2,
    background: 'linear-gradient(135deg, #fff5h5 0%, #ffe3e3 100%)',
    boxShadow: '0 0 10px rgba(255, 107, 107, 0.35)',
  },
  cardDisabled: {
    opacity: 0.25,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  jokerText: {
    fontWeight: 900,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  compactContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  standardContent: {
    width: '100%',
    height: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  corner: {
    position: 'absolute',
    top: 4,
    left: 4,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1,
  },
  centerIcon: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
}
