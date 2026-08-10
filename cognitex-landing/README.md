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
| **Maps** | React Leaflet | 5 |

## 🚀 Getting Started

### Prerequisites
*   Node.js v20+
*   npm v10+

### Installation
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
```bash
docker build -t cognitex-landing .
docker run -p 5173:80 cognitex-landing
```

## 📄 License

Private property of Cognitex Industrial.
