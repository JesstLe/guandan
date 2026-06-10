import React from 'react'
import { CardsIcon } from './Icons'

// 用中文写注释，增加代码可读性
interface PlayerInfo {
  seat: number
  handCount: number
  label: string
  isTeammate: boolean
  isCurrentPlayer: boolean
  isFinished: boolean
}

interface PlayerBarProps {
  players: PlayerInfo[]
  trumpRank: string
  roundNumber: number
}

export const PlayerBar: React.FC<PlayerBarProps> = ({ players, trumpRank, roundNumber }) => {
  return (
    <div style={styles.container}>
      <div style={styles.info}>
        <span style={styles.trumpBadge}>
          <CardsIcon size={12} color="#d97706" style={{ marginRight: 6 }} />
          主牌: {trumpRank}
        </span>
        <span style={styles.roundBadge}>第 {roundNumber} 轮</span>
      </div>
      <div style={styles.players}>
        {players.map(p => (
          <div
            key={p.seat}
            style={{
              ...styles.player,
              ...(p.isCurrentPlayer ? styles.playerActive : {}),
              ...(p.isFinished ? styles.playerFinished : {}),
              ...(p.isTeammate ? styles.playerTeammate : {}),
            }}
          >
            <span style={styles.playerLabel}>{p.label}</span>
            <span style={styles.playerCount}>{p.handCount}张</span>
            {p.isFinished && <span style={styles.finishedTag}>✓</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    background: '#ffffff',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  info: {
    display: 'flex',
    gap: 10,
  },
  trumpBadge: {
    fontSize: 12,
    padding: '4px 12px',
    background: '#fef3c7',
    borderRadius: 6,
    color: '#d97706',
    fontWeight: 700,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#fde68a',
    display: 'flex',
    alignItems: 'center',
  },
  roundBadge: {
    fontSize: 12,
    padding: '4px 12px',
    background: '#f3f4f6',
    borderRadius: 6,
    color: '#4b5563',
    fontWeight: 600,
  },
  players: {
    display: 'flex',
    gap: 8,
  },
  player: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    background: '#f9fafb',
    fontSize: 12,
    transition: 'all 0.2s ease',
  },
  playerActive: {
    borderColor: '#c7d2fe',
    background: '#e0e7ff',
    boxShadow: '0 0 12px rgba(99,102,241,0.1)',
  },
  playerFinished: {
    opacity: 0.5,
  },
  playerTeammate: {
    borderColor: '#a7f3d0',
    background: '#ecfdf5',
  },
  playerLabel: {
    fontWeight: 700,
    color: '#1f2937',
  },
  playerCount: {
    color: '#6b7280',
    fontWeight: 500,
  },
  finishedTag: {
    color: '#10b981',
    fontWeight: 'bold',
  },
}
