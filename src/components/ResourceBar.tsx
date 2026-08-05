import { RESOURCE_META } from '../game/constants'
import { formatNumber, productionPerHour, storageCap } from '../game/engine'
import type { Resources, Village } from '../game/types'

interface ResourceBarProps {
  village: Village
}

export function ResourceBar({ village }: ResourceBarProps) {
  const prod = productionPerHour(village)
  const cap = storageCap(village)

  return (
    <div className="resources" aria-label="Resources">
      {(Object.keys(RESOURCE_META) as (keyof Resources)[]).map((id) => {
        const meta = RESOURCE_META[id]
        const limit = id === 'grain' ? cap.granary : cap.warehouse
        return (
          <div key={id} className="resource-chip" title={`${meta.name} storage ${formatNumber(limit)}`}>
            <span className="resource-chip__symbol" aria-hidden>
              {meta.symbol}
            </span>
            <div className="resource-chip__meta">
              <strong>{formatNumber(village.resources[id])}</strong>
              <span>
                {meta.name} · +{formatNumber(prod[id])}/h
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
