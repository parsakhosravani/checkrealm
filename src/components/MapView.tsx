import { useMemo, useState } from 'react'
import { EMPTY_ARMY, MAP_SIZE, UNITS } from '../game/constants'
import { armyCount, formatDuration } from '../game/engine'
import type { Army, GameState, UnitId, Village } from '../game/types'

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

  const byCoord = useMemo(() => {
    const map = new Map<string, Village>()
    for (const v of state.villages) map.set(`${v.x},${v.y}`, v)
    return map
  }, [state.villages])

  const selected = state.villages.find((v) => v.id === selectedId) ?? null
  const owner = selected
    ? state.players.find((p) => p.id === selected.ownerId)
    : null
  const isEnemy = selected && selected.ownerId !== state.humanPlayerId

  const cells = []
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const village = byCoord.get(`${x},${y}`)
      const light = (x + y) % 2 === 0
      const yours = village?.ownerId === state.humanPlayerId
      const player = village
        ? state.players.find((p) => p.id === village.ownerId)
        : null

      cells.push(
        <button
          key={`${x}-${y}`}
          type="button"
          className={[
            'map-cell',
            light ? 'map-cell--light' : 'map-cell--dark',
            village ? 'map-cell--occupied' : '',
            yours ? 'map-cell--yours' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={village ? { color: player?.color } : undefined}
          disabled={!village}
          onClick={() => {
            if (!village) return
            setSelectedId(village.id)
            setArmy(EMPTY_ARMY())
          }}
          title={village ? `${village.name} (${x}, ${y})` : `Empty square (${x}, ${y})`}
        >
          {village ? (yours ? '♔' : '♚') : ''}
          {village && (
            <span className="map-cell__label">
              {village.name.split(' ')[0]}
            </span>
          )}
        </button>,
      )
    }
  }

  return (
    <section className="panel">
      <div className="panel__head">
        <div>
          <h2>The Board</h2>
          <p>
            Nine files by nine ranks. Your king marks home. Strike rival keeps to
            seize timber, ivory, steel, and grain.
          </p>
        </div>
      </div>

      <div className="map-wrap">
        <div className="map-grid" role="grid" aria-label="World map">
          {cells}
        </div>
      </div>

      {selected && owner && (
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
                  {m.kind === 'return' ? 'Returning' : m.kind === 'raid' ? 'Raiding' : 'Attacking'}{' '}
                  from {from?.name ?? '?'} → {to?.name ?? '?'} · {armyCount(m.army)} pieces ·{' '}
                  {formatDuration(m.arrivesAt - now)}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
