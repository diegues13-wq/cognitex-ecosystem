# Cognitex Landing

`cognitexindustrial.com` — the corporate site and the top of the commercial
funnel. Spanish is the primary locale at the root; English lives under `/en`.

## Stack

| Concern | Choice | Why |
| :--- | :--- | :--- |
| Framework | **Astro 7** | Ships real HTML. v1 was a client-rendered SPA whose entire body copy was invisible to search engines. |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | Brand tokens live in `@theme` in `src/styles/global.css`. |
| Fonts | Space Grotesk + Inter, self-hosted variable subsets via Fontsource | v1 preconnected to Google Fonts but never loaded a stylesheet, so both fonts silently fell back to system defaults. |
| Interactivity | Plain TypeScript in `<script>` blocks | See below. |
| Tests | Vitest | Money logic only. |

### There is no UI framework, on purpose

Every interactive piece — nav, count-ups, accordion, coverage check, all three
ROI calculators — is a few lines of vanilla TS that Astro inlines into the
page. Adding React to power four number inputs would cost ~187KB of runtime,
and the performance budget below caps initial JS at 150KB.

The result: **~3KB of JavaScript, zero external JS requests.**

Re-add `@astrojs/react` when the chat island lands with the backend — that one
genuinely benefits from a component runtime.

## Commands

```bash
npm install
npm run dev        # localhost:4321
npm test           # vitest — money logic
npm run build      # astro check (typecheck) then astro build
npm run preview    # serve dist/
```

`npm run build` runs `astro check` first, so a type error fails the build.

## Structure

```
src/
├── config.ts            Single source of truth: WhatsApp number, pricing, assumptions
├── i18n/
│   ├── es.ts            Primary content. Dictionary type is inferred from here
│   ├── en.ts            Mirror — a missing key is a compile error
│   └── utils.ts         ROUTES map (localised paths), route(), formatUsd()
├── lib/
│   ├── roi.ts           Pure ROI arithmetic + stated assumptions
│   ├── calculator-ui.ts Band formatting and the WhatsApp hand-off message
│   └── schema.ts        JSON-LD builders
├── layouts/Base.astro   html/head, skip link, nav, footer, reveal observer
├── components/
│   ├── ui/              Button, Card, Section, Stat, Accordion
│   └── home/            The nine home sections of spec §4.3
└── pages/               Spanish at root, English under en/
```

### Content lives in the dictionaries, never in components

`src/i18n/es.ts` is the source of truth; `en.ts` is typed against it with a
`Translated<Dictionary>` mapped type, so adding a Spanish key breaks the build
until it is translated. Routes are localised (`/energia` ↔ `/en/energy`) rather
than prefixed, which is what makes the `hreflang` pairs in `Seo.astro` correct.

### Money logic is tested

`src/lib/roi.ts` produces the figures a prospect carries into a WhatsApp
conversation, so spec §7.7 requires tests on it. Every assumption behind those
figures — the 8–12% savings band, genset burn rate, agent recovery rate — is a
named constant at the top of the file, stated so it can be argued with.

Results are always a band (conservative → optimistic). Quoting a single figure
to the dollar would be exactly the unbacked precision the brand voice forbids.

## Performance budget (spec §4.8)

| Target | Status |
| :--- | :--- |
| Initial JS < 150KB | ~3KB inline, no external JS |
| Lighthouse ≥ 95 ×4 | to verify on a deployed build |
| LCP < 2.0s on 4G | no render-blocking JS; fonts self-hosted |
| CLS < 0.1 | fonts preloaded with `font-synthesis: none`; images have intrinsic dimensions |
| `prefers-reduced-motion` | disables reveals, count-ups and the hero parallax |

## Deployment

Firebase Hosting via `.github/workflows/deploy-landing.yaml`. Pull requests get
a preview channel; `main` publishes to live. `firebase.json` carries the cache
headers and a CSP.

**DNS is not yet pointed at Firebase.** The domain currently resolves to
Cloudflare, and the apex `cognitexindustrial.com` has no record at all — only
`www` works. Both need fixing at cutover.

## Environment

`PUBLIC_GA4_MEASUREMENT_ID` — when unset, no analytics loads and the LOPDP
consent banner never appears. Consent Mode v2 starts denied; analytics runs
only after an explicit opt-in.

## Known placeholders

These render figures a prospect will read as a promise. **Confirm before
launch** (see `src/config.ts`):

- `PRICING.fleetPerVehicleMonthly` — invented, needed for the fleet "net of cost" row.
- `PRICING.energySystemInvestment` — invented, needed for the energy payback row.

Only `PRICING.agentsMonthly` (USD 490) comes from the spec.

The live-demo widgets and the coverage map render server-side placeholder data
behind their final interfaces. Wiring them is a fetch call once the Cloud Run
backend exists — the markup does not change.
