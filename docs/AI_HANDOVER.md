# Cognitex Industrial Ecosystem — AI Handover Document

> **[IMPORTANT FOR ALL AI ASSISTANTS]**
> Read this document completely before suggesting architectural changes, deployments, or modifying core logic. This is the single source of truth for the Cognitex ecosystem's history, current state, and next steps.

---

## 1. Project Overview

Cognitex Industrial is an Ecuadorian technology company positioned as a **Strategic Partner for Industrial Automation and Industry 4.0**. The ecosystem is a monorepo of interconnected React/Vite SPAs monitored and controlled via GCP + Firebase.

### Platforms (Monorepo Sub-projects)

| Sub-project | Port | Role | Theme |
| :--- | :--- | :--- | :--- |
| `cognitex-landing` | 5173 | Corporate website & marketing funnel | Neural / Dark |
| `industry-sentinel` | 5175 | SCADA, OEE, predictive maintenance, multi-tenant | Cyan / Blue |
| `personal-sentinel` | 5176 | Workforce safety, PPE compliance, biometrics | Orange / Amber |
| `agro-sentinel` | 5174 | IoT greenhouse monitoring, thermal analysis | Emerald / Green |
| `cash-sentinel` | — | Currency exchange & remittance calculator | Blue / Financial |
| `terra-landing` | 5177 | B2B landing page for Terra Latitude | — |

---

## 2. Architecture & Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS v4 (PostCSS), Recharts, Leaflet + React-Leaflet 5, Lucide React, date-fns
- **Animations**: Framer Motion (industry-sentinel, cognitex-landing)
- **Routing**: React Router DOM v7 (industry-sentinel only)
- **Backend / Auth**: Firebase 11 (Auth + Firestore)
- **Build**: Vite 7 (all except terra-landing which uses Vite 8)
- **Styling Exceptions**: `cash-sentinel` and `terra-landing` use Tailwind CSS v3
- **Python**: `agro-sentinel` cloud/edge components — managed strictly via `uv` (never pip/venv)
- **Package Manager**: npm (separate `package.json` per subfolder)

### Key Pinned Versions (do not change without testing)
- `vite`: `7.3.3` (exact pin — 7.3.1 and earlier have rollup incompatibility)
- `rollup`: `4.60.4` (exact pin — 4.57.x has a source-phase-imports bug that breaks Docker builds)
- `react-leaflet`: `5.0.0` (exact pin — RC versions export `LeafletProvider` instead of `LeafletContext`)
- `firebase`: `^11.0.0`

---

## 3. Authentication Architecture

All three sentinel apps (`agro-sentinel`, `industry-sentinel`, `personal-sentinel`) use a **dual-mode auth** pattern in `src/firebase.js`:

```js
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
export const isMockAuth = !apiKey;

if (isMockAuth) {
  // Mock user for local/CI dev — no Firebase SDK called
  auth = { currentUser: null, onAuthStateChanged: () => () => {} };
} else {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}
```

- **Mock mode** (default): `VITE_FIREBASE_API_KEY` is empty → auto-login as `dev@local` / "Dev User". No Firebase project needed.
- **Real mode**: `VITE_FIREBASE_API_KEY` is set → full Firebase Email/Password auth.

**Current production state**: All three deployed services are running in **mock mode** (no Firebase secrets configured yet). The next development session must configure real Firebase auth.

---

## 4. Production Deployment Status

### Cloud Run (GCP) — Active

| Service | Cloud Run URL | Status |
| :--- | :--- | :--- |
| **agro-sentinel** | `https://agro-sentinel-myvq6twbpa-uk.a.run.app` | ✅ Live |
| **industry-sentinel** | `https://industry-sentinel-myvq6twbpa-uk.a.run.app` | ✅ Live |
| **personal-sentinel** | `https://personal-sentinel-myvq6twbpa-uk.a.run.app` | ✅ Live |

**GCP Details:**
- Project ID: `cognitex-485919`
- Region: `us-east4`
- Artifact Registry: `us-east4-docker.pkg.dev/cognitex-485919/cognitex-repo/`
- All services deployed with `--allow-unauthenticated` (public access)

### Cloudflare Pages — Legacy / Static Hosting

| Platform | Domain | Root Dir |
| :--- | :--- | :--- |
| Landing | `www.cognitexindustrial.com` | `cognitex-landing` |

> Note: The sentinel apps were previously on Cloudflare Pages. They are now on Cloud Run via GitHub Actions. Cloudflare Pages projects may still exist but are superseded.

### GitHub Secrets Required

| Secret | Used By | Description |
| :--- | :--- | :--- |
| `GCP_PROJECT_ID` | All deploy workflows | `cognitex-485919` |
| `GCP_CREDENTIALS` | All deploy workflows | Service account JSON key (`github-deployer@cognitex-485919`) |
| `VITE_FIREBASE_API_KEY` | industry + personal deploy | **Not yet set** — needed for real auth |
| `VITE_FIREBASE_AUTH_DOMAIN` | industry + personal deploy | **Not yet set** |
| `VITE_FIREBASE_PROJECT_ID` | industry + personal deploy | **Not yet set** |
| `VITE_FIREBASE_STORAGE_BUCKET` | industry + personal deploy | **Not yet set** |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | industry + personal deploy | **Not yet set** |
| `VITE_FIREBASE_APP_ID` | industry + personal deploy | **Not yet set** |

The `github-deployer` service account needs: `roles/artifactregistry.writer`, `roles/run.admin`, `roles/iam.serviceAccountUser`.

