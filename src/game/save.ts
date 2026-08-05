import { SAVE_KEY } from './constants'
import type { GameState } from './types'

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as GameState
    if (data?.version !== 1) return null
    return data
  } catch {
    return null
  }
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota errors
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY)
}
