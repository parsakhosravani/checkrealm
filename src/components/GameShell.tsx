import { useState } from 'react'
import { getHumanVillage } from '../game/engine'
import type { Army, GameState, UnitId, ViewId } from '../game/types'
import { ArmyView } from './ArmyView'
import { KingdomView } from './KingdomView'
import { MapView } from './MapView'
import { ReportsView } from './ReportsView'
import { ResourceBar } from './ResourceBar'

interface GameShellProps {
  state: GameState
  now: number
  onUpgrade: (slotIndex: number) => void
  onTrain: (unitId: UnitId, amount: number) => void
  onAttack: (toVillageId: string, army: Army, kind: 'attack' | 'raid') => void
  onResign: () => void
}

const VIEWS: { id: ViewId; label: string }[] = [
  { id: 'kingdom', label: 'Kingdom' },
  { id: 'army', label: 'Army' },
  { id: 'map', label: 'Board' },
  { id: 'reports', label: 'Reports' },
]

export function GameShell({
  state,
  now,
  onUpgrade,
  onTrain,
  onAttack,
  onResign,
}: GameShellProps) {
  const [view, setView] = useState<ViewId>('kingdom')
  const village = getHumanVillage(state)
  const player = state.players.find((p) => p.id === state.humanPlayerId)!

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__brand">
          CheckRealm
          <small>
            {player.name} · {village.name}
          </small>
        </div>

        <ResourceBar village={village} />

        <nav className="nav" aria-label="Main">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`nav__btn${view === v.id ? ' is-active' : ''}`}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
          <button type="button" className="nav__btn" onClick={onResign}>
            Resign
          </button>
        </nav>
      </header>

      <main className="main">
        {view === 'kingdom' && (
          <KingdomView village={village} now={now} onUpgrade={onUpgrade} />
        )}
        {view === 'army' && (
          <ArmyView village={village} now={now} onTrain={onTrain} />
        )}
        {view === 'map' && (
          <MapView
            state={state}
            humanVillage={village}
            now={now}
            onAttack={onAttack}
          />
        )}
        {view === 'reports' && <ReportsView reports={state.reports} />}
      </main>
    </div>
  )
}
