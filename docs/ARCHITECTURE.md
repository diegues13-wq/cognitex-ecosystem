# Cognitex Ecosystem — Technical Reference

Single source of truth for architecture, deployment and known constraints.
Every claim here was verified against the workflows, Dockerfiles and live
services on 2026-08-10. **If you change infrastructure, update this file in
the same commit.**

Superseded and deleted on 2026-08-10: `AI_HANDOVER.md`, `cloudflare_pages_guide.md`,
`VERSION_CONTROL_GUIDE.md`, `implementation_plan.md`, `gcp_setup_guide.md`. They
described a Cloudflare-based architecture that no longer exists and contradicted
each other on deploy targets, region and project ID.

---

## 1. Applications

Seven applications live in this monorepo. Each has its own `package.json` and
is built independently — there is no workspace tooling.

| Directory | Role | Deploys to | Dev port |
| :--- | :--- | :--- | :--- |
| `cognitex-landing` | Corporate site & marketing funnel | GitHub Pages → *migrating to Firebase Hosting* | 5173 |
| `industry-sentinel` | SCADA, OEE, predictive maintenance | Cloud Run | 5175 |
| `personal-sentinel` | Workforce safety, PPE, biometrics | Cloud Run | 5176 |
| `agro-sentinel` | IoT greenhouse monitoring, thermal analysis | Cloud Run (`/web` only) | 5174 |
| `productivity-sentinel` | Productivity analytics | Cloud Run | — |
| `transport-sentinel` | Railway operations control center | Cloud Run | — |
| `cash-sentinel` | Currency exchange & remittance calculator | **no CI/CD** | — |

`agro-sentinel` is the only multi-component app: `/edge` (Python, gateway),
`/cloud` (Python, Cloud Functions), `/web` (React) and `/terraform`. Python is
managed strictly with `uv`, never pip/venv.

---

## 2. Stack

React 19 + Vite 7 + Tailwind CSS v4 across the board, with two exceptions:

- `cash-sentinel` uses **Tailwind v3**.
- `cognitex-landing` is being migrated to **Astro 4** (see §7).

Shared libraries: Recharts (charts), Leaflet + React-Leaflet 5 (maps), Lucide
React (icons), Firebase 11 (auth + Firestore), Framer Motion (animation).

`transport-sentinel` is the only app with a server: an Express API in `api/`
that serves the built SPA from `./public` and talks to Firestore and Vertex AI
Gemini. It is the reference pattern for any future Cloud Run backend.

### Pinned versions — do not bump without testing in Docker

| Package | Pin | Why |
| :--- | :--- | :--- |
| `vite` | `7.3.3` | 7.3.1 and earlier have a rollup incompatibility |
| `rollup` | `4.60.4` | 4.57.x has a source-phase-imports bug that breaks Docker builds |
| `react-leaflet` | `5.0.0` | RC versions export `LeafletProvider` instead of `LeafletContext` |

---

## 3. GCP

| Setting | Value |
| :--- | :--- |
| Project ID | `cognitex-485919` |
| Region | `us-east4` |
| Artifact Registry | `us-east4-docker.pkg.dev/cognitex-485919/cognitex-repo/` |
| Access | All Cloud Run services are `--allow-unauthenticated` |

Live services: `agro-sentinel`, `industry-sentinel`, `personal-sentinel`,
`productivity-sentinel`, `transport-sentinel`.

### Service URLs — read this before debugging a 404

Cloud Run reports a URL in `status.url` that **does not necessarily route**.

The five original services answer on the legacy form
`SERVICE-myvq6twbpa-uk.a.run.app`. Services created after Google changed the
URL format answer only on `SERVICE-530498544659.us-east4.run.app`, and
`gcloud run services describe --format='value(status.url)'` still reports the
legacy one for them. So does the `deploy-cloudrun` GitHub action's output.

The authoritative URL is the one **`gcloud run deploy` prints in its own
output**. Deriving it from the project number also works:

```
https://<service>-530498544659.us-east4.run.app
```

This cost hours on `demo-api`: healthy revisions, 100% traffic, `allUsers`
invoker, ingress `all`, and every request to the reported URL returning a 404
from the Google frontend.

Related: a bare `/healthz` on a `*.run.app` host is answered by the Google
frontend and never reaches the container. Health endpoints live under
`/api/health`.

### Ports

Cloud Run requires the container to listen on **8080**. All five sentinel apps
use `EXPOSE 8080` and `listen 8080` in `nginx.conf`.

`services/demo-api` is a Node service and listens on 8080 directly.

`cognitex-landing` is the exception — it uses port **80**, because it is served
as a static site and its Dockerfile is not used by any deploy.

---

## 4. CI/CD

