import React from 'react'
import { HistoryIcon } from './Icons'

// 用中文写注释，增加代码可读性
interface RoundPlay {
  player: number
  action: 'play' | 'pass'
  cards?: any[]
  combination?: { type: string }
}

interface Round {
  roundNumber: number
  leadPlayer: number
  plays: RoundPlay[]
  winner: number | null
}

interface PlayHistoryProps {
  rounds: Round[]
  currentRound: Round | null
  trumpRank: string
}

const PLAYER_LABELS: Record<number, string> = {
  0: '我',
  1: '对手A',
  2: '队友',
  3: '对手B',
}

const SUIT_SYMBOLS: Record<string, string> = {
  spade: '♠',
  heart: '♥',
  diamond: '♦',
  club: '♣',
}

const COMBO_LABELS: Record<string, string> = {
  single: '单张',
  pair: '对子',
  triple: '三张',
  triple_with_pair: '三带二',
  straight: '顺子',
  pair_straight: '连对',
  airplane: '钢板',
  bomb: '炸弹',
  same_suit_straight: '同花顺',
  joker_bomb: '王炸',
}

function formatCard(card: any): string {
  if (card.type === 'big') return '大王'
  if (card.type === 'small') return '小王'
  const suit = SUIT_SYMBOLS[card.suit] || ''
  return `${suit}${card.rank}`
}

function formatCards(cards: any[]): string {
  return cards.map(formatCard).join(' ')
}

export const PlayHistory: React.FC<PlayHistoryProps> = ({ rounds, currentRound, trumpRank }) => {
  const allRounds = [...rounds]
  if (currentRound && !rounds.find(r => r.roundNumber === currentRound.roundNumber)) {
    allRounds.push(currentRound)
  }

  const displayRounds = allRounds.slice(-5).reverse()

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <HistoryIcon size={14} color="#4f46e5" style={{ marginRight: 6 }} />
        <span>出牌记录</span>
      </div>
      {displayRounds.length === 0 ? (
        <div style={styles.empty}>暂无出牌记录</div>
      ) : (
        displayRounds.map(round => (
          <div key={round.roundNumber} style={styles.round}>
            <div style={styles.roundTitle}>
              第{round.roundNumber}轮
              {round.winner !== null && (
                <span style={styles.winnerTag}>
                  ✓ {PLAYER_LABELS[round.winner]}
                </span>
              )}
            </div>
            {round.plays.map((play, idx) => (
              <div key={idx} style={styles.play}>
                <span style={{
                  ...styles.playerLabel,
                  ...(play.player === 0 ? styles.meLabel : {}),
                  ...(play.player === 2 ? styles.teammateLabel : {}),
                }}>
                  {PLAYER_LABELS[play.player]}
                </span>
                {play.action === 'pass' ? (
                  <span style={styles.passText}>过</span>
                ) : (
                  <span style={styles.playDetail}>
                    {play.combination && (
                      <span style={styles.comboTag}>
                        {COMBO_LABELS[play.combination.type] || play.combination.type}
                      </span>
                    )}
                    {play.cards && <span style={styles.cardText}>{formatCards(play.cards)}</span>}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    padding: 16,
    maxHeight: 400,
    overflowY: 'auto',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  header: {
    fontSize: 13,
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: 10,
    paddingBottom: 8,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
  },
  empty: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center' as const,
    padding: '20px 0',
  },
  round: {
    marginBottom: 10,
    paddingBottom: 8,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#e5e7eb',
  },
  roundTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#4b5563',
    marginBottom: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  winnerTag: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: 700,
  },
  play: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '3px 0',
    fontSize: 12,
  },
  playerLabel: {
    fontWeight: 700,
    color: '#9ca3af',
    minWidth: 44,
    fontSize: 11,
  },
  meLabel: {
    color: '#4f46e5',
  },
  teammateLabel: {
    color: '#10b981',
  },
  passText: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  playDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap' as const,
  },
  comboTag: {
    fontSize: 10,
    padding: '2px 6px',
    background: '#f5f3ff',
    borderRadius: 4,
    color: '#6366f1',
    fontWeight: 600,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#c7d2fe',
  },
  cardText: {
    color: '#1f2937',
    fontSize: 12,
    letterSpacing: 0.5,
    fontWeight: 500,
  },
}
