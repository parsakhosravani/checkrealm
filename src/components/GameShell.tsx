import { useState } from 'react'
import { getHumanVillage } from '../game/engine'
import type { Army, GameState, UnitId, ViewId } from '../game/types'
import type { Online } from '../online/useOnline'
import { ArmyView } from './ArmyView'
import { KingdomView } from './KingdomView'
import { LeaderboardView } from './LeaderboardView'
import { MapView } from './MapView'
import { ReportsView } from './ReportsView'
import { ResourceBar } from './ResourceBar'

interface GameShellProps {
  state: GameState
  now: number
  online: Online
  score: number
  onUpgrade: (slotIndex: number) => void
  onTrain: (unitId: UnitId, amount: number) => void
  onAttack: (toVillageId: string, army: Army, kind: 'attack' | 'raid') => void
  onResign: () => void
  onSignOut: () => void
}

const VIEWS: { id: ViewId; label: string }[] = [
  { id: 'kingdom', label: 'Kingdom' },
  { id: 'army', label: 'Army' },
  { id: 'map', label: 'Board' },
  { id: 'reports', label: 'Reports' },
  { id: 'leaderboard', label: 'Leaderboard' },
]

export function GameShell({
  state,
  now,
  online,
  score,
  onUpgrade,
  onTrain,
  onAttack,
  onResign,
  onSignOut,
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

        <div className="topbar__status">
          <span className="score-chip" title="Realm score">
            ♛ {score.toLocaleString()}
          </span>
          <span
            className={`presence-chip${online.connected ? ' is-live' : ''}`}
            title={online.connected ? 'Connected to the realm' : 'Reconnecting…'}
          >
            ● {online.onlineNames.length} online
          </span>
        </div>

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
          <button type="button" className="nav__btn" onClick={onSignOut}>
            Sign Out
          </button>
        </nav>
      </header>

      <main className={`main${view === 'reports' || view === 'leaderboard' ? '' : ' main--stage'}`}>
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
        {view === 'leaderboard' && (
          <LeaderboardView
            entries={online.entries}
            onlineNames={online.onlineNames}
            herald={online.herald}
            connected={online.connected}
            playerName={online.user?.name ?? player.name}
          />
        )}
      </main>
    </div>
  )
}
