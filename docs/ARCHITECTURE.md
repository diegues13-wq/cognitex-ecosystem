# Cognitex Ecosystem — Technical Reference

Single source of truth for architecture, deployment and known constraints.
Every claim here was re-verified against the workflows, Dockerfiles, manifests
and package sources on 2026-08-11, after the platform unification. **If you
change infrastructure, update this file in the same commit.**

Superseded and deleted on 2026-08-10: `AI_HANDOVER.md`,
`cloudflare_pages_guide.md`, `VERSION_CONTROL_GUIDE.md`,
`implementation_plan.md`, `gcp_setup_guide.md`. They described a
Cloudflare-based architecture that no longer exists and contradicted each other
on deploy targets, region and project ID.

---

## 1. Applications

Seven applications. Six are npm workspace members sharing one root lockfile and
the `@cognitex/*` packages; `cognitex-landing` is not, and installs on its own.

| Directory | Workspace name | Role | Deploys to | Dev port |
| :--- | :--- | :--- | :--- | :--- |
| `agro-sentinel/web` | `agro-sentinel-web` | Greenhouse climate, ISA-18.2 alarms, thermal scans | Cloud Run | 5174 |
| `cash-sentinel` | `cash-sentinel` | Public USD ⇄ RUB remittance calculator | Cloud Run | 5179 |
| `industry-sentinel` | `industry-sentinel` | OEE, availability, downtime, maintenance | Cloud Run | 5175 |
| `personal-sentinel` | `personal-sentinel` | Fatigue, exposure, PPE, man-down | Cloud Run | 5176 |
| `transport-sentinel` | `transport-sentinel` | Rail operations control centre | Cloud Run | 5177 |
| `productivity-sentinel` | `productivity-sentinel` | Last Planner: failure log, PPC, constraints | Cloud Run | 5178 |
| `cognitex-landing` | — | Corporate site, Astro static | Firebase Hosting | 4321 |
| `services/demo-api` | `demo-api` | Live-demo feed behind the landing | Cloud Run | 8080 |

`agro-sentinel` is the only multi-component app: `/web` (the console),
`/edge` (Python gateway), `/cloud` (Python Cloud Functions) and `/terraform`.
Python is managed strictly with `uv`, never pip/venv. **None of `/edge`,
`/cloud` or `/terraform` is deployed by anything**, and the pipeline has never
carried a reading end to end — see `agro-sentinel/PIPELINE_STATUS.md`, which
cites file and line.

### Workspaces

```json
"workspaces": ["packages/*", "services/*", "agro-sentinel/web", "cash-sentinel",
               "industry-sentinel", "personal-sentinel",
               "productivity-sentinel", "transport-sentinel"]
```

`services/*` matches `services/demo-api`, the Express service feeding the
landing's live demo. `transport-sentinel/api` is intentionally excluded: it is a separate npm
package with its own lockfile so the API image installs without the frontend's
dependency tree.

`packages/README.md` describes a target layout where apps move under `apps/`.
That has not happened; all seven are still top-level directories and every
workflow path filter, Dockerfile path and compose entry addresses them there.

---

## 2. Shared packages

| Package | Exports | Owns |
| :--- | :--- | :--- |
| `@cognitex/config` | `./vite`, `./eslint`, `./tsconfig.json` | The one Vite config (React plugin, Tailwind v4 plugin, `es2020` target, vendor chunking), the one flat ESLint config, the strict TS base |
| `@cognitex/theme` | `.`, `./tokens.css`, `./brands` | Tokens, the closed `STATUS` vocabulary, one accent per platform |
| `@cognitex/auth` | `.` | `useAuth`, `AuthGate`, `LoginScreen` |
| `@cognitex/data` | `.`, `./types` | Firestore client, tenant-scoped repository, the per-platform reading schemas |
| `@cognitex/ui` | `.` | `AppShell`, `MetricCard`, `StatusDot`, `DataSourceBadge`, `TimeSeriesChart` |

Rationale is in `packages/README.md`. Two constraints in it are load-bearing
and appear again in §7 below: no charting library, and no translucent panel
that blurs what is behind it.

