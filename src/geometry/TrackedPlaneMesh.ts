import * as THREE from 'three';
import { HalftoneShader } from '../shaders/halftoneShader';
import { HandLandmarks } from '../types/vision';
import { screenToThreeWorld, lerp } from '../utils/mathUtils';

export class TrackedPlaneMesh {
  public group: THREE.Group;
  private mesh: THREE.Mesh;
  private wireframe: THREE.LineSegments;
  private material: THREE.ShaderMaterial;
  private geometry: THREE.PlaneGeometry;

  constructor() {
    this.group = new THREE.Group();
    this.geometry = new THREE.PlaneGeometry(3.2, 1.4, 4, 4);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uOpacity: { value: 0.0 },
        uColorPrimary: { value: new THREE.Color(0x00d2ff) },
        uColorSecondary: { value: new THREE.Color(0xb829ea) },
        uMode: { value: 0 }
      },
      vertexShader: HalftoneShader.vertexShader,
      fragmentShader: HalftoneShader.fragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.group.add(this.mesh);

    const wireGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(3.2, 1.4));
    const wireMat = new THREE.LineBasicMaterial({ color: 0x00f5ff, linewidth: 2, transparent: true, opacity: 0.9 });
    this.wireframe = new THREE.LineSegments(wireGeo, wireMat);
    this.group.add(this.wireframe);

    this.group.visible = false;
  }

  public update(
    hands: HandLandmarks[],
    screenWidth: number,
    screenHeight: number,
    time: number,
    mode: number,
    opacity: number
  ): void {
    if (opacity <= 0.01) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;

    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uOpacity.value = opacity;
    this.material.uniforms.uMode.value = mode;

    if (mode === 0) {
      this.material.uniforms.uColorPrimary.value.setHex(0x00f5ff);
      this.material.uniforms.uColorSecondary.value.setHex(0xb829ea);
      (this.wireframe.material as THREE.LineBasicMaterial).color.setHex(0x00f5ff);
    } else {
      this.material.uniforms.uColorPrimary.value.setHex(0xff007f);
      this.material.uniforms.uColorSecondary.value.setHex(0xff4081);
      (this.wireframe.material as THREE.LineBasicMaterial).color.setHex(0xff007f);
    }

    let targetCenter = new THREE.Vector3(0, 0, 0);
    let targetWidth = 3.2;
    let targetHeight = 1.4;
    let targetRotationZ = 0;

    if (hands.length >= 2) {
      const left = hands[0].palmCenter.x < hands[1].palmCenter.x ? hands[0] : hands[1];
      const right = left === hands[0] ? hands[1] : hands[0];

      const lWorld = screenToThreeWorld(left.palmCenter.screenX, left.palmCenter.screenY, screenWidth, screenHeight);
      const rWorld = screenToThreeWorld(right.palmCenter.screenX, right.palmCenter.screenY, screenWidth, screenHeight);

      targetCenter.set((lWorld.x + rWorld.x) * 0.5, (lWorld.y + rWorld.y) * 0.5, 0);
      const dx = rWorld.x - lWorld.x;
      const dy = rWorld.y - lWorld.y;
      targetWidth = Math.max(1.8, Math.sqrt(dx * dx + dy * dy) * 1.3);
      targetRotationZ = Math.atan2(dy, dx);
    } else if (hands.length === 1) {
      const h = hands[0];
      const w = screenToThreeWorld(h.palmCenter.screenX, h.palmCenter.screenY, screenWidth, screenHeight);
      targetCenter.set(w.x, w.y, 0);
      targetWidth = 2.4;
    } else {
      targetCenter.set(0, Math.sin(time * 1.5) * 0.1, 0);
    }

    this.group.position.lerp(targetCenter, 0.18);
    this.group.rotation.z = lerp(this.group.rotation.z, targetRotationZ, 0.18);
    this.group.scale.set(targetWidth / 3.2, targetHeight / 1.4, 1.0);
  }
}
