# DRAGA AI Data Center & ORC Digital Twin — Web CAD & 3D Spatial Twin

An enterprise-grade Industrial Web CAD and 3D Digital Twin frontend for the **DRAGA AI Data Center & Rooftop Ammonia ORC Plant (Rayong Smart Industrial Park)**. Built with **Vue 3, TypeScript, Vite, Pinia, and Three.js**.

---

## 🚀 Key Features

* **2D Vector CAD Blueprint Engine:**
  * Interactive SVG viewport ($1920 \times 1080$) with 60 FPS Pan & Zoom, cursor coordinates, and architectural grids.
  * **4 Projection Views:** Side Section (vertical hydraulic flow), Top Plan (containment aisles), Front Elevation (compute facade), and Back Elevation (cooling infrastructure).
  * **5-Rai Site Plan Masterplan Overlay:** Visualizes the building footprint ($36\text{m} \times 24\text{m} = 864\text{ m}^2$) within an 5-Rai ($8,000\text{ m}^2$) plot (10.8% BCR) with directional markers (FRONT/SOUTH, BACK/NORTH, LEFT/WEST, RIGHT/EAST).
* **3D Spatial Twin Engine (Three.js WebGL2):**
  * 6-story building model (Ground Basin, Floors 1–4, and Rooftop ORC Deck).
  * 40 standalone liquid-cooled 42U AI server racks ($45\text{ kW}$ each).
  * Rooftop Ammonia ORC Nucleus (`HEX-R01` evaporator, `TB-R01` turbine, `CND-R01` condenser).
  * Animated central vertical risers (DN250) with hydraulic flow velocity shaders.
* **Phase 6 "The Sims" Interactive CRUD Studio:**
  * Real-time Raycasting with 1-meter floor snap-to-grid.
  * Cyan Ghost Wireframe bounding box preview following cursor.
  * One-click 3D placement with GSAP pop-in animations and instant RESTful sync to the .NET 8 backend.
* **High-Frequency Real-Time Telemetry & Control:**
  * 500ms bidirectional WebSocket stream (`ws://localhost:3001/ws/telemetry`).
  * Live gauges, thermal gradients, alarm thresholds, and Operator Override controls.
* **Internationalization (i18n):** Full bilingual support (Thai & English) with instant toggle.

---

## 🛠️ Tech Stack

* **Framework:** Vue 3 (Composition API, `<script setup>`)
* **Language:** TypeScript 5.x
* **Build Tool:** Vite
* **State Management:** Pinia
* **3D Graphics:** Three.js, WebGL2
* **Styling:** Vanilla CSS & Tailwind CSS
* **Icons:** Lucide Vue Next
* **Animation:** GSAP
* **i18n:** Vue I18n

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The application will be running at `http://localhost:5173`.

### 3. Build for Production
```bash
npm run build
```

---

## 🔌 Backend Integration

This frontend communicates directly with the **DRAGA .NET 8 Clean Architecture Backend** via:
* **REST API:** `http://localhost:3001/api` (handled via `DragaApiClient`)
* **WebSockets:** `ws://localhost:3001/ws/telemetry` (handled via `TelemetryWebSocketClient`)
