# PulseCity

PulseCity is a crisis-response training simulator. Its city areas, service points, requests, routes, and outcomes are fictional demonstration data and are not operational emergency guidance.

The response brief is rule-based; this app does not use a trained AI model. The map defaults to a fictional illustrated command-map style with dark buildings and roads, green parks, blue water, and circular simulated risk areas. An optional OpenStreetMap basemap shows central Bengaluru for geographic context and requires an internet connection; all scenario areas, facilities, routes, and conditions remain fictional. If basemap tiles fail, the app displays a notice while keeping the simulated area overlays available and provides a retry control.

## Model and map scope

- **Model:** There is no trained or connected AI model. The response brief uses deterministic rules to highlight the most urgent pending request and highest-risk area. Scores and scenario changes are fixed prototype training effects; they have not been validated as real-world response measures. Before adding AI, define its intended use, permitted data, safety boundaries, and evaluation plan.
- **Fictional map:** The default map's roads, landcover, buildings, circular risk areas, service points, requests, and scenario conditions are illustrative demo geometry and data.
- **Optional geographic context:** The OpenStreetMap toggle loads a real basemap of central Bengaluru. It does not validate or locate the fictional overlays. Keep attribution visible when enabled.
- **Routes and use:** Displayed routes are straight illustrative lines between simulated areas, not road routing, travel-time estimates, safe paths, or operational advice. Do not use the model, scores, map overlays, or routes for real emergencies.
- **Tile service:** Enabling OpenStreetMap sends map tile requests to the public OSM tile service. Keep the fictional map selected for offline demos, and do not treat the optional basemap as an operational map.

## Requirements

- Node.js 22.13 or later
- npm

## Run locally

```powershell
npm ci
npm run dev
```

Open http://localhost:3000.

Before starting the server, create an ignored `.env.local` file in the project directory and configure a unique, randomly generated team password (at least 16 characters):

```text
PULSECITY_TEAM_PASSWORD=use-a-unique-random-password-here
```

Replace the example value with a generated secret, share it with teammates privately, and never commit it. Restart the server after changing it. Team sessions expire after 12 hours; sign out in the shared-run panel to end a browser session early.

Completed exercise summaries are stored in a local SQLite database and shared by everyone using the same running server. The default database location is `data/pulsecity.sqlite`. To store it elsewhere, set `PULSECITY_DB_PATH` to an absolute file path before starting the server. Keep the database on persistent storage; it is not suitable for ephemeral serverless filesystems.

For a team demo on a private, trusted network, run:

```powershell
npm run dev -- --hostname 0.0.0.0
```

Share the host computer's local IP address, port `3000`, and the team password with teammates using a private channel. Restrict the host firewall to the trusted team network. The login password is sent to the app at sign-in; use HTTPS to protect it in transit. Without HTTPS, only use an isolated network whose traffic you trust. Do not expose this demo server to the public internet.

## Demo-day data management

Run these commands from the project directory. They use the same `PULSECITY_DB_PATH` as the app, if set.

- `npm run backup:demo` creates a consistent SQLite backup in the database's `backups` folder without changing run history.
- `npm run reset:demo` displays the target database and run count. It only proceeds when `RESET` is typed exactly; it creates a backup first, then clears saved run history. It does not reset an exercise currently open in a browser.

Keep backups somewhere persistent and separate from the demo computer if the saved runs matter. To restore one, stop the app first, preserve the current database and move any sibling `-wal` and `-shm` files out of the way, replace the configured database file with the backup, then restart the app. If `PULSECITY_DB_PATH` is configured, replace that file rather than the default path.

To confirm persistence before the demo, complete an exercise, restart the app server, then verify the saved run still appears. A successful `npm run backup:demo` prints the created backup path and run count.

## Demo walkthrough

1. Start the server and open the app on the presentation device.
2. Use the guided presentation, if helpful, to introduce the training-only purpose and simulated data.
3. Select a role, start an exercise, inspect an area and its requests, then dispatch actions.
4. Show how actions affect the simulated scenario and review the completed report and shared run history.
5. If demonstrating the map, point out that facilities and routes are fictional; the route is illustrative, not navigation.
6. Before a fresh session, back up any run history you want to keep, then run `npm run reset:demo` and type `RESET` to clear the shared saved-run list.

## API

- `GET /api/runs` returns the ten most recent completed runs without sign-in; run summaries are therefore visible to anyone who can reach the app.
- `POST /api/runs` requires a signed team session, validates and stores a completed run, and uses a client-generated idempotency key to prevent duplicate submissions.
- `/api/team-session` supports same-origin team sign-in and sign-out. The session cookie is HttpOnly, SameSite strict, and Secure when served over HTTPS. Five failed sign-ins lock login for 15 minutes on that server process.
- Open pages refresh shared run history every 15 seconds.

The shared-password session and in-process login limiter are demo controls, not production-grade identity or abuse prevention. The password is shared by the team; a lost or exposed password must be rotated in `.env.local`, then the server restarted. Run-history reads remain public on the reachable network. Do not expose the app publicly without per-user authentication, HTTPS, durable rate limiting, authorization policy, and operational monitoring.

The SQLite file must be kept on persistent storage. Serverless deployments with an ephemeral filesystem will not reliably preserve data. A deployment with multiple app instances also requires a shared database service instead of a local SQLite file.

## Checks

```powershell
npm run lint
npm test
npm run build
```
