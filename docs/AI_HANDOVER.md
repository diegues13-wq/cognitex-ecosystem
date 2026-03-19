# Cognitex Industrial Ecosystem - AI Handover Document

> **[IMPORTANT FOR ALL AI ASSISTANTS]**
> Read this document completely before suggesting architectural changes, deployments, or modifying core logic. This serves as the single source of truth for the Cognitex ecosystem's history, current state, and future roadmap.

## 1. Project Overview & Business Logic
Cognitex Industrial is an Ecuadorian technology company positioned as a **Strategic Partner for Industrial Automation and Industry 4.0**. 
The ecosystem is a monorepo consisting of multiple interconnected web platforms (React/Vite SPAs) that digitize and supervise industrial operations.

### Current Platforms (Monorepo Sub-projects)
1. **`cognitex-landing`**: The main corporate website and marketing funnel.
   - **Vite config:** `base: '/'`
   - **SEO:** Fully optimized (sitemap.xml, robots.txt, semantic HTML `main/sections`, open graph tags).
2. **`industry-sentinel`**: Dashboard for SCADA, OEE (Overall Equipment Effectiveness), and predictive maintenance.
3. **`agro-sentinel`**: IoT monitoring tailored for agricultural environments (sensors, moisture, crop health).
4. **`personal-sentinel`**: Workplace safety monitoring, body tracking, PPE compliance.
5. **`cash-sentinel`**: Financial, billing, and resource optimization platform.

## 2. Architecture & Tech Stack
- **Frontend / UI**: React 19, Tailwind CSS v4, Framer Motion (heavy use of glassmorphism and neon-industrial aesthetics), `lucide-react` for iconography.
- **Build Tool**: Vite (configured for explicit relative/absolute pathing depending on domain setup).
- **Package Manager**: npm (Standard monolithic structure with separate package.json per subfolder).

## 3. Current Deployment Status (Production)
The production deployment strategy recently migrated **away** from Google Cloud Run (due to missing GCP credentials) and GitHub Pages default routing.

**Current Setup for `cognitex-landing`:**
- **Hosting / CDN**: **Cloudflare Pages** (directly connected to the GitHub repository `diegues13-wq/cognitex-ecosystem`).
- **Domain**: `www.cognitexindustrial.com` (Managed by Cloudflare DNS).
- **Deployment Trigger**: Any push to the `main` branch automatically triggers Cloudflare Pages to run `npm run build` inside the `cognitex-landing` directory and serve the `dist/` folder.
- **Quirks & Rules**: 
  - Cloudflare Pages uses native `_redirects` files. An SPA fallback `/* /index.html 200` is currently used. 
  - *If GitHub Pages warnings appear (e.g., "Improperly configured"), they can be ignored as long as Cloudflare Pages is the active deployment engine.*

## 4. Past Issues Solved (Do Not Revert)
- **Base Pathing (`vite.config.js`)**: Originally set to `/cognitex-ecosystem/` for GitHub Pages. It has been **permanently fixed to `/`** because Cloudflare Pages hosts it at the root domain (`www.cognitexindustrial.com`). 
- **Cloudflare Caching**: Cloudflare aggressively cached an old version that returned 404s for assets. The user had to manually purge cache/deployments in Cloudflare. **Always push an empty commit to `main` or ask the user to manually trigger a build in Cloudflare if the site doesn't visually update**.

## 5. Future Development Roadmap (Objetivos a Futuro)
Future AI assistants working on this repo should focus on these upcoming goals:

### Phase 1: Deploy Remaining Sentinels
- The 4 sub-platforms (`industry`, `agro`, `personal`, `cash`) are currently local.
- **Goal**: They need to be deployed either as subdomains (e.g., `industry.cognitexindustrial.com`) via Cloudflare Pages OR containerized in Docker if they require heavy backend components.

### Phase 2: Centralized Backend & AI Integration (GCP)
- The architecture requires a Python API backend (FastAPI/Edge) to ingest IoT data.
- **Infrastructure**: Google Cloud Run (for API microservices), Firestore (for NoSQL real-time time-series DB), and **Vertex AI / Gemini** (for predictive maintenance and "Cognitive AI" chatbot answering plant status).
- **Prerequisite**: A valid `GCP_CREDENTIALS` JSON must be securely provided to GitHub Actions or local environment by the user before initiating any Google Cloud infrastructure-as-code scripts.

### Phase 3: Authentication Layer
- Implement Firebase Auth or Auth0 to protect the `*-sentinel` platforms so only authorized plant managers can access data.

---

*Document generated on: 2026-03-19. Maintain and update this file whenever major architectural shifts occur.*
