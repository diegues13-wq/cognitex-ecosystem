# Cash Sentinel

A public currency-exchange and remittance calculator for the Ecuador–Russia
corridor, in Spanish, English and Russian. It is the one Sentinel that is not a
console: no login, no tenant, no dashboard. Someone arrives wanting to know how
much their mother receives, and leaves in a WhatsApp conversation with an
operator.

It stays unauthenticated on purpose. Putting a login in front of a public
calculator would remove the reason the page exists.

## What it does

- Converts USD ⇄ RUB with a 3% commission itemised on screen.
- Fetches the market rate every minute, and **says whether the rate on screen
  came from the market or from us**.
- Opens WhatsApp with the calculated figures already written into the message.

## The arithmetic

`src/domain/exchange.ts` is the product; everything else is packaging. It is
pure, typed and tested (`src/domain/exchange.test.ts`), and it holds money as
integer minor units — cents and kopeks — never as floats.

The rules worth knowing:

| Decision | Why |
| :--- | :--- |
| Every amount is converted to integer minor units once, at the edge. | Money is never added or compared as a float. |
| Commission is rounded half-up to a whole minor unit. | A fraction of a cent is not a thing that can be charged. |
| The net is `gross − commission`, never `gross × (1 − rate)`. | Guarantees the three lines of the receipt add up on screen. |
| Ties round **away from zero**, after re-reading the value at 15 significant digits. | `Math.round(1.005 * 100)` is 100. Binary can't hold 1.005, so a cent used to vanish. |
| RUB→USD **divides** by the rate. | Multiplying by a precomputed `1 / rate` rounds twice and drifts by a kopek. |
| Amounts are clamped to `[0, 1e9]`. | Above that, `MAX_SAFE_INTEGER` stops covering the intermediate products and cents silently stop existing. The interface says when it clamped. |
| An unusable rate falls back to a labelled reference rate. | Nothing may divide by zero, and nothing may render "NaN" into a message a customer sends to a human. |

## Tech

React 19 · TypeScript · Vite 7 · Tailwind v4 through `@cognitex/theme` ·
`@cognitex/ui` · `@cognitex/config` · lucide-react. No framer-motion (the two
entrance transitions are CSS), no charting library, and nothing that blurs what
is behind it — see `packages/README.md`.

Tailwind v4 scans this README as plain text along with the source, so the
banned utility is described here rather than named; naming it would emit the
rule into the stylesheet.

## Running it

From the repository root:

```bash
npm install --workspaces --include-workspace-root
npm run dev  --workspace cash-sentinel   # http://localhost:5175
npm run test --workspace cash-sentinel
npm run build --workspace cash-sentinel  # tsc --noEmit && vite build
```

## Deploying

Cloud Run, `us-east4`, via `.github/workflows/deploy-cash.yaml` on a push to
`main`. It needs no Firebase secrets — there is no auth to configure.

Build the image from the **repository root**, because the app imports the
shared packages and Docker cannot reach outside its context:

```bash
docker build -f cash-sentinel/Dockerfile -t cash-sentinel .
docker run -p 8080:8080 cash-sentinel
```

## Licence

Private property of Cognitex Industrial.
