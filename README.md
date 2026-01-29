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

## 🏁 Getting Started

### Prerequisites
*   Node.js v20+
*   npm v10+

### Installation
```bash
# Install dependencies for all projects
cd cognitex-landing && npm install && cd ..
cd industry-sentinel && npm install && cd ..
cd personal-sentinel && npm install && cd ..
cd agro-sentinel/web && npm install && cd ../..
```

### Development
Currently, you can run each project individually (monorepo orchestration coming soon).

```bash
# Run Landing Page
cd cognitex-landing && npm run dev

# Run Industry Sentinel
cd industry-sentinel && npm run dev
```

---
© 2026 Cognitex Industrial. All inputs. All outputs. Optimized.
