# Sentry & Cognitex Version Control Strategy (GCP Phase)

 This document defines the development workflow for the Cognitex Ecosystem. We use a **Mirror Project** strategy to maintain a stable static production site while developing complex Google Cloud integrations in parallel.

 ## 🌳 Branch Structure

 ### 1. `main` (Stable / Static)
 *   **Role**: Production code.
 *   **Hosting**: `www.cognitexindustrial.com` (and subdomains).
 *   **Projects**: `cognitex-landing`, `industry-sentinel`, etc.
 *   **Cloudflare Branch**: `main`.

 ### 2. `gc` (Development / Google Cloud)
 *   **Role**: Active development for Google Cloud Platform integration.
 *   **Hosting**: `beta.cognitexindustrial.com` (and subdomains).
 *   **Projects**: `cognitex-landing-gc`, `industry-sentinel-gc`, etc.
 *   **Cloudflare Branch**: `gc`.
 *   **Goal**: This branch will eventually be merged into `main` once the backend is fully functional.

 ---

 ## 🏛️ Official Project Rules & Architecture

All work is managed in the `cognitex-ecosystem` repository on GitHub. We strictly separate "Stable Production" from "GCP Development" using branches and separate Cloudflare projects.

### 🔴 Production Environment (Stable)
*   **Branch**: `main`
*   **Type**: Static Site (Current Version)
*   **Hosting**: Cloudflare Pages

| Project Name (Cloudflare) | Root Directory | Domain (Production) | Description |
| :--- | :--- | :--- | :--- |
| `cognitex-landing` | `cognitex-landing` | `www.cognitexindustrial.com` | Main landing page |
| `agro-sentinel` | `agro-sentinel/web` | `agro.cognitexindustrial.com` | Agro dashboard (Static) |
| `industry-sentinel` | `industry-sentinel` | `industry.cognitexindustrial.com` | Industry dashboard (Static) |
| `personal-sentinel` | `personal-sentinel` | `personal.cognitexindustrial.com` | Personal dashboard (Static) |

### 🔵 Development Environment (GCP Integration)
*   **Branch**: `gc`
*   **Type**: Research & Development (Google Cloud Integration)
*   **Hosting**: Cloudflare Pages (Mirror Projects)

| Project Name (Cloudflare) | Root Directory | Domain (Beta / Test) | Description |
| :--- | :--- | :--- | :--- |
| `cognitex-landing-gc` | `cognitex-landing` | `beta.cognitexindustrial.com` | GCP integration testing |
| `agro-sentinel-gc` | `agro-sentinel/web` | `beta-agro.cognitexindustrial.com` | Agro backend testing |
| `industry-sentinel-gc` | `industry-sentinel` | `beta-industry.cognitexindustrial.com` | Industry backend testing |
| `personal-sentinel-gc` | `personal-sentinel` | `beta-personal.cognitexindustrial.com` | Personal backend testing |

---

## 🛠️ Configuration Manual: Cloudflare Mirror Projects (How-To)

 ---

 ## 🔄 Dev Workflow

 ### Starting Work
 Always check out the `gc` branch before writing code:
 ```bash
 git checkout gc
 ```

 ### Saving Changes
 ```bash
 git add .
 git commit -m "feat: add cloud run config"
 git push origin gc
 ```
 *This triggers the `*-gc` projects in Cloudflare.*

 ### Going Live
 When GCP is ready:
 ```bash
 git checkout main
 git merge gc
 git push origin main
 ```
 *This triggers the live production projects.*
