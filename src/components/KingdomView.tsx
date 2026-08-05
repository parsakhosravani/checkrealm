import { useState } from 'react'
import { BUILDINGS, RESOURCE_META } from '../game/constants'
import {
  canAfford,
  formatDuration,
  formatNumber,
  getBuildingLevel,
  scaleCost,
} from '../game/engine'
import type { Resources, Village } from '../game/types'
import { KingdomScene } from '../three/KingdomScene'

interface KingdomViewProps {
  village: Village
  now: number
  onUpgrade: (slotIndex: number) => void
}

export function KingdomView({ village, now, onUpgrade }: KingdomViewProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(0)
  const job = village.construction
  const throneLvl = getBuildingLevel(village, 'throne')

  const slot =
    selectedSlot != null ? village.slots[selectedSlot] : null
  const def = slot?.buildingId ? BUILDINGS[slot.buildingId] : null
  const nextLevel = slot ? slot.level + 1 : 0
  const atMax = def && slot ? slot.level >= def.maxLevel : false
  const cost =
    def && slot && !atMax
      ? scaleCost(def.baseCost, nextLevel, def.costGrowth)
      : null
  const affordable = cost ? canAfford(village.resources, cost) : false
  const prodKey = def?.production
    ? (Object.keys(def.production)[0] as keyof Resources)
    : null

  return (
    <section className="view-3d">
      <KingdomScene
        village={village}
        selectedSlot={selectedSlot}
        onSelectSlot={setSelectedSlot}
      />

      <aside className="hud-panel">
        <div className="panel__head">
          <div>
            <h2>{village.name}</h2>
            <p>
              Population {village.population} · Throne rank {throneLvl}. Explore your
              3D plaza and raise the halls of the realm.
            </p>
          </div>
        </div>

        {job && (
          <div className="queue-banner">
            Raising {BUILDINGS[job.buildingId].name} to rank {job.targetLevel} —{' '}
            {formatDuration(job.finishesAt - now)} remaining
          </div>
        )}

        {def && slot ? (
          <div className="inspect-card">
            <div className="inspect-card__symbol" aria-hidden>
              {def.symbol}
            </div>
            <div>
              <h3>
                {def.name}{' '}
                <span>
                  {slot.level === 0 ? '· Not founded' : `· Rank ${slot.level}`}
                </span>
              </h3>
              <p>{def.description}</p>
              {prodKey && slot.level > 0 && (
                <p className="inspect-card__prod">
                  +
                  {formatNumber(
                    Math.floor(
                      (def.production![prodKey] ?? 0) *
                        slot.level *
                        (1 + (slot.level - 1) * 0.15),
                    ),
                  )}{' '}
                  {RESOURCE_META[prodKey].name}/h
                </p>
              )}
              {cost && (
                <div className="slot__cost" style={{ marginTop: '0.65rem' }}>
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
                className="btn btn--gold"
                style={{ marginTop: '0.85rem' }}
                disabled={!!atMax || !!job || !affordable}
                onClick={() => selectedSlot != null && onUpgrade(selectedSlot)}
              >
                {atMax
                  ? 'Complete'
                  : slot.level === 0
                    ? 'Found Structure'
                    : `Upgrade → ${nextLevel}`}
              </button>
            </div>
          </div>
        ) : (
          <p className="empty" style={{ padding: '1rem 0' }}>
            Select a pedestal in the 3D plaza.
          </p>
        )}
      </aside>
    </section>
  )
}
