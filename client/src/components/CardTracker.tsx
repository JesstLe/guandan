import React from 'react'
import { type CardTrackerEntry } from '../hooks/useGame'
import { TrackerIcon } from './Icons'

// 用中文写注释，增加代码可读性
interface CardTrackerProps {
  tracker: Record<string, CardTrackerEntry>
  trumpRank: string
}

const RANK_ORDER = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2']
const JOKER_ORDER = ['SJ', 'BJ']

export const CardTracker: React.FC<CardTrackerProps> = ({ tracker, trumpRank }) => {
  const entries: { key: string; label: string; total: number; remaining: number; played: number; isTrump: boolean; isJoker: boolean }[] = []

  for (const rank of RANK_ORDER) {
    const entry = tracker[rank]
    if (entry) {
      entries.push({
        key: rank,
        label: rank,
        total: entry.total,
        remaining: entry.remaining,
        played: entry.played,
        isTrump: rank === trumpRank,
        isJoker: false,
      })
    }
  }

  for (const jk of JOKER_ORDER) {
    const entry = tracker[jk]
    if (entry) {
      entries.push({
        key: jk,
        label: jk === 'BJ' ? '大王' : '小王',
        total: entry.total,
        remaining: entry.remaining,
        played: entry.played,
        isTrump: true,
        isJoker: true,
      })
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <TrackerIcon size={14} color="#4f46e5" style={{ marginRight: 6 }} />
        <span>记牌器</span>
      </div>
      <div style={styles.grid}>
        {entries.map(e => (
          <div
            key={e.key}
            style={{
              ...styles.cell,
              ...(e.isTrump ? styles.trumpCell : {}),
              ...(e.remaining === 0 ? styles.exhaustedCell : {}),
            }}
          >
            <span style={{
              ...styles.rankLabel,
              ...(e.isTrump ? styles.trumpLabel : {}),
              ...(e.remaining === 0 ? styles.exhaustedLabel : {}),
            }}>
              {e.label}
            </span>
            <span style={{
              ...styles.countLabel,
              ...(e.remaining === 0 ? styles.exhaustedLabel : {}),
              ...(e.remaining > 0 && e.remaining <= 2 ? styles.lowCount : {}),
            }}>
              {e.remaining}/{e.total}
            </span>
          </div>
        ))}
      </div>
      <div style={styles.legend}>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, background: '#fef3c7', borderColor: '#fde68a' }} /> 主牌
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, background: '#f3f4f6', borderColor: '#e5e7eb' }} /> 已出完
        </span>
      </div>
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 5,
  },
  cell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '6px 2px',
    borderRadius: 6,
    background: '#f9fafb',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    transition: 'all 0.15s ease',
  },
  trumpCell: {
    background: '#fef3c7',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#fde68a',
  },
  exhaustedCell: {
    background: '#f3f4f6',
    borderColor: '#e5e7eb',
    opacity: 0.5,
  },
  rankLabel: {
    fontSize: 14,
    fontWeight: 800,
    color: '#1f2937',
  },
  trumpLabel: {
    color: '#d97706',
  },
  exhaustedLabel: {
    color: '#9ca3af',
  },
  countLabel: {
    fontSize: 10,
    color: '#4b5563',
    fontWeight: 500,
  },
  lowCount: {
    color: '#ef4444',
  },
  legend: {
    display: 'flex',
    gap: 16,
    marginTop: 10,
    fontSize: 10,
    color: '#4b5563',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
    borderWidth: 1,
    borderStyle: 'solid',
  },
}
