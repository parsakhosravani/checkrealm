import { armyStrength } from './engine'
import type { GameState } from './types'

/**
 * Realm score: what the leaderboard ranks. Grows with population,
 * developed buildings, standing armies and battlefield victories.
 */
export function computeScore(state: GameState): { score: number; victories: number } {
  const player = state.players.find((p) => p.id === state.humanPlayerId)
  const villages = state.villages.filter((v) => v.ownerId === state.humanPlayerId)

  let score = 0
  for (const village of villages) {
    score += village.population * 4
    score += village.slots.reduce((sum, slot) => sum + slot.level, 0) * 12
    score += Math.round(
      (armyStrength(village.army, 'attack') + armyStrength(village.army, 'defense')) / 10,
    )
  }

  const victories = player
    ? state.reports.filter((r) => r.victory && r.attackerName.startsWith(player.name)).length
    : 0
  score += victories * 150

  return { score, victories }
}
