# Personal Sentinel

Workforce-safety console: fatigue scoring, heat and cardiac exposure, PPE and
man-down across a five-person crew.

Rewritten in TypeScript on the shared `@cognitex/*` packages. The previous
version was a single 440-line `Dashboard.jsx` that "navigated" by swapping a
`selectedVariable` string, and it aliased its physics into agro-sentinel's
field names — heart rate in `vpd`, fatigue in `humidity`, body temperature in
`temp`.

## The defect this fixes

The generator wrote:

```js
co2: isWorking ? 1 : 0,  // ManDown Status - actually inverted logic for simplicity
```

and the dashboard rendered:

```jsx
value={stats.co2 === 1 ? 'ALERTA' : 'OK'}
```

The producer meant "working", the consumer read "fallen". In history mode every
worked hour displayed a man-down alarm and every idle hour displayed OK.

`PersonalReading.manDown` is a boolean. `src/domain/safety.test.ts` asserts that
a full worked shift with nobody down produces zero episodes, and fails if the
polarity ever comes back.

## Layout

| Path | What lives there |
| :--- | :--- |
| `src/domain` | Pure typed calculations with vitest coverage: fatigue scoring, exposure windows, man-down episodes, PPE verification |
| `src/data` | Firestore through `@cognitex/data` when configured, a deterministic generator otherwise — and the answer always says which |
| `src/views` | One view per section of the shell |
| `src/components` | The panel, the worker picker, the alarm ticker |

Everything else — the console shell, login, theme, metric cards, chart, build
and lint config — comes from `packages/`.

## What the numbers mean

- **Fatigue** is a weighted composite of the wearable's own index (0.4),
  heart-rate reserve in use (0.3), thermal load (0.2) and hours on shift (0.1).
  The drivers are returned with the score, so a supervisor sees *why* someone
  scored 78.
- **Cardiac strain** is measured per person — 85% of `220 − age` — not against
  one fixed 120 bpm for a 31-year-old chemist and a 52-year-old driver alike.
- **Exposure** is a *window*, not a peak. A window opens at the first reading
  over the limit and closes at the first one back under it, so a single spike
  during a lift is not a finding and twenty sustained minutes is.
- **PPE**: only the smart helmet has telemetry, so exactly one item per worker
  can be verified. The rest are marked `declarado` and carry no tick — and the
  compliance rate is null, not 100%, when nothing could be checked.

## Running it

```bash
npm install --workspaces --include-workspace-root   # from the repo root
npm run dev --workspace personal-sentinel           # http://localhost:5176
```

Leave `VITE_FIREBASE_API_KEY` empty (see `.env.example`) and the console runs
unconfigured: open demo login, generated data, and a `Datos simulados` badge on
every view. It never presents generated numbers as measurement.

```bash
npm run typecheck --workspace personal-sentinel
npm run test --workspace personal-sentinel
npm run lint --workspace personal-sentinel
npm run build --workspace personal-sentinel    # tsc --noEmit && vite build
```

## Docker

The image builds from the **repository root**: the app depends on workspace
packages outside its own directory, so a `./personal-sentinel` context cannot
resolve them.

```bash
docker build -f personal-sentinel/Dockerfile -t personal-sentinel .
docker run -p 8080:8080 personal-sentinel
```

Firebase config is passed as `--build-arg VITE_FIREBASE_*`, exactly as the
workflow does. The container listens on 8080 for Cloud Run.

## Production

Deployed to Cloud Run (`cognitex-485919`, `us-east4`) by
`.github/workflows/deploy-personal.yaml` on pushes to `main` touching
`personal-sentinel/**`, `packages/**` or the root manifests.

## License

Private property of Cognitex Industrial.
