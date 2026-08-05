import { WebSocketServer } from 'ws'
import { leaderboard, sessionUser } from './app.js'

const HERALD_LOG_SIZE = 40

/**
 * Realtime hub: tracks who is online over WebSocket and pushes presence,
 * leaderboard and herald (world feed) updates to every connected player.
 */
export function createHub(store) {
  const wss = new WebSocketServer({ noServer: true })
  /** @type {Map<import('ws').WebSocket, {name: string}>} */
  const clients = new Map()
  const heraldLog = []

  function onlineNames() {
    const names = new Set()
    for (const { name } of clients.values()) names.add(name)
    return [...names].sort((a, b) => a.localeCompare(b))
  }

  function send(ws, payload) {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload))
  }

  function broadcast(payload) {
    const raw = JSON.stringify(payload)
    for (const ws of clients.keys()) {
      if (ws.readyState === ws.OPEN) ws.send(raw)
    }
  }

  const hub = {
    onlineNames,
    broadcastPresence() {
      broadcast({ type: 'presence', online: onlineNames() })
    },
    broadcastLeaderboard() {
      broadcast({ type: 'leaderboard', entries: leaderboard(store, hub) })
    },
    herald(message, from = null) {
      const entry = { at: Date.now(), from, message }
      heraldLog.push(entry)
      if (heraldLog.length > HERALD_LOG_SIZE) heraldLog.shift()
      broadcast({ type: 'herald', entry })
    },
    handleUpgrade(req, socket, head) {
      const url = new URL(req.url, 'http://localhost')
      // Other upgrade listeners (e.g. Vite HMR in dev) own non-/ws sockets.
      if (url.pathname !== '/ws') return
      const user = sessionUser(store, url.searchParams.get('token'))
      if (!user) {
        socket.destroy()
        return
      }
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req, user)
      })
    },
    close() {
      for (const ws of clients.keys()) ws.terminate()
      wss.close()
    },
  }

  wss.on('connection', (ws, _req, user) => {
    clients.set(ws, { name: user.name })
    send(ws, { type: 'welcome', online: onlineNames(), entries: leaderboard(store, hub), herald: heraldLog })
    hub.broadcastPresence()
    hub.broadcastLeaderboard()

    ws.on('message', (raw) => {
      let msg
      try {
        msg = JSON.parse(String(raw))
      } catch {
        return
      }
      if (msg?.type === 'ping') send(ws, { type: 'pong' })
    })

    ws.on('close', () => {
      clients.delete(ws)
      user.lastSeen = Date.now()
      store.save()
      hub.broadcastPresence()
      hub.broadcastLeaderboard()
    })
  })

  return hub
}