**Tailwind v4 source scanning.** `packages/theme/src/tokens.css` declares
`@source '../../ui/src'` and `@source '../../auth/src'`, because Tailwind scans
the importing app's tree and skips `node_modules` — which is where npm symlinks
the workspace packages. Without those two lines, every class used only by the
shared shell or login screen is absent from the generated stylesheet and both
render unstyled. Verified by the utilities missing from productivity-sentinel's
first build: `bg-navy-deep`, `min-h-dvh`, `w-64`, `min-h-16`.

The same scanner reads Markdown as plain text. Writing a banned utility's class
name into a README emits that rule into the stylesheet, so the constraints are
described in prose in the app docs rather than named.

---

## 3. Stack

React 19 + TypeScript 5.9 + Vite 7 + Tailwind v4 across all six platforms,
configured entirely through `@cognitex/config` and `@cognitex/theme`. No app
carries a `tailwind.config.js`, a `postcss.config.js` or its own Vite config
beyond a port.

- **Charts:** none. `TimeSeriesChart` in `@cognitex/ui` is hand-written SVG.
- **Maps:** none in the platforms. `transport-sentinel` uses the Google Maps
  JS API when `VITE_GOOGLE_MAPS_API_KEY` is set and falls back to a projected
  SVG that still plots every train correctly.
- **Icons:** `lucide-react`, imported one icon at a time so the `vendor-icons`
  chunk stays small.
- **Auth/DB:** Firebase 11 (`firebase/auth`, `firebase/firestore`).
- **Tests:** Vitest, plus `node --test` inside `transport-sentinel/api`.

`cognitex-landing` is **not** on this stack, by design. It is an Astro 7
static site — the marketing site has to ship real HTML for search engines,
which a client-rendered SPA cannot. It carries no UI framework at all: every
interactive piece is vanilla TypeScript that Astro inlines, with `motion` for
the scroll choreography. It installs on its own rather than as a workspace
member.

`services/demo-api` is a small Express service on Cloud Run that feeds the
landing's live-demo widgets. Firebase Hosting rewrites `/api/public/**` to it,
so the page fetches same-origin and no API URL is baked into the bundle. Its
payload always carries a `source` field which reads `"live"` only when a device
reported inside the freshness window — otherwise the site says on screen that
it is showing a reference curve.

`transport-sentinel` is the only app with a server: an Express API in `api/`
that serves the built SPA from `./public` and talks to Firestore and Vertex AI
Gemini. It is the reference pattern for any future Cloud Run backend.

### Pinned versions — do not bump without testing in Docker

| Package | Intent | Actual |
| :--- | :--- | :--- |
| `vite` | `^7.3.3` (7.3.1 and earlier had a rollup incompatibility) | 7.3.6 resolved at the root; `cash-sentinel` still declares `^7.3.1` |
| `rollup` | was pinned to `4.60.4` for a source-phase-imports bug in 4.57.x | **no longer pinned** — 4.62.4 resolves transitively, with all 25 `@rollup/rollup-*` native binaries present. Builds pass. |
| `react-leaflet` | `5.0.0`, never an RC (RCs export `LeafletProvider` instead of `LeafletContext`) | removed everywhere — no platform and no site depends on it |

---

## 4. GCP

| Setting | Value |
| :--- | :--- |
| Project ID | `cognitex-485919` |
| Region | `us-east4` |
| Artifact Registry | `us-east4-docker.pkg.dev/cognitex-485919/cognitex-repo/` |
| Access | All Cloud Run services deploy with `--allow-unauthenticated` |

Cloud Run services defined by the workflows: `agro-sentinel`, `cash-sentinel`,
`industry-sentinel`, `personal-sentinel`, `productivity-sentinel`,
`transport-sentinel`.

`--allow-unauthenticated` is not the access control for anything that costs
money. `POST /api/ai/chat` on transport-sentinel verifies a Firebase ID token
with the Admin SDK before it spends on Vertex AI; the flag exists so the SPA
and its login screen can load at all.

### Ports

