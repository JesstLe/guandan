import React from 'react'
import { type AISuggestion, type AISuggestionOption, type Rank, type Suit } from '@guandan/shared'

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
        <div style={styles.header}>AI 建议</div>
        <div style={styles.loading}>
          <span style={styles.spinner}>⏳</span> AI 正在思考...
        </div>
      </div>
    )
  }

  if (!suggestion) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>AI 建议</div>
        <div style={styles.empty}>点击"请求建议"获取AI出牌推荐</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        AI 建议
        {suggestion.isDilemma && <span style={styles.dilemma}>⚠️ 两难选择</span>}
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
            <div key={i} style={styles.warning}>⚠️ {w}</div>
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
  const cardText = option.cards.map(c =>
    `${SUIT_SYMBOL[c.suit]}${c.rank}`
  ).join(' ')

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
    <div style={{ ...styles.optionCard, ...(primary ? styles.optionCardPrimary : {}) }}>
      <div style={styles.optionHeader}>
        <span style={styles.optionLabel}>{label}</span>
        <span style={styles.optionAction}>
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
                background: d.value > 0 ? '#51cf66' : d.value < 0 ? '#ff6b6b' : '#adb5bd',
              }} />
            </div>
          </div>
        ))}
      </div>

      {option.reasoning && (
        <div style={styles.reasoning}>{option.reasoning}</div>
      )}

      {onAdopt && (
        <button
          style={{ ...styles.adoptBtn, ...(primary ? styles.adoptBtnPrimary : {}) }}
          onClick={() => onAdopt(option)}
        >
          采纳此方案
        </button>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: 8,
    padding: 12,
  },
  header: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  dilemma: {
    fontSize: 11,
    color: '#e67700',
    background: '#fff3bf',
    padding: '2px 6px',
    borderRadius: 4,
  },
  loading: {
    textAlign: 'center',
    padding: 20,
    color: '#868e96',
  },
  spinner: {
    fontSize: 20,
  },
  empty: {
    textAlign: 'center',
    padding: 20,
    color: '#adb5bd',
    fontSize: 13,
  },
  optionCard: {
    background: '#fff',
    border: '1px solid #dee2e6',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  optionCardPrimary: {
    borderColor: '#339af0',
    borderWidth: 2,
  },
  optionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  optionLabel: {
    fontWeight: 600,
    fontSize: 13,
  },
  optionAction: {
    fontSize: 11,
    padding: '2px 6px',
    borderRadius: 4,
    background: '#d0ebff',
    color: '#1971c2',
  },
  optionType: {
    fontSize: 11,
    padding: '2px 6px',
    borderRadius: 4,
    background: '#e9ecef',
    color: '#495057',
  },
  optionCards: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 6,
    letterSpacing: 1,
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  scoreLabel: {
    fontSize: 11,
    color: '#868e96',
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: 700,
    color: '#2b8a3e',
  },
  confidence: {
    fontSize: 11,
    color: '#868e96',
  },
  dimGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 3,
    marginBottom: 6,
  },
  dimRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  dimName: {
    fontSize: 10,
    color: '#868e96',
    width: 24,
  },
  dimBarBg: {
    flex: 1,
    height: 4,
    background: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  dimBarFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s',
  },
  reasoning: {
    fontSize: 12,
    color: '#495057',
    lineHeight: 1.4,
    marginBottom: 6,
    padding: '4px 8px',
    background: '#f8f9fa',
    borderRadius: 4,
  },
  warnings: {
    marginTop: 8,
  },
  warning: {
    fontSize: 11,
    color: '#e67700',
    padding: '2px 0',
  },
  adoptBtn: {
    width: '100%',
    padding: '6px 0',
    border: '1px solid #ced4da',
    borderRadius: 4,
    background: '#f1f3f5',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
  adoptBtnPrimary: {
    background: '#339af0',
    color: '#fff',
    borderColor: '#228be6',
  },
}
