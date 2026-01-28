# Agro-Sentinel

**Agro-Sentinel** is an industrial IoT platform for monitoring flower greenhouses in Ecuador. It leverages Edge Computing and Google Cloud Platform (GCP) to provide real-time insights, thermal analysis, and AI-driven queries.

## 🏗 Architecture

The project is divided into three main components:

1.  **`/edge`**: Python code running on the Greenhouse Gateway (Raspberry Pi/Industrial PC). Handles sensor polling (Modbus/Simulated), thermal image capture, and reliable MQTT transmission to the cloud.
2.  **`/cloud`**: Serverless backend on GCP.
    *   **Pub/Sub**: Data ingestion.
    *   **Cloud Functions**: ETL processing, alarm checks, and writing to BigQuery/Firestore.
    *   **BigQuery**: Historical data warehouse.
    *   **vertex AI**: Thermal image analysis and Chat-with-your-data.
3.  **`/web`**: React-based dashboard for real-time monitoring, historical charts, and AI interaction.

## 🚀 Getting Started

### Prerequisites
*   Python 3.10+
*   uv (gestor de paquetes)
*   Node.js 18+
*   Google Cloud SDK (gcloud)

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
(Note: Ensure `eslint.config.js` is present).

## 📄 License
Private property of Cognitex Industrial.
