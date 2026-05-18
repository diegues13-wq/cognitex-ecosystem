# Personal Sentinel

**Personal Sentinel** is the workforce safety and EHS (Environmental Health & Safety) platform within the Cognitex Industrial Ecosystem. Real-time personnel monitoring for safety compliance in industrial environments.

## Features

- **Real-time Dashboard**: Live monitoring with interactive charts (Recharts)
- **Geospatial Visualization**: Zone tracking and geofencing via Leaflet
- **AI Chat Assistant**: Conversational AI for safety metrics queries
- **Biometrics Tracking**: Integration with wearable sensor data
- **Incident Reporting**: EHS compliance workflows
- **Theme**: Safety Orange / Amber

## Tech Stack

| Category | Technology | Version |
| :--- | :--- | :--- |
| UI Framework | React | 19 |
| Build Tool | Vite | 7.3.3 (pinned) |
| Styling | Tailwind CSS (PostCSS) | 4 |
| Charts | Recharts | 2 |
| Maps | Leaflet + React-Leaflet | 5.0.0 (pinned) |
| Auth / Backend | Firebase | 11 |
| Icons | Lucide React | 0.563 |
| Date Utilities | date-fns | 4 |

## Getting Started

### Prerequisites
- Node.js v20+
- npm v10+

### Installation
```bash
cd personal-sentinel
npm install
npm run dev
```

Runs on **port 5176** → [http://localhost:5176](http://localhost:5176)

### Authentication

The app uses dual-mode auth in `src/firebase.js`:

- **Mock mode** (default): Leave `VITE_FIREBASE_API_KEY` empty → auto-login as `Dev User`. No Firebase project needed.
- **Real mode**: Fill all `VITE_FIREBASE_*` vars → Firebase Email/Password auth.

```bash
cp .env.example .env
# Edit .env and add your Firebase config values
```

### Production Build
```bash
npm run build    # Output → dist/
npm run preview  # Preview production build locally
```

### Docker

```bash
# Mock auth (no credentials needed)
docker build -t personal-sentinel .
docker run -p 8080:8080 personal-sentinel

# Real Firebase auth
docker build \
  --build-arg VITE_FIREBASE_API_KEY=your_key \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com \
  --build-arg VITE_FIREBASE_PROJECT_ID=your_project_id \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id \
  --build-arg VITE_FIREBASE_APP_ID=your_app_id \
  -t personal-sentinel .
```

> Container listens on port **8080** (Cloud Run requirement).

## Production

**URL**: `https://personal-sentinel-myvq6twbpa-uk.a.run.app`  
**Platform**: Google Cloud Run (`cognitex-485919`, `us-east4`)  
**Deploy**: Automatic via GitHub Actions on push to `personal-sentinel/**` on `main`  
**Auth state**: Mock mode (real Firebase auth pending — see `docs/AI_HANDOVER.md`)

## License

Private property of Cognitex Industrial.
