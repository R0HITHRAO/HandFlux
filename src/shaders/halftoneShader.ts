export const HalftoneShader = {
  uniforms: {
    uTime: { value: 0.0 },
    uOpacity: { value: 1.0 },
    uColorPrimary: { value: null },
    uColorSecondary: { value: null },
    uMode: { value: 0 }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float uTime;
    uniform float uOpacity;
    uniform vec3 uColorPrimary;
    uniform vec3 uColorSecondary;
    uniform int uMode;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      vec4 finalColor = vec4(0.0);

      if (uMode == 0) {
        float diag = (uv.x + uv.y) * 28.0 - uTime * 3.5;
        float hatch = step(0.5, fract(diag));
        vec3 col = mix(uColorPrimary, uColorSecondary, uv.x);
        float border = step(0.03, uv.x) * step(0.03, uv.y) * step(uv.x, 0.97) * step(uv.y, 0.97);
        float alpha = (hatch * 0.65 + (1.0 - border) * 0.85) * uOpacity;
        finalColor = vec4(col, alpha);
      } else {
        vec2 grid = fract(uv * vec2(36.0, 18.0)) - 0.5;
        float dist = length(grid);
        float dotSize = 0.35 + sin(uTime * 4.0 + uv.x * 12.0) * 0.08;
        float circle = 1.0 - smoothstep(dotSize - 0.05, dotSize + 0.05, dist);
        float border = step(0.02, uv.x) * step(0.02, uv.y) * step(uv.x, 0.98) * step(uv.y, 0.98);
        float alpha = (circle * 0.8 + (1.0 - border) * 0.9) * uOpacity;
        vec3 col = mix(uColorPrimary, uColorSecondary, uv.y);
        finalColor = vec4(col, alpha);
      }

      gl_FragColor = finalColor;
    }
  `
};
