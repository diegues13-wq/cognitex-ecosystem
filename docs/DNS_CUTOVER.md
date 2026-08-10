# DNS cutover runbook

Three problems to fix, in this order. DNS is authoritative on **Cloudflare**
(nameservers `nataly.ns.cloudflare.com` / `cameron.ns.cloudflare.com`).

State measured on 2026-08-10:

| Host | Resolves to | Serving | Status |
| :--- | :--- | :--- | :--- |
| `cognitexindustrial.com` (apex) | **nothing** | — | ✗ broken |
| `www.cognitexindustrial.com` | Cloudflare (proxied) | Cloudflare Pages, landing v1 | to migrate |
| `agro.` / `industry.` / `personal.` | Cloudflare (proxied) | Cloud Run behind the proxy | leave alone |
| `transport.` | `ghs.googlehosted.com` | Cloud Run domain mapping | leave alone |
| `productivity.` | **nothing** | Cloud Run, no domain | ✗ missing |
| `cash.` | nothing | not deployed anywhere | out of scope |

---

## 0. Before touching DNS

Deploy the new landing to Firebase **first** and verify it on the Firebase URL
(`<project>.web.app`). Switching DNS before there is something to switch to
takes the site down.

Order: merge the branch → CI deploys to Firebase → check `*.web.app` → only
then change DNS.

---

## 1. Landing → Firebase Hosting (apex + www)

### 1.1 Add the domains in Firebase

Firebase Console → **Hosting** → *Add custom domain*. Do it twice: once for
`cognitexindustrial.com`, once for `www.cognitexindustrial.com`.

Firebase will offer to redirect one to the other — **take it**, and make the
apex redirect to `www`. The whole site's canonical URLs already use `www`
(`src/config.ts` → `SITE.url`), so the apex must be the redirect, not the
target. That is what fixes problem #1.

Firebase then shows you the exact records to create: a `TXT` for ownership
verification, then `A` records for the host. **Use the values Firebase shows
you** — do not copy IPs from any guide, including this one, because they
change.

### 1.2 Create the records in Cloudflare

Cloudflare → DNS → Records.

Two things that will break this if you get them wrong:

1. **Set the proxy status to "DNS only" (grey cloud), not "Proxied" (orange).**
   Firebase provisions its own TLS certificate and must reach the host to
   complete the ACME challenge. With the orange cloud on, verification hangs
   and the certificate never issues. This is the single most common failure.

2. **Delete the existing records for `www` first.** The current `www` record
   points at Cloudflare Pages. Leaving it creates a conflict.

Cloudflare supports CNAME flattening at the apex, so if Firebase gives you a
CNAME target rather than A records, you can still use it on the root.

### 1.3 Wait, then verify

Certificate issuance typically takes minutes but Firebase allows up to 24
hours. Check with:

```bash
dig +short cognitexindustrial.com
dig +short www.cognitexindustrial.com
curl -sI https://cognitexindustrial.com | head -3   # expect a 301 to www
curl -sI https://www.cognitexindustrial.com | head -3
```

### 1.4 Decommission Cloudflare Pages

The Cloudflare Pages project still has a native GitHub integration and will
keep building on every push. Since the v1 SPA no longer exists in the repo,
those builds will start failing and emailing you.

In the Cloudflare dashboard → Workers & Pages → the landing project:
remove the custom domain, then disconnect the GitHub integration (or delete
the project outright).

Also confirm the GitHub Pages deployment is gone — the old
`deploy-landing.yaml` published there, and `public/CNAME` (the GitHub Pages
custom-domain marker) has been deleted in the new branch. Check
GitHub → Settings → Pages and set the source to *None*.

---

## 2. `productivity.cognitexindustrial.com`

Productivity Sentinel is live on Cloud Run but reachable only at its
`run.app` URL, which is what the landing currently links to.

Mirror what `transport.` already does — a **Cloud Run domain mapping**, which
is DNS-only and gets its certificate from Google:

```bash
gcloud beta run domain-mappings create \
  --service=productivity-sentinel \
  --domain=productivity.cognitexindustrial.com \
  --region=us-east4 \
  --project=cognitex-485919
```

That prints the record to create. It will be a `CNAME` to
`ghs.googlehosted.com` — add it in Cloudflare as **DNS only (grey cloud)**,
same as `transport.` already is.

The domain must be verified in Google Search Console for the account running
the command, or the mapping is refused.

Once it resolves, update `src/config.ts`:

```ts
// PLATFORMS → productivity
url: 'https://productivity.cognitexindustrial.com',
```

---

## 3. `cash.cognitexindustrial.com` — not yet

Cash Sentinel has **no deployment pipeline at all**: no workflow, and its
`run.app` URL returns 404. There is nothing to point DNS at.

The landing lists it as "En preparación" with no link, which is accurate. To
make it real it needs a `deploy-cash.yaml` modelled on
`deploy-productivity.yaml`, plus a Dockerfile — it is the only web project in
the monorepo without one.

---

## Why not keep the Cloudflare proxy in front of Firebase

You *can* leave the orange cloud on after the certificate issues, with SSL
mode set to **Full (strict)**. It is not recommended here:

- You would stack two CDNs. Firebase Hosting is already a global CDN, so
  Cloudflare adds a hop without adding cache hit rate.
- The cache headers in `cognitex-landing/firebase.json` (immutable for
  `/_astro/**`, `must-revalidate` for HTML) stop being authoritative.
- Certificate renewal has to re-run the ACME challenge. If the proxy is on at
  renewal time, renewal fails — and it fails silently, months later.

Keep DNS-only for the landing. The existing proxied sentinel subdomains are a
separate decision; they work today, so leave them.
