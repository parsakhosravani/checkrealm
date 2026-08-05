import { useState } from 'react'
import { RESOURCE_META, UNITS } from '../game/constants'
import {
  canAfford,
  formatDuration,
  formatNumber,
  getBuildingLevel,
} from '../game/engine'
import type { Resources, UnitId, Village } from '../game/types'

interface ArmyViewProps {
  village: Village
  now: number
  onTrain: (unitId: UnitId, amount: number) => void
}

const UNIT_ORDER: UnitId[] = ['pawn', 'bishop', 'knight', 'rook', 'queen']

export function ArmyView({ village, now, onTrain }: ArmyViewProps) {
  const [amounts, setAmounts] = useState<Record<UnitId, number>>({
    pawn: 5,
    bishop: 2,
    knight: 2,
    rook: 1,
    queen: 1,
  })

  const job = village.training

  return (
    <section className="panel">
      <div className="panel__head">
        <div>
          <h2>Training Grounds</h2>
          <p>
            Muster chess pieces for raid and conquest. Grain upkeep rises with every
            soldier you field.
          </p>
        </div>
      </div>

      {job && (
        <div className="queue-banner">
          Training {job.amount}× {UNITS[job.unitId].name} —{' '}
          {formatDuration(job.finishesAt - now)} remaining
        </div>
      )}

      <div className="army-layout">
        <div className="unit-list">
          {UNIT_ORDER.map((id) => {
            const def = UNITS[id]
            const level = getBuildingLevel(village, def.requires)
            const unlocked = level >= def.minBuildingLevel
            const amount = amounts[id]
            const totalCost: Resources = {
              timber: def.cost.timber * amount,
              ivory: def.cost.ivory * amount,
              steel: def.cost.steel * amount,
              grain: def.cost.grain * amount,
            }
            const affordable = canAfford(village.resources, totalCost)

            return (
              <article key={id} className="unit-card">
                <div className="unit-card__symbol" aria-hidden>
                  {def.symbol}
                </div>
                <div>
                  <h3>
                    {def.name}
                    {!unlocked && (
                      <span style={{ color: 'var(--ivory-dim)', fontWeight: 400 }}>
                        {' '}
                        · locked
                      </span>
                    )}
                  </h3>
                  <p>{def.description}</p>
                  <div className="unit-card__stats">
                    <span>Atk {def.attack}</span>
                    <span>Def {def.defense}</span>
                    <span>Spd {def.speed}</span>
                    <span>Carry {def.carry}</span>
                    <span>Upkeep {def.upkeep}</span>
                  </div>
                  <div className="unit-card__stats">
                    {(Object.keys(totalCost) as (keyof Resources)[]).map((rid) => (
                      <span
                        key={rid}
                        style={{
                          color:
                            village.resources[rid] < totalCost[rid]
                              ? 'var(--danger)'
                              : undefined,
                        }}
                      >
                        {RESOURCE_META[rid].symbol}
                        {formatNumber(totalCost[rid])}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="unit-card__train">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={amount}
                    disabled={!unlocked || !!job}
                    onChange={(e) =>
                      setAmounts((prev) => ({
                        ...prev,
                        [id]: Math.max(1, Math.min(50, Number(e.target.value) || 1)),
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="btn btn--gold"
                    style={{ padding: '0.5rem 0.7rem', fontSize: '0.72rem' }}
                    disabled={!unlocked || !!job || !affordable}
                    onClick={() => onTrain(id, amount)}
                  >
                    Train
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        <aside className="garrison">
          <h3>Garrison</h3>
          <ul>
            {UNIT_ORDER.map((id) => (
              <li key={id}>
                <span>
                  {UNITS[id].symbol} {UNITS[id].name}
                </span>
                <strong>{village.army[id] ?? 0}</strong>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  )
}
