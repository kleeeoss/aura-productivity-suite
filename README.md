<div align="center">

  <img src="./assets/icon.png" alt="AURA Logo" width="128" style="border-radius: 24px;" />

  # AURA
  ### *The Glassmorphic Desktop Productivity Suite & Multiverse Visual Engine*

  [![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
  [![Tauri v2](https://img.shields.io/badge/Tauri_v2-24C8D8?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Electron](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg?style=for-the-badge)](./LICENSE)

  **A modern, hyper-focused desktop productivity suite crafted with frosted glassmorphism, mathematical audio synthesis, a connected productivity loop, and the revolutionary Multiverse Visual Engine.**

  [Downloads](#-downloads--installation) • [Multiverse Visual Engine](#-multiverse-visual-engine) • [The Vibe Coding Story](#-the-vibe-coding-case-study) • [Features](#-features) • [Architecture](#-desktop-architecture-matrix) • [Local Development](#-local-development)

</div>

---

<div align="center">
  <img src="./screenshots/technical-blueprint.png" alt="AURA Technical Blueprint HUD" width="100%" style="border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,0.4);" />
</div>

---

## ⚡ Downloads & Installation

AURA is available as an ultra-lightweight native Windows executable built on **Tauri v2** using native OS WebView2 (under 10 MB bundle size, instant startup, minimal RAM).

👉 **[Download the Latest Windows Release (v1.1.1)](https://github.com/kleeeoss/aura-productivity-suite/releases/latest)**

| Asset | Format | Description |
| :--- | :--- | :--- |
| **[`AURA_1.1.1_x64-setup.exe`](https://github.com/kleeeoss/aura-productivity-suite/releases/download/v1.1.1/AURA_1.1.1_x64-setup.exe)** | NSIS Installer | **Recommended.** Windows installer with desktop and start menu shortcuts. |
| **[`AURA_standalone.exe`](https://github.com/kleeeoss/aura-productivity-suite/releases/download/v1.1.1/AURA_standalone.exe)** | Portable | Zero-install portable binary. Run directly from anywhere or a USB drive. |

---

## 🌌 Multiverse Visual Engine

AURA v1.1.1 introduces the **Multiverse Visual Engine**—a fundamental shift away from cosmetic color swaps into **complete architectural worldbuilding**. Every theme is a cohesive environment structured across **10 orthogonal design dimensions** and an expressive **4-tier typography hierarchy**.

### 📐 The 10 Orthogonal Dimensions

| # | Dimension | Role & Implementation |
| :-: | :--- | :--- |
| **1** | **Theme World** | Overarching artistic philosophy, lineage, and emotional atmosphere. |
| **2** | **Typography System** | 4-tier functional typographic roles: Display, Body, Data/Mono, and Accent/Kicker. |
| **3** | **Component Shapes** | Distinct silhouette geometry: 0px razor chamfers, 14px cockpit rounds, to `18px 6px` asymmetric wabi-sabi pebbles. |
| **4** | **Borders & Linework** | Aerospace 1px hairlines, 1px dashed cyan CAD guidelines, 2px stepped pixel borders, or 3px pitch-black borders. |
| **5** | **Shadows & Depth** | Refractive frosted glass blurs, physical 4px offset sticker shadows, CRT phosphor glow, to zero-shadow flat linen. |
| **6** | **Surfaces & Textures** | Authentic material overlays: CRT scanlines, CAD coordinate millimeter grids, book linen, and Game Boy dot matrices. |
| **7** | **Spacing & Density** | Calibrated information density: compact telemetry cockpits, balanced desks, and expansive reading broadsheets. |
| **8** | **Motion Dynamics** | Custom physics: instant 0ms VT220 steps, 60ms 2-frame chiptune steps, snappy 100ms brutalist snaps, to 400ms gentle easing. |
| **9** | **Interaction Feedback** | Tactile visual responses: physical button depressions (`translate(2px, 2px)`), phosphor blooming, and laser edge illuminates. |
| **10** | **Telemetry & Progress** | Bespoke geometric progress visualizations adapted to each theme world's mechanical personality. |

---

### 🪐 Canonical Theme Worlds

<div align="center">

| **Terminal / Cyber-CLI 1984** | **Neo-Brutalist Studio** |
| :---: | :---: |
| <img src="./screenshots/cyber-cli.png" alt="Terminal / Cyber-CLI 1984" width="460" style="border-radius: 8px;" /> | <img src="./screenshots/neo-brutalist.png" alt="Neo-Brutalist Studio" width="460" style="border-radius: 8px;" /> |
| *VT220 Distraction-Free Console • Phosphor CRT glow • ASCII linework • 0ms instant steps* | *High-Contrast Tactile Poster • 3px solid black borders • Physical 4px offset drop-shadows* |

| **Editorial Broadsheet** | **8-Bit Arcade** |
| :---: | :---: |
| <img src="./screenshots/editorial-broadsheet.png" alt="Editorial Broadsheet" width="460" style="border-radius: 8px;" /> | <img src="./screenshots/8bit-arcade.png" alt="8-Bit Arcade" width="460" style="border-radius: 8px;" /> |
| *Antique Literary Sanctuary • Delicate ink rules • Cream linen texture • Serif typography* | *Microcomputer Nostalgia • Game Boy 4-shade green • Stepped pixel borders • Chiptune vitality* |

| **Zen Botanical** | **Obsidian Monolith** |
| :---: | :---: |
| <img src="./screenshots/zen-botanical.png" alt="Zen Botanical" width="460" style="border-radius: 8px;" /> | <img src="./screenshots/obsidian-monolith.png" alt="Obsidian Monolith" width="460" style="border-radius: 8px;" /> |
| *Wabi-Sabi Meditative Sanctuary • Earthy matcha & stone • Asymmetric pebble geometry* | *Neo-Noir OLED Cockpit • Pure #000000 black • Stealth zero-eye-strain nocturnal laser edges* |

</div>

- **🛸 Translucent Cockpit**: Aerospace Flight HUD with glassmorphic deep-slate acrylics, Space Grotesk display typography, aerospace telemetry halos, and circular HUD arcs.
- **📐 Technical Blueprint**: CAD Draftsman Workstation featuring millimeter coordinate grids, cyan dashed borders, registration crosshairs, and engineering caliper telemetry (`CAL-065mm`).

---

### 🔤 4-Tier Typographic Hierarchy

AURA separates typography into four purposeful roles:
1. **Display Font**: Hero emblems, window titles, and view headers (e.g. *Archivo Black*, *Fraunces*, *Space Grotesk*, *VT323*, *Press Start 2P*).
2. **Body Font**: Long-form readability for notes, reflections, and task descriptions (e.g. *Inter*, *Merriweather*, *Plus Jakarta Sans*, *Fira Code*).
3. **Data / Mono Font**: Tabular numbers, timestamps, countdown clocks, and telemetry figures (e.g. *JetBrains Mono*, *Space Mono*, *Fira Code*).
4. **Accent / Kicker Font**: Subheadings, category badges, keyboard shortcuts, and button kickers.

---

### ⏱️ Theme-Adaptive Focus & Telemetry

When working in the Focus Suite, your Pomodoro countdown progress automatically mirrors the mechanical personality of your active theme world:

- **Cyber-CLI**: Monospaced ASCII bracket meters `[██████░░░░] 60%`.
- **Neo-Brutalist**: Tactile 10-segment physical blocks with active fill.
- **8-Bit Arcade**: Retro video game health & XP bars `HP: [♥♥♥♡♡] 60%`.
- **Technical Blueprint**: Precision drafting caliper readouts `CAL-065mm`.
- **Obsidian Monolith**: Pulsing OLED laser rings.
- **Editorial Broadsheet**: Flowing ink sweeps.
- **Zen Botanical**: Concentric water basin ripples.
- **Translucent Cockpit**: Aerospace HUD orbital arcs.

---

## 🤖 The "Vibe Coding" Case Study

AURA is an honest, transparent case study in modern **spec-driven AI pair engineering** (colloquially known as *"vibe coding"*). 

Rather than a toy prototype generated in one prompt on a random afternoon, AURA was built through disciplined engineering iterations between:
- **Human Technical Director & Product Architect** (Prompting, high-level architecture decisions, quality assurance, manual edge-case hunting, user experience direction).
- **Gemini** (Autonomous implementation, code generation, refactoring, systems integration, build toolchain configuration).

### 🔍 Highlights from the Engineering Trenches:
1. **The Background Timer Drift Bug**: When minimized while coding or studying in Obsidian, Chromium and Windows aggressively throttle `setInterval`. A naive timer lost 90% of time. We refactored `useTimer.ts` into a **Timestamp Delta-Time Architecture** using `Date.now()` anchors to preserve microsecond accuracy regardless of window state.
2. **From Electron to Tauri**: When Electron's 150MB bundle and memory footprint proved too heavy for a background companion app, we pivoted to **Rust / Tauri v2**, shrinking the binary size down to under 10MB while maintaining a shared web codebase.
3. **Procedural Web Audio Synthesis**: Replaced flat audio recordings with real-time mathematical noise generators (White, Pink, and Brownian noise) calculated directly through the Web Audio API.
4. **Responsive Transform Matrix**: Solved CSS viewport clipping and whitespace bugs across scaling levels (80% to 150%) via an anchored `transform: scale()` matrix.
5. **The Multiverse Visual Engine**: Evolved basic CSS styling into a comprehensive 10-dimension architectural matrix supporting 8 distinct canonical worlds with bespoke typography, surfaces, and telemetry.

📖 **[Read the complete engineering changelog in `iterations.md`](./iterations.md)**

---

## ✨ Features

### 🏠 Home Dashboard
- **Live Clock & Date**: Real-time localized time tracking.
- **Weather Widget**: Temperature, condition, humidity, wind speed, sunrise/sunset with automated IP geolocation and instant timeout fallback.
- **Daily Calendar**: Interactive calendar view with date selection.
- **Productivity Score**: Dynamic algorithm scoring your daily task completion, focus sessions, and habits.
- **Recent Activity Feed**: Central event stream updating whenever work is logged anywhere in the application.
- **Motivational Engine**: Dynamic quotes that refresh across tabs.

### ⏱️ Focus Suite (Pomodoro)
- **State-Persistent Timer**: Work, Short Break, and Long Break intervals that persist smoothly across tab navigation.
- **Background Drift Immunity**: Uses real-world timestamp deltas so timers never pause when AURA is out of focus.
- **Theme-Adaptive Telemetry**: Progress rings, ASCII brackets, caliper gauges, and 8-bit health bars that match your visual world.
- **Distraction-Free Focus Mode**: Fullscreen ambient mode with smooth backdrop dimming.
- **Interactive Audio Visualizer**: Live HTML5 Canvas waveform reacting to focus sessions.

### 🎵 Media & Sound Suite
- **Embedded Media Player**: Paste any **Spotify** playlist/track URL or **YouTube** video/stream link to load a clean, integrated web player directly inside AURA.
- **Noise Generators**: Web Audio API procedural synthesis with individual volume sliders:
  - ⚪ **White Noise** (Uniform spectrum for noise cancellation)
  - 🌸 **Pink Noise** (Balanced 1/f falloff for reading & writing)
  - 🟤 **Brownian Noise** (Deep, low-frequency rumble for relaxation)

### 🪐 Focus Spaces (Context Presets)
- **Deep Code**: 50m hyperfocus sprint with deep brown noise, Midnight dark theme, and coding category logging.
- **Study Sprint**: 25m classic Pomodoro with balanced white noise in serene forest theme.
- **Flow / Writing**: 45m distraction-free writing session with soft pink noise in minimalist theme.
- **Instant Switching**: Toggle spaces in 1-click via the header pill or global shortcuts (`Ctrl+1`, `Ctrl+2`, `Ctrl+3`).

### 🔄 The Connected Productivity Loop
- **Task-Linked Focus**: Link active tasks directly to the Focus Timer; track cumulative focus minutes per task.
- **Post-Session Reflection**: 1-click completion prompts and quick reflection capture that automatically appends to today's Journal without leaving your flow.
- **Real Analytics Engine**: Replaced all demo data with true persisted aggregations: real 90-day heatmaps, weekly trend charts, and actual category distributions.
- **Modular Dashboard**: Customize card visibility and vertical ordering (Clock, Weather, Score, Habits, Tasks, Activity, Quotes) to build your ideal command center.

### 📋 Productivity Modules
- **Tasks**: Kanban-style task tracker with categories, priority tags, and focus time tracking.
- **Notes**: Instant Markdown editor with live preview and local persistence.
- **Habits**: Daily habit tracker with calendar-accurate streak calculation and achievement unlocks.
- **Journal**: Daily reflection log with mood ratings and quick session recaps.
- **Statistics**: Real focus time breakdowns, category analytics, and 90-day activity heatmaps.

### 🎨 Personalization & Accessibility
- **8 Canonical Theme Worlds**: Translucent Cockpit, Cyber-CLI 1984, Neo-Brutalist Studio, Editorial Broadsheet, Technical Blueprint, 8-Bit Arcade, Obsidian Monolith, and Zen Botanical.
- **10-Dimension Visual Matrix**: Inspect live font specimens, border metrics, tactile button states, and progress telemetry directly in Settings.
- **UI Scaling Slider**: Seamlessly scale the entire interface from **80% to 150%** without layout distortion.
- **Accessibility Toggles**: Reduce Motion and Disable Animations for low-spec machines.
- **Defensive Data Portability**: Full JSON database export and schema-validated backup import.

---

## 🏛️ Desktop Architecture Matrix

AURA is configured with a unified 3-tier build matrix allowing it to compile into any target from a single repository:

| Feature | ⚡ Tauri v2 (Primary) | 🌐 Web (Vite SPA) | ⚛️ Electron |
| :--- | :--- | :--- | :--- |
| **Output Location** | `Builds/Tauri/` | `Builds/Web/` | `Builds/Electron/` |
| **Bundle Size** | **~5 – 10 MB** | ~1 MB | ~150 MB |
| **RAM Footprint** | **~40 – 70 MB** | Dependent on Browser | ~180 – 250 MB |
| **Engine** | Native Edge WebView2 + Rust | Standard Browser | Bundled Chromium + Node.js |
| **Installer** | NSIS Setup & Standalone | N/A (Static hosting) | NSIS Setup & Portable |

---

## 💻 Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust & Cargo](https://www.rust-lang.org/tools/install) (required only if building the Tauri desktop app)

### Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/kleeeoss/aura-productivity-suite.git
   cd aura-productivity-suite
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start local web dev server**:
   ```bash
   npm run dev
   ```

4. **Launch with Tauri (Desktop Development)**:
   ```bash
   npm run tauri dev
   ```

5. **Run Quality Gate Lint**:
   ```bash
   npm run lint
   ```

6. **Run Automated Test Suite**:
   ```bash
   npm test
   ```

7. **Verify Version Consistency**:
   ```bash
   npm run verify-version
   ```

### Building Releases
```bash
# Build the Web SPA (outputs to Builds/Web)
npm run dist:web

# Build the Tauri Windows Installer & Standalone (outputs to Builds/Tauri)
npm run dist:tauri

# Build the Electron executable (outputs to Builds/Electron)
npm run dist:electron

# Build all targets sequentially
npm run dist:all
```

---

## 🤝 Contributing & Bug Reports

Contributions, feature suggestions, and bug reports are warmly welcome!

- Found a bug or glitch? Feel free to [open an issue](https://github.com/kleeeoss/aura-productivity-suite/issues).
- Have an idea for a new widget or ambient generator? Start a discussion or submit a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.
