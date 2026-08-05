import { useState } from 'react'
import { EMPTY_ARMY, UNITS } from '../game/constants'
import { armyCount, formatDuration } from '../game/engine'
import type { Army, GameState, UnitId, Village } from '../game/types'
import { WorldBoard } from '../three/WorldBoard'

interface MapViewProps {
  state: GameState
  humanVillage: Village
  now: number
  onAttack: (toVillageId: string, army: Army, kind: 'attack' | 'raid') => void
}

const UNIT_ORDER: UnitId[] = ['pawn', 'bishop', 'knight', 'rook', 'queen']

export function MapView({ state, humanVillage, now, onAttack }: MapViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [army, setArmy] = useState<Army>(() => EMPTY_ARMY())

  const selected = state.villages.find((v) => v.id === selectedId) ?? null
  const owner = selected
    ? state.players.find((p) => p.id === selected.ownerId)
    : null
  const isEnemy = selected && selected.ownerId !== state.humanPlayerId

  return (
    <section className="view-3d">
      <WorldBoard
        state={state}
        selectedId={selectedId}
        onSelectVillage={setSelectedId}
      />

      <aside className="hud-panel">
        <div className="panel__head">
          <div>
            <h2>The Board</h2>
            <p>Orbit the living chessboard. Select a keep, then march your pieces.</p>
          </div>
        </div>

        {selected && owner ? (
          <div className="map-detail">
            <h3>
              {selected.name}{' '}
              <span style={{ color: owner.color }}>· {owner.name}</span>
            </h3>
            <p>
              Square ({selected.x}, {selected.y}) · Population {selected.population}
              {selected.id === humanVillage.id ? ' · Your capital' : ''}
            </p>

            {isEnemy && (
              <form
                className="march-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  onAttack(selected.id, army, 'attack')
                  setArmy(EMPTY_ARMY())
                }}
              >
                <div className="march-form__units">
                  {UNIT_ORDER.map((id) => (
                    <label key={id}>
                      {UNITS[id].symbol} {UNITS[id].name} ({humanVillage.army[id] ?? 0})
                      <input
                        type="number"
                        min={0}
                        max={humanVillage.army[id] ?? 0}
                        value={army[id] ?? 0}
                        onChange={(e) =>
                          setArmy((prev) => ({
                            ...prev,
                            [id]: Math.max(
                              0,
                              Math.min(
                                humanVillage.army[id] ?? 0,
                                Number(e.target.value) || 0,
                              ),
                            ),
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
                <div className="landing__actions" style={{ justifyContent: 'flex-start' }}>
                  <button
                    type="submit"
                    className="btn btn--gold"
                    disabled={armyCount(army) < 1}
                  >
                    March to Attack
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    disabled={armyCount(army) < 1}
                    onClick={() => {
                      onAttack(selected.id, army, 'raid')
                      setArmy(EMPTY_ARMY())
                    }}
                  >
                    Raid
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <p className="empty" style={{ padding: '1rem 0' }}>
            Click a 3D keep on the board to inspect it.
          </p>
        )}

        {state.marches.length > 0 && (
          <div className="marches">
            <h3>Armies in Motion</h3>
            <ul>
              {state.marches.map((m) => {
                const from = state.villages.find((v) => v.id === m.fromVillageId)
                const to = state.villages.find((v) => v.id === m.toVillageId)
                return (
                  <li key={m.id}>
                    {m.kind === 'return'
                      ? 'Returning'
                      : m.kind === 'raid'
                        ? 'Raiding'
                        : 'Attacking'}{' '}
                    from {from?.name ?? '?'} → {to?.name ?? '?'} · {armyCount(m.army)} pieces ·{' '}
                    {formatDuration(m.arrivesAt - now)}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </aside>
    </section>
  )
}
