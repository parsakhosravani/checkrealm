import { useCallback, useEffect, useRef, useState } from 'react'
import { TICK_MS } from '../game/constants'
import {
  createNewGame,
  sendAttack,
  tick,
  trainUnits,
  upgradeBuilding,
} from '../game/engine'
import { clearSave, loadGame, saveGame } from '../game/save'
import type { Army, GameState, UnitId } from '../game/types'

export function useGame() {
  const [state, setState] = useState<GameState | null>(() => loadGame())
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    if (!state) return
    const id = window.setInterval(() => {
      const current = stateRef.current
      if (!current) return
      const next = tick(current)
      stateRef.current = next
      setState(next)
      setNow(Date.now())
      saveGame(next)
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [!!state])

  const startGame = useCallback((name: string) => {
    const fresh = createNewGame(name)
    setState(fresh)
    saveGame(fresh)
    setError(null)
  }, [])

  const continueGame = useCallback(() => {
    const saved = loadGame()
    if (!saved) {
      setError('No saved realm found.')
      return
    }
    const synced = tick(saved)
    setState(synced)
    saveGame(synced)
    setError(null)
  }, [])

  const resign = useCallback(() => {
    clearSave()
    setState(null)
    setError(null)
  }, [])

  const selectVillage = useCallback((villageId: string) => {
    setState((prev) => {
      if (!prev) return prev
      const next = { ...prev, selectedVillageId: villageId }
      saveGame(next)
      return next
    })
  }, [])

  const upgrade = useCallback((slotIndex: number) => {
    setState((prev) => {
      if (!prev) return prev
      const village = prev.villages.find((v) => v.ownerId === prev.humanPlayerId)
      if (!village) return prev
      const result = upgradeBuilding(prev, village.id, slotIndex)
      if ('error' in result) {
        setError(result.error)
        return prev
      }
      setError(null)
      saveGame(result)
      return result
    })
  }, [])

  const train = useCallback((unitId: UnitId, amount: number) => {
    setState((prev) => {
      if (!prev) return prev
      const village = prev.villages.find((v) => v.ownerId === prev.humanPlayerId)
      if (!village) return prev
      const result = trainUnits(prev, village.id, unitId, amount)
      if ('error' in result) {
        setError(result.error)
        return prev
      }
      setError(null)
      saveGame(result)
      return result
    })
  }, [])

  const attack = useCallback(
    (toVillageId: string, army: Army, kind: 'attack' | 'raid' = 'attack') => {
      setState((prev) => {
        if (!prev) return prev
        const village = prev.villages.find((v) => v.ownerId === prev.humanPlayerId)
        if (!village) return prev
        const result = sendAttack(prev, village.id, toVillageId, army, kind)
        if ('error' in result) {
          setError(result.error)
          return prev
        }
        setError(null)
        saveGame(result)
        return result
      })
    },
    [],
  )

  const dismissError = useCallback(() => setError(null), [])

  return {
    state,
    now,
    error,
    hasSave: !!loadGame() || !!state,
    startGame,
    continueGame,
    resign,
    selectVillage,
    upgrade,
    train,
    attack,
    dismissError,
  }
}
