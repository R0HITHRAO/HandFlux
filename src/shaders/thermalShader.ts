export const ThermalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uThermalIntensity: { value: 0.0 },
    uBlurIntensity: { value: 0.0 },
    uResolution: { value: null },
    uTime: { value: 0.0 }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      // Mirror horizontally so the video is a natural mirror
      vUv = vec2(1.0 - uv.x, uv.y);
      gl_Position = vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uThermalIntensity;
    uniform float uBlurIntensity;
    uniform vec2 uResolution;
    uniform float uTime;
    varying vec2 vUv;

    float getLuminance(vec3 color) {
      return dot(color, vec3(0.299, 0.587, 0.114));
    }

    vec3 getThermalColor(float lum) {
      vec3 col;
      if (lum < 0.15) {
        col = mix(vec3(0.02, 0.02, 0.18), vec3(0.0, 0.4, 0.9), lum / 0.15);
      } else if (lum < 0.35) {
        col = mix(vec3(0.0, 0.4, 0.9), vec3(0.0, 0.95, 0.95), (lum - 0.15) / 0.2);
      } else if (lum < 0.55) {
        col = mix(vec3(0.0, 0.95, 0.95), vec3(0.1, 0.95, 0.2), (lum - 0.35) / 0.2);
      } else if (lum < 0.75) {
        col = mix(vec3(0.1, 0.95, 0.2), vec3(1.0, 0.9, 0.0), (lum - 0.55) / 0.2);
      } else if (lum < 0.90) {
        col = mix(vec3(1.0, 0.9, 0.0), vec3(1.0, 0.1, 0.5), (lum - 0.75) / 0.15);
      } else {
        col = mix(vec3(1.0, 0.1, 0.5), vec3(1.0, 1.0, 1.0), (lum - 0.90) / 0.1);
      }
      return col;
    }

    vec4 sampleBlurred(sampler2D tex, vec2 uv, float radius) {
      if (radius <= 0.001) return texture2D(tex, uv);
      vec2 texel = (1.0 / uResolution) * radius * 10.0;
      vec4 sum = vec4(0.0);
      sum += texture2D(tex, uv + vec2(-texel.x, -texel.y)) * 0.0625;
      sum += texture2D(tex, uv + vec2( 0.0,     -texel.y)) * 0.125;
      sum += texture2D(tex, uv + vec2( texel.x, -texel.y)) * 0.0625;
      sum += texture2D(tex, uv + vec2(-texel.x,  0.0))     * 0.125;
      sum += texture2D(tex, uv + vec2( 0.0,      0.0))     * 0.25;
      sum += texture2D(tex, uv + vec2( texel.x,  0.0))     * 0.125;
      sum += texture2D(tex, uv + vec2(-texel.x,  texel.y)) * 0.0625;
      sum += texture2D(tex, uv + vec2( 0.0,      texel.y)) * 0.125;
      sum += texture2D(tex, uv + vec2( texel.x,  texel.y)) * 0.0625;
      return sum;
    }

    void main() {
      vec2 uv = vUv;
      vec4 baseColor = sampleBlurred(tDiffuse, uv, uBlurIntensity);

      if (uThermalIntensity > 0.001) {
        float lum = getLuminance(baseColor.rgb);
        vec3 thermalRgb = getThermalColor(lum);
        float scanline = sin(uv.y * 320.0 + uTime * 6.0) * 0.04;
        thermalRgb += scanline;
        vec3 finalRgb = mix(baseColor.rgb, thermalRgb, uThermalIntensity);
        gl_FragColor = vec4(finalRgb, 1.0);
      } else {
        gl_FragColor = baseColor;
      }
    }
  `
};
