import http from 'node:http'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { createApp } from './app.js'
import { createHub } from './hub.js'
import { createStore } from './store.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PORT = Number(process.env.PORT || 3000)
const IS_PROD = process.env.NODE_ENV === 'production'
const DATA_FILE = process.env.CHECKREALM_DATA || path.join(ROOT, 'data', 'db.json')

async function main() {
  const store = createStore(DATA_FILE)
  const hub = createHub(store)
  const app = createApp(store, hub)

  if (IS_PROD) {
    const dist = path.join(ROOT, 'dist')
    if (!fs.existsSync(path.join(dist, 'index.html'))) {
      console.error('[checkrealm] dist/ not found — run `npm run build` first.')
      process.exit(1)
    }
    app.use(express.static(dist, { index: false, maxAge: '1h' }))
    app.get(/^\/(?!api\/|ws).*/, (_req, res) => {
      res.sendFile(path.join(dist, 'index.html'))
    })
  } else {
    // Dev: mount Vite as middleware so the game, API and WebSocket all share
    // one origin on one port (matches the Cloud Agent environment on :3000).
    const { createServer: createViteServer } = await import('vite')
    const vite = await createViteServer({
      root: ROOT,
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  }

  const server = http.createServer(app)
  server.on('upgrade', (req, socket, head) => hub.handleUpgrade(req, socket, head))

  server.listen(PORT, () => {
    console.log(`[checkrealm] ${IS_PROD ? 'production' : 'dev'} server on http://localhost:${PORT}`)
  })

  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => {
      try {
        store.flushNow()
      } catch {
        // best-effort flush
      }
      server.close(() => process.exit(0))
      setTimeout(() => process.exit(0), 1500).unref()
    })
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
