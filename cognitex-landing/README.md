# Cognitex Landing

**Cognitex Landing** is the central marketing and entry hub for the Cognitex Industrial Ecosystem. It serves as the primary gateway for users to discover and access the various Sentinel platforms.

## 🌟 Features

*   **Central Hub**: Unified entry point showcasing all Sentinel applications.
*   **Interactive Ecosystem**: Visual navigator for exploring platform capabilities.
*   **Contact Modal**: Integrated lead capture for B2B inquiries.
*   **Theme**: Neural network aesthetics — the "Brain" of the ecosystem.

## 🛠️ Tech Stack

| Category | Technology | Version |
| :--- | :--- | :--- |
| **UI Framework** | React | 19 |
| **Build Tool** | Vite | 7 |
| **Styling** | Tailwind CSS (PostCSS) | 4 |
| **Animations** | Framer Motion | 12 |
| **Icons** | Lucide React | 0.563 |
| **Maps** | React Leaflet | **5.0.0-rc.2** |

> **This app has not been migrated to the shared packages.** The six Sentinel
> platforms are TypeScript workspaces built on `@cognitex/{config,theme,auth,data,ui}`;
> this one keeps its own JavaScript sources, its own Tailwind and PostCSS
> config, and its own dependency tree. Two of those dependencies are
> deliberately excluded from the platforms: `react-leaflet` at a release
> candidate (RCs export `LeafletProvider` instead of `LeafletContext`), and the
> translucent panels that blur their backdrop, which raised SIGILL on older
> CPUs. See [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) §3 and §7.

## 🚀 Getting Started

### Prerequisites
*   Node.js v20+
*   npm v10+

### Installation

It is **not** an npm workspace member, so it installs on its own rather than
from the repository root:

```bash
cd cognitex-landing
npm install
npm run dev
```

The application will be available at [http://localhost:5173](http://localhost:5173).

### Production Build
```bash
npm run build    # Output in dist/
npm run preview  # Preview the production build
```

### 🐳 Docker

Unlike the Sentinel platforms, this image builds from its own directory and
listens on port **80**, not 8080 — nothing deploys it, so the Cloud Run port
requirement does not apply.

```bash
docker build -t cognitex-landing .
docker run -p 5173:80 cognitex-landing
```

## ☁️ Deployment

**GitHub Pages**, via `.github/workflows/deploy-landing.yaml` on pushes to
`main` touching `cognitex-landing/**`. The workflow runs `npm install` and
`npm run build` in this directory and uploads `dist/` as a Pages artifact. It
does not use the Dockerfile and does not touch the workspace.

The only build-time variable is `VITE_WEB3FORMS_ACCESS_KEY`, used by the
contact modal (see `.env.example`).

## 📄 License

Private property of Cognitex Industrial.
