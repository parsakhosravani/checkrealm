import { RESOURCE_META, UNITS } from '../game/constants'
import { formatNumber } from '../game/engine'
import type { BattleReport, Resources, UnitId } from '../game/types'

interface ReportsViewProps {
  reports: BattleReport[]
}

function armyLine(
  label: string,
  army: Record<UnitId, number>,
  losses?: Record<UnitId, number>,
) {
  const parts = (Object.keys(UNITS) as UnitId[])
    .filter((id) => (army[id] ?? 0) > 0 || (losses?.[id] ?? 0) > 0)
    .map((id) => {
      const lost = losses?.[id] ?? 0
      return `${UNITS[id].symbol}${army[id] ?? 0}${lost ? ` (−${lost})` : ''}`
    })
  if (!parts.length) return `${label}: none`
  return `${label}: ${parts.join('  ')}`
}

export function ReportsView({ reports }: ReportsViewProps) {
  return (
    <section className="panel">
      <div className="panel__head">
        <div>
          <h2>Battle Reports</h2>
          <p>Every clash on the board is etched here — victories, routs, and spoils.</p>
        </div>
      </div>

      {reports.length === 0 ? (
        <p className="empty">No battles yet. March an army from the Board.</p>
      ) : (
        <div className="reports">
          {reports.map((r) => {
            const lootParts = (Object.keys(RESOURCE_META) as (keyof Resources)[])
              .filter((id) => r.loot[id] > 0)
              .map((id) => `${RESOURCE_META[id].symbol}${formatNumber(r.loot[id])}`)

            return (
              <article
                key={r.id}
                className={`report ${r.victory ? 'report--win' : 'report--loss'}`}
              >
                <h3>{r.victory ? 'Victory' : 'Defeat'}</h3>
                <p>{r.summary}</p>
                <div className="report__meta">
                  <span>{new Date(r.at).toLocaleString()}</span>
                  <span>{r.attackerName}</span>
                  <span>vs {r.defenderName}</span>
                </div>
                <div className="report__meta">
                  <span>{armyLine('Attacker', r.attackerArmy, r.attackerLosses)}</span>
                </div>
                <div className="report__meta">
                  <span>{armyLine('Defender', r.defenderArmy, r.defenderLosses)}</span>
                </div>
                {lootParts.length > 0 && (
                  <div className="report__meta">
                    <span>Loot {lootParts.join('  ')}</span>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
