# Cognitex Ecosystem

An npm-workspace monorepo holding six Sentinel platforms, one marketing site
and the five packages they are built on.

Six of the seven applications are TypeScript consoles that share a design
system, an auth layer and a Firestore client. The seventh, `cognitex-landing`,
predates that work and is still a standalone JavaScript app.

---

## What is in here

### Applications

| Directory | Workspace name | What it is | Dev port |
| :--- | :--- | :--- | :--- |
| `agro-sentinel/web` | `agro-sentinel-web` | Greenhouse console — climate, ISA-18.2 alarms, thermal scans, queries | 5174 |
| `cash-sentinel` | `cash-sentinel` | Public USD ⇄ RUB remittance calculator. No login. | 5175 |
| `industry-sentinel` | `industry-sentinel` | Manufacturing console — OEE, availability, downtime, maintenance | 5175 |
| `personal-sentinel` | `personal-sentinel` | Workforce-safety console — fatigue, exposure, PPE, man-down | 5176 |
| `transport-sentinel` | `transport-sentinel` | Rail operations control centre. The only app with its own backend. | 5177 |
| `productivity-sentinel` | `productivity-sentinel` | Last Planner console — failure log, PPC, constraints | 5178 |
| `cognitex-landing` | *not a workspace* | Corporate site. Installed and built on its own. | 5173 |

`cash-sentinel` and `industry-sentinel` are both configured for **5175**, so
they cannot run at the same time without overriding one:
`npm run dev --workspace cash-sentinel -- --port 5179`.

`agro-sentinel/` also contains `edge/`, `cloud/` and `terraform/` — a Python
IoT pipeline that has never carried a reading end to end. Read
[`agro-sentinel/PIPELINE_STATUS.md`](./agro-sentinel/PIPELINE_STATUS.md)
before assuming any number in that console is a measurement.

### Packages

| Package | What it owns |
| :--- | :--- |
| `@cognitex/config` | The one Vite config, the one ESLint config, the base `tsconfig.json` |
| `@cognitex/theme` | Design tokens, the status vocabulary, one accent per platform |
| `@cognitex/auth` | Firebase auth, the session hook, the shared login screen |
| `@cognitex/data` | Typed, tenant-scoped Firestore access; the platform reading schemas |
| `@cognitex/ui` | `AppShell`, `MetricCard`, `DataSourceBadge`, `TimeSeriesChart` |

Why they exist, and the decisions baked into them, are in
[`packages/README.md`](./packages/README.md). Read that before adding anything
to an app that another app might also want.

---

## Layout: why the apps are still at the root

`packages/README.md` describes a target where each app moves under `apps/` as
it is rewritten. That move has not happened: all seven applications are still
top-level directories, and CI path filters, Dockerfile paths and deploy
workflows all address them there. Keeping them in place is what let the six
platforms be migrated one at a time without a CI outage.

The root `package.json` declares the workspace globs:

```json
"workspaces": [
  "packages/*", "services/*",
  "agro-sentinel/web", "cash-sentinel", "industry-sentinel",
  "personal-sentinel", "productivity-sentinel", "transport-sentinel"
]
```

Two things to know about that list:

- **`services/*` matches nothing today.** There is no `services/` directory in
  the repository. The glob is harmless and is presumably there for a backend
  that has not landed yet.
- **`cognitex-landing` is deliberately absent.** It has its own dependency
  tree, its own Tailwind and PostCSS config, and it is installed with a plain
  `npm install` inside its own directory.

`transport-sentinel/api` is also *not* a workspace member. It is a separate npm
package with its own `package-lock.json`, so the API image installs without the
frontend's dependency tree.

---

## Quick start

Requires **Node 22+** and npm 10+.

```bash
git clone <repo> && cd cognitex-ecosystem
npm install                                   # once, at the root — installs every workspace
npm run dev --workspace industry-sentinel     # http://localhost:5175
```

That is the whole setup for any of the six platforms. Substitute the workspace
name from the table above; note that agro's is `agro-sentinel-web`, not
`agro-sentinel`.

