import React from 'react'
import { GameBoard } from './components/GameBoard'

const App: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f3f5',
      padding: 16,
    }}>
      <GameBoard />
    </div>
  )
}

export default App
