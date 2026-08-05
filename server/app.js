import express from 'express'
import { hashPassword, newId, newToken, verifyPassword } from './auth.js'

const USERNAME_RE = /^[a-zA-Z0-9_ ]{3,20}$/
const MAX_SAVE_BYTES = 512 * 1024
const LEADERBOARD_SIZE = 25

export function publicUser(user) {
  return {
    name: user.name,
    bestScore: user.bestScore ?? 0,
    victories: user.victories ?? 0,
    createdAt: user.createdAt,
  }
}

/**
 * Builds the JSON API. `hub` is optional and receives realtime notifications
 * (presence/leaderboard/herald broadcasts) when provided.
 */
export function createApp(store, hub = null) {
  const app = express()
  app.use(express.json({ limit: '600kb' }))

  const users = () => store.data.users
  const sessions = () => store.data.sessions

  function findUser(username) {
    return users()[String(username || '').trim().toLowerCase()] ?? null
  }

  function authed(req, res, next) {
    const header = String(req.headers.authorization || '')
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    const session = token ? sessions()[token] : null
    const user = session ? findUser(session.username) : null
    if (!user) {
      res.status(401).json({ error: 'Not signed in.' })
      return
    }
    session.lastSeen = Date.now()
    user.lastSeen = Date.now()
    req.user = user
    req.token = token
    store.save()
    next()
  }

  function startSession(user) {
    const token = newToken()
    sessions()[token] = { username: user.name.toLowerCase(), createdAt: Date.now(), lastSeen: Date.now() }
    store.save()
    return token
  }

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'checkrealm', time: new Date().toISOString() })
  })

  app.post('/api/auth/register', (req, res) => {
    const name = String(req.body?.username || '').trim()
    const password = String(req.body?.password || '')
    if (!USERNAME_RE.test(name)) {
      res.status(400).json({ error: 'Username must be 3–20 letters, numbers, spaces or underscores.' })
      return
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' })
      return
    }
    if (findUser(name)) {
      res.status(409).json({ error: 'That house name is already claimed.' })
      return
    }
    const { salt, hash } = hashPassword(password)
    const user = {
      id: newId(),
      name,
      salt,
      hash,
      createdAt: Date.now(),
      lastSeen: Date.now(),
      bestScore: 0,
      victories: 0,
      save: null,
    }
    users()[name.toLowerCase()] = user
    const token = startSession(user)
    hub?.broadcastLeaderboard()
    hub?.herald(`⚑ House ${user.name} has founded a realm.`)
    res.status(201).json({ token, user: publicUser(user) })
  })

  app.post('/api/auth/login', (req, res) => {
    const user = findUser(req.body?.username)
    const password = String(req.body?.password || '')
    if (!user || !verifyPassword(password, user.salt, user.hash)) {
      res.status(401).json({ error: 'Wrong house name or password.' })
      return
    }
    const token = startSession(user)
    res.json({ token, user: publicUser(user) })
  })

  app.post('/api/auth/logout', authed, (req, res) => {
    delete sessions()[req.token]
    store.save()
    res.json({ ok: true })
  })

  app.get('/api/auth/me', authed, (req, res) => {
    res.json({ user: publicUser(req.user), hasSave: !!req.user.save })
  })

  app.get('/api/save', authed, (req, res) => {
    res.json({ state: req.user.save ?? null })
  })

  app.put('/api/save', authed, (req, res) => {
    const { state, score, victories } = req.body ?? {}
    if (state !== null && state !== undefined) {
      const raw = JSON.stringify(state)
      if (raw.length > MAX_SAVE_BYTES) {
        res.status(413).json({ error: 'Save too large.' })
        return
      }
      req.user.save = state
    } else {
      req.user.save = null
    }
    const numericScore = Number(score)
    let newBest = false
    if (Number.isFinite(numericScore) && numericScore > (req.user.bestScore ?? 0)) {
      req.user.bestScore = Math.min(Math.round(numericScore), 1_000_000_000)
      newBest = true
    }
    const numericVictories = Number(victories)
    if (Number.isFinite(numericVictories) && numericVictories > (req.user.victories ?? 0)) {
      req.user.victories = Math.min(Math.round(numericVictories), 1_000_000)
      newBest = true
    }
    store.save()
    if (newBest) hub?.broadcastLeaderboard()
    res.json({ ok: true, user: publicUser(req.user) })
  })

  app.get('/api/leaderboard', (_req, res) => {
    res.json({ entries: leaderboard(store, hub) })
  })

  app.get('/api/online', (_req, res) => {
    res.json({ online: hub ? hub.onlineNames() : [] })
  })

  const heraldLast = new Map()
  app.post('/api/herald', authed, (req, res) => {
    const message = String(req.body?.message || '').slice(0, 240).trim()
    if (!message) {
      res.status(400).json({ error: 'Empty message.' })
      return
    }
    const last = heraldLast.get(req.user.id) ?? 0
    if (Date.now() - last < 1500) {
      res.status(429).json({ error: 'Too fast.' })
      return
    }
    heraldLast.set(req.user.id, Date.now())
    hub?.herald(message, req.user.name)
    res.json({ ok: true })
  })

  return app
}

export function leaderboard(store, hub = null) {
  const online = new Set((hub ? hub.onlineNames() : []).map((n) => n.toLowerCase()))
  return Object.values(store.data.users)
    .map((u) => ({
      name: u.name,
      score: u.bestScore ?? 0,
      victories: u.victories ?? 0,
      online: online.has(u.name.toLowerCase()),
      lastSeen: u.lastSeen ?? u.createdAt,
    }))
    .sort((a, b) => b.score - a.score || b.victories - a.victories || a.name.localeCompare(b.name))
    .slice(0, LEADERBOARD_SIZE)
}

export function sessionUser(store, token) {
  const session = token ? store.data.sessions[token] : null
  return session ? (store.data.users[session.username] ?? null) : null
}
