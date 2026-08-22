import * as THREE from 'three';

export const HalftoneShader = {
  uniforms: {
    uTime: { value: 0.0 },
    uMode: { value: 0 }, // 0: Blue/Purple Hatching (0-4s), 1: Pink/Red Halftone Dots (18-22s)
    uOpacity: { value: 0.85 },
    uScale: { value: 24.0 },
    uColor1: { value: new THREE.Color(0x00d2ff) },
    uColor2: { value: new THREE.Color(0xb829ea) },
    uHandVelocity: { value: 0.0 }
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
    uniform int uMode;
    uniform float uOpacity;
    uniform float uScale;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform float uHandVelocity;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vec2 uv = vUv;
      
      if (uMode == 0) {
        // MODE 0: Opening Hatching & Dotted Plane (0-4s)
        // Diagonal animated stripes
        float angle = 0.785398; // 45 degrees
        vec2 rotUv = vec2(
          uv.x * cos(angle) - uv.y * sin(angle),
          uv.x * sin(angle) + uv.y * cos(angle)
        );
        
        float stripe = sin((rotUv.x + uTime * 0.3) * uScale * 3.14159);
        float stripeMask = smoothstep(0.1, 0.2, stripe);
        
        // Dotted grid overlay
        vec2 grid = fract(uv * uScale) - 0.5;
        float d = length(grid);
        float dotMask = 1.0 - smoothstep(0.18, 0.28, d);
        
        // Color blending
        vec3 col = mix(uColor1, uColor2, sin(rotUv.x * 4.0 + uTime) * 0.5 + 0.5);
        vec3 finalCol = mix(vec3(0.95, 0.98, 1.0), col, max(stripeMask * 0.7, dotMask));
        
        // White border outline
        float edgeDist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
        float border = 1.0 - smoothstep(0.01, 0.03, edgeDist);
        finalCol = mix(finalCol, vec3(1.0), border);
        
        float alpha = uOpacity * (0.35 + 0.45 * stripeMask + 0.2 * dotMask + border * 0.5);
        gl_FragColor = vec4(finalCol, alpha);
        
      } else {
        // MODE 1: Pink/Red Halftone Dots Matrix (18-22s)
        vec2 grid = fract(uv * (uScale * 1.2)) - 0.5;
        float distFromCenter = length(uv - vec2(0.5));
        
        // Dynamic dot size modulated by distance & movement
        float dotRadius = 0.15 + 0.25 * (1.0 - distFromCenter) + sin(uTime * 4.0 + uv.x * 10.0) * 0.05;
        dotRadius += uHandVelocity * 0.1;
        
        float dotMask = 1.0 - smoothstep(dotRadius - 0.05, dotRadius + 0.05, length(grid));
        
        vec3 dotColor = mix(vec3(1.0, 0.08, 0.45), vec3(0.95, 0.15, 0.2), uv.y);
        vec3 bg = vec3(1.0, 0.95, 0.98);
        
        vec3 finalCol = mix(bg, dotColor, dotMask);
        
        // Edge frame
        float edgeDist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
        float border = 1.0 - smoothstep(0.015, 0.03, edgeDist);
        finalCol = mix(finalCol, vec3(1.0, 0.2, 0.5), border);
        
        float alpha = uOpacity * (0.25 + dotMask * 0.65 + border * 0.6);
        gl_FragColor = vec4(finalCol, alpha);
      }
    }
  `
};
