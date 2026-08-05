import { SAVE_KEY } from './constants'
import type { GameState } from './types'

/**
 * Local saves are scoped to the signed-in account so one browser can host
 * many houses without them adopting each other's kingdoms.
 */
let scope: string | null = null

export function setSaveScope(username: string | null): void {
  scope = username ? username.toLowerCase() : null
}

function key(): string | null {
  return scope ? `${SAVE_KEY}:${scope}` : null
}

export function loadGame(): GameState | null {
  const k = key()
  if (!k) return null
  try {
    const raw = localStorage.getItem(k)
    if (!raw) return null
    const data = JSON.parse(raw) as GameState
    if (data?.version !== 1) return null
    return data
  } catch {
    return null
  }
}

export function saveGame(state: GameState): void {
  const k = key()
  if (!k) return
  try {
    localStorage.setItem(k, JSON.stringify(state))
  } catch {
    // ignore quota errors
  }
}

export function clearSave(): void {
  const k = key()
  if (!k) return
  localStorage.removeItem(k)
}
