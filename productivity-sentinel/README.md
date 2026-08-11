# Productivity Sentinel

A Last Planner console: a daily log of what did not get done and why, rolled up
into weekly plan compliance, a constraint board and a root-cause Pareto. It is
the only platform where the user **writes** the data — the other consoles read
what a gateway measured.

Built on the shared `@cognitex/*` packages; see
[`../packages/README.md`](../packages/README.md) for the stack and the
decisions behind it.

## Sections

| Section | What it does |
| :--- | :--- |
| Resumen | PPC, recurrence rate, open constraints, the control loop |
| Registro diario | The entry form and the day's log; yesterday's commitments get verified here |
| Restricciones | The constraint board — `activa → en_experimento → neutralizada`, with the reverse edges |
| Análisis | Root-cause Pareto and the recurrence trend |
| Síntesis semanal | The week's synthesis and next week's experiment, computed from the log |

## Where the data comes from

| | Firestore configured | Not configured |
| :--- | :--- | :--- |
| Read | `productivityEntries` and `productivityConstraints`, filtered by `orgId` | Deterministic generator |
| Write | Persisted | Kept in memory for the session only |
| Badge | `Datos medidos` | `Datos simulados` |

Every view renders `DataSourceBadge`, so the distinction is on screen and not
in a comment. In unconfigured mode a write still returns a value with a local
id, so the demo responds to typing — but `source` stays `generated` and the
badge stays amber. Nothing pretends the write reached a database.

The two domain collections live in `src/data/store.ts` rather than in
`@cognitex/data`, on purpose: a failure entry carries prose, a taxonomy code
and a verification state, and squeezing it into `ProductivityReading`'s three
numeric slots is exactly the aliasing the shared package exists to stop. What
*is* published to the shared `readings` collection is the daily rollup —
`planCompliance`, `openConstraints`, `rootCause` — through `publishRollup`.

## What the numbers mean

These definitions changed in the rewrite, and the figures changed with them.

- **PPC is binary.** A commitment is complete or it is not. `parcial` is
  counted and shown but does not count as a completion; treating it as one
  inflated the headline by about eleven points on the seeded data.
- **Pending is excluded, not failed.** `pendiente` means verification has not
  happened yet, so it leaves the denominator. Previously a user watched their
  score drop the moment they logged an entry.
- **Recurrence is derived, not stored.** A failure is recurrent when its root
  cause already appeared in the preceding window (14 days by default).
  `es_recurrente` used to be a stored field — random for demo rows, hardcoded
  `false` for anything a real user typed — so the headline KPI could not have
  agreed with the log printed beside it.
- **Days-active is derived from `since`.** It used to be a stored integer that
  never incremented, so a constraint could claim it had been in experiment for
  eight days, six months later.
- **The vital few are computed.** Every Pareto row up to and including the
  first whose cumulative share reaches 80%. It used to hardcode the first two
  rows as dominant, and rounded each share before adding them.
- **Ties in the Pareto fall back to the taxonomy's declared order**, so the
  bars stop reordering themselves between renders.
- **The control loop plots the log.** PPC, mean self-reported energy and the
  trailing 7-day recurrence rate. If a goal cannot be computed from the log,
  the series is empty and the view says so instead of drawing a random walk
  labelled "PV (Valor Real)".
- **The weekly synthesis is a function of the week's entries and the board.**
  It used to return the same hypothesis, action and metric every week for every
  user, behind a button that waited 1.2 seconds and re-rendered identical text.

The root-cause taxonomy is closed — seven causes in `src/domain/taxonomy.ts`,
each with a definition and a standard counter-measure that seeds the weekly
experiment. Causes carry no colour: the Pareto derives its ramp from
`--color-brand`, so it follows the platform accent.

## Layout

| Path | What lives there |
| :--- | :--- |
| `src/domain` | Pure typed calculations, all under test: PPC, recurrence, constraints, Pareto, control loop, synthesis, dates |
| `src/data` | `repository.ts` (the only entry point), `store.ts` (Firestore), `generate.ts` |
| `src/views` | One view per section |
| `src/components` | Entry form, entry table, constraint board, Pareto table, verification control |

Everything else — shell, login, theme, metric cards, chart, build and lint
config — comes from `packages/`.

## Running it

From the repository root:

```bash
npm install                                          # once
npm run dev --workspace productivity-sentinel        # http://localhost:5178
```

Leave `VITE_FIREBASE_API_KEY` empty (see `.env.example`) and the console runs
unconfigured: open demo login, generated data, `Datos simulados` on every view.

```bash
npm run typecheck --workspace productivity-sentinel
npm run test      --workspace productivity-sentinel   # 100 tests, 7 files
npm run lint      --workspace productivity-sentinel
npm run build     --workspace productivity-sentinel   # tsc --noEmit && vite build
```

## Docker

The image builds from the **repository root**: the app depends on workspace
packages outside its own directory, so a `./productivity-sentinel` context
cannot resolve them.

```bash
docker build -f productivity-sentinel/Dockerfile -t productivity-sentinel .
docker run -p 8080:8080 productivity-sentinel
```

Firebase config is passed as `--build-arg VITE_FIREBASE_*`, exactly as the
workflow does. The container listens on 8080 for Cloud Run.

This is the only service currently wired correctly in
[`../docker-compose.yml`](../docker-compose.yml) — it is the one entry that
uses `context: .`.

## Production

Deployed to Cloud Run (`cognitex-485919`, `us-east4`) by
`.github/workflows/deploy-productivity.yaml` on pushes to `main` touching
`productivity-sentinel/**`, `packages/**` or the root manifests.

It has no subdomain yet; `BRANDS.productivity.url` in
`packages/theme/src/brands.ts` points at the raw `*.run.app` host.

## Licence

Private property of Cognitex Industrial.
