import * as THREE from 'three';
import { HandLandmarks } from '../types/vision';
import { screenToThreeWorld, lerp } from '../utils/mathUtils';

export class GlowingBlocksMesh {
  public group: THREE.Group;
  private magentaCube: THREE.Mesh;
  private magentaWire: THREE.LineSegments;
  private mintCuboid: THREE.Mesh;
  private mintWire: THREE.LineSegments;

  private currentMagentaPos: THREE.Vector3 = new THREE.Vector3(1.2, 0.2, 0);
  private currentMintPos: THREE.Vector3 = new THREE.Vector3(-1.2, -0.1, 0);

  constructor() {
    this.group = new THREE.Group();

    const cubeGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const magentaMat = new THREE.MeshStandardMaterial({
      color: 0xff007f,
      emissive: 0xff007f,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85
    });
    this.magentaCube = new THREE.Mesh(cubeGeo, magentaMat);
    const magWireGeo = new THREE.EdgesGeometry(cubeGeo);
    const magWireMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2, transparent: true, opacity: 0.95 });
    this.magentaWire = new THREE.LineSegments(magWireGeo, magWireMat);
    this.magentaCube.add(this.magentaWire);
    this.group.add(this.magentaCube);

    const cuboidGeo = new THREE.BoxGeometry(0.7, 1.4, 0.7);
    const mintMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85
    });
    this.mintCuboid = new THREE.Mesh(cuboidGeo, mintMat);
    const mintWireGeo = new THREE.EdgesGeometry(cuboidGeo);
    const mintWireMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2, transparent: true, opacity: 0.95 });
    this.mintWire = new THREE.LineSegments(mintWireGeo, mintWireMat);
    this.mintCuboid.add(this.mintWire);
    this.group.add(this.mintCuboid);

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

    let targetMag = new THREE.Vector3(1.3 + Math.sin(time) * 0.2, 0.3 + Math.cos(time * 1.2) * 0.2, 0);
    let targetMint = new THREE.Vector3(-1.3 - Math.sin(time) * 0.2, -0.1 + Math.sin(time * 1.5) * 0.2, 0);

    if (hands.length >= 2) {
      const right = hands[0].palmCenter.x > hands[1].palmCenter.x ? hands[0] : hands[1];
      const left = right === hands[0] ? hands[1] : hands[0];
      const rW = screenToThreeWorld(right.palmCenter.screenX, right.palmCenter.screenY, screenWidth, screenHeight);
      const lW = screenToThreeWorld(left.palmCenter.screenX, left.palmCenter.screenY, screenWidth, screenHeight);
      targetMag.set(rW.x + 0.3, rW.y + 0.2, rW.z);
      targetMint.set(lW.x - 0.3, lW.y + 0.2, lW.z);
    } else if (hands.length === 1) {
      const h = hands[0];
      const w = screenToThreeWorld(h.palmCenter.screenX, h.palmCenter.screenY, screenWidth, screenHeight);
      targetMag.set(w.x + 0.5, w.y + 0.3, w.z);
      targetMint.set(w.x - 0.5, w.y - 0.2, w.z);
    }

    this.currentMagentaPos.lerp(targetMag, 0.16);
    this.currentMintPos.lerp(targetMint, 0.16);

    this.magentaCube.position.copy(this.currentMagentaPos);
    this.magentaCube.rotation.x = time * 0.8;
    this.magentaCube.rotation.y = time * 1.1;

    this.mintCuboid.position.copy(this.currentMintPos);
    this.mintCuboid.rotation.y = time * 0.9;
    this.mintCuboid.rotation.z = Math.sin(time * 0.8) * 0.3;

    (this.magentaCube.material as THREE.MeshStandardMaterial).opacity = opacity * 0.88;
    (this.mintCuboid.material as THREE.MeshStandardMaterial).opacity = opacity * 0.88;
  }
}
