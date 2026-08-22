import * as THREE from 'three';

export const ThermalShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uThermalIntensity: { value: 0.0 }, // 0.0 (normal) to 1.0 (full thermal)
    uBlurIntensity: { value: 0.0 },    // 0.0 (sharp) to 1.0 (heavy blur)
    uResolution: { value: new THREE.Vector2(1280, 720) },
    uTime: { value: 0.0 }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uThermalIntensity;
    uniform float uBlurIntensity;
    uniform vec2 uResolution;
    uniform float uTime;
    varying vec2 vUv;

    // Luminance coefficients (Rec. 709)
    float getLuminance(vec3 color) {
      return dot(color, vec3(0.2126, 0.7152, 0.0722));
    }

    // False-color thermal spectrum mapper
    vec3 getThermalColor(float lum) {
      lum = clamp(lum, 0.0, 1.0);
      
      vec3 c0 = vec3(0.02, 0.02, 0.15); // Deep Blue / Dark
      vec3 c1 = vec3(0.05, 0.15, 0.85); // Royal Blue
      vec3 c2 = vec3(0.00, 0.88, 0.95); // Cyan
      vec3 c3 = vec3(0.10, 0.95, 0.28); // Bright Green
      vec3 c4 = vec3(1.00, 0.92, 0.05); // Electric Yellow
      vec3 c5 = vec3(1.00, 0.40, 0.00); // Hot Orange
      vec3 c6 = vec3(1.00, 0.05, 0.58); // Neon Magenta / Pink
      vec3 c7 = vec3(1.00, 1.00, 1.00); // White Peak

      if (lum < 0.15) {
        return mix(c0, c1, lum / 0.15);
      } else if (lum < 0.32) {
        return mix(c1, c2, (lum - 0.15) / 0.17);
      } else if (lum < 0.48) {
        return mix(c2, c3, (lum - 0.32) / 0.16);
      } else if (lum < 0.65) {
        return mix(c3, c4, (lum - 0.48) / 0.17);
      } else if (lum < 0.80) {
        return mix(c4, c5, (lum - 0.65) / 0.15);
      } else if (lum < 0.93) {
        return mix(c5, c6, (lum - 0.80) / 0.13);
      } else {
        return mix(c6, c7, (lum - 0.93) / 0.07);
      }
    }

    // 9-tap separable Gaussian / Kawase blur
    vec4 sampleBlurred(sampler2D tex, vec2 uv, float radius) {
      if (radius <= 0.001) return texture2D(tex, uv);
      
      vec2 texel = (1.0 / uResolution) * radius * 8.0;
      vec4 col = vec4(0.0);
      
      col += texture2D(tex, uv + vec2(-texel.x, -texel.y) * 0.5) * 0.25;
      col += texture2D(tex, uv + vec2( texel.x, -texel.y) * 0.5) * 0.25;
      col += texture2D(tex, uv + vec2(-texel.x,  texel.y) * 0.5) * 0.25;
      col += texture2D(tex, uv + vec2( texel.x,  texel.y) * 0.5) * 0.25;
      
      // Secondary wider ring
      vec4 col2 = vec4(0.0);
      col2 += texture2D(tex, uv + vec2(-texel.x * 1.5, 0.0)) * 0.25;
      col2 += texture2D(tex, uv + vec2( texel.x * 1.5, 0.0)) * 0.25;
      col2 += texture2D(tex, uv + vec2(0.0, -texel.y * 1.5)) * 0.25;
      col2 += texture2D(tex, uv + vec2(0.0,  texel.y * 1.5)) * 0.25;
      
      return mix(col, col2, 0.4);
    }

    void main() {
      // Mirrored texture coordinates for webcam alignment
      vec2 uv = vUv;
      
      // Sample camera with optional blur
      vec4 baseColor = sampleBlurred(tDiffuse, uv, uBlurIntensity);
      
      // Compute thermal mapping
      float lum = getLuminance(baseColor.rgb);
      vec3 thermalRgb = getThermalColor(lum);
      
      // Interpolate between normal camera and false-color thermal
      vec3 finalRgb = mix(baseColor.rgb, thermalRgb, uThermalIntensity);

      // Subtle technical grid / scanline artifact during thermal mode
      if (uThermalIntensity > 0.1) {
        float scanline = sin(uv.y * uResolution.y * 0.8) * 0.04 * uThermalIntensity;
        finalRgb -= scanline;
      }

      gl_FragColor = vec4(finalRgb, 1.0);
    }
  `
};
