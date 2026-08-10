# Shared packages

Everything six Sentinel platforms were duplicating, extracted once.

The audit that motivated this found ten files that were **byte-identical**
across apps (`firebase.js`, `main.jsx`, `nginx.conf`, `Dockerfile`,
`vite.config.js`, `postcss.config.js`, `eslint.config.js`,
`tailwind.config.js`, `index.css`, and a dead `Sidebar.jsx` still branded for
another product). The auth block inside every `App.jsx` was identical in four
apps. `ChatAssistant.jsx` was 266 lines of which only 66 differed — colour,
icon and strings.

| Package | Replaces |
| :--- | :--- |
| `@cognitex/config` | 6 × `vite.config.js`, `postcss.config.js`, `eslint.config.js` |
| `@cognitex/theme` | 5 × `tailwind.config.js` + `index.css`, and ~150 hardcoded hex literals |
| `@cognitex/auth` | 4 × `firebase.js` + 6 × login screen + the duplicated hook pair |
| `@cognitex/data` | the copy-pasted `dataService.js` and every browser-side generator |
| `@cognitex/ui` | 4 × KPI card, 2 × chart wrapper, 3 × inline sidebar |

## Decisions worth knowing

**One accent, everything else shared.** `cognitex.DEFAULT` used to mean
`#06b6d4`, `#7c3aed` and `#1d6fa5` in different apps — the token existed but
carried no meaning. Surfaces, type, spacing and semantics are now identical
everywhere; a platform sets `--color-brand` and nothing else. Brands live in
`@cognitex/theme/brands`.

**No backdrop blur. Anywhere.** `backdrop-filter: blur()` routes through
Skia's Gaussian kernel, which takes an AVX2 path that raised SIGILL on
pre-Haswell CPUs and repeatedly crashed transport-sentinel in the field.
Industrial panel PCs are exactly the machines that are old. Panels are solid;
this is a constraint, not a preference.

**No charting library.** `recharts` was removed from transport-sentinel for
the same SIGILL reason and replaced with 334 lines of app-specific SVG, while
four other apps kept it. `TimeSeriesChart` is the shared version of the safe
approach — plain SVG, no canvas, no filters — and it drops ~180KB of vendor
JavaScript from every app that used recharts.

**Measurements have names.** The apps shared one row shape copied from
agro-sentinel and aliased their own physics into its fields:

```js
vpd:     parseFloat(vib.toFixed(2)),   // vibration in the VPD slot
battery: Math.round(oee),              // OEE in the battery slot
co2:     isWorking ? 1 : 0,            // man-down in the CO2 slot
```

So `co2` meant ppm in one app, watts in another and a boolean alarm in a
third — and that already caused a live defect where personal-sentinel's
history view reported every worked hour as a man-down alert. `@cognitex/data`
types each platform's readings separately and discriminates the union on
`platform`, so one console's reading cannot typecheck as another's.

**The UI says where numbers came from.** Every platform generates data in the
browser today and presents it as measurement. `DataSourceBadge` makes the
distinction visible, the same promise the landing page's live demo makes. We
sell measurement, so we say when we are not measuring.

**TypeScript.** The apps are JavaScript; the packages are TypeScript and the
rewritten apps will be too. The audit's most expensive bugs were shape
mismatches between a producer and a consumer — `{time, priority}` versus
`{timestamp, severity}`, `EN_CURSO` versus `EN_PROGRESO` — which silently
rendered blank timestamps and wrong icons. Those are exactly the bugs a type
checker catches for free.

## Layout

Apps still live at the repository root while they are migrated one at a time,
so CI keeps working throughout. Each moves under `apps/` as it is rewritten.
