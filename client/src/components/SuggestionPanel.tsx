import React from 'react'
import { type AISuggestion, type AISuggestionOption, type Rank, type Suit } from '@guandan/shared'
import { motion } from 'motion/react'
import { BrainIcon, WarningIcon } from './Icons'

// 用中文写注释，增加代码可读性
// 花色符号映射
const SUIT_SYMBOL: Record<Suit, string> = {
  spade: '♠', heart: '♥', diamond: '♦', club: '♣',
}

interface SuggestionPanelProps {
  suggestion: AISuggestion | null
  loading: boolean
  onAdopt?: (option: AISuggestionOption) => void
}

export const SuggestionPanel: React.FC<SuggestionPanelProps> = ({
  suggestion,
  loading,
  onAdopt,
}) => {
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <BrainIcon size={16} color="#4f46e5" />
          <span>AI 建议</span>
        </div>
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <span>AI 正在思考...</span>
        </div>
      </div>
    )
  }

  if (!suggestion) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <BrainIcon size={16} color="#4f46e5" />
          <span>AI 建议</span>
        </div>
        <div style={styles.empty}>点击「AI建议」获取出牌推荐</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BrainIcon size={16} color="#4f46e5" />
          <span>AI 建议</span>
        </div>
        {suggestion.isDilemma && (
          <span style={styles.dilemma}>
            <WarningIcon size={12} color="#d97706" style={{ marginRight: 4 }} />
            两难选择
          </span>
        )}
      </div>

      <OptionCard
        label="推荐方案"
        option={suggestion.primary}
        onAdopt={onAdopt}
        primary
      />

      {suggestion.alternative && (
        <OptionCard
          label="备选方案"
          option={suggestion.alternative}
          onAdopt={onAdopt}
        />
      )}

      {suggestion.warnings && suggestion.warnings.length > 0 && (
        <div style={styles.warnings}>
          {suggestion.warnings.map((w, i) => (
            <div key={i} style={styles.warning}>
              <WarningIcon size={12} color="#d97706" style={{ marginRight: 4 }} />
              {w}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const OptionCard: React.FC<{
  label: string
  option: AISuggestionOption
  onAdopt?: (option: AISuggestionOption) => void
  primary?: boolean
}> = ({ label, option, onAdopt, primary }) => {
  const cardText = option.cards.map(c => {
    const suit = SUIT_SYMBOL[c.suit as Suit] ?? ''
    return `${suit}${c.rank}`
  }).join(' ')

  const dims = option.dimensions
  const dimBars = [
    { name: '效率', value: dims.efficiency },
    { name: '局势', value: dims.situation },
    { name: '推断', value: dims.inference },
    { name: '控制', value: dims.control },
    { name: '配合', value: dims.cooperation },
    { name: '收官', value: dims.endgame },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01, borderColor: primary ? '#4f46e5' : '#d1d5db' }}
      style={{ ...styles.optionCard, ...(primary ? styles.optionCardPrimary : {}) }}
    >
      <div style={styles.optionHeader}>
        <span style={styles.optionLabel}>{label}</span>
        <span style={{
          ...styles.optionAction,
          ...(option.action === 'play' ? styles.actionPlay : styles.actionPass),
        }}>
          {option.action === 'play' ? '出牌' : '过牌'}
        </span>
        <span style={styles.optionType}>{option.combinationType}</span>
      </div>

      {option.action === 'play' && (
        <div style={styles.optionCards}>{cardText}</div>
      )}

      <div style={styles.scoreRow}>
        <span style={styles.scoreLabel}>综合评分</span>
        <span style={styles.scoreValue}>{(option.totalScore * 100).toFixed(0)}%</span>
        <span style={styles.confidence}>置信度 {(option.confidence * 100).toFixed(0)}%</span>
      </div>

      <div style={styles.dimGrid}>
        {dimBars.map(d => (
          <div key={d.name} style={styles.dimRow}>
            <span style={styles.dimName}>{d.name}</span>
            <div style={styles.dimBarBg}>
              <div style={{
                ...styles.dimBarFill,
                width: `${Math.max(0, (d.value + 1) / 2 * 100)}%`,
                background: d.value > 0
                  ? 'linear-gradient(90deg, #10b981, #059669)'
                  : d.value < 0
                    ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                    : '#e5e7eb',
              }} />
            </div>
          </div>
        ))}
      </div>

      {option.reasoning && (
        <div style={styles.reasoning}>{option.reasoning}</div>
      )}

      {onAdopt && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ ...styles.adoptBtn, ...(primary ? styles.adoptBtnPrimary : {}) }}
          onClick={() => onAdopt(option)}
        >
          采纳此方案
        </motion.button>
      )}
    </motion.div>
  )
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
    fontWeight: 700,
    fontSize: 14,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#1f2937',
  },
  dilemma: {
    fontSize: 11,
    color: '#d97706',
    background: '#fef3c7',
    padding: '2px 8px',
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#fde68a',
    display: 'flex',
    alignItems: 'center',
  },
  loading: {
    textAlign: 'center',
    padding: 24,
    color: '#6b7280',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    fontSize: 13,
  },
  spinner: {
    width: 28,
    height: 28,
    border: '3px solid #f3f4f6',
    borderTopColor: '#4f46e5',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  empty: {
    textAlign: 'center',
    padding: 24,
    color: '#9ca3af',
    fontSize: 13,
  },
  optionCard: {
    background: '#ffffff',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  optionCardPrimary: {
    borderColor: '#c7d2fe',
    borderWidth: 2,
    background: '#f5f3ff',
  },
  optionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  optionLabel: {
    fontWeight: 700,
    fontSize: 13,
    color: '#111827',
  },
  optionAction: {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 4,
    fontWeight: 600,
  },
  actionPlay: {
    background: '#ecfdf5',
    color: '#059669',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#a7f3d0',
  },
  actionPass: {
    background: '#f3f4f6',
    color: '#4b5563',
  },
  optionType: {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 4,
    background: '#f3f4f6',
    color: '#4b5563',
  },
  optionCards: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 8,
    letterSpacing: 1,
    color: '#111827',
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 800,
    color: '#059669',
  },
  confidence: {
    fontSize: 11,
    color: '#6b7280',
  },
  dimGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 4,
    marginBottom: 8,
  },
  dimRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  dimName: {
    fontSize: 10,
    color: '#6b7280',
    width: 28,
    flexShrink: 0,
  },
  dimBarBg: {
    flex: 1,
    height: 5,
    background: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  dimBarFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  reasoning: {
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 1.5,
    marginBottom: 8,
    padding: '8px 10px',
    background: '#f9fafb',
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
  },
  warnings: {
    marginTop: 10,
  },
  warning: {
    fontSize: 11,
    color: '#d97706',
    padding: '3px 0',
    display: 'flex',
    alignItems: 'center',
  },
  adoptBtn: {
    width: '100%',
    padding: '8px 0',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    borderRadius: 8,
    background: '#ffffff',
    color: '#4b5563',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.15s ease',
  },
  adoptBtnPrimary: {
    background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
    color: '#fff',
    borderColor: '#4f46e5',
    boxShadow: '0 4px 12px rgba(79,70,229,0.15)',
  },
}
