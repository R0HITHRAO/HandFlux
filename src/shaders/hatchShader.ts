import * as THREE from 'three';

export const HatchShader = {
  uniforms: {
    uTime: { value: 0.0 },
    uOpacity: { value: 0.85 },
    uColorPrimary: { value: new THREE.Color(0x00f5ff) },
    uColorSecondary: { value: new THREE.Color(0x0077ff) },
    uLineSpacing: { value: 24.0 },
    uLineWidth: { value: 0.28 }
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float uTime;
    uniform float uOpacity;
    uniform vec3 uColorPrimary;
    uniform vec3 uColorSecondary;
    uniform float uLineSpacing;
    uniform float uLineWidth;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vec2 uv = vUv;

      // 1. Diagonal Laser Hatch Lines (Smoothly anti-aliased)
      float diag = (uv.x + uv.y) * uLineSpacing - uTime * 2.5;
      float lineFrac = fract(diag);
      float lineMask = smoothstep(0.5 - uLineWidth * 0.5, 0.5 - uLineWidth * 0.5 + 0.08, lineFrac) *
                       (1.0 - smoothstep(0.5 + uLineWidth * 0.5 - 0.08, 0.5 + uLineWidth * 0.5, lineFrac));

      // 2. Micro Halftone Dotted Grid
      vec2 dotGrid = fract(uv * vec2(32.0, 18.0)) - 0.5;
      float dotDist = length(dotGrid);
      float dots = 1.0 - smoothstep(0.12, 0.22, dotDist);

      // 3. Technical Border & Corner Brackets
      float borderX = min(uv.x, 1.0 - uv.x);
      float borderY = min(uv.y, 1.0 - uv.y);
      float border = 1.0 - smoothstep(0.015, 0.035, min(borderX, borderY));

      // Corner Accents
      float cornerDist = length(vec2(borderX, borderY));
      float cornerTick = 1.0 - smoothstep(0.04, 0.08, cornerDist);

      // 4. Color Gradient
      vec3 lineColor = mix(uColorPrimary, uColorSecondary, uv.x + sin(uTime * 1.5 + uv.y * 4.0) * 0.2);
      vec3 baseColor = vec3(0.02, 0.08, 0.15);

      // 5. Alpha Compositing (Glass-like base so user is visible underneath)
      float baseAlpha = 0.15; // Transparent backdrop
      float hatchAlpha = lineMask * 0.55;
      float dotAlpha = dots * 0.25;
      float borderAlpha = border * 0.85 + cornerTick * 0.4;

      float finalAlpha = (baseAlpha + hatchAlpha + dotAlpha + borderAlpha) * uOpacity;
      vec3 finalColor = mix(baseColor, lineColor, clamp(lineMask + border + dots * 0.5, 0.0, 1.0));

      // Add neon glow along edges
      finalColor += uColorPrimary * border * 0.6;

      gl_FragColor = vec4(finalColor, clamp(finalAlpha, 0.0, 0.95));
    }
  `
};
