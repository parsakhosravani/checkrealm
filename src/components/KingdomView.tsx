import { BUILDINGS, RESOURCE_META } from '../game/constants'
import {
  canAfford,
  formatDuration,
  formatNumber,
  getBuildingLevel,
  scaleCost,
} from '../game/engine'
import type { Resources, Village } from '../game/types'

interface KingdomViewProps {
  village: Village
  now: number
  onUpgrade: (slotIndex: number) => void
}

export function KingdomView({ village, now, onUpgrade }: KingdomViewProps) {
  const job = village.construction
  const throneLvl = getBuildingLevel(village, 'throne')

  return (
    <section className="panel">
      <div className="panel__head">
        <div>
          <h2>{village.name}</h2>
          <p>
            Population {village.population} · Throne rank {throneLvl}. Upgrade fields
            and halls to fuel your campaign across the board.
          </p>
        </div>
      </div>

      {job && (
        <div className="queue-banner">
          Raising {BUILDINGS[job.buildingId].name} to rank {job.targetLevel} —{' '}
          {formatDuration(job.finishesAt - now)} remaining
        </div>
      )}

      <div className="kingdom-grid">
        {village.slots.map((slot, index) => {
          if (!slot.buildingId) return null
          const def = BUILDINGS[slot.buildingId]
          const nextLevel = slot.level + 1
          const atMax = slot.level >= def.maxLevel
          const cost = atMax
            ? null
            : scaleCost(def.baseCost, nextLevel, def.costGrowth)
          const affordable = cost ? canAfford(village.resources, cost) : false
          const isBuilding = job?.slotIndex === index
          const prodKey = def.production
            ? (Object.keys(def.production)[0] as keyof Resources)
            : null

          return (
            <article
              key={index}
              className={`slot${isBuilding ? ' is-building' : ''}`}
            >
              <div className="slot__symbol" aria-hidden>
                {def.symbol}
              </div>
              <div className="slot__name">{def.name}</div>
              <div className="slot__level">
                {slot.level === 0 ? 'Not founded' : `Rank ${slot.level}`}
                {atMax ? ' · Max' : ''}
              </div>
              {prodKey && slot.level > 0 && (
                <div className="slot__prod">
                  +
                  {formatNumber(
                    Math.floor(
                      (def.production![prodKey] ?? 0) *
                        slot.level *
                        (1 + (slot.level - 1) * 0.15),
                    ),
                  )}{' '}
                  {RESOURCE_META[prodKey].name}/h
                </div>
              )}
              {cost && (
                <div className="slot__cost">
                  {(Object.keys(cost) as (keyof Resources)[]).map((id) => (
                    <span
                      key={id}
                      className={
                        village.resources[id] < cost[id] ? 'lack' : undefined
                      }
                    >
                      {RESOURCE_META[id].symbol}
                      {formatNumber(cost[id])}
                    </span>
                  ))}
                </div>
              )}
              <button
                type="button"
                className="slot__action"
                disabled={atMax || !!job || !affordable}
                onClick={() => onUpgrade(index)}
              >
                {atMax
                  ? 'Complete'
                  : slot.level === 0
                    ? 'Found'
                    : `Upgrade → ${nextLevel}`}
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
