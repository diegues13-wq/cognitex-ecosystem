# Contributing

Read [`../packages/README.md`](../packages/README.md) first. It explains what
the shared packages replaced and why, and most of the rules below follow from
it.

---

## Before you push

From the repository root:

```bash
npm run typecheck --workspaces --if-present
npm run lint      --workspaces --if-present
npm run test      --workspaces --if-present
npm run build     --workspaces --if-present
```

`build` is `tsc --noEmit && vite build` in every app, so a type error fails a
build and, in CI, fails the image. That is intended.

`test` currently exits 1 on `@cognitex/data`, which declares a `test` script
but ships no test files. Until that is fixed, check the per-app results rather
than the exit code, or run one workspace at a time.

If you touched a Dockerfile, a workflow or anything in `packages/`, build the
affected image locally before pushing — from the **repository root**:

```bash
docker build -f industry-sentinel/Dockerfile -t industry-sentinel .
```

A change in `packages/` redeploys all six platforms, because every Cloud Run
workflow watches `packages/**`.

---

## Adding a platform

Copy `industry-sentinel` — it is the plainest of the six — and work through
this list. Nothing here is optional; a missing step shows up either as an
unstyled shell, an image that will not build, or a console that cannot say
where its numbers came from.

| # | Step |
| :--- | :--- |
| 1 | Create `<name>-sentinel/` at the repository root and add it to `workspaces` in the root `package.json`. Apps live at the root, not under `apps/`. |
| 2 | `package.json`: depend on `@cognitex/{auth,data,theme,ui}`, devDepend on `@cognitex/config`. Scripts `dev`, `build` (`tsc --noEmit && vite build`), `preview`, `lint`, `typecheck`, `test`. |
| 3 | `vite.config.ts` — one line: `export default createViteConfig({ port })`. Pick a free port; 5173–5178 are taken, and 5175 is already double-booked. |
| 4 | `tsconfig.json` extends `@cognitex/config/tsconfig.json`; `eslint.config.js` is `createEslintConfig()`. No local overrides. |
| 5 | Add the platform to `PlatformId` and `BRANDS` in `packages/theme/src/brands.ts`: one accent, one icon name, one tagline, one URL (`null` until it deploys). |
| 6 | Add your reading type to `packages/data/src/types.ts` and to the `Reading` union. Give every field its own name and unit. Do not reuse another platform's slots. |
| 7 | `src/main.tsx` calls `initData(readSettings(import.meta.env))` **before** the first render, then imports `@cognitex/theme/tokens.css` and the three font packages. Getting that order wrong makes the app decide it is in demo mode during first paint and change its mind. |
| 8 | `src/App.tsx` is `AuthGate` + your `Console`. `src/Console.tsx` is `AppShell` + a `NavSection[]`. Import lucide icons one at a time. |
| 9 | `src/data/repository.ts` is the app's only data entry point, and obeys the two rules below. |
| 10 | `.env.example` with the six `VITE_FIREBASE_*` and a comment saying what an empty API key means. |
| 11 | `nginx.conf` with `listen 8080`; `Dockerfile` built from the repo root, with the six `ARG`/`ENV` pairs. |
| 12 | `.github/workflows/deploy-<name>.yaml`, copied from an existing one. `CONTEXT: .`, `DOCKERFILE: <name>-sentinel/Dockerfile`, and path filters covering `<name>-sentinel/**`, `packages/**`, `package.json`, `package-lock.json` and the workflow itself. |
| 13 | A `README.md` following the shape the other six use. Link to `packages/README.md` rather than restating the shared stack. |

### The two data rules

```
1. Firestore when it is configured, the generator otherwise.
2. The answer always says which one it was.
```

Every load returns a `source: DataSource`, every view renders
`<DataSourceBadge source={source} />`, and every query filters on `orgId`.
Firestore security rules must enforce the same `orgId` boundary — doing it in
both places means a missing rule cannot silently widen a query.

If your platform needs collections beyond the shared `readings` and `alerts`,
put them in your own `src/data/store.ts` and import only `getDb()` and
`isConfigured()` from `@cognitex/data`. Do not widen the shared types to fit
one platform.

---

## Constraints that are not negotiable

Each of these exists because something broke.

**No translucent panels that blur their backdrop.** `backdrop-filter: blur()`
routes through Skia's Gaussian kernel, which takes an AVX2 path that raised
SIGILL on pre-Haswell CPUs and repeatedly crashed transport-sentinel in the
field. Industrial panel PCs are exactly the machines that are old. Panels are
solid.

*Careful when documenting this:* Tailwind v4 scans Markdown and comments as
plain text along with the source, so writing the utility's class name into a
README emits the rule into that app's stylesheet. Describe it; do not name it.

**No charting library.** `recharts` was removed from transport-sentinel for the
same SIGILL reason. `TimeSeriesChart` in `@cognitex/ui` is plain SVG — no
canvas, no filters — and it drops about 180KB of vendor JavaScript from every
app that used to carry recharts. If you need a chart shape it does not have,
extend that component.

**No hardcoded hex.** Colour comes from tokens. A platform sets
`--color-brand` through its entry in `BRANDS` and nothing else. The old
per-app Tailwind configs are why `cognitex.DEFAULT` meant `#06b6d4`, `#7c3aed`
and `#1d6fa5` in three different apps, and why personal-sentinel's orange UI
rendered a cyan selection highlight. Status colours come from `STATUS_COLOR`;
derived ramps come from `color-mix` on `--color-brand`.

**Measurements carry their own names and units.** The apps used to share one
row shape and alias their physics into its fields — vibration in `vpd`, OEE in
`battery`, man-down in `co2`. That produced a live defect where
personal-sentinel reported every worked hour as a man-down alert. Add a field;
never borrow a slot. Booleans are booleans, not 0/1 in a numeric field.

**The UI must always say whether data is measured or generated.** No exceptions
and no 8px caption at 40% opacity. This applies to anything a customer could
read as a measurement, including the landing page's demo and cash-sentinel's
exchange rate — which labels itself `live` or `fallback` and says why.

**No `Math.sin` or similar in a per-frame hot path**, and keep the build target
at `es2020`. Both were part of the same SIGILL fix.

**Port 8080 in every container.** Cloud Run routes there; anything else and the
revision never passes its health check. Health routes go under `/api/health` —
a bare `/healthz` on a `*.run.app` host is answered by the Google frontend and
never reaches your container, so it reports healthy regardless.

**Build images from the repository root.** Covered above and in
[`ARCHITECTURE.md`](./ARCHITECTURE.md) §5. If you add a
`<dockerfile>.dockerignore`, remember BuildKit reads it *instead of* the root
`.dockerignore`, so it must be a self-sufficient superset.

**Python is managed with `uv`.** Never pip or venv. This applies to
`agro-sentinel/edge` and `agro-sentinel/cloud`.

---

## Documentation

[`ARCHITECTURE.md`](./ARCHITECTURE.md) is the single source of truth for
infrastructure. **If you change infrastructure, update it in the same commit** —
the previous generation of docs in this repository disagreed with each other on
deploy target, region and project ID, and cost real debugging time.

When you record a rule, say in one sentence what broke. That is what makes
people follow it.
