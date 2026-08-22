import * as THREE from 'three';
import { HalftoneShader } from '../shaders/halftoneShader';
import { HandLandmarks } from '../types/vision';
import { screenToThreeWorld } from '../utils/mathUtils';

export class TrackedPlaneMesh {
  public group: THREE.Group;
  private mesh: THREE.Mesh;
  private wireframe: THREE.LineSegments;
  private material: THREE.ShaderMaterial;
  private geometry: THREE.BufferGeometry;

  constructor() {
    this.group = new THREE.Group();

    // 4-vertex deformable Quad Plane
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
      -1,  0.5, 0,
       1,  0.5, 0,
      -1, -0.5, 0,
       1, -0.5, 0
    ]);
    const uvs = new Float32Array([
      0, 1,
      1, 1,
      0, 0,
      1, 0
    ]);
    const indices = [
      0, 2, 1,
      2, 3, 1
    ];

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    this.geometry.setIndex(indices);
    this.geometry.computeVertexNormals();

    this.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(HalftoneShader.uniforms),
      vertexShader: HalftoneShader.vertexShader,
      fragmentShader: HalftoneShader.fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.group.add(this.mesh);

    // Subtle edge border wireframe
    const wireGeo = new THREE.EdgesGeometry(this.geometry);
    const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, linewidth: 2 });
    this.wireframe = new THREE.LineSegments(wireGeo, wireMat);
    this.group.add(this.wireframe);

    this.group.visible = false;
  }

  public update(
    hands: HandLandmarks[],
    screenWidth: number,
    screenHeight: number,
    time: number,
    mode: number = 0, // 0: Hatching (0-4s), 1: Pink dots (18-22s)
    opacity: number = 1.0
  ): void {
    if (opacity <= 0.01) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;

    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uMode.value = mode;
    this.material.uniforms.uOpacity.value = opacity;

    let p0 = { x: -1.5, y:  0.4, z: 0 }; // Top-Left
    let p1 = { x:  1.5, y:  0.4, z: 0 }; // Top-Right
    let p2 = { x: -1.5, y: -0.4, z: 0 }; // Bottom-Left
    let p3 = { x:  1.5, y: -0.4, z: 0 }; // Bottom-Right

    if (hands.length >= 2) {
      const leftHand = hands[0].palmCenter.x < hands[1].palmCenter.x ? hands[0] : hands[1];
      const rightHand = leftHand === hands[0] ? hands[1] : hands[0];

      // Map corners to fingertips & wrists
      p0 = screenToThreeWorld(leftHand.indexTip.screenX, leftHand.indexTip.screenY - 20, screenWidth, screenHeight);
      p1 = screenToThreeWorld(rightHand.indexTip.screenX, rightHand.indexTip.screenY - 20, screenWidth, screenHeight);
      p2 = screenToThreeWorld(leftHand.thumbTip.screenX - 20, leftHand.wrist.screenY, screenWidth, screenHeight);
      p3 = screenToThreeWorld(rightHand.thumbTip.screenX + 20, rightHand.wrist.screenY, screenWidth, screenHeight);

      this.material.uniforms.uHandVelocity.value = (leftHand.velocity.speed + rightHand.velocity.speed) * 0.5;
    } else if (hands.length === 1) {
      const h = hands[0];
      const c = screenToThreeWorld(h.palmCenter.screenX, h.palmCenter.screenY, screenWidth, screenHeight);
      const halfW = (h.boundingBox.width / screenWidth) * 4.0;
      const halfH = (h.boundingBox.height / screenHeight) * 3.0;

      p0 = { x: c.x - halfW, y: c.y + halfH, z: 0 };
      p1 = { x: c.x + halfW, y: c.y + halfH, z: 0 };
      p2 = { x: c.x - halfW, y: c.y - halfH, z: 0 };
      p3 = { x: c.x + halfW, y: c.y - halfH, z: 0 };
      this.material.uniforms.uHandVelocity.value = h.velocity.speed;
    }

    const posAttr = this.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    arr[0] = p0.x; arr[1] = p0.y; arr[2] = p0.z;
    arr[3] = p1.x; arr[4] = p1.y; arr[5] = p1.z;
    arr[6] = p2.x; arr[7] = p2.y; arr[8] = p2.z;
    arr[9] = p3.x; arr[10] = p3.y; arr[11] = p3.z;

    posAttr.needsUpdate = true;
    this.geometry.computeVertexNormals();

    // Refresh wireframe edges
    this.wireframe.geometry.dispose();
    this.wireframe.geometry = new THREE.EdgesGeometry(this.geometry);
  }
}
