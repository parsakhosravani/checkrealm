import { useCallback, useEffect, useRef, useState } from 'react'
import type { GameState } from '../game/types'
import {
  api,
  getToken,
  setToken,
  wsUrl,
  type HeraldEntry,
  type LeaderboardEntry,
  type OnlineUser,
} from './api'

const HERALD_MAX = 40

export interface Online {
  user: OnlineUser | null
  checking: boolean
  authBusy: boolean
  authError: string | null
  connected: boolean
  onlineNames: string[]
  entries: LeaderboardEntry[]
  herald: HeraldEntry[]
  serverSave: GameState | null
  register: (username: string, password: string) => Promise<boolean>
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  syncSave: (state: GameState | null, score: number, victories: number) => void
  sendHerald: (message: string) => void
  dismissAuthError: () => void
}

export function useOnline(): Online {
  const [user, setUser] = useState<OnlineUser | null>(null)
  const [checking, setChecking] = useState(() => !!getToken())
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [onlineNames, setOnlineNames] = useState<string[]>([])
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [herald, setHerald] = useState<HeraldEntry[]>([])
  const [serverSave, setServerSave] = useState<GameState | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef(0)
  const closedByUs = useRef(false)

  const loadServerSave = useCallback(async () => {
    try {
      const { state } = await api.getSave()
      setServerSave(state)
    } catch {
      setServerSave(null)
    }
  }, [])

  // Restore an existing session on boot.
  useEffect(() => {
    if (!getToken()) return
    let cancelled = false
    ;(async () => {
      try {
        const { user: me } = await api.me()
        if (cancelled) return
        setUser(me)
        await loadServerSave()
      } catch {
        setToken(null)
      } finally {
        if (!cancelled) setChecking(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadServerSave])

  // Realtime connection follows the signed-in user.
  const userName = user?.name ?? null
  useEffect(() => {
    if (!userName) {
      setConnected(false)
      setOnlineNames([])
      return
    }
    let disposed = false
    let reconnectTimer: number | undefined

    function connect() {
      const token = getToken()
      if (!token || disposed) return
      closedByUs.current = false
      const ws = new WebSocket(wsUrl(token))
      wsRef.current = ws

      ws.onopen = () => {
        retryRef.current = 0
        setConnected(true)
      }
      ws.onmessage = (event) => {
        let msg: Record<string, unknown>
        try {
          msg = JSON.parse(String(event.data))
        } catch {
          return
        }
        if (msg.type === 'welcome') {
          setOnlineNames(msg.online as string[])
          setEntries(msg.entries as LeaderboardEntry[])
          setHerald((msg.herald as HeraldEntry[]).slice(-HERALD_MAX))
        } else if (msg.type === 'presence') {
          setOnlineNames(msg.online as string[])
        } else if (msg.type === 'leaderboard') {
          setEntries(msg.entries as LeaderboardEntry[])
        } else if (msg.type === 'herald') {
          setHerald((prev) => [...prev, msg.entry as HeraldEntry].slice(-HERALD_MAX))
        }
      }
      ws.onclose = () => {
        setConnected(false)
        wsRef.current = null
        if (disposed || closedByUs.current) return
        const delay = Math.min(15000, 1000 * 2 ** retryRef.current)
        retryRef.current += 1
        reconnectTimer = window.setTimeout(connect, delay)
      }
      ws.onerror = () => ws.close()
    }

    connect()
    return () => {
      disposed = true
      window.clearTimeout(reconnectTimer)
      closedByUs.current = true
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [userName])

  const authenticate = useCallback(
    async (kind: 'login' | 'register', username: string, password: string) => {
      setAuthBusy(true)
      setAuthError(null)
      try {
        const { token, user: me } =
          kind === 'login'
            ? await api.login(username, password)
            : await api.register(username, password)
        setToken(token)
        setUser(me)
        await loadServerSave()
        return true
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Something went wrong.')
        return false
      } finally {
        setAuthBusy(false)
      }
    },
    [loadServerSave],
  )

  const login = useCallback(
    (u: string, p: string) => authenticate('login', u, p),
    [authenticate],
  )
  const register = useCallback(
    (u: string, p: string) => authenticate('register', u, p),
    [authenticate],
  )

  const logout = useCallback(() => {
    api.logout().catch(() => {})
    setToken(null)
    setUser(null)
    setServerSave(null)
    setEntries([])
    setHerald([])
  }, [])

  const syncSave = useCallback(
    (state: GameState | null, score: number, victories: number) => {
      api
        .putSave(state, score, victories)
        .then(({ user: updated }) => setUser(updated))
        .catch(() => {})
    },
    [],
  )

  const sendHerald = useCallback((message: string) => {
    api.herald(message).catch(() => {})
  }, [])

  const dismissAuthError = useCallback(() => setAuthError(null), [])

  return {
    user,
    checking,
    authBusy,
    authError,
    connected,
    onlineNames,
    entries,
    herald,
    serverSave,
    register,
    login,
    logout,
    syncSave,
    sendHerald,
    dismissAuthError,
  }
}