Cloud Run routes to **8080**. Every Sentinel image is `EXPOSE 8080`, and the
five nginx-served consoles `listen 8080`. `cognitex-landing`'s Dockerfile is
the exception at port 80 — and no deploy uses it.

### Health checks

Health endpoints live under **`/api/health`**, never `/healthz`. A bare
`/healthz` on a `*.run.app` host is answered by the Google frontend and never
reaches the container, so it reports healthy no matter what the container is
doing.

Only `transport-sentinel` serves one today —
`GET /api/health` returns `{status, firestore: 'connected'|'in-memory', ts}`,
registered before CORS so a prober from any origin can reach it. The five
static consoles have no health route; nginx answers `/` and that is what the
revision check uses.

### `gcloud run services describe` reports a URL that does not route

For recently created services, the `status.url` field returns a hostname that
does not resolve or does not route to the revision. Do not take it as proof of
a working deploy — confirm with an actual request to a known-good URL. This has
cost debugging time more than once.

---

## 5. CI/CD

Seven workflows, all on push to `main`.

| Workflow | Path triggers | Target |
| :--- | :--- | :--- |
| `deploy-agro.yaml` | `agro-sentinel/web/**` + shared* | Cloud Run `agro-sentinel` |
| `deploy-cash.yaml` | `cash-sentinel/**` + shared* | Cloud Run `cash-sentinel` |
| `deploy-industry.yaml` | `industry-sentinel/**` + shared* | Cloud Run `industry-sentinel` |
| `deploy-personal.yaml` | `personal-sentinel/**` + shared* | Cloud Run `personal-sentinel` |
| `deploy-productivity.yaml` | `productivity-sentinel/**` + shared* | Cloud Run `productivity-sentinel` |
| `deploy-transport.yaml` | `transport-sentinel/**` + shared* | Cloud Run `transport-sentinel` |
| `deploy-landing.yaml` | `cognitex-landing/**` | GitHub Pages |

\* *shared* = `packages/**`, `package.json`, `package-lock.json`, and the
workflow's own file. A change to a shared package therefore redeploys all six
platforms. That is intended: they are built from it.

`deploy-agro.yaml` still watches `agro-sentinel/web/**` only — changes to
`/cloud`, `/edge` or `/terraform` never trigger anything.

`deploy-landing.yaml` runs `npm install` and `npm run build` inside
`./cognitex-landing` and uploads `dist/` as a Pages artifact. It does not use
Docker and does not touch the workspace.

Sentinel build flow: `checkout → GCP auth → configure Docker → docker build
(root context, Firebase --build-args) → push to Artifact Registry → deploy to
Cloud Run`.

### The repository-root build context

**Every Sentinel workflow sets `CONTEXT: .` and `DOCKERFILE: <app>/Dockerfile`.**

```yaml
CONTEXT: .
DOCKERFILE: industry-sentinel/Dockerfile
```

The apps import `@cognitex/*` from `packages/`, and `npm ci` needs the root
lockfile to resolve them. Docker cannot `COPY` from outside its build context,
so a `./industry-sentinel` context physically cannot install the app. Each
Dockerfile copies only what it needs — root manifests, `packages/`, its own
`package.json`, then its own source — and runs
`npm ci --workspace <name> --include-workspace-root`, so the other five
consoles' dependencies never enter the image.

`build` is `tsc --noEmit && vite build` in every app, so a type error fails the
image rather than shipping.

BuildKit reads `<dockerfile>.dockerignore` in preference to the context root's
`.dockerignore`. `cash-sentinel/Dockerfile.dockerignore` and
`transport-sentinel/Dockerfile.dockerignore` are therefore self-sufficient
supersets of the root `.dockerignore`, not additions to it.

### Build-time secret injection

`VITE_*` variables are baked into the JS bundle by Vite at **build** time; they
cannot be injected at Cloud Run runtime. Dockerfiles accept them as build args:

```dockerfile
ARG VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
RUN npm run build --workspace industry-sentinel
```

| Secret | Consumed by |
| :--- | :--- |
| `GCP_PROJECT_ID`, `GCP_CREDENTIALS` | all six Cloud Run workflows |
| 6× `VITE_FIREBASE_*` | agro, industry, personal, productivity, transport |
| `VITE_GOOGLE_MAPS_API_KEY` | transport only |
| `TRANSPORT_ADMIN_KEY` | transport only, as the runtime `ADMIN_KEY` |

