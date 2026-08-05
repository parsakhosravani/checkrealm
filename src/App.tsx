import { GameShell } from './components/GameShell'
import { Landing } from './components/Landing'
import { useGame } from './hooks/useGame'
import { loadGame } from './game/save'

export default function App() {
  const game = useGame()
  const hasSave = !!game.state || !!loadGame()

  return (
    <>
      {!game.state ? (
        <Landing
          hasSave={hasSave}
          onStart={game.startGame}
          onContinue={game.continueGame}
        />
      ) : (
        <GameShell
          state={game.state}
          now={game.now}
          onUpgrade={game.upgrade}
          onTrain={game.train}
          onAttack={game.attack}
          onResign={game.resign}
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
