import { useEffect, useMemo, useRef } from 'react'
import { GameShell } from './components/GameShell'
import { Landing } from './components/Landing'
import { computeScore } from './game/score'
import { loadGame } from './game/save'
import { useGame } from './hooks/useGame'
import { useOnline } from './online/useOnline'

const SYNC_MS = 10_000

export default function App() {
  const online = useOnline()
  const game = useGame()
  const hasSave = !!game.state || !!online.serverSave || !!loadGame()

  const { score, victories } = useMemo(
    () => (game.state ? computeScore(game.state) : { score: 0, victories: 0 }),
    [game.state],
  )

  const userName = online.user?.name ?? null
  const inGame = !!game.state

  // Push the running game to the player's account every few seconds.
  const syncRef = useRef({ state: game.state, score, victories })
  syncRef.current = { state: game.state, score, victories }
  useEffect(() => {
    if (!userName || !inGame) return
    const id = window.setInterval(() => {
      const { state, score: s, victories: v } = syncRef.current
      if (state) online.syncSave(state, s, v)
    }, SYNC_MS)
    return () => {
      window.clearInterval(id)
      const { state, score: s, victories: v } = syncRef.current
      if (state) online.syncSave(state, s, v)
    }
  }, [userName, inGame])

  // Announce fresh victories to every player through the realm herald.
  const announcedVictories = useRef<number | null>(null)
  useEffect(() => {
    if (!online.user || !game.state) {
      announcedVictories.current = null
      return
    }
    if (announcedVictories.current === null) {
      announcedVictories.current = victories
      return
    }
    if (victories > announcedVictories.current) {
      const latest = game.state.reports.find((r) => r.victory)
      online.sendHerald(
        latest ? `⚔ ${latest.summary}` : `⚔ ${online.user.name} won a battle!`,
      )
    }
    announcedVictories.current = victories
  }, [victories, userName, inGame])

  const startGame = (name: string) => {
    game.startGame(name)
  }

  const continueGame = () => {
    const local = loadGame()
    // Prefer whichever save has progressed further (device vs cloud).
    if (online.serverSave && (!local || online.serverSave.lastTickAt > local.lastTickAt)) {
      game.adoptState(online.serverSave)
    } else {
      game.continueGame()
    }
  }

  const resign = () => {
    if (online.user) online.syncSave(null, score, victories)
    game.resign()
  }

  return (
    <>
      {!online.user || !game.state ? (
        <Landing
          user={online.user}
          checking={online.checking}
          authBusy={online.authBusy}
          authError={online.authError}
          hasSave={hasSave}
          onLogin={online.login}
          onRegister={online.register}
          onLogout={() => {
            game.suspend()
            online.logout()
          }}
          onStart={startGame}
          onContinue={continueGame}
        />
      ) : (
        <GameShell
          state={game.state}
          now={game.now}
          online={online}
          score={score}
          onUpgrade={game.upgrade}
          onTrain={game.train}
          onAttack={game.attack}
          onResign={resign}
          onSignOut={() => {
            const current = syncRef.current
            if (current.state) online.syncSave(current.state, current.score, current.victories)
            game.suspend()
            online.logout()
          }}
        />
      )}

      {game.error && (
        <div className="toast" role="alert" onClick={game.dismissError}>
          {game.error}
        </div>
      )}
    </>
  )
}
