# Cognitex Industrial Ecosystem

The **Cognitex Industrial Ecosystem** is a unified suite of next-generation monitoring platforms powered by AI and IIoT (Industrial Internet of Things).

## 🚀 Platforms

This monorepo hosts the following integrated applications:

### 1. [Cognitex Landing](./cognitex-landing) (Port 5173)
*   **Role**: Central Marketing & Entry Hub.
*   **Tech**: React 19, Tailwind 4, Vite 7.
*   **Identity**: The "Brain" of the ecosystem. Neural network aesthetics.

### 2. [Industry Sentinel](./industry-sentinel) (Port 5175)
*   **Role**: Smart Manufacturing & Predictive Maintenance.
*   **Domain**: Factory floors, production lines, OEE monitoring.
*   **Theme**: **Cyan/Industrial Blue**.
*   **Tech**: React 19, Vite 7, Tailwind 4.

### 3. [Personal Sentinel](./personal-sentinel) (Port 5176)
*   **Role**: Workforce Safety & EHS.
*   **Domain**: Biometrics tracking, zone alerts, incident reporting.
*   **Theme**: **Safety Orange/Amber**.
*   **Tech**: React 19, Vite 7, Tailwind 4.

### 4. [Agro Sentinel](./agro-sentinel) (Port 5174)
*   **Role**: Precision Agriculture.
*   **Domain**: Soil monitoring, drone telemetry, crop health.
*   **Theme**: **Emerald/Green**.
*   **Tech**: React 19, Vite 7, Tailwind 4, Python (IoT Edge).


---

## 🛠️ Technology Stack
We utilize the bleeding edge of web development:
*   **Frontend**: React 19 + Vite 7
*   **Styling**: Tailwind CSS v4 (Oxide engine)
*   **Languages**: JavaScript (ESM), Python (AI/IoT Backend)

> [!IMPORTANT]
> **Python Management**: We strictly use [uv](https://github.com/astral-sh/uv) (An extremely fast Python package installer and resolver, written in Rust) instead of pip/venv.

## 🔐 Access & Credentials
| Platform | URL | Default User | Default Password |
| :--- | :--- | :--- | :--- |
| **Industry Sentinel** | [http://localhost:5175](http://localhost:5175) | `admin` | `admin` |
| **Personal Sentinel** | [http://localhost:5176](http://localhost:5176) | `admin` | `admin` |
| **Agro Sentinel** | [http://localhost:5174](http://localhost:5174) | `admin` | `admin` |

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
Currently, you can run each project individually (monorepo orchestration coming soon).

```bash
# Run Landing Page
cd cognitex-landing && npm run dev

# Run Industry Sentinel
cd industry-sentinel && npm run dev
```

### 🐳 Production Deployment (Docker)
You can run the entire ecosystem in production mode using Docker Compose.
**Note**: Ensure [Docker](https://docs.docker.com/get-docker/) is installed and running on your machine.

```bash
# Build and Start all platforms
docker compose up --build -d

# Verify containers are running
docker-compose ps
```

The applications will be available at the same ports:
*   **Landing**: http://localhost:5173
*   **Industry**: http://localhost:5175
*   **Personal**: http://localhost:5176
*   **Agro**: http://localhost:5174

## 🗺️ Roadmap: Ecosystem Integration

A core initiative for the next phase of the Cognitex Ecosystem is unifying the Sentinel platforms (`Industry`, `Personal`, and `Agro`) into a cohesive, interconnected experience. 

Future milestones include:
1.  **Single Sign-On (SSO) & Centralized Identity**: Allowing users to securely navigate between dashboards with unified credentials.
2.  **Cross-Domain Data Correlation**: For example, correlating `Personal Sentinel` worker biometrics with `Industry Sentinel` factory zones or `Agro Sentinel` field operations.
3.  **Micro-Frontend Architecture**: Reusing React components and widgets across apps (e.g., displaying personnel alerts directly in the factory dashboard).
4.  **Unified Message Broker**: A central event bus (like MQTT/Redis) for real-time telemetry streaming across the entire suite.

---
© 2026 Cognitex Industrial. All inputs. All outputs. Optimized.
