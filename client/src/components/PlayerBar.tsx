import React from 'react'

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
        <span style={styles.badge}>主牌: {trumpRank}</span>
        <span style={styles.badge}>第 {roundNumber} 轮</span>
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
    padding: '8px 12px',
    background: '#f8f9fa',
    borderRadius: 8,
    border: '1px solid #dee2e6',
  },
  info: {
    display: 'flex',
    gap: 8,
  },
  badge: {
    fontSize: 12,
    padding: '2px 8px',
    background: '#e9ecef',
    borderRadius: 4,
    color: '#495057',
  },
  players: {
    display: 'flex',
    gap: 8,
  },
  player: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 8px',
    borderRadius: 4,
    border: '1px solid #dee2e6',
    background: '#fff',
    fontSize: 12,
  },
  playerActive: {
    borderColor: '#339af0',
    background: '#d0ebff',
  },
  playerFinished: {
    opacity: 0.5,
  },
  playerTeammate: {
    borderColor: '#51cf66',
  },
  playerLabel: {
    fontWeight: 600,
  },
  playerCount: {
    color: '#868e96',
  },
  finishedTag: {
    color: '#51cf66',
    fontWeight: 'bold',
  },
}
