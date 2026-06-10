import React from 'react'
import { GameBoard } from './components/GameBoard'

const App: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f2f5 0%, #f7f9fa 50%, #ffffff 100%)',
      padding: 16,
    }}>
      <GameBoard />
    </div>
  )
}

export default App