`cash-sentinel` takes no build args at all. It is a public calculator with no
auth and no Firebase, deliberately.

`deploy-transport.yaml` is the only workflow that also sets runtime `env_vars`:
`NODE_ENV`, `FIREBASE_PROJECT_ID`, `GOOGLE_CLOUD_PROJECT`, `ADMIN_KEY`.

**Fixed on 2026-08-11:** `deploy-agro.yaml` previously passed no build args and
`agro-sentinel/web/Dockerfile` declared no `ARG`, so every agro image ever
built had an empty `VITE_FIREBASE_API_KEY`. The deployed console was an open
click-through demo with browser-generated data for its entire life. Both files
now carry the six values.

### Known gap: service account keys

All GCP workflows authenticate with `credentials_json` — a downloaded service
account JSON key held in `GCP_CREDENTIALS`. Current GCP practice is Workload
Identity Federation, which removes the long-lived key entirely. Migrating is
open work. The workflows already request `id-token: 'write'`, so the permission
side is in place.

---

## 6. Authentication and tenancy

`@cognitex/data` decides the mode from one value:

```ts
const apiKey = env.VITE_FIREBASE_API_KEY;
if (!apiKey) return null;          // readSettings → initData(null) → isConfigured() === false
```

- **Unconfigured** (no API key at build time): `useAuth` accepts any
  credentials and returns a demo user whose `orgId` is `'demo'`. Every
  repository returns generated data and every view renders
  `<DataSourceBadge source="generated">` — `Datos simulados`. Nothing is
  presented as measurement.
- **Configured:** Firebase Email/Password with `browserLocalPersistence`, so a
  reload does not sign an operator out mid-shift. `orgId` comes from a **custom
  claim** on the ID token, defaulting to `'default'` if absent.

Every Firestore query in `@cognitex/data` filters on `orgId`, *and* the
security rules enforce the same boundary — doing it in both places means a
missing rule cannot silently widen a query. `agro-sentinel/web/firestore.rules`
is the worked example: default deny, `readings` and `alerts` scoped by
`inOrg()`, and `alerts` updatable only on the single field `acknowledgedAt`.

`getIdToken()` is exposed on the hook so an app with a backend does not have to
reach around it into `firebase/auth`. That is what transport-sentinel's chat
client uses.

To enable real auth on a service: register a web app in the Firebase project
linked to `cognitex-485919`, enable Email/Password, set the six
`VITE_FIREBASE_*` GitHub secrets, and push to trigger a rebuild. Provision
`orgId` as a custom claim server-side. Verify by confirming the demo login no
longer accepts arbitrary credentials.

---

## 7. Traps that have already cost a day

### The Firebase plan and GCP billing are one switch, seen from two consoles

Selecting the Spark (free) plan in the Firebase console **unlinks the billing
account from the GCP project**. Nothing in that dialog mentions Cloud Run,
Firestore or Vertex AI, and the failure arrives later and somewhere else.

What it looks like when it happens: every Cloud Run service in the project
answers **HTTP 500**, and any workflow pushing an image fails with
`denied: This API method requires billing to be enabled` — *after* building
the image successfully, so the logs look like a code problem right up to the
last line. Firebase Hosting keeps serving, because static hosting is inside
the free tier; that makes the site look healthy while every console behind it
is down.

Diagnose it in one command:

```bash
gcloud beta billing projects describe cognitex-485919   # billingEnabled: true
```

Cloud Run requires the **Blaze** plan. Services recover on their own once
billing is restored — no redeploy needed.

### Cloud Run's reported URL is not always the one that routes

See §4. `status.url` and the deploy action's output both report the legacy
`SERVICE-PROJECTHASH-REGIONCODE.a.run.app` form, which does not route for
recently created services. The authoritative URL is the one `gcloud run
deploy` prints.

### A workflow can go green having deployed nothing

