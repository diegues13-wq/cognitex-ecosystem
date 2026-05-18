# Cognitex Industrial Ecosystem

The **Cognitex Industrial Ecosystem** is a unified suite of next-generation monitoring platforms powered by AI and IIoT (Industrial Internet of Things).

## 🚀 Platforms

This monorepo hosts the following integrated applications:

### 1. [Cognitex Landing](./cognitex-landing) (Port 5173)
*   **Role**: Central Marketing & Entry Hub.
*   **Domain**: Corporate website, ecosystem showcase, interactive platform navigator.
*   **Theme**: Neural network aesthetics — the "Brain" of the ecosystem.
*   **Tech**: React 19, Vite 7, Tailwind CSS 4, Framer Motion, Leaflet.

### 2. [Industry Sentinel](./industry-sentinel) (Port 5175)
*   **Role**: Smart Manufacturing & Predictive Maintenance.
*   **Domain**: Factory floors, production lines, OEE monitoring, multi-tenant admin.
*   **Theme**: **Cyan/Industrial Blue**.
*   **Tech**: React 19, Vite 7, Tailwind CSS 4, Firebase, Recharts, Leaflet, React Router.

### 3. [Personal Sentinel](./personal-sentinel) (Port 5176)
*   **Role**: Workforce Safety & EHS.
*   **Domain**: Biometrics tracking, zone alerts, incident reporting.
*   **Theme**: **Safety Orange/Amber**.
*   **Tech**: React 19, Vite 7, Tailwind CSS 4, Firebase, Recharts, Leaflet.

### 4. [Agro Sentinel](./agro-sentinel) (Port 5174)
*   **Role**: Precision Agriculture & IoT.
*   **Domain**: Greenhouse monitoring, thermal analysis, AI-driven queries.
*   **Theme**: **Emerald/Green**.
*   **Tech**: React 19, Vite 7, Tailwind CSS 4, Firebase, Recharts, Leaflet, Python (Cloud/Edge).

### 5. [Cash Sentinel](./cash-sentinel)
*   **Role**: Financial & Transfer Calculator.
*   **Domain**: Currency exchange, remittance calculations, multi-language support.
*   **Theme**: **Blue/Financial**.
*   **Tech**: React 19, Vite 7, Tailwind CSS 3, Framer Motion.

### 6. [Terra Landing](./terra-landing) (Port 5177 via Docker)
*   **Role**: B2B Landing Page for Terra Latitude.
*   **Domain**: Heritage, global logistics, EUDR traceability.
*   **Note**: Also exists as an independent repository at `../terra-landing`.

---

## 🛠️ Technology Stack

*   **Frontend**: React 19 + Vite 7
*   **Styling**: Tailwind CSS v4 (PostCSS integration) — except Cash Sentinel (Tailwind v3)
*   **Charts**: Recharts
*   **Maps**: Leaflet + React-Leaflet
*   **Backend**: Firebase (Auth/Firestore), Python (AI/IoT Edge/Cloud)
*   **Languages**: JavaScript (ESM), Python

