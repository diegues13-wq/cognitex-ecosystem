# Agro-Sentinel

**Agro-Sentinel** is an industrial IoT platform for monitoring flower greenhouses in Ecuador. It leverages Edge Computing and Google Cloud Platform (GCP) to provide real-time insights, thermal analysis, and AI-driven queries.

## 🏗 Architecture

The project is divided into four main components:

1.  **`/edge`**: Python code running on the Greenhouse Gateway (Raspberry Pi/Industrial PC). Handles sensor polling (Modbus/Simulated), thermal image capture, and reliable MQTT transmission to the cloud.
2.  **`/cloud`**: Serverless backend on GCP.
    *   **Pub/Sub**: Data ingestion.
    *   **Cloud Functions**: ETL processing, alarm checks, and writing to BigQuery/Firestore.
    *   **BigQuery**: Historical data warehouse.
    *   **Vertex AI**: Thermal image analysis and Chat-with-your-data.
3.  **`/web`**: React-based dashboard for real-time monitoring, historical charts, and AI interaction.
4.  **`/terraform`**: Infrastructure-as-Code for GCP resource provisioning.

### Web Dashboard Tech Stack

| Category | Technology | Version |
| :--- | :--- | :--- |
| **UI Framework** | React | 19 |
| **Build Tool** | Vite | 7 |
| **Styling** | Tailwind CSS (PostCSS) | 4 |
| **Charts** | Recharts | 2 |
| **Maps** | Leaflet + React-Leaflet | 5 |
| **Backend** | Firebase | 11 |
| **Icons** | Lucide React | 0.563 |
| **Date Utilities** | date-fns | 4 |

## 🚀 Getting Started

### Prerequisites
*   Python 3.10+
*   uv (Python package manager)
*   Node.js v20+
*   npm v10+
*   Google Cloud SDK (gcloud) — for cloud deployment

### Setup
1.  **Edge**:
    ```bash
    cd edge
    uv venv
    source .venv/bin/activate
    uv pip install -r requirements.txt
    ```
2.  **Cloud**:
    ```bash
    cd cloud
    uv venv
    source .venv/bin/activate
    uv pip install -r requirements.txt
    ```
3.  **Web**:
    ```bash
    cd web
    npm install
    npm run dev
    ```

The web dashboard will be available at [http://localhost:5174](http://localhost:5174).

### 🔐 Access & Credentials

Runs in **mock auth mode** when `VITE_FIREBASE_API_KEY` is unset — it auto-logs in
as `dev@local` / "Dev User" with no password. There is no default `admin` account.
See `docs/ARCHITECTURE.md` § Authentication.

## 🛠 Development & Testing

### 1. Cloud (`/cloud`)
Run unit tests with mocks (no GCP credentials required):
```bash
cd cloud
export USE_MOCK_GCP=true
python test_local.py
python test_thermal.py
```
Linting:
```bash
ruff check .
```

### 2. Edge (`/edge`)
Run simulator tests:
```bash
cd edge
python test_simulator.py
```
Linting:
```bash
ruff check .
```

### 3. Web (`/web`)
Run ESLint:
```bash
cd web
npm run lint
```

### 🐳 Docker (Web only)
```bash
cd web
docker build -t agro-sentinel-web .
docker run -p 5174:8080 agro-sentinel-web
```

## 📚 Additional Documentation
*   [Production Deployment Guide](./PRODUCTION.md) — Full instructions for deploying Edge, Cloud, and Web components.

## 📄 License
Private property of Cognitex Industrial.
