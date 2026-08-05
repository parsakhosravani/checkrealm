# CheckRealm

**CheckRealm** is a browser strategy game in the spirit of [Travian](https://www.travian.com/) — kingdom building, resource economies, troop training, and world-map warfare — redesigned around chess.

Build your seat on the board, raise pawns and knights, and march on rival keeps.

## Play

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build    # production build
npm run preview  # serve the build
```

Progress is saved in your browser (`localStorage`).

## How it works

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

AI houses expand, train, and occasionally raid you so the board stays alive.

## Stack

- React 19 + TypeScript
- Vite
- Pure client-side game engine (no backend required for this version)

## Roadmap ideas

- Alliances / kingdoms of many villages
- Marketplace trading
- Heroes & research trees
- Multiplayer / persistent server
- Oasis tiles and reinforcements

## License

MIT