---

## 5. CI/CD Workflows

Workflows in `.github/workflows/`:

| File | Triggers On | Deploys |
| :--- | :--- | :--- |
| `deploy-agro.yaml` | push to `agro-sentinel/**` | Cloud Run `agro-sentinel` |
| `deploy-industry.yaml` | push to `industry-sentinel/**` | Cloud Run `industry-sentinel` |
| `deploy-personal.yaml` | push to `personal-sentinel/**` | Cloud Run `personal-sentinel` |
| `deploy-landing.yaml` | push to `cognitex-landing/**` | Cloudflare Pages |
| `deploy-terra-landing.yaml` | push to `terra-landing/**` | Cloud Run |

**Build flow for sentinels**: `checkout → GCP auth → configure Docker → docker build (with Firebase --build-args) → push to Artifact Registry → deploy to Cloud Run`

### Firebase Config — Build-Time Injection

`VITE_*` variables are **baked into the JS bundle at build time** by Vite. They cannot be injected at Cloud Run runtime. The Dockerfiles for `industry-sentinel` and `personal-sentinel` accept them as Docker build args:

```dockerfile
ARG VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
# ... (all 6 vars)
RUN npm run build
```

The workflows pass them via `--build-arg VITE_FIREBASE_API_KEY=${{ secrets.VITE_FIREBASE_API_KEY }}`.

---

## 6. Docker Configuration

Each sentinel app (`agro-sentinel/web`, `industry-sentinel`, `personal-sentinel`) uses a multi-stage Dockerfile:
- **Build stage**: `node:20-alpine`, runs `npm ci` + `npm run build`
- **Production stage**: `nginx:alpine`, serves static files on port **8080** (required by Cloud Run)
- **nginx.conf**: `listen 8080` (not 80)

### Critical: .dockerignore Required

`industry-sentinel` and `personal-sentinel` have their `node_modules` committed to git (legacy). Without `.dockerignore`, `COPY . .` overwrites the `npm ci`-installed packages with the wrong committed ones. Both projects have `.dockerignore` files that exclude `node_modules` and `dist`.

### package-lock.json Notes

The lock files were generated locally with npm 11, which omits `resolved`/`integrity` fields for cached packages. All missing fields were backfilled by fetching from the npm registry. The lock files in the repo are the authoritative source and must not be regenerated locally without verifying the result in Docker.

---

## 7. Known Issues & Past Fixes (Do Not Revert)

| Issue | Fix | Where |
| :--- | :--- | :--- |
| `EXPOSE 80` vs `EXPOSE 8080` | Changed to 8080 for Cloud Run | All sentinel Dockerfiles |
| `listen 80` in nginx | Changed to `listen 8080` | All sentinel nginx.conf |
| `npm ci` fails — missing `resolved` fields | Backfilled all ~200 packages via npm registry script | industry/personal lock files |
| rollup@4.57.0 source-phase-imports bug | Pinned rollup@4.60.4 + all 25 `@rollup/rollup-*` native binaries | industry/personal lock files |
| `LeafletProvider not exported` error | Pinned `react-leaflet@5.0.0` (not RC), added `.dockerignore` | industry/personal |
| `COPY . .` overwrites npm ci packages | Added `.dockerignore` excluding `node_modules` | industry/personal |
| `rollup optionalDependencies` version mismatch | Updated `node_modules/rollup` lock entry `optionalDependencies` to 4.60.4 | industry/personal lock files |
| Base path `/cognitex-ecosystem/` (GitHub Pages legacy) | Set `base: '/'` in vite.config.js | All apps |
| Cloudflare stale cache | Push empty commit or manual purge in Cloudflare dashboard | — |

---

## 8. Next Development Session: Firebase Real Auth

**Goal**: Enable real Firebase Email/Password authentication for `industry-sentinel` and `personal-sentinel` on Cloud Run.

**Steps** (in order):

1. **Create/link Firebase project** to GCP project `cognitex-485919`:
   - Go to [console.firebase.google.com](https://console.firebase.google.com)
   - Add project → find `cognitex-485919` → link it

2. **Register a web app** in Firebase Console → get the `firebaseConfig` object

3. **Enable Email/Password** sign-in method in Firebase Console → Authentication → Sign-in method

4. **Create at least one user** in Firebase Console → Authentication → Users

5. **Add 6 GitHub secrets** (via `gh secret set`):
   ```
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   ```

6. **Push a trivial change** to `industry-sentinel/**` and `personal-sentinel/**` to trigger rebuilds with the secrets baked in.

7. **Verify**: Check that `dev@local` / `Dev User` strings no longer appear in the deployed JS bundle (they're only present in mock mode).

**Note on agro-sentinel**: Its Firebase auth was set up and deployed earlier. Use the same Firebase project for industry and personal sentinels to enable future SSO across the ecosystem.

---

## 9. Future Roadmap

### Phase 2: Centralized Backend & AI (GCP)
- FastAPI backend on Cloud Run
- Firestore for NoSQL storage
- Vertex AI / Gemini for predictive maintenance and AI chat

### Phase 3: SSO Across Sentinels
- All three sentinels (agro, industry, personal) share one Firebase project
- Users log in once and navigate between dashboards without re-authenticating

### Phase 4: Real Sensor Data
- Replace mock/simulated sensor data with live IoT feeds
- agro-sentinel edge → Cloud Pub/Sub → BigQuery → dashboard

---

*Last updated: 2026-05-18. Always update this file when major architectural changes occur.*
