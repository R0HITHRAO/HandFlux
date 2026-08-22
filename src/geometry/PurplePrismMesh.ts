import * as THREE from 'three';
import { GlowPrismShader } from '../shaders/glowPrismShader';
import { HandLandmarks } from '../types/vision';
import { screenToThreeWorld, lerp } from '../utils/mathUtils';

export class PurplePrismMesh {
  public group: THREE.Group;
  private mesh: THREE.Mesh;
  private outerFrame: THREE.LineSegments;
  private innerPrism: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private currentPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private currentScale: number = 1.0;

  constructor() {
    this.group = new THREE.Group();

    // Architectural Digital Crystal Prism (multi-faceted polyhedron)
    const geom = new THREE.IcosahedronGeometry(1.4, 0);
    this.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(GlowPrismShader.uniforms),
      vertexShader: GlowPrismShader.vertexShader,
      fragmentShader: GlowPrismShader.fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.mesh = new THREE.Mesh(geom, this.material);
    this.group.add(this.mesh);

    // Thick structural dark purple edge frames
    const edgeGeo = new THREE.EdgesGeometry(geom);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x581c87, // Deep violet
      linewidth: 3,
      transparent: true,
      opacity: 0.95
    });
    this.outerFrame = new THREE.LineSegments(edgeGeo, edgeMat);
    this.group.add(this.outerFrame);

    // Inner glowing core
    const innerGeo = new THREE.OctahedronGeometry(0.8, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xf5d0fe, // Pale pink/white core
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });
    this.innerPrism = new THREE.Mesh(innerGeo, innerMat);
    this.group.add(this.innerPrism);

    this.group.visible = false;
  }

  public update(
    hands: HandLandmarks[],
    screenWidth: number,
    screenHeight: number,
    time: number,
    opacity: number = 1.0
  ): void {
    if (opacity <= 0.01) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;

    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uOpacity.value = opacity;

    let targetPos = new THREE.Vector3(0, 0, 0);
    let targetScale = 1.2;
    let targetRotZ = 0;

    if (hands.length >= 2) {
      const h1 = hands[0];
      const h2 = hands[1];
      const p1 = screenToThreeWorld(h1.palmCenter.screenX, h1.palmCenter.screenY, screenWidth, screenHeight);
      const p2 = screenToThreeWorld(h2.palmCenter.screenX, h2.palmCenter.screenY, screenWidth, screenHeight);

      targetPos.set((p1.x + p2.x) * 0.5, (p1.y + p2.y) * 0.5 + 0.3, 0);
      const dist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
      targetScale = Math.max(0.8, Math.min(2.2, dist * 0.8));
      targetRotZ = Math.atan2(p2.y - p1.y, p2.x - p1.x);

      this.material.uniforms.uVelocity.value = (h1.velocity.speed + h2.velocity.speed) * 0.5;
    } else if (hands.length === 1) {
      const h = hands[0];
      const p = screenToThreeWorld(h.palmCenter.screenX, h.palmCenter.screenY, screenWidth, screenHeight);
      targetPos.set(p.x, p.y + 0.5, 0);
      targetScale = 1.1;
      this.material.uniforms.uVelocity.value = h.velocity.speed;
    }

    this.currentPos.lerp(targetPos, 0.12);
    this.currentScale = lerp(this.currentScale, targetScale, 0.12);

    this.group.position.copy(this.currentPos);
    this.group.scale.setScalar(this.currentScale);

    this.mesh.rotation.y = time * 0.5;
    this.mesh.rotation.x = time * 0.3;
    this.mesh.rotation.z = targetRotZ;

    this.innerPrism.rotation.y = -time * 0.8;
    this.innerPrism.rotation.z = time * 0.6;
  }
}
