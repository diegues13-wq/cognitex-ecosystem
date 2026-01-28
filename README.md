# Cognitex Industrial Ecosystem

This repository contains the source code for the Cognitex Industrial platform ecosystem, comprising the main landing page and the Sentinel suite of monitoring applications.

## Project Structure

This monorepo hosts the following applications:

*   **[cognitex-landing](./cognitex-landing)** (Port 5173)
    *   The central marketing and entry point for the platform.
    *   Features: "Neural Network" particle background, localized content, and product showcase.
*   **[industry-sentinel](./industry-sentinel)** (Port 5175/5179)
    *   **Theme**: Industrial Blue/Cyan.
    *   **Domain**: Smart Manufacturing & Predictive Maintenance.
    *   **Features**: OEE monitoring, vibration analysis, motor status.
*   **[personal-sentinel](./personal-sentinel)** (Port 5176)
    *   **Theme**: Safety Orange/Amber.
    *   **Domain**: EHS (Environment, Health, Safety) & Workforce Monitoring.
    *   **Features**: Biometrics, zone alerts, incident reporting.
*   **[agro-sentinel](./agro-sentinel)**
    *   **Theme**: Agriculture Green/Emerald.
    *   **Domain**: Precision Agriculture & IoT.

## Getting Started

1.  **Install Dependencies**: Navigate to each project folder and run `npm install`.
2.  **Development**: Run `npm run dev` in each folder to start the local servers.
3.  **Production**: Run `npm run build` to generate optimized assets.

## Recent Updates
*   **Unified Branding**: All platforms now use the new transparent "Cognitex" brain icon.
*   **Theming**: distinct color palettes established for each vertical (Cyan, Orange, Green).
*   **Performance**: Production builds verified for stability.

---
© 2026 Cognitex Industrial. All inputs. All outputs. Optimized.
