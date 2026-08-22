import * as THREE from 'three';

export const GlowPrismShader = {
  uniforms: {
    uTime: { value: 0.0 },
    uBaseColor: { value: new THREE.Color(0xb829ea) },  // Lavender / Violet
    uRimColor: { value: new THREE.Color(0xf0abfc) },   // Pale Pink / White Highlight
    uEdgeColor: { value: new THREE.Color(0x7e22ce) },  // Dark Structural Violet
    uFresnelPower: { value: 2.2 },
    uOpacity: { value: 0.75 },
    uVelocity: { value: 0.0 }
  },

  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,

  fragmentShader: `
    uniform float uTime;
    uniform vec3 uBaseColor;
    uniform vec3 uRimColor;
    uniform vec3 uEdgeColor;
    uniform float uFresnelPower;
    uniform float uOpacity;
    uniform float uVelocity;
    
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      
      // Fresnel effect
      float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), uFresnelPower);
      
      // Internal depth caustics simulation
      float internalShimmer = sin(vWorldPos.x * 6.0 + vWorldPos.y * 6.0 + uTime * 2.5) * 0.15;
      
      // Structural edge glow
      vec3 col = mix(uBaseColor, uRimColor, fresnel + internalShimmer);
      col += vec3(0.2, 0.1, 0.3) * (uVelocity * 2.0);
      
      float alpha = uOpacity * (0.35 + fresnel * 0.65);
      
      gl_FragColor = vec4(col, alpha);
    }
  `
};
