# Transport Sentinel

A rail operations control centre: fleet position and status, on-time
performance, maintenance orders, energy, RAMS metrics and a Vertex AI
assistant. It is the only platform with its own backend — an Express API in
`api/` that serves both the REST routes and the built SPA from one Cloud Run
service.

Built on the shared `@cognitex/*` packages; see
[`../packages/README.md`](../packages/README.md) for the stack and the
decisions behind it.

## Why this one has a server

The other five consoles talk to Firestore directly from the browser, with
security rules as the access boundary. This one keeps a server because
streaming a Gemini response needs a process that can hold a credential — the
model is called through Vertex AI with Application Default Credentials, so no
API key ever reaches the bundle. Everything else the API does could in
principle move to the browser; the assistant could not.

## Sections

Nine, all lazily loaded so the initial bundle carries only the control centre.

| Section | What it shows |
| :--- | :--- |
| Centro de control | Fleet map, live snapshot, alert ticker |
| Operaciones y OTP | Punctuality and schedule adherence |
| Comercial | Passenger and cargo series |
| Flota | Per-train registry and state |
| Mantenimiento | Work orders |
| Energía | Daily traction energy |
| Seguridad y RAMS | Incidents, reliability/availability/maintainability metrics |
| Asistente IA | Streaming Vertex AI chat |
| Proyectos | Fourteen rail networks of the Americas — researched reference data, not telemetry |

## Where the data comes from

The console reads `/api/*`, never Firestore directly. The API splits its routes
in two:

| Routes | Source |
| :--- | :--- |
| `/api/fleet`, `/api/kpis`, `/api/alerts`, `/api/hourly`, `/api/rams`, `/api/schedule` | Generated in memory, per request. Always. |
| `/api/trains`, `/api/routes`, `/api/maintenance`, `/api/incidents`, `/api/history`, `/api/energy`, `/api/commercial` | Firestore when credentials are available, seeded on first startup; the same generators otherwise |

Because the telemetry endpoints generate every reading per request in every
deployment today, the console renders `DataSourceBadge` as `Datos simulados` on
every screen unconditionally. That is deliberate: a demonstration must not pass
for a fleet. When real telemetry lands, that badge becomes conditional like the
other consoles'.

`GET /api/health` reports which store is behind the API —
`{status, firestore: "connected" | "in-memory", ts}`. It is registered before
the CORS middleware so an uptime prober from any origin can reach it. Use
`/api/health`, never `/healthz`: a bare `/healthz` on a `*.run.app` host is
answered by the Google frontend and never reaches the container.

## Auth, and what it protects

Firebase auth through `@cognitex/auth`, same as the other consoles. Without the
six `VITE_FIREBASE_*` build values the app runs unconfigured: open demo login,
generated data, amber badge.

One consequence is specific to this platform. **The AI assistant needs a real
session**, because `POST /api/ai/chat` requires a Firebase ID token verified by
the Admin SDK before it spends anything on Vertex AI. In demo mode the
assistant says so rather than failing obscurely; every other section works.

The Cloud Run service is `--allow-unauthenticated` so the SPA and its login
screen can load. That is not the access control for the billed endpoint — the
ID token is, backed by a per-uid rate limit (20 requests/minute, in-memory and
therefore per instance; it is a courtesy limit, not a control). The limit is
keyed on uid rather than IP because behind Cloud Run an entire corporate
network arrives as one address.

`POST /api/admin/reseed` fails closed: if `ADMIN_KEY` is unset the endpoint
returns 503 for every request. It used to skip its check entirely when unset,
which left a destructive endpoint open on a public service.

Vertex AI failures reach the client as short codes, never as the provider's
message. The old client pattern-matched on upstream error text and rendered a
`gcloud projects add-iam-policy-binding` command — project id and service
account included — into a chat bubble in a control room. Full detail stays in
the server log.

CORS is an allowlist of the `cognitexindustrial.com` origins plus, outside
production, `localhost:5177`. Extra origins can be added at runtime with
`ALLOWED_ORIGINS`.

