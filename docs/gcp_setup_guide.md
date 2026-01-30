# Google Cloud Setup Guide (Cognitex Ecosystem)

This guide walks you through configuring Google Cloud Platform (GCP) to host the backend services for Cognitex. We will set up **Cloud Run** (hosting), **Firestore** (database), and **Vertex AI** (intelligence).

> [!IMPORTANT]
> **Prerequisite**: You must have a Google Cloud account with billing enabled (free tier is fine to start).

---

## ☁️ 1. Create a Project
1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Click the project dropdown (top left).
3.  **New Project**:
    *   **Name**: `cognitex-platform` (or similar).
    *   **Organization**: (Leave as "No organization" if personal).
4.  Click **Create** and wait a moment.
5.  **Select** the new project.
6.  **Copy your Project ID** (e.g., `cognitex-platform-12345`). You will need this later.

---

## 🛠️ 2. Enable Services (APIs)
We need to "turn on" the specific features we will use.
1.  Open **Cloud Shell** (Icon in the top right header `>_`).
2.  Paste and run this command (Authorize if asked):

```bash
gcloud services enable \
  artifactregistry.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  firestore.googleapis.com \
  aiplatform.googleapis.com \
  secretmanager.googleapis.com
```
*   `artifactregistry`: Stores our Docker images.
*   `run`: Runs the apps.
*   `cloudbuild`: Builds the apps (optional backup).
*   `firestore`: NoSQL Database.
*   `aiplatform`: Vertex AI (Gemini).

---

## 📦 3. Create Artifact Registry
This is where our code lives after GitHub builds it.
1.  Search for **Artifact Registry** in the console.
2.  Click **Create Repository**.
    *   **Name**: `cognitex-repo`
    *   **Format**: **Docker** (Standard)
    *   **Mode**: Standard
    *   **Region**: `us-central1` (Iowa) - *Recommended for cost/latency balance.*
3.  Click **Create**.

---

## 🔥 4. Initialize Firestore Database
1.  Search for **Firestore**.
2.  Click **Create Database**.
3.  **Select Mode**: **Native Mode** (Recommended for web apps).
4.  **Configuration**:
    *   **Location**: `nam5` (United States) or match your region (`us-central1`).
5.  **Rules**: Start in **Production mode** (We will update rules later).
6.  Click **Create**.

---

## 🤖 5. Create Service Account (GitHub Deployer)
This "Robot User" allows GitHub to push updates automatically.
1.  Go to **IAM & Admin** > **Service Accounts**.
2.  **Create Service Account**:
    *   **Name**: `github-deployer`
    *   **Description**: "Deploys Cognitex to Cloud Run"
3.  **Grant Access (Roles)** - *Search and add these exactly*:
    *   `Cloud Run Admin`
    *   `Service Account User`
    *   `Artifact Registry Writer`
    *   `Firestore Service Agent` (Optional, helpful for future migration)
    *   `Vertex AI User`
4.  Click **Done**.
5.  **Generate Key**:
    *   Click the three dots `...` next to `github-deployer` -> **Manage keys**.
    *   **Add Key** -> **Create new key**.
    *   Type: **JSON**.
    *   **Create**. (A file will download. **KEEP THIS FILE SAFE**).

---

## 🔐 6. Connect to GitHub
Finally, link this GCP project to your GitHub repository.
1.  Go to your GitHub Repo: `cognitex-ecosystem`.
2.  **Settings** > **Secrets and variables** > **Actions**.
3.  **New Repository Secret**:
    *   Name: `GCP_PROJECT_ID`
    *   Value: `cognitex-platform-12345` (Your Project ID from Step 1).
4.  **New Repository Secret**:
    *   Name: `GCP_CREDENTIALS`
    *   Value: (Open the JSON file from Step 5, copy EVERYTHING, and paste it here).

---

## ✅ Verification
Once completed, tell me "GCP setup done". I will then configure our `docker-compose` and Terraform scripts to match these credentials.