No `.env` is needed to run. With `VITE_FIREBASE_API_KEY` unset, a console
starts unconfigured: any credentials get you in, all data is generated in the
browser, and every view carries a `Datos simulados` badge. Copy an app's
`.env.example` to `.env` and fill in the six Firebase values to get a real
session and real data. See [Data and auth](#data-and-auth).

The landing site is separate:

```bash
cd cognitex-landing && npm install && npm run dev   # http://localhost:5173
```

---

## Checks

From the root, across every workspace:

```bash
npm run typecheck --workspaces --if-present
npm run lint      --workspaces --if-present
npm run test      --workspaces --if-present
npm run build     --workspaces --if-present     # tsc --noEmit && vite build, per app
```

Or one workspace at a time: `npm run test --workspace personal-sentinel`.

Current state, verified by running them:

| Command | Result |
| :--- | :--- |
| `typecheck` | passes |
| `lint` | passes |
| `build` | passes |
| `test` | **exits 1** — see below |

`npm run test --workspaces` fails on `@cognitex/data`, which declares
`"test": "vitest run"` but ships no test files; Vitest exits 1 on "No test
files found". Every app suite passes: agro 107, cash 47, industry 73,
personal 77, productivity 100, transport 12. `transport-sentinel/api` runs
its own suite separately on `node --test`.

---

## Docker: build from the repository root

**Every Sentinel Dockerfile builds with the repository root as its context**,
addressed with `-f`:

```bash
docker build -f industry-sentinel/Dockerfile -t industry-sentinel .
docker run -p 8080:8080 industry-sentinel
```

Not `docker build ./industry-sentinel`. The apps depend on the `@cognitex/*`
packages in `packages/`, and `npm ci` needs the root `package-lock.json` to
resolve them. Docker cannot `COPY` from outside its build context, so a
directory-scoped context physically cannot install these apps. This is the
single most surprising thing about the repository for a newcomer, and it is
why every workflow sets `CONTEXT: .`.

Each Dockerfile copies only the four paths it needs — the root manifests,
`packages/`, its own `package.json`, then its own source — and runs
`npm ci --workspace <name> --include-workspace-root`, so the other five
consoles' dependencies never enter the image.

Two exclusion files matter:

- The root [`.dockerignore`](./.dockerignore) applies to root-context builds.
- BuildKit prefers `<dockerfile>.dockerignore` when it exists.
  `cash-sentinel/Dockerfile.dockerignore` and
  `transport-sentinel/Dockerfile.dockerignore` are therefore self-sufficient
  supersets of the root file, not additions to it. Keep them in step.

Cloud Run routes to port **8080**. Every Sentinel image exposes 8080 and its
`nginx.conf` listens on 8080. `cognitex-landing`'s Dockerfile is the exception
at port 80 — and no deployment uses it.

### docker-compose is stale

[`docker-compose.yml`](./docker-compose.yml) still gives `agro-sentinel-web`,
`industry-sentinel` and `personal-sentinel` their own directories as the build
context. Those three Dockerfiles now start with `COPY package.json
package-lock.json ./` and `COPY packages ./packages`, and none of that exists
inside an app directory, so those three services fail to build. Only
`productivity-sentinel` was updated to `context: .`. Use `docker build -f …`
directly until the compose file is fixed.

---

## Deployment

GCP project `cognitex-485919`, region `us-east4`, Artifact Registry
`us-east4-docker.pkg.dev/cognitex-485919/cognitex-repo/`. All workflows trigger
on push to `main`.

| Deploys | Workflow | Target |
| :--- | :--- | :--- |
| `agro-sentinel/web` | `deploy-agro.yaml` | Cloud Run `agro-sentinel` |
| `cash-sentinel` | `deploy-cash.yaml` | Cloud Run `cash-sentinel` |
| `industry-sentinel` | `deploy-industry.yaml` | Cloud Run `industry-sentinel` |
| `personal-sentinel` | `deploy-personal.yaml` | Cloud Run `personal-sentinel` |
| `productivity-sentinel` | `deploy-productivity.yaml` | Cloud Run `productivity-sentinel` |
| `transport-sentinel` | `deploy-transport.yaml` | Cloud Run `transport-sentinel` |
| `cognitex-landing` | `deploy-landing.yaml` | GitHub Pages |

**Nothing deploys `agro-sentinel/edge`, `agro-sentinel/cloud` or
`agro-sentinel/terraform`.** `deploy-agro.yaml` watches `agro-sentinel/web/**`
only. Terraform has never been applied.

The six Cloud Run workflows also watch `packages/**` and the root manifests, so
a change to a shared package redeploys every app that uses it.

Full CI/CD detail, required secrets and the hard-won operational warnings are in
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

---

## Data and auth

| | Unconfigured | Configured |
| :--- | :--- | :--- |
| Trigger | `VITE_FIREBASE_API_KEY` empty at **build** time | all six `VITE_FIREBASE_*` values present |
| Login | any credentials accepted, `orgId` is `'demo'` | Firebase Email/Password |
| Data | generated deterministically in the browser | Firestore, every query filtered by `orgId` |
| On screen | `Datos simulados` | `Datos medidos`, with the store's timestamp |

`VITE_*` values are inlined by Vite at build time and cannot be injected at
Cloud Run runtime — which is why they are Docker `--build-arg`s and not
service environment variables.

Tenancy is an `orgId` custom claim on the Firebase user. `@cognitex/data`
filters every query by it, and Firestore security rules enforce the same
boundary so a missing filter cannot silently widen a query. `cash-sentinel` has
no auth at all, by design: it is a public calculator.

`transport-sentinel` is the only platform with a server. Its Express API in
`api/` holds the Vertex AI credential, because streaming a model response needs
a process that can. Everything else talks to Firestore directly from the
browser.

---

## Documentation

| Document | What it covers |
| :--- | :--- |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Deployment, CI/CD, pinned versions, past failures not to reintroduce |
| [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md) | How to add a platform, the non-negotiable constraints, what to run before pushing |
| [`packages/README.md`](./packages/README.md) | What each shared package replaced and why |
| [`agro-sentinel/PIPELINE_STATUS.md`](./agro-sentinel/PIPELINE_STATUS.md) | The real state of the IoT pipeline, file and line |

Per-platform: [agro](./agro-sentinel/README.md) ·
[cash](./cash-sentinel/README.md) · [industry](./industry-sentinel/README.md) ·
[personal](./personal-sentinel/README.md) ·
[productivity](./productivity-sentinel/README.md) ·
[transport](./transport-sentinel/README.md) ·
[landing](./cognitex-landing/README.md)

---

## Licence

Private property of Cognitex Industrial.
