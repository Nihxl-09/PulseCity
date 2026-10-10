# PulseCity

PulseCity is a crisis-response training simulator. Its city areas, service points, requests, routes, and outcomes are fictional demonstration data and are not operational emergency guidance.

## Requirements

- Node.js 22.13 or later
- npm

## Run locally

```powershell
npm ci
npm run dev
```

Open http://localhost:3000.

Completed exercise summaries are stored in a local SQLite database and shared by everyone using the same running server. The default database location is `data/pulsecity.sqlite`. To store it elsewhere, set `PULSECITY_DB_PATH` to an absolute file path before starting the server.

For a team demo on the same trusted network, run:

```powershell
npm run dev -- --hostname 0.0.0.0
```

Share the host computer's local IP address and port `3000` with teammates. They must be able to reach that computer through the network firewall. All connected browsers will use the same run history and database.

## API

- `GET /api/runs` returns the ten most recent completed runs.
- `POST /api/runs` validates and stores a completed run. A client-generated idempotency key prevents duplicate submissions.
- Open pages refresh shared run history every 15 seconds.

The anonymous API is intended for a trusted demo network. Anyone able to reach the app can submit run summaries; do not expose it to the public internet until authentication and abuse protection are added.

The SQLite file must be kept on persistent storage. Serverless deployments with an ephemeral filesystem will not reliably preserve data. A deployment with multiple app instances also requires a shared database service instead of a local SQLite file.

## Checks

```powershell
npm run lint
npm run build
```
