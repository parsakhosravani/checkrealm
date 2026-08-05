# CheckRealm

CheckRealm is a tiny web app that checks whether a website is **real and reachable**.
Enter a URL and it resolves the domain, sends an HTTP request, measures the response
time, and returns a verdict: `real`, `suspicious`, or `unreachable`.

## Stack

- **Runtime:** Node.js (>= 20), ES modules
- **Server:** Express — serves the static UI and a small JSON API
- **Frontend:** vanilla HTML/CSS/JS (no build step)
- **Tests:** Node's built-in test runner (`node --test`)

## Getting started

```bash
npm install
npm run dev      # start with auto-reload on http://localhost:3000
# or
npm start        # start without watch
```

Then open http://localhost:3000 and check a URL.

## Scripts

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm start`     | Start the server (`src/server.js`)       |
| `npm run dev`   | Start with `node --watch` auto-reload    |
| `npm test`      | Run the unit tests                       |
| `npm run lint`  | Lint the codebase with ESLint            |

## API

### `GET /api/health`

Returns service status.

```json
{ "status": "ok", "service": "checkrealm", "time": "..." }
```

### `GET /api/check?url=<url>`

Checks a URL (bare hostnames are treated as `https`).

```bash
curl "http://localhost:3000/api/check?url=example.com"
```

```json
{
  "input": "example.com",
  "url": "https://example.com/",
  "reachable": true,
  "status": 200,
  "statusText": "OK",
  "redirected": false,
  "finalUrl": "https://example.com/",
  "elapsedMs": 123,
  "verdict": "real",
  "checkedAt": "..."
}
```

## Cloud Agent environment

The development environment is defined in [`.cursor/environment.json`](.cursor/environment.json):
`npm install` refreshes dependencies and the `dev-server` terminal runs `npm run dev`
on port `3000`.
