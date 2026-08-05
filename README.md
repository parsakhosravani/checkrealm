# checkrealm

A tiny full-stack uptime checker. Enter a domain or URL and `checkrealm` tells you
whether the "realm" is reachable, its HTTP status, and how fast it responded.

## Stack

- **server/** — Express (TypeScript, ESM) API that performs the reachability check.
- **client/** — React + Vite (TypeScript) single-page UI.
- npm **workspaces** tie the two packages together.

## Getting started

Requires Node.js 22+.

```bash
npm ci        # install all workspace dependencies
npm run dev   # start API (:3001) and client (:5173) together
```

Then open http://localhost:5173. The Vite dev server proxies `/api/*` to the API.

## Useful scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run the API and client together (watch mode). |
| `npm run build` | Type-check + build both packages. |
| `npm test` | Run the server unit tests (Vitest). |
| `npm run lint` | Lint the whole workspace (ESLint). |
| `npm start` | Run the built API from `server/dist`. |

## API

- `GET /api/health` → `{ status, service, time }`
- `POST /api/check` with `{ "url": "example.com" }` → reachability result:

```json
{
  "url": "https://example.com/",
  "finalUrl": "https://example.com/",
  "ok": true,
  "status": 200,
  "statusText": "OK",
  "responseTimeMs": 142,
  "checkedAt": "2026-08-05T11:40:00.000Z"
}
```