> [!IMPORTANT]
> **Python Management**: We strictly use [uv](https://github.com/astral-sh/uv) (An extremely fast Python package installer and resolver, written in Rust) instead of pip/venv.

## 🔐 Access & Credentials

### Local Development (Mock Mode)
All sentinel apps run in **mock auth mode** when `VITE_FIREBASE_API_KEY` is not set — they auto-login as `Dev User` with no password required. Copy `.env.example` to `.env` in each project and leave `VITE_FIREBASE_API_KEY` empty.

### Production (Cloud Run)
| Platform | Production URL | Auth |
| :--- | :--- | :--- |
| **Agro Sentinel** | `https://agro-sentinel-myvq6twbpa-uk.a.run.app` | Mock (Firebase pending) |
| **Industry Sentinel** | `https://industry-sentinel-myvq6twbpa-uk.a.run.app` | Mock (Firebase pending) |
| **Personal Sentinel** | `https://personal-sentinel-myvq6twbpa-uk.a.run.app` | Mock (Firebase pending) |

> Real Firebase Email/Password auth is wired but not yet activated — the next step is adding Firebase credentials as GitHub Secrets. See `docs/AI_HANDOVER.md` § "Next Development Session".

## 🏁 Getting Started

### Prerequisites
*   Node.js v20+
*   npm v10+
*   **uv** (Install via `curl -LsSf https://astral.sh/uv/install.sh | sh` or `pip install uv`)

### Installation

#### Web Applications (Frontend)
```bash
# Install dependencies for all web projects
cd cognitex-landing && npm install && cd ..
cd industry-sentinel && npm install && cd ..
cd personal-sentinel && npm install && cd ..
cd agro-sentinel/web && npm install && cd ../..
cd cash-sentinel && npm install && cd ..
```

#### Python Components (Backend/Edge)
Use `uv` to create virtual environments and install dependencies.

```bash
# Agro Cloud Components
cd agro-sentinel/cloud
uv venv
uv pip install -r requirements.txt

# Agro Edge Components
cd ../edge
uv venv
uv pip install -r requirements.txt
```

### Development
Run each project individually:

```bash
# Run Landing Page (default port 5173)
cd cognitex-landing && npm run dev

# Run Industry Sentinel (port 5175)
cd industry-sentinel && npm run dev

# Run Personal Sentinel (port 5176)
cd personal-sentinel && npm run dev

# Run Agro Sentinel Web (default port 5174)
cd agro-sentinel/web && npm run dev

# Run Cash Sentinel (default port)
cd cash-sentinel && npm run dev
```

### 🐳 Production Deployment (Docker)
You can run the entire ecosystem in production mode using Docker Compose.
**Note**: Ensure [Docker](https://docs.docker.com/get-docker/) is installed and running on your machine.

```bash
# Build and Start all platforms
docker compose up --build -d

# Verify containers are running
docker compose ps
```

The applications will be available at:
*   **Landing**: http://localhost:5173
*   **Agro**: http://localhost:5174
*   **Industry**: http://localhost:5175
*   **Personal**: http://localhost:5176
*   **Terra**: http://localhost:5177

### ☁️ CI/CD & Production Deployment

Sentinel apps deploy to **Google Cloud Run** (`cognitex-485919`, `us-east4`) via GitHub Actions on push to `main`.

| Workflow | Deploys To |
| :--- | :--- |
| `deploy-agro.yaml` | Cloud Run `agro-sentinel` |
| `deploy-industry.yaml` | Cloud Run `industry-sentinel` |
| `deploy-personal.yaml` | Cloud Run `personal-sentinel` |
| `deploy-landing.yaml` | Cloudflare Pages |
| `deploy-terra-landing.yaml` | Cloud Run |

**Required GitHub Secrets**: `GCP_PROJECT_ID`, `GCP_CREDENTIALS`, and 6× `VITE_FIREBASE_*` secrets (for real auth builds).

## 🗺️ Roadmap: Ecosystem Integration

A core initiative for the next phase of the Cognitex Ecosystem is unifying the Sentinel platforms (`Industry`, `Personal`, and `Agro`) into a cohesive, interconnected experience.

Future milestones include:
1.  **Single Sign-On (SSO) & Centralized Identity**: Allowing users to securely navigate between dashboards with unified credentials.
2.  **Cross-Domain Data Correlation**: For example, correlating `Personal Sentinel` worker biometrics with `Industry Sentinel` factory zones or `Agro Sentinel` field operations.
3.  **Micro-Frontend Architecture**: Reusing React components and widgets across apps (e.g., displaying personnel alerts directly in the factory dashboard).
4.  **Unified Message Broker**: A central event bus (like MQTT/Redis) for real-time telemetry streaming across the entire suite.

---
© 2026 Cognitex Industrial. All inputs. All outputs. Optimized.
