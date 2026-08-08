# CheckRealm

**CheckRealm** is a 3D online browser strategy game in the spirit of [Travian](https://www.travian.com/) — kingdom building, resource economies, troop training, and world-map warfare — redesigned around chess.

Create an account, build your seat on the board, raise pawns and knights, march on rival keeps, and climb the **live realm leaderboard**.

## Play

```bash
npm install
npm run dev
```

Open `http://localhost:3000` — the dev server hosts the game, the JSON API and the realtime WebSocket on one port.

## Online features

- **Real accounts** — register a house name with a password (scrypt-hashed server-side); sessions use bearer tokens.
- **Cloud saves** — your kingdom syncs to your account every few seconds and follows you across devices; on `Continue Campaign` the further-progressed save (local vs. cloud) wins.
- **Live leaderboard** — realm score (population, buildings, armies, victories) ranked across all players, pushed live over WebSocket.
- **Presence** — see who is online right now.
- **Realm Herald** — a live world feed: new houses founding realms and battle victories are announced to everyone.

## How the game works

| Travian idea | CheckRealm |
| --- | --- |
| Wood / Clay / Iron / Crop | **Timber · Ivory · Steel · Grain** |
| Village buildings | Throne Hall, resource yards, Barracks, Knight Stable, Siege Works, Royal Court, Ramparts |
| Troops | **Pawn, Bishop, Knight, Rook, Queen** |
| World map | 9×9 chessboard of kingdoms |
| Raids & attacks | March pieces, resolve combat, loot resources |

### Loop

1. **Kingdom** — upgrade fields and halls to grow production and unlock military buildings.
2. **Army** — train pieces (requires the matching building rank).
3. **Board** — pick an enemy keep, choose an army, march to attack or raid.
4. **Reports** — read battle outcomes and spoils.
5. **Leaderboard** — watch your realm score climb against other players, live.

AI houses expand, train, and occasionally raid you so the board stays alive.

## Stack

- React 19 + TypeScript + Vite
- **Three.js** via React Three Fiber + Drei — 3D board, kingdom plaza, animated hero characters, star fields, ember particles, flickering torchlight
- Node.js + Express + `ws` — accounts, cloud saves, leaderboard, presence and the herald feed
- JSON-file persistence (`data/db.json`) — zero external services required

### 3D views

- **Landing** — rotating 3D chessboard, floating pieces, patrolling villager and hero guards
- **Kingdom** — orbitable plaza with citizens who appear as your population grows
- **Army** — auto-rotating 3D unit preview
- **Board** — full 3D world map; drag to orbit, click keeps to march

## API

| Endpoint | Description |
| --- | --- |
| `POST /api/auth/register` | Create an account (`username`, `password`) |
| `POST /api/auth/login` | Sign in, returns a bearer token |
| `POST /api/auth/logout` | End the session |
| `GET /api/auth/me` | Current account info |
| `GET /api/save` / `PUT /api/save` | Cloud save round-trip (authed) |
| `GET /api/leaderboard` | Top 25 houses by realm score |
| `GET /api/online` | Who is connected right now |
| `GET /api/health` | Service health |
| `WS /ws?token=…` | Live presence, leaderboard and herald pushes |

## Testing

```bash
npm test    # backend API tests (node --test)
npm run lint
```

## Deployment

The production app is one Node server: it serves the built frontend, the API and the WebSocket from a single port.

### Any Node host (Railway, Render, Fly.io, a VPS…)

```bash
npm ci
npm run build
npm start          # NODE_ENV=production node server/index.js
```

- `PORT` — listen port (default `3000`)
- `CHECKREALM_DATA` — path of the JSON database (default `./data/db.json`); put it on a persistent disk

### Docker

```bash
docker build -t checkrealm .
docker run -p 3000:3000 -v checkrealm-data:/app/data checkrealm
```

The named volume keeps accounts, saves and the leaderboard across restarts.

### Vercel

The repo is Vercel-ready: the Vite frontend deploys as static output and the API runs as a serverless function (`api/index.js` + `vercel.json`). Serverless functions can't hold WebSockets open, so on Vercel the client automatically falls back to HTTP polling (leaderboard, presence and herald refresh every 8 s; presence is derived from recent activity).

```bash
npx vercel link          # link the repo to a Vercel project (once)
npx vercel deploy        # preview deployment
npx vercel --prod        # production deployment
```

**Persistence on Vercel:** the serverless filesystem is ephemeral. Install Upstash Redis from the Vercel Marketplace so accounts and the leaderboard survive:

```bash
npx vercel integration add upstash   # pick the Redis product when prompted
```

The store detects the injected `KV_REST_API_URL`/`KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`) env vars and keeps the whole database under one Redis key. Without Redis the app still runs, but data lives in `/tmp` and resets between instances.

Simulate the Vercel constraints locally with `CHECKREALM_NO_WS=1 npm start` (WebSocket upgrades refused → the client switches to polling).

> For always-on WebSockets and file persistence, prefer a long-running Node host (Railway, Render, Fly.io, Docker, a VPS).

## License

MIT
