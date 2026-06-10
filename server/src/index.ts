import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../../.env') })
console.log('[dotenv] KIMI_API_KEY:', process.env.KIMI_API_KEY ? 'SET' : 'NOT SET')
import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { createAPIRouter } from './api/routes'
import { createWSServer } from './api/ws'

const PORT = parseInt(process.env.PORT || '3667', 10)

const app = express()
app.use(express.json())
app.use('/api', createAPIRouter())

const server = createServer(app)

const wss = new WebSocketServer({ server, path: '/ws' })
createWSServer(wss)

server.listen(PORT, () => {
  console.log(`掼蛋助手服务端已启动: http://localhost:${PORT}`)
  console.log(`WebSocket 端点: ws://localhost:${PORT}/ws`)
})
