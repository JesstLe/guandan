import { Router, type Request, type Response } from 'express'

export function createAPIRouter(): Router {
  const router = Router()

  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: Date.now() })
  })

  router.get('/ranks', (_req: Request, res: Response) => {
    res.json({
      ranks: ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'],
      suits: ['spade', 'heart', 'diamond', 'club'],
    })
  })

  router.get('/combination-types', (_req: Request, res: Response) => {
    res.json([
      { type: 'single', name: '单张', minCards: 1 },
      { type: 'pair', name: '对子', minCards: 2 },
      { type: 'triple', name: '三张', minCards: 3 },
      { type: 'triple_with_pair', name: '三带二', minCards: 5 },
      { type: 'straight', name: '顺子', minCards: 5 },
      { type: 'pair_straight', name: '连对', minCards: 6 },
      { type: 'airplane', name: '钢板', minCards: 6 },
      { type: 'bomb', name: '炸弹', minCards: 4 },
      { type: 'same_suit_straight', name: '同花顺', minCards: 5 },
      { type: 'joker_bomb', name: '天王炸', minCards: 4 },
    ])
  })

  return router
}
