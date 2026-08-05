import type { GameState } from '../game/types'

const TOKEN_KEY = 'checkrealm-session-v1'

export interface OnlineUser {
  name: string
  bestScore: number
  victories: number
  createdAt: number
}

export interface LeaderboardEntry {
  name: string
  score: number
  victories: number
  online: boolean
  lastSeen: number
}

export interface HeraldEntry {
  at: number
  from: string | null
  message: string
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage unavailable — session just won't persist
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const token = getToken()
  const res = await fetch(url, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  let payload: unknown = null
  try {
    payload = await res.json()
  } catch {
    // non-JSON error body
  }
  if (!res.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed (${res.status})`
    throw new Error(message)
  }
  return payload as T
}

export const api = {
  register: (username: string, password: string) =>
    request<{ token: string; user: OnlineUser }>('POST', '/api/auth/register', {
      username,
      password,
    }),
  login: (username: string, password: string) =>
    request<{ token: string; user: OnlineUser }>('POST', '/api/auth/login', {
      username,
      password,
    }),
  logout: () => request<{ ok: true }>('POST', '/api/auth/logout'),
  me: () => request<{ user: OnlineUser; hasSave: boolean }>('GET', '/api/auth/me'),
  getSave: () => request<{ state: GameState | null }>('GET', '/api/save'),
  putSave: (state: GameState | null, score: number, victories: number) =>
    request<{ ok: true; user: OnlineUser }>('PUT', '/api/save', { state, score, victories }),
  leaderboard: () => request<{ entries: LeaderboardEntry[] }>('GET', '/api/leaderboard'),
  herald: (message: string) => request<{ ok: true }>('POST', '/api/herald', { message }),
}

export function wsUrl(token: string): string {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${location.host}/ws?token=${encodeURIComponent(token)}`
}
