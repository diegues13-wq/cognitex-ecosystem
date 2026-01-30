# Cloudflare Pages Master Guide (Production & Beta)

This is the definitive guide for managing the Cognitex Ecosystem on Cloudflare. We maintain two separate environments to ensure stability while developing new features.

---

## 🏛️ Environment Architecture

| Environment | Branch | Cloudflare Project Suffix | Domain Prefix | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **🔴 Production** | `main` | (None) e.g., `cognitex-landing` | `www`, `agro`, `industry` | Stable, public-facing sites. |
| **🔵 Beta (GC)** | `gc` | `-gc` e.g., `cognitex-landing-gc` | `beta`, `beta-agro` | Google Cloud integration testing. |

---

## 🔴 Part 1: Production Deployment (Stable)
*Use this for the public version of the site.*

### Global Settings
*   **Build Command**: `npm install && npm run build`
*   **Production Branch**: `main`

### Project Specifics
1.  **Landing Page**
    *   Project Name: `cognitex-landing`
    *   Root Directory: `cognitex-landing`
    *   Domain: `www.cognitexindustrial.com`
2.  **Industry Sentinel**
    *   Project Name: `industry-sentinel`
    *   Root Directory: `industry-sentinel`
    *   Domain: `industry.cognitexindustrial.com`
3.  **Agro Sentinel**
    *   Project Name: `agro-sentinel`
    *   Root Directory: `agro-sentinel/web`
    *   Domain: `agro.cognitexindustrial.com`
4.  **Personal Sentinel**
    *   Project Name: `personal-sentinel`
    *   Root Directory: `personal-sentinel`
    *   Domain: `personal.cognitexindustrial.com`

---

## 🔵 Part 2: Beta Deployment (GCP Development)
*Use this for testing new backend features before dragging them to main.*

### Global Settings
*   **Build Command**: `npm install && npm run build`
*   **Production Branch**: `gc`  <-- **CRITICAL DIFFERENCE**

### Project Specifics
1.  **Landing Page (Beta)**
    *   Project Name: `cognitex-landing-gc`
    *   Root Directory: `cognitex-landing`
    *   Domain: `beta.cognitexindustrial.com`
2.  **Industry Sentinel (Beta)**
    *   Project Name: `industry-sentinel-gc`
    *   Root Directory: `industry-sentinel`
    *   Domain: `beta-industry.cognitexindustrial.com`
3.  **Agro Sentinel (Beta)**
    *   Project Name: `agro-sentinel-gc`
    *   Root Directory: `agro-sentinel/web`
    *   Domain: `beta-agro.cognitexindustrial.com`
4.  **Personal Sentinel (Beta)**
    *   Project Name: `personal-sentinel-gc`
    *   Root Directory: `personal-sentinel`
    *   Domain: `beta-personal.cognitexindustrial.com`

---

## 🆘 Troubleshooting

### "Dependency Mismatch" or Build Failures
If Cloudflare complains about `npm ci` or locked files:
1.  **Delete** the project in Cloudflare.
2.  **Re-create it** exactly with the settings above.
3.  This clears the internal cache and forces a fresh install.

### Updating Beta
Push to the `gc` branch:
```bash
git checkout gc
git add .
git commit -m "update beta"
git push origin gc
```

### Promoting to Production
Merge `gc` into `main`:
```bash
git checkout main
git merge gc
git push origin main
```