## Maps

`VITE_GOOGLE_MAPS_API_KEY` enables the Google Maps view. Without it the CCO
falls back to a projected SVG that still plots every train in the right place —
the section is never blank.

`src/services/maps.ts` is a hand-written declaration of the eight SDK members
this console touches, rather than a `@types/google.maps` dependency describing
nine thousand lines of an API surface it does not use.

## Layout

| Path | What lives there |
| :--- | :--- |
| `src/domain` | Types, status vocabulary, series maths, and `parse.ts` for the two shapes the API and the client did *not* agree on (alerts, work orders) |
| `src/services` | `api.ts` (REST), `chat.ts` (SSE + failure codes), `maps.ts`, `session.ts` |
| `src/views` | One per section, all lazy |
| `src/components` | Panel, alert ticker, asset and work-order cards, train map and graph, error boundary |
| `api/` | The Express server, Firestore admin client, seed, generators, ID-token middleware |

`api/` is **not** a workspace member. It is a separate npm package with its own
`package-lock.json`, so the runtime image installs without the frontend's
dependency tree.

## Running it

From the repository root:

```bash
npm install                                     # once — frontend workspaces
npm run dev --workspace transport-sentinel      # http://localhost:5177
```

For the API as well, in a second terminal:

```bash
cd transport-sentinel/api && npm install && npm run dev   # PORT=3001
```

Vite proxies `/api` to `:3001` in dev; in production the same Express process
serves both, so the path never changes.

Firestore locally is optional — without credentials the API answers everything
from its generators. To use a real one, either set
`GOOGLE_APPLICATION_CREDENTIALS` to a service-account key or run the emulator
with `FIRESTORE_EMULATOR_HOST=localhost:8090`. See `.env.example`, which
separates the Vite build-time variables from the Node runtime ones.

## Testing

```bash
npm run typecheck --workspace transport-sentinel
npm run test      --workspace transport-sentinel   # 12 tests, src/**/*.test.ts
npm run lint      --workspace transport-sentinel
npm run build     --workspace transport-sentinel   # tsc --noEmit && vite build

cd transport-sentinel/api && npm test              # node --test
```

`vitest.config.ts` restricts collection to `src/**/*.test.ts`. Without it
Vitest picks up `api/generators.test.js`, fails to recognise a `node:test`
suite, and reports a red run for a file that passes.

## Docker

Two stages, built from the **repository root**: stage 1 builds the SPA against
the workspace packages, stage 2 is the Node server and copies the SPA into
`./public`.

```bash
docker build -f transport-sentinel/Dockerfile -t transport-sentinel .
docker run -p 8080:8080 transport-sentinel
```

`Dockerfile.dockerignore` is not optional here. BuildKit reads
`<dockerfile>.dockerignore` in preference to the context root's
`.dockerignore`, so it must be self-sufficient. The line that matters is
`**/node_modules`: the runtime stage runs `npm ci --omit=dev` and then copies
`api/` over the result, and without the exclusion a developer's local
`api/node_modules` — the full dev tree, about 91MB — lands on top of the
production install and ships.

This app is deliberately absent from
[`../docker-compose.yml`](../docker-compose.yml): it needs Firestore
credentials and Vertex AI access to be more than a set of generators.

## Production

Deployed to Cloud Run (`cognitex-485919`, `us-east4`) by
`.github/workflows/deploy-transport.yaml` on pushes to `main` touching
`transport-sentinel/**`, `packages/**` or the root manifests.

Build args: the six `VITE_FIREBASE_*` plus `VITE_GOOGLE_MAPS_API_KEY`.
Runtime `env_vars`: `NODE_ENV`, `FIREBASE_PROJECT_ID`, `GOOGLE_CLOUD_PROJECT`,
`ADMIN_KEY`.

The service account needs `roles/datastore.user` for Firestore and access to
Vertex AI in `GEMINI_REGION` (default `us-central1`). The model is
`gemini-2.5-flash`.

## Licence

Private property of Cognitex Industrial.
