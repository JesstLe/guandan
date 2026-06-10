import React, { useState, useMemo, useEffect, useRef } from 'react'
import { type AnyCard, type Rank, type GameMode, type SeatConfig } from '@guandan/shared'
import { useGame } from '../hooks/useGame'
import { CardSelector } from './CardSelector'
import { HandDisplay } from './HandDisplay'
import { HandPicker } from './HandPicker'
import { SuggestionPanel } from './SuggestionPanel'
import { PlayerBar } from './PlayerBar'
import { PlayHistory } from './PlayHistory'
import { CardTracker } from './CardTracker'
import { motion, AnimatePresence } from 'motion/react'
import { PlayIcon, PassIcon, UndoIcon, BrainIcon, AutoplayIcon, StopIcon, ErrorIcon, WarningIcon, CloseIcon, CardsIcon } from './Icons'

export const GameBoard: React.FC = () => {
  const game = useGame()
  const [selectedCards, setSelectedCards] = useState<AnyCard[]>([])
  const [selectorMode, setSelectorMode] = useState<'full' | 'quick'>('full')
  const [activePlayer, setActivePlayer] = useState<number>(0)
  const [setupMode, setSetupMode] = useState(true)
  const [trumpRank, setTrumpRank] = useState<Rank>('7')
  const [handCards, setHandCards] = useState<AnyCard[]>([])
  const [autoPlay, setAutoPlay] = useState(false)
  const autoPlayRetryRef = useRef(0)
  const autoPlayPhaseRef = useRef<'suggest' | 'play'>('suggest')
  const MAX_AUTO_PLAY_RETRIES = 5

  // AI 自对弈自动化回路
  useEffect(() => {
    if (!autoPlay || game.loading || !game.state) return

    // 如果对局结束，停止自对弈
    if (game.state.phase === 'game_over') {
      setAutoPlay(false)
      return
    }

    if (game.error) {
      // 只在出牌阶段失败时计入重试，建议阶段失败直接重试
      if (autoPlayPhaseRef.current === 'play') {
        autoPlayRetryRef.current++
        if (autoPlayRetryRef.current >= MAX_AUTO_PLAY_RETRIES) {
          autoPlayRetryRef.current = 0
          setAutoPlay(false)
          return
        }
      }
      // 出错后重新请求建议
      autoPlayPhaseRef.current = 'suggest'
      const timer = setTimeout(() => {
        game.requestSuggestion(game.state!.currentPlayer)
      }, 1500)
      return () => clearTimeout(timer)
    }

    if (game.suggestion) {
      autoPlayRetryRef.current = 0
      autoPlayPhaseRef.current = 'play'
      // 收到 AI 建议后，延迟 1.2 秒自动执行
      const timer = setTimeout(() => {
        const option = game.suggestion!.primary
        if (option.action === 'play') {
          const cards = option.cards.map((c: any) => {
            if (c.rank === 'BJ' || c.rank === 'SJ') {
              return { type: (c.rank === 'BJ' ? 'big' : 'small'), copyIndex: c.copyIndex }
            }
            return {
              rank: c.rank,
              suit: c.suit,
              copyIndex: c.copyIndex,
              isTrump: c.rank === game.state!.trumpRank,
              isRedTrump: c.rank === game.state!.trumpRank && c.suit === 'heart',
            }
          })
          game.play(game.state!.currentPlayer, cards as any)
        } else {
          game.pass(game.state!.currentPlayer)
        }
      }, 1200)
      return () => clearTimeout(timer)
    } else {
      // 未收到 AI 建议，延迟 800ms 请求当前出牌玩家的建议
      autoPlayPhaseRef.current = 'suggest'
      const timer = setTimeout(() => {
        game.requestSuggestion(game.state!.currentPlayer)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [autoPlay, game.suggestion, game.loading, game.state, game.error])

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
    if (handCards.length !== 27) return
    const mode: GameMode = {
      type: 'single',
      tributeEnabled: false,
      tripleWithSingle: false,
      initialTrumpRank: trumpRank,
    }
    const seats: SeatConfig = { me: 0, teammate: 2, opponentA: 1, opponentB: 3 }
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

  return (
    <AnimatePresence mode="wait">
      {setupMode ? (
        <motion.div
          key="setup"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={styles.setupContainer}
        >
          <div style={styles.setupLogo}>
            <CardsIcon size={48} color="#4f46e5" />
          </div>
          <h2 style={styles.setupTitle}>掼蛋助手</h2>
          <p style={styles.setupSubtitle}>智能出牌辅助 · 实时AI建议</p>
          <div style={styles.setupForm}>
            <div style={styles.formRow}>
              <label style={styles.label}>主牌等级</label>
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
              <label style={styles.label}>选择你的手牌（点选27张）</label>
              <HandPicker
                trumpRank={trumpRank}
                selectedCards={handCards}
                onSelectionChange={setHandCards}
                maxCards={27}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <motion.button
                whileHover={handCards.length === 27 ? { scale: 1.02 } : {}}
                whileTap={handCards.length === 27 ? { scale: 0.98 } : {}}
                style={{
                  ...styles.startBtn,
                  flex: 1,
                  ...(handCards.length !== 27 ? styles.startBtnDisabled : {}),
                }}
                onClick={handleStartGame}
                disabled={handCards.length !== 27}
              >
                {handCards.length === 27 ? '🎮 开始游戏' : `选牌 (${handCards.length}/27)`}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  ...styles.startBtn,
                  flex: 1,
                  background: 'linear-gradient(135deg, #37b24d, #2b8a3e)',
                  boxShadow: '0 4px 16px rgba(43,138,62,0.3)',
                }}
                onClick={() => {
                  const mode: GameMode = {
                    type: 'single',
                    tributeEnabled: false,
                    tripleWithSingle: false,
                    initialTrumpRank: trumpRank,
                  }
                  const seats: SeatConfig = { me: 0, teammate: 2, opponentA: 1, opponentB: 3 }
                  game.startGame(mode, seats, [])
                  setSetupMode(false)
                }}
              >
                🎲 随机分发并开始
              </motion.button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="game"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={styles.container}
        >
          <div style={styles.topBar}>
            <PlayerBar
              players={playerInfos}
              trumpRank={game.state?.trumpRank || '7'}
              roundNumber={game.state?.roundNumber || 1}
            />
          </div>

          <div style={styles.mainArea}>
            {/* Left Column: History & Tracker */}
            <div style={styles.leftPanel}>
              <PlayHistory
                rounds={game.state?.rounds || []}
                currentRound={game.state?.currentRound || null}
                trumpRank={game.state?.trumpRank || '7'}
              />
              <CardTracker
                tracker={game.state?.cardTracker || {}}
                trumpRank={game.state?.trumpRank || '7'}
              />
            </div>

            {/* Center Column: PlayerSelect, Selector, Actions, HandDisplay */}
            <div style={styles.centerPanel}>
              <div style={styles.playerSelect}>
                <label style={styles.label}>出牌玩家</label>
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
                <motion.button
                  whileHover={!(selectedCards.length === 0 || game.loading) ? { scale: 1.03 } : {}}
                  whileTap={!(selectedCards.length === 0 || game.loading) ? { scale: 0.97 } : {}}
                  style={{
                    ...styles.actionBtn,
                    ...styles.playBtn,
                    ...(selectedCards.length === 0 || game.loading ? styles.actionBtnDisabled : {}),
                  }}
                  onClick={handlePlay}
                  disabled={selectedCards.length === 0 || game.loading}
                >
                  <PlayIcon size={14} style={{ marginRight: 6 }} />
                  确认出牌
                </motion.button>
                <motion.button
                  whileHover={!game.loading ? { scale: 1.03 } : {}}
                  whileTap={!game.loading ? { scale: 0.97 } : {}}
                  style={{
                    ...styles.actionBtn,
                    ...styles.passBtn,
                    ...(game.loading ? styles.actionBtnDisabled : {}),
                  }}
                  onClick={handlePass}
                  disabled={game.loading}
                >
                  <PassIcon size={14} style={{ marginRight: 6 }} />
                  过
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ ...styles.actionBtn, ...styles.undoBtn }}
                  onClick={handleUndo}
                >
                  <UndoIcon size={14} style={{ marginRight: 6 }} />
                  撤回
                </motion.button>
                <motion.button
                  whileHover={!game.loading ? { scale: 1.03 } : {}}
                  whileTap={!game.loading ? { scale: 0.97 } : {}}
                  style={{
                    ...styles.actionBtn,
                    ...styles.suggestBtn,
                    ...(game.loading ? styles.actionBtnDisabled : {}),
                  }}
                  onClick={() => game.requestSuggestion(game.state!.currentPlayer)}
                  disabled={game.loading}
                >
                  <BrainIcon size={14} style={{ marginRight: 6 }} />
                  AI建议
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    ...styles.actionBtn,
                    background: autoPlay ? 'linear-gradient(135deg, #fa5252, #e03131)' : 'linear-gradient(135deg, #40c057, #2f9e44)',
                    boxShadow: autoPlay ? '0 4px 12px rgba(224,49,49,0.15)' : '0 4px 12px rgba(47,158,68,0.15)',
                    color: '#fff',
                  }}
                  onClick={() => setAutoPlay(ap => !ap)}
                >
                  {autoPlay ? <StopIcon size={14} style={{ marginRight: 6 }} /> : <AutoplayIcon size={14} style={{ marginRight: 6 }} />}
                  {autoPlay ? '停止对弈' : 'AI自动对弈'}
                </motion.button>
              </div>

              <HandDisplay
                cards={(game.state?.myHand || []).map((s: any) => s.card)}
                trumpRank={game.state?.trumpRank || '7'}
              />
            </div>

            {/* Right Column: AI Suggestion */}
            <div style={styles.rightPanel}>
              <SuggestionPanel
                suggestion={game.suggestion}
                loading={game.loading}
                onAdopt={handleAdoptSuggestion}
              />
            </div>
          </div>

          {game.error && (
            <div style={styles.errorBar}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ErrorIcon size={16} />
                {game.error}
              </span>
              <button style={styles.errorClose} onClick={() => {}}>
                <CloseIcon size={14} />
              </button>
            </div>
          )}

          {!game.connected && (
            <div style={styles.disconnected}>
              <WarningIcon size={14} style={{ marginRight: 6 }} />
              未连接到服务器
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    color: '#1f2937',
  },
  topBar: {
    marginBottom: 16,
  },
  mainArea: {
    display: 'grid',
    gridTemplateColumns: '280px 1fr 320px',
    gap: 20,
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  centerPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  playerSelect: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    background: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#4b5563',
  },
  select: {
    padding: '6px 12px',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#d1d5db',
    fontSize: 13,
    background: '#ffffff',
    color: '#1f2937',
    outline: 'none',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  actionBar: {
    display: 'flex',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    padding: '10px 0',
    borderRadius: 10,
    borderWidth: 0,
    borderStyle: 'solid',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    transform: 'none',
    boxShadow: 'none',
  },
  playBtn: {
    background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(79,70,229,0.15)',
  },
  passBtn: {
    background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
    color: '#374151',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#d1d5db',
  },
  undoBtn: {
    background: '#ffffff',
    color: '#374151',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#d1d5db',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  suggestBtn: {
    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(139,92,246,0.15)',
  },
  errorBar: {
    marginTop: 16,
    padding: '10px 16px',
    background: '#fef2f2',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#fee2e2',
    borderRadius: 12,
    color: '#ef4444',
    fontSize: 13,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(239,68,68,0.05)',
  },
  errorClose: {
    background: 'none',
    borderWidth: 0,
    borderStyle: 'solid',
    cursor: 'pointer',
    color: '#ef4444',
    display: 'flex',
    alignItems: 'center',
  },
  disconnected: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: '#fef2f2',
    borderColor: '#fee2e2',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    color: '#ef4444',
    textAlign: 'center',
    padding: 10,
    fontSize: 13,
    fontWeight: 600,
    zIndex: 9999,
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupContainer: {
    maxWidth: 640,
    margin: '60px auto',
    padding: 32,
    background: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
  },
  setupLogo: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 16,
  },
  setupTitle: {
    textAlign: 'center',
    marginBottom: 6,
    fontSize: 26,
    color: '#111827',
    fontWeight: 800,
    letterSpacing: 0.5,
  },
  setupSubtitle: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 32,
  },
  setupForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  startBtn: {
    padding: '12px 24px',
    borderRadius: 12,
    borderWidth: 0,
    borderStyle: 'solid',
    background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(79,70,229,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnDisabled: {
    background: '#e5e7eb',
    color: '#9ca3af',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
}
