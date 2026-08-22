# 🖐️ HandFlux

> **Real-Time Hand-Controlled Visual Effects & Interactive Computer Vision Installation**

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r170-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Tasks%20Vision-0078D4?style=for-the-badge&logo=google&logoColor=white)](https://developers.google.com/mediapipe)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-14%2F14%20Passing-brightgreen?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

A browser-first real-time computer-vision visual effects application that composites procedural 3D geometry, custom GLSL shaders (false-color thermal, halftone dots, blur transitions, glowing prisms), and technical coordinate overlays onto a mirrored live webcam feed driven by MediaPipe 21-landmark hand tracking.

---

## 🌟 Key Visual Features

- **Live Hand & Finger Tracking**: 21 3D landmarks per hand with **OneEuroFilter** dynamic temporal smoothing for jitter-free tracking.
- **Technical Coordinate HUD**: Real-time `x: 655 y: 210` coordinate readouts, crosshairs, and hand-to-hand span guide lines.
- **34s Automated Reference Demo**: Faithful recreation of the reference video sequence.
- **Interactive Live Mode**: Dynamic 3D geometry and shaders reacting to hand movement, span, and velocity.
- **GPU Shaders**: Real-time false-color thermal vision, multi-tap Gaussian blur transitions, procedural halftone dot matrices, and Fresnel glows.
- **Synthetic Hands (Test Mode)**: Built-in simulation mode allowing full hands-free evaluation without requiring a camera.
- **Capture & Recording**: Built-in 60 FPS `MediaRecorder` video recording and high-res PNG snapshot exporter.

---

## ⏱️ 34-Second Reference Sequence Timeline

| Timeline | Visual Effect State | Description | Primary Colors |
| :---: | :--- | :--- | :--- |
| **0 – 4s** | `RECTANGLE_TRACKING` | Deformable quad between hands with animated diagonal hatching & dotted pattern | Cyan `#00d2ff`, Violet `#b829ea` |
| **4 – 8s** | `TRIANGLE_EFFECT` | Floating elongated purple/pink triangular prisms attached to fingertips with inertia | Purple `#9333ea`, Magenta `#ff00ff` |
| **8 – 11s** | `GLOW_BLOCKS` | Luminous magenta emissive cube (right hand) + mint-green cuboid (center/left hand) | Neon Pink `#ff007f`, Mint `#00ff88` |
| **11 – 12.5s** | `BLUR_TRANSITION` | Fullscreen multi-tap Gaussian GPU camera blur transition | Full spectrum blur |
| **12.5 – 14.5s** | `ANGULAR_OBJECT` | Multi-faceted vibrant polygonal prism attached to upper raised hands | Cyan, Green, Yellow, Magenta |
| **14.5 – 17.5s** | `THERMAL` | GPU false-color thermal vision shader (Black → Blue → Cyan → Green → Yellow → Orange → Magenta) | Electric False-Color |
| **17.5 – 22s** | `RECTANGLE_DOTS` | Dense pink/red procedural halftone dot matrix tracked between hands | Hot Pink `#ff2d55`, Crimson |
| **22 – 29s** | `LARGE_GEOMETRY` | Massive multi-colored folded 3D architectural structure spanning both hand anchors | Full Geometric Palette |
| **29 – 34s** | `PURPLE_PRISM` | Large translucent lavender crystal prism with dark structural edges and Fresnel glow | Lavender `#c084fc`, Deep Violet |

---

## 🏗️ Architecture

```
                    [ WEBCAM / TEST SIMULATION FEED ]
                                   │
                                   ▼
       [ CAMERA MANAGER ] (1280x720 60FPS target, mirrored, aspect-ratio lock)
                                   │
                                   ▼
      [ MEDIAPIPE HAND LANDMARKER ] + [ ONE-EURO TEMPORAL SMOOTHING ]
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
[ 2D TECHNICAL HUD OVERLAY ]                      [ THREE.JS + GLSL SHADER PIPELINE ]
  • Dynamic x/y coordinate markers                  • Background Camera Quad (Thermal / Blur)
  • Precision reticles & crosshairs                 • Deformable Tracked Hatching Planes
  • Hand-to-hand dashed span lines                  • Luminous Emissive Cubes & Blocks
  • Corner brackets & velocity tags                 • Folded 3D Multi-Colored Structures
                                                    • Translucent Fresnel Crystal Prisms
         │                                                   │
         └─────────────────────────┬─────────────────────────┘
                                   ▼
                      [ GPU COMPOSITED AR VIEWPORT ]
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| **`1`** | Trigger Opening Hatched Plane (0–4s) |
| **`2`** | Trigger Floating Purple Triangular Wedges (4–8s) |
| **`3`** | Trigger Luminous Emissive Glow Blocks (8–11s) |
| **`4`** | Toggle GPU False-Color Thermal Vision (14.5–17.5s) |
| **`5`** | Trigger Pink Halftone Dotted Plane (17.5–22s) |
| **`6`** | Trigger Large Multi-Colored Folded 3D Structure (22–29s) |
| **`7`** | Trigger Translucent Purple Crystal Prism (29–34s) |
| **`D`** | Toggle **34s Automated Demo Mode** vs **Live Interactive Mode** |
| **`S`** | Toggle **Test Simulation (Synthetic Hands)** vs **Live Webcam** |
| **`T`** | Toggle False-Color Thermal Camera Shader |
| **`B`** | Trigger Fullscreen GPU Blur Transition |
| **`H`** | Toggle 2D Technical HUD & Coordinate Readouts |
| **`L`** | Toggle Hand Skeleton Landmarks |
| **`C`** | Toggle Coordinate Tags (`x: y:`) |
| **`G`** | Toggle Tracking Guide Lines |
| **`F`** | Toggle Fullscreen Mode |
| **`SPACE`** | Pause / Resume interaction |
| **`R`** | Reset tracking to default state |
| **`ESC`** | Exit Fullscreen |

---

## 🚀 Quick Start

### 1. Installation
```bash
cd C:\projects\pro3
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Automated Tests
```bash
npm run test
```

### 4. Build Production Bundle
```bash
npm run build
```

---

## 📄 License

MIT License © 2026 HandFlux. Built with Google MediaPipe & Three.js.
