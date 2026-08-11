# Industry Sentinel

Smart-manufacturing console: OEE, availability, downtime and predictive
maintenance across five machines.

Rewritten in TypeScript on the shared `@cognitex/*` packages. The previous
version was a single 448-line `Dashboard.jsx` that "navigated" by swapping a
`selectedVariable` string, and it aliased its physics into agro-sentinel's
field names — vibration in `vpd`, power in `co2`, OEE in `battery`. It now
reads `IndustryReading` from `@cognitex/data`, where every measurement carries
its own name and unit.

## Layout

| Path | What lives there |
| :--- | :--- |
| `src/domain` | Pure typed calculations with vitest coverage: OEE decomposition, downtime episodes, MTBF/MTTR, the vibration-trend forecast, alarm rules |
| `src/data` | Firestore through `@cognitex/data` when configured, a deterministic generator otherwise — and the answer always says which |
| `src/views` | One view per section of the shell |
| `src/components` | The panel, the machine picker, the alarm ticker |

Everything else — the console shell, login, theme, metric cards, chart, build
and lint config — comes from `packages/`.

## What the numbers mean

- **Availability** is running time over *scheduled* time. The shift is
  `[06:00, 22:00)`, so a machine that is off at 03:00 is not downtime.
- **Performance** is mean speed against each machine's own rated speed.
- **Quality** is not measurable from this telemetry, so it is back-computed
  from the MES-reported OEE and returns null when it cannot be. A value over
  100% means the reported OEE cannot be reconciled with the sensors, and the
  summary says so rather than hiding it.
- **MTBF/MTTR** are null when nothing failed. A machine that never stopped has
  no MTBF, and reporting zero says the opposite.
- **The maintenance horizon** is null when vibration is flat or falling. No
  fabricated "next service in 340 hrs".

## Running it

```bash
npm install --workspaces --include-workspace-root   # from the repo root
npm run dev --workspace industry-sentinel           # http://localhost:5175
```

Leave `VITE_FIREBASE_API_KEY` empty (see `.env.example`) and the console runs
unconfigured: open demo login, generated data, and a `Datos simulados` badge on
every view. It never presents generated numbers as measurement.

```bash
npm run typecheck --workspace industry-sentinel
npm run test --workspace industry-sentinel
npm run lint --workspace industry-sentinel
npm run build --workspace industry-sentinel    # tsc --noEmit && vite build
```

## Docker

The image builds from the **repository root**: the app depends on workspace
packages outside its own directory, so an `./industry-sentinel` context cannot
resolve them.

```bash
docker build -f industry-sentinel/Dockerfile -t industry-sentinel .
docker run -p 8080:8080 industry-sentinel
```

Firebase config is passed as `--build-arg VITE_FIREBASE_*`, exactly as the
workflow does. The container listens on 8080 for Cloud Run.

## Production

Deployed to Cloud Run (`cognitex-485919`, `us-east4`) by
`.github/workflows/deploy-industry.yaml` on pushes to `main` touching
`industry-sentinel/**`, `packages/**` or the root manifests.

## License

Private property of Cognitex Industrial.
