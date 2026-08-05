import type { HeraldEntry, LeaderboardEntry } from '../online/api'

interface LeaderboardViewProps {
  entries: LeaderboardEntry[]
  onlineNames: string[]
  herald: HeraldEntry[]
  connected: boolean
  playerName: string
}

function timeAgo(at: number): string {
  const s = Math.max(0, Math.floor((Date.now() - at) / 1000))
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function LeaderboardView({
  entries,
  onlineNames,
  herald,
  connected,
  playerName,
}: LeaderboardViewProps) {
  return (
    <div className="leaderboard">
      <div className="leaderboard__main panel">
        <header className="panel__head">
          <h2>Realm Leaderboard</h2>
          <span className={`live-dot${connected ? ' is-live' : ''}`}>
            {connected ? 'live' : 'offline'}
          </span>
        </header>

        {entries.length === 0 ? (
          <p className="leaderboard__empty">No houses ranked yet. Be the first.</p>
        ) : (
          <table className="leaderboard__table">
            <thead>
              <tr>
                <th>#</th>
                <th>House</th>
                <th>Score</th>
                <th>Victories</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr
                  key={entry.name}
                  className={entry.name === playerName ? 'is-you' : undefined}
                >
                  <td className="leaderboard__rank">
                    {i === 0 ? '♔' : i === 1 ? '♕' : i === 2 ? '♖' : i + 1}
                  </td>
                  <td>
                    {entry.name}
                    {entry.name === playerName && <span className="you-tag">you</span>}
                  </td>
                  <td>{entry.score.toLocaleString()}</td>
                  <td>{entry.victories}</td>
                  <td>
                    {entry.online ? (
                      <span className="online-pill">● online</span>
                    ) : (
                      <span className="offline-pill">{timeAgo(entry.lastSeen)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <aside className="leaderboard__side">
        <div className="panel">
          <header className="panel__head">
            <h2>Online Now</h2>
            <span className="online-count">{onlineNames.length}</span>
          </header>
          {onlineNames.length === 0 ? (
            <p className="leaderboard__empty">The realm sleeps…</p>
          ) : (
            <ul className="online-list">
              {onlineNames.map((name) => (
                <li key={name}>
                  <span className="online-pill">●</span> {name}
                  {name === playerName && <span className="you-tag">you</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <header className="panel__head">
            <h2>Realm Herald</h2>
          </header>
          {herald.length === 0 ? (
            <p className="leaderboard__empty">No news from the front.</p>
          ) : (
            <ul className="herald-list">
              {[...herald].reverse().map((entry, i) => (
                <li key={`${entry.at}-${i}`}>
                  <span className="herald-time">{timeAgo(entry.at)}</span>
                  <span>{entry.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  )
}
