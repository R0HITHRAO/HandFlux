# HandFlux | Real-Time Hand-Controlled Visual Effects

> A browser-first real-time computer-vision visual effects installation driven by hand/finger tracking, procedural 3D geometry, custom GLSL shaders, and technical coordinate overlays.

---

## ðŸŒŸ Overview & Concept

**HandFlux** transforms a live webcam feed into an experimental computer-vision art installation. Rather than drawing generic skeletal landmarks, the application synthesizes:
- **Live screen-space coordinate tags** (`x: 655 y: 210`) attached to 21 tracked hand joints.
- **Thin guide lines & reticles** creating a technical instrumentation aesthetic.
- **Deformable procedural planes** with animated diagonal hatching and pink halftone dots.
- **Vibrant 3D polygon wedges and glowing cuboids** with inertia and velocity-based bloom.
- **GPU false-color thermal vision** and full-screen Gaussian blur transitions.
- **Massive multi-colored folded 3D architectural structures** that stretch and bank between both hands.
- **A large translucent lavender digital crystal prism** with dark purple structural edges and Fresnel glow.

---

## â±ï¸ 34-Second Reference Sequence Timeline

The application includes an automated **Reference Demo Mode** faithfully recreating the visual progression of the reference video:

| Time | Visual Effect State | Description |
| :--- | :--- | :--- |
| **0â€“4s** | `RECTANGLE_TRACKING` | Deformable quad between hands with animated blue/purple diagonal hatching & dotted pattern |
| **4â€“8s** | `TRIANGLE_EFFECT` | Floating purple/violet/pink triangular prisms attached to raised fingertips with inertia |
| **8â€“11s** | `GLOW_BLOCKS` | Luminous magenta emissive cube (right hand) + mint green cuboid (center/left hand) |
| **11â€“12.5s** | `BLUR_TRANSITION` | Fullscreen multi-tap Gaussian GPU camera blur transition |
| **12.5â€“14.5s** | `ANGULAR_OBJECT` | Multi-faceted vibrant polygonal prism attached to upper raised hand |
| **14.5â€“17.5s** | `THERMAL` | Fullscreen false-color thermal luminance mapper (black â†’ blue â†’ cyan â†’ green â†’ yellow â†’ orange â†’ magenta) |
| **17.5â€“22s** | `RECTANGLE_DOTS` | Dense pink/red procedural halftone dot matrix tracked between hands |
| **22â€“29s** | `LARGE_GEOMETRY` | Massive multi-colored folded 3D architectural structure spanning both hand anchors |
| **29â€“34s** | `PURPLE_PRISM` | Large translucent lavender crystal prism with dark violet structural edges and Fresnel glow |

---

## ðŸ› ï¸ Architecture & Technology Stack

```
[WEBCAM / SYNTHETIC FEED]
          â”‚
          â–¼
   [CAMERA MANAGER] (Aspect ratio preservation, 1280x720 60FPS target, mirrored)
          â”‚
          â–¼
[MEDIAPIPE HAND LANDMARKER] + [ONE-EURO TEMPORAL FILTER]
          â”‚
          â”œâ”€â”€â–º [GESTURE & VELOCITY ENGINE] (Pinch, span, angle, velocity)
          â”‚
          â”œâ”€â”€â–º [2D TECHNICAL HUD CANVAS]
          â”‚     - Dynamic x/y coordinate markers (`x: 655 y: 210`)
          â”‚     - Reticles, crosshairs, corner brackets, hand-to-hand span lines
          â”‚
          â””â”€â”€â–º [THREE.JS + CUSTOM GLSL SHADER PIPELINE]
                â”œâ”€â”€ Background Quad Pass (Normal / GPU Blur Transition / Thermal False-Color)
                â”œâ”€â”€ Tracked Dotted/Halftone Planes (Procedural GLSL hatching & dots)
                â”œâ”€â”€ Glowing Cuboids & Emissive Blocks (Magenta & mint green)
                â”œâ”€â”€ Purple/Pink Triangular Wedges & Angular Polygons
                â”œâ”€â”€ Large Multi-Colored Folded 3D Structure (Stretching between anchors)
                â””â”€â”€ Translucent Purple Crystal Prism (Lavender facets & violet edges)
```

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Vision Engine**: MediaPipe Tasks Vision (`@mediapipe/tasks-vision`) with 21-landmark tracking and OneEuroFilter jitter reduction.
- **3D Graphics & Shaders**: Three.js WebGL with custom GLSL shaders (Thermal, Halftone, Multi-tap Blur, Fresnel Glow).
- **Zero Backend**: 100% browser-based with zero external server or cloud dependencies.

---

## âŒ¨ï¸ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `1` | Trigger Opening Hatched Plane (0â€“4s) |
| `2` | Trigger Purple Triangular Wedges (4â€“8s) |
| `3` | Trigger Luminous Glowing Blocks (8â€“11s) |
| `4` | Toggle Thermal False-Color Vision (14.5â€“17.5s) |
| `5` | Trigger Pink Halftone Dotted Plane (17.5â€“22s) |
| `6` | Trigger Large Multi-Colored 3D Structure (22â€“29s) |
| `7` | Trigger Translucent Purple Crystal Prism (29â€“34s) |
| `D` | Toggle **Demo Mode** vs **Live Interactive Mode** |
| `S` | Toggle **Test Mode** (Simulated Hands) vs **Live Webcam** |
| `T` | Toggle Thermal Camera Shader |
| `B` | Trigger GPU Blur Transition |
| `H` | Toggle Technical HUD Overlay |
| `L` | Toggle Hand Landmarks Skeleton |
| `C` | Toggle Coordinate Tags (`x: y:`) |
| `G` | Toggle Tracking Guide Lines |
| `F` | Toggle Fullscreen |
| `SPACE` | Pause / Resume interaction |
| `R` | Reset state to initial tracking |
| `ESC` | Exit Fullscreen |

---

## ðŸš€ Quick Start & Development

### 1. Installation
```bash
cd C:\projects\pro3
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 3. Run Unit Tests
```bash
npm run test
```

### 4. Type-Check
```bash
npm run typecheck
```

### 5. Production Build
```bash
npm run build
```

---

## ðŸ“¸ Capture & Video Recording

- **`[ CAPTURE ]`**: Instantly captures the composited 3D WebGL render and 2D technical coordinate overlay as a high-resolution PNG image.
- **`[ RECORD ]` / `[ STOP ]`**: Utilizes the browser `MediaRecorder` API to record a 60 FPS video clip of the interactive canvas with instant local WebM download.

---

## ðŸ§ª Test & Simulation Mode

Don't have a webcam handy or testing in a container? Toggle **Test Mode (Simulation)** from the startup screen or press `S` in the app. The built-in synthetic trajectory engine animates natural 21-landmark hand motions, pinches, expansions, and gesture changes in real-time.