`deploy-cloudrun` joins `env_vars` with `^,^`, so a comma inside a value
splits it into a second, malformed variable. gcloud rejects the command and
the action still reports success — the step finished in twelve seconds having
created no service. Every Cloud Run workflow should end with a smoke test that
probes `/api/health`; `deploy-demo-api.yaml` shows the pattern. Also set
`env_vars_update_strategy: overwrite`, because the default merges and a
variable set once by mistake survives every later deploy.

---

## 8. Known issues & past fixes — do not revert

| Issue | Fix |
| :--- | :--- |
| `EXPOSE 80` on Cloud Run | 8080 in every Sentinel Dockerfile and `nginx.conf` |
| `npm ci` fails — missing `resolved` fields | Backfilled; the root lockfile is now the only one (plus `api/`) |
| rollup 4.57.0 source-phase-imports bug | Was pinned to 4.60.4; now unpinned at 4.62.4 and passing |
| `LeafletProvider not exported` | Never use a `react-leaflet` RC |
| `COPY . .` overwrote `npm ci` packages | `.dockerignore` / `Dockerfile.dockerignore` excluding `node_modules` |
| Base path `/cognitex-ecosystem/` (Pages legacy) | `base: '/'`; the shared Vite config sets no base |
| SIGILL crashes in transport-sentinel | Removed `Math.sin` from hot paths, removed recharts, removed every translucent panel that blurs its backdrop, and set the build target to `es2020` |
| Agro shipped with no Firebase args | `ARG`/`ENV` in the Dockerfile, `--build-arg` in the workflow |
| Agro Dockerfile copied the developer's `node_modules` over the install | Root context + `.dockerignore` |
| transport image shipped ~91MB of the frontend's modules | `Dockerfile.dockerignore` with `**/node_modules` |
| `/api/ai/chat` open on an unauthenticated service | `requireIdToken` + a per-uid rate limit |
| `/api/admin/reseed` open when `ADMIN_KEY` was unset | Fails closed; unset means 503 |
| Vertex AI errors rendered a `gcloud add-iam-policy-binding` command into a control-room chat bubble | Errors classified into codes; detail stays in the server log |

### The blur constraint, stated once

`backdrop-filter: blur()` routes through Skia's Gaussian kernel, which takes an
AVX2 path that raised SIGILL on pre-Haswell CPUs and repeatedly crashed
transport-sentinel in the field. Industrial panel PCs are exactly the machines
that are old. Panels are solid across all six platforms and both shared UI
packages. `cognitex-landing` still uses it in five components; it runs on
customers' own laptops rather than on panel PCs, and it has not been migrated.

---

## 9. Open work

- **`services/*` is declared as a workspace glob but `services/` does not
  exist.** Either a service is expected to land there or the glob should go.
- **`docker-compose.yml` is stale.** `agro-sentinel-web`, `industry-sentinel`
  and `personal-sentinel` still use directory build contexts, which their
  Dockerfiles can no longer be built from. Only `productivity-sentinel` was
  updated to `context: .`. `cash-sentinel` is missing entirely.
- **`@cognitex/data` declares a `test` script with no test files**, so
  `npm run test --workspaces` exits 1 on an otherwise green repository.
- **`cognitex-landing` has not been migrated** — separate install, own
  Tailwind/PostCSS config, `framer-motion`, a `react-leaflet` RC, and the blur
  utilities the platforms banned. It also still deploys to GitHub Pages.
- **`BRANDS.cash.url` is `null`** in `packages/theme/src/brands.ts` with a
  comment saying no pipeline exists. `deploy-cash.yaml` now exists; the comment
  and the URL are stale.
- **The apex domain `cognitexindustrial.com` does not resolve.** Only `www` has
  a DNS record. DNS is on Cloudflare. Note that `transport-sentinel/api`'s CORS
  allowlist and `packages/theme/src/brands.ts` both already name
  `*.cognitexindustrial.com` subdomains that must exist for those links to work.
- **Workload Identity Federation** to replace the service account JSON key.
- **The agro Python pipeline** — see `agro-sentinel/PIPELINE_STATUS.md`.

---

*Last verified: 2026-08-11.*
