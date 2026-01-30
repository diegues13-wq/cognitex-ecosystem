# Implementation Plan: Cognitex Ecosystem (Phase 2 - Backend)

This plan outlines the transition from a static frontend demo to a fully functional AI-powered ecosystem on Google Cloud Platform.

## 🥅 Goal
Connect the existing React frontends to a robust serverless backend on Google Cloud, powered by **Vertex AI (Gemini)** for intelligence and **Firestore** for data persistence.

## 🏗️ Architecture Status

| Component | Status | Hosting | Branch |
| :--- | :--- | :--- | :--- |
| **Frontend (Prod)** | ✅ Live | Cloudflare Pages | `main` |
| **Frontend (Beta)** | ✅ Live | Cloudflare Pages | `gc` |
| **Backend API** | 🚧 Planned | Cloud Run | `gc` |
| **Database** | 🚧 Planned | Firestore | `gc` |
| **AI Engine** | 🚧 Planned | Vertex AI | `gc` |

## 📅 Roadmap (Remaining Steps)

### 1. Infrastructure Setup (Current Step)
-   [x] Create GCP Project & Enable APIs.
-   [ ] Create Artifact Registry (`cognitex-repo`).
-   [ ] Create Service Account (`github-deployer`).
-   [ ] **Validation**: Push a "Hello World" container to Artifact Registry via GitHub Actions.

### 2. Backend Implementation (`gc` branch)
-   [ ] Initialize Python/FastAPI backend structure in `cognitex-ecosystem`.
-   [ ] Implement **Authentication** (Firebase Auth or similar).
-   [ ] Implement **Gemini Integration** (Vertex AI SDK).
-   [ ] Create Dockerfile for Backend.

### 3. Frontend Integration
-   [ ] Update React apps to call the new Backend API URL.
-   [ ] Test interactions in the **Beta Environment** (`beta.cognitexindustrial.com`).

### 4. Production Release
-   [ ] Merge `gc` -> `main`.
-   [ ] Switch API endpoints to Production.

## 🛠️ Technical Details

### Cloud Run Service
-   Single container handling API requests.
-   Auto-scaling (0 to N).
-   Region: `us-central1`.

### Data Models (Firestore)
-   **Users**: Profile, Role, Subscription Tier.
-   **Sensors**: ID, Type, Real-time Data Stream.
-   **AI_Chats**: History of conversations with Sentinels.

## 🧪 Verification Plan
-   **Unit Tests**: Local Pytest for API logic.
-   **Integration Tests**: GitHub Actions deployment to Cloud Run (Preview).
-   **E2E Tests**: Manual verification on `beta` domains.
