import * as THREE from 'three';
import { HandLandmarks } from '../types/vision';
import { screenToThreeWorld, lerp } from '../utils/mathUtils';

export class PurplePrismMesh {
  public group: THREE.Group;
  private outerPrism: THREE.Mesh;
  private outerWire: THREE.LineSegments;
  private innerDiamond: THREE.Mesh;
  private innerWire: THREE.LineSegments;

  private currentCenter: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private currentScale: number = 1.0;

  constructor() {
    this.group = new THREE.Group();

    const prismGeo = new THREE.CylinderGeometry(1.4, 1.8, 2.4, 6, 2, false);
    const prismMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 0.85,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide
    });
    this.outerPrism = new THREE.Mesh(prismGeo, prismMat);

    const wireGeo = new THREE.EdgesGeometry(prismGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x4c1d95, linewidth: 2.5, transparent: true, opacity: 0.95 });
    this.outerWire = new THREE.LineSegments(wireGeo, wireMat);
    this.outerPrism.add(this.outerWire);
    this.group.add(this.outerPrism);

    const diamondGeo = new THREE.OctahedronGeometry(1.0, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0xdb2777,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.4,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    this.innerDiamond = new THREE.Mesh(diamondGeo, diamondMat);
    const diamondWireGeo = new THREE.EdgesGeometry(diamondGeo);
    const diamondWireMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2, transparent: true, opacity: 0.95 });
    this.innerWire = new THREE.LineSegments(diamondWireGeo, diamondWireMat);
    this.innerDiamond.add(this.innerWire);
    this.group.add(this.innerDiamond);

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

    let targetCenter = new THREE.Vector3(0, Math.sin(time) * 0.15, 0);
    let targetScale = 1.35;

    if (hands.length >= 2) {
      const h1 = hands[0];
      const h2 = hands[1];
      const w1 = screenToThreeWorld(h1.palmCenter.screenX, h1.palmCenter.screenY, screenWidth, screenHeight);
      const w2 = screenToThreeWorld(h2.palmCenter.screenX, h2.palmCenter.screenY, screenWidth, screenHeight);

      targetCenter.set((w1.x + w2.x) * 0.5, (w1.y + w2.y) * 0.5, (w1.z + w2.z) * 0.5);
      const dist = Math.sqrt((w2.x - w1.x) ** 2 + (w2.y - w1.y) ** 2);
      targetScale = Math.max(1.0, dist * 0.95);
    } else if (hands.length === 1) {
      const h = hands[0];
      const w = screenToThreeWorld(h.palmCenter.screenX, h.palmCenter.screenY, screenWidth, screenHeight);
      targetCenter.set(w.x, w.y, w.z);
      targetScale = 1.2;
    }

    this.currentCenter.lerp(targetCenter, 0.16);
    this.currentScale = lerp(this.currentScale, targetScale, 0.16);

    this.group.position.copy(this.currentCenter);
    this.group.scale.setScalar(this.currentScale);

    this.outerPrism.rotation.y = time * 0.7;
    this.outerPrism.rotation.x = Math.sin(time * 0.5) * 0.2;

    this.innerDiamond.rotation.y = -time * 1.2;
    this.innerDiamond.rotation.z = Math.cos(time * 0.8) * 0.3;

    (this.outerPrism.material as THREE.MeshStandardMaterial).opacity = opacity * 0.85;
    (this.innerDiamond.material as THREE.MeshStandardMaterial).opacity = opacity * 0.88;
  }
}
