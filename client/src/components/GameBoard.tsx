import React, { useState, useMemo } from 'react'
import { type AnyCard, type Card, type Rank, type GameMode, type SeatConfig, isJoker } from '@guandan/shared'
import { useGame } from '../hooks/useGame'
import { CardSelector } from './CardSelector'
import { HandDisplay } from './HandDisplay'
import { SuggestionPanel } from './SuggestionPanel'
import { PlayerBar } from './PlayerBar'
import { TributePanel } from './TributePanel'

export const GameBoard: React.FC = () => {
  const game = useGame()
  const [selectedCards, setSelectedCards] = useState<AnyCard[]>([])
  const [selectorMode, setSelectorMode] = useState<'full' | 'quick'>('full')
  const [activePlayer, setActivePlayer] = useState<number>(0)
  const [setupMode, setSetupMode] = useState(true)
  const [trumpRank, setTrumpRank] = useState<Rank>('7')
  const [handInput, setHandInput] = useState<string>('')

  const playerInfos = useMemo(() => {
    if (!game.state) return []
    const seats = [
      { seat: 0, label: '我', isTeammate: false },
      { seat: 1, label: '对手A', isTeammate: false },
      { seat: 2, label: '队友', isTeammate: true },
      { seat: 3, label: '对手B', isTeammate: false },
    ]
    return seats.map(s => ({
      ...s,
      handCount: game.state?.players.find(p => p.seat === s.seat)?.handCount ?? 0,
      isCurrentPlayer: game.state?.currentPlayer === s.seat,
      isFinished: game.state?.finishedPlayers.includes(s.seat) ?? false,
    }))
  }, [game.state])

  const handleStartGame = () => {
    const mode: GameMode = {
      type: 'single',
      tributeEnabled: false,
      tripleWithSingle: false,
      initialTrumpRank: trumpRank,
    }
    const seats: SeatConfig = { me: 0, teammate: 2, opponentA: 1, opponentB: 3 }
    const handCards = parseHandInput(handInput)
    game.startGame(mode, seats, handCards)
    setSetupMode(false)
  }

  const handlePlay = () => {
    if (selectedCards.length === 0) return
    game.play(activePlayer, selectedCards)
    setSelectedCards([])
  }

  const handlePass = () => {
    game.pass(activePlayer)
    setSelectedCards([])
  }

  const handleUndo = () => {
    game.undo()
    setSelectedCards([])
  }

  const handleAdoptSuggestion = (option: any) => {
    if (option.action === 'play' && option.cards) {
      const cards: AnyCard[] = option.cards.map((c: any) => ({
        rank: c.rank,
        suit: c.suit,
        copyIndex: c.copyIndex,
        isTrump: c.rank === trumpRank,
        isRedTrump: c.rank === trumpRank && c.suit === 'heart',
      }))
      setSelectedCards(cards)
    } else if (option.action === 'pass') {
      game.pass(0)
    }
  }

  if (setupMode) {
    return (
      <div style={styles.setupContainer}>
        <h2 style={styles.setupTitle}>🃏 掼蛋助手</h2>
        <div style={styles.setupForm}>
          <div style={styles.formRow}>
            <label style={styles.label}>主牌等级:</label>
            <select
              value={trumpRank}
              onChange={e => setTrumpRank(e.target.value as Rank)}
              style={styles.select}
            >
              {['3','4','5','6','7','8','9','10','J','Q','K','A','2'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div style={styles.formRow}>
            <label style={styles.label}>我的手牌:</label>
            <textarea
              value={handInput}
              onChange={e => setHandInput(e.target.value)}
              placeholder="输入手牌，如: ♠3 ♥3 ♦4 ♣5 ♠6 ♥7 ..."
              style={styles.textarea}
              rows={4}
            />
          </div>
          <button style={styles.startBtn} onClick={handleStartGame}>
            开始游戏
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <PlayerBar
          players={playerInfos}
          trumpRank={game.state?.trumpRank || '7'}
          roundNumber={game.state?.roundNumber || 1}
        />
      </div>

      <div style={styles.mainArea}>
        <div style={styles.leftPanel}>
          <div style={styles.playerSelect}>
            <label style={styles.label}>谁出的:</label>
            <select
              value={activePlayer}
              onChange={e => setActivePlayer(Number(e.target.value))}
              style={styles.select}
            >
              <option value={0}>我</option>
              <option value={1}>对手A</option>
              <option value={2}>队友</option>
              <option value={3}>对手B</option>
            </select>
          </div>

          <CardSelector
            cardStates={game.state?.myHand || []}
            trumpRank={game.state?.trumpRank || '7'}
            selectedCards={selectedCards}
            onSelectionChange={setSelectedCards}
            mode={selectorMode}
            onModeToggle={() => setSelectorMode(m => m === 'full' ? 'quick' : 'full')}
          />

          <div style={styles.actionBar}>
            <button
              style={{ ...styles.actionBtn, ...styles.playBtn }}
              onClick={handlePlay}
              disabled={selectedCards.length === 0 || game.loading}
            >
              确认出牌
            </button>
            <button
              style={{ ...styles.actionBtn, ...styles.passBtn }}
              onClick={handlePass}
              disabled={game.loading}
            >
              过
            </button>
            <button
              style={{ ...styles.actionBtn, ...styles.undoBtn }}
              onClick={handleUndo}
            >
              撤回
            </button>
            <button
              style={{ ...styles.actionBtn, ...styles.suggestBtn }}
              onClick={game.requestSuggestion}
              disabled={game.loading}
            >
              AI建议
            </button>
          </div>
        </div>

        <div style={styles.rightPanel}>
          <HandDisplay
            cards={(game.state?.myHand || []).map((s: any) => s.card)}
            trumpRank={game.state?.trumpRank || '7'}
          />
          <SuggestionPanel
            suggestion={game.suggestion}
            loading={game.loading}
            onAdopt={handleAdoptSuggestion}
          />
        </div>
      </div>

      {game.error && (
        <div style={styles.errorBar}>
          ❌ {game.error}
          <button style={styles.errorClose} onClick={() => {}}>✕</button>
        </div>
      )}

      {!game.connected && (
        <div style={styles.disconnected}>⚠️ 未连接到服务器</div>
      )}
    </div>
  )
}

function parseHandInput(input: string): AnyCard[] {
  const cards: AnyCard[] = []
  const suitMap: Record<string, string> = { '♠': 'spade', '♥': 'heart', '♦': 'diamond', '♣': 'club' }
  const parts = input.trim().split(/\s+/)

  for (const part of parts) {
    const match = part.match(/^([♠♥♦♣])(\d+|10|[JQKA2])$/)
    if (match) {
      const suit = suitMap[match[1]] as any
      const rank = match[2] as Rank
      cards.push({
        rank,
        suit,
        copyIndex: (cards.filter(c => !isJoker(c) && c.rank === rank && c.suit === suit).length + 1) as 1 | 2,
        isTrump: false,
        isRedTrump: false,
      })
    }
  }

  return cards
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  topBar: {
    marginBottom: 12,
  },
  mainArea: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: 16,
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  playerSelect: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#495057',
  },
  select: {
    padding: '4px 8px',
    borderRadius: 4,
    border: '1px solid #ced4da',
    fontSize: 13,
  },
  actionBar: {
    display: 'flex',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    padding: '8px 0',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.15s',
  },
  playBtn: {
    background: '#339af0',
    color: '#fff',
  },
  passBtn: {
    background: '#868e96',
    color: '#fff',
  },
  undoBtn: {
    background: '#f1f3f5',
    color: '#495057',
    border: '1px solid #ced4da',
  },
  suggestBtn: {
    background: '#845ef7',
    color: '#fff',
  },
  errorBar: {
    marginTop: 12,
    padding: '8px 12px',
    background: '#fff5f5',
    border: '1px solid #ff6b6b',
    borderRadius: 6,
    color: '#c92a2a',
    fontSize: 13,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#c92a2a',
    fontSize: 16,
  },
  disconnected: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: '#c92a2a',
    color: '#fff',
    textAlign: 'center',
    padding: 8,
    fontSize: 13,
    zIndex: 9999,
  },
  setupContainer: {
    maxWidth: 480,
    margin: '80px auto',
    padding: 32,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  setupTitle: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 24,
  },
  setupForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  textarea: {
    padding: 8,
    borderRadius: 4,
    border: '1px solid #ced4da',
    fontSize: 13,
    resize: 'vertical',
  },
  startBtn: {
    padding: '10px 0',
    borderRadius: 6,
    border: 'none',
    background: '#339af0',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
}