| Workflow | Path trigger | Target |
| :--- | :--- | :--- |
| `deploy-agro.yaml` | `agro-sentinel/web/**` | Cloud Run `agro-sentinel` |
| `deploy-industry.yaml` | `industry-sentinel/**` | Cloud Run `industry-sentinel` |
| `deploy-personal.yaml` | `personal-sentinel/**` | Cloud Run `personal-sentinel` |
| `deploy-productivity.yaml` | `productivity-sentinel/**` | Cloud Run `productivity-sentinel` |
| `deploy-transport.yaml` | `transport-sentinel/**` | Cloud Run `transport-sentinel` |
| `deploy-landing.yaml` | `cognitex-landing/**` | Firebase Hosting |
| `deploy-demo-api.yaml` | `services/demo-api/**` | Cloud Run `demo-api` |

All trigger on push to `main` only.

`deploy-demo-api.yaml` probes `/api/health` after deploying and fails if
nothing answers. It exists because an earlier run reported success while
creating no service at all: a comma inside `ALLOWED_ORIGINS` was split by the
action's `^,^` join, gcloud rejected the malformed variable, and the step went
green in twelve seconds. Every Cloud Run workflow should grow the same probe.

Also note `env_vars_update_strategy: overwrite`. The default `merge` only adds
and updates, so a variable set once by mistake survives every later deploy —
`demo-api` carried one literally named `https://cognitexindustrial.com` across
five revisions.

Sentinel build flow: `checkout → GCP auth → configure Docker → docker build
(with Firebase --build-args) → push to Artifact Registry → deploy to Cloud Run`.

Note `deploy-agro.yaml` watches only `agro-sentinel/web/**` — changes to
`/cloud`, `/edge` or `/terraform` never trigger a deploy.

### Build-time secret injection

`VITE_*` variables are baked into the JS bundle by Vite at **build** time; they
cannot be injected at Cloud Run runtime. Dockerfiles accept them as build args:

```dockerfile
ARG VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
RUN npm run build
```

| Secret | Consumed by |
| :--- | :--- |
| `GCP_PROJECT_ID`, `GCP_CREDENTIALS` | all Cloud Run workflows |
| 6× `VITE_FIREBASE_*` | industry, personal, productivity, transport |
| `VITE_GOOGLE_MAPS_API_KEY`, `VITE_GEMINI_API_KEY` | transport only |

**`deploy-agro.yaml` passes no build args at all**, and `agro-sentinel/web/Dockerfile`
declares no `ARG`. Agro therefore *cannot* run real Firebase auth as currently
configured — it is in mock mode like the rest.

### Known gap: service account keys

All GCP workflows authenticate with `credentials_json` — a downloaded service
account JSON key held in `GCP_CREDENTIALS`. Current GCP practice is Workload
Identity Federation, which removes the long-lived key entirely. Migrating is
open work.

---

## 5. Authentication

Sentinel apps use a **dual-mode** pattern in `src/firebase.js`:

```js
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
export const isMockAuth = !apiKey;
```

- **Mock mode** (no API key): auto-login as `dev@local` / "Dev User". No Firebase
  project needed. This is the default locally and **the current state of every
  deployed service**.
- **Real mode** (API key set): full Firebase Email/Password auth.

To enable real auth: link a Firebase project to `cognitex-485919`, register a web
app, enable Email/Password, then set the 6 `VITE_FIREBASE_*` GitHub secrets and
push to trigger rebuilds. Verify by confirming `dev@local` no longer appears in
the deployed bundle. Agro additionally needs `ARG`/`ENV` lines added to its
Dockerfile and `--build-arg` flags to its workflow.

---

## 6. Known issues & past fixes — do not revert

| Issue | Fix |
| :--- | :--- |
| `EXPOSE 80` on Cloud Run | Changed to 8080 in all sentinel Dockerfiles and nginx.conf |
| `npm ci` fails — missing `resolved` fields | Backfilled from npm registry in industry/personal lock files |
| rollup 4.57.0 source-phase-imports bug | Pinned rollup 4.60.4 + all 25 `@rollup/rollup-*` native binaries |
| `LeafletProvider not exported` | Pinned `react-leaflet@5.0.0` (not RC) |
| `COPY . .` overwrote `npm ci` packages | `.dockerignore` excluding `node_modules` |
| Base path `/cognitex-ecosystem/` (Pages legacy) | `base: '/'` in every `vite.config.js` |
| SIGILL crashes in transport-sentinel | Removed `Math.sin` in hot paths, all CSS blur, and recharts |

The `.dockerignore` files in industry/personal were added because those projects
had `node_modules` committed to git. That was fixed on 2026-08-10 (commit
`f911e009`), but the `.dockerignore` files remain correct and should stay.

---

## 7. Open work

- **`cognitex-landing` v2** — migrating to Astro 4 and Firebase Hosting, per the
  development spec. Built on a feature branch until complete.
- **The apex domain `cognitexindustrial.com` does not resolve.** Only `www` has a
  DNS record. Anyone typing the bare domain reaches nothing. DNS is on Cloudflare.
- **`cash-sentinel` has no deployment path** — no workflow, no Dockerfile.
- **Workload Identity Federation** to replace the service account JSON key.
- **Real Firebase auth** — all services are still in mock mode.

---

*Last verified: 2026-08-10.*
