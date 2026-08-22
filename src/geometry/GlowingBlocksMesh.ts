import * as THREE from 'three';
import { HandLandmarks } from '../types/vision';
import { screenToThreeWorld, lerp } from '../utils/mathUtils';

export class GlowingBlocksMesh {
  public group: THREE.Group;
  private pinkBlock: THREE.Mesh;
  private pinkWire: THREE.LineSegments;
  private greenBlock: THREE.Mesh;
  private greenWire: THREE.LineSegments;
  private pinkPos: THREE.Vector3 = new THREE.Vector3(1.2, 0.8, 0);
  private greenPos: THREE.Vector3 = new THREE.Vector3(-0.8, -0.4, 0);

  constructor() {
    this.group = new THREE.Group();

    // 1. Bright Pink / Magenta Emissive Cube (Upper/Right)
    const pinkGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const pinkMat = new THREE.MeshStandardMaterial({
      color: 0xff007f,
      emissive: 0xff007f,
      emissiveIntensity: 0.85,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85
    });
    this.pinkBlock = new THREE.Mesh(pinkGeo, pinkMat);
    const pinkWireGeo = new THREE.EdgesGeometry(pinkGeo);
    this.pinkWire = new THREE.LineSegments(pinkWireGeo, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2, transparent: true, opacity: 0.9 }));
    this.pinkBlock.add(this.pinkWire);
    this.group.add(this.pinkBlock);

    // 2. Mint / Cyan / Green Luminous Cuboid (Lower/Center)
    const greenGeo = new THREE.BoxGeometry(1.2, 0.5, 0.5);
    const greenMat = new THREE.MeshStandardMaterial({
      color: 0x00ffaa,
      emissive: 0x00ff88,
      emissiveIntensity: 0.7,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.8
    });
    this.greenBlock = new THREE.Mesh(greenGeo, greenMat);
    const greenWireGeo = new THREE.EdgesGeometry(greenGeo);
    this.greenWire = new THREE.LineSegments(greenWireGeo, new THREE.LineBasicMaterial({ color: 0xecfdf5, linewidth: 2, transparent: true, opacity: 0.85 }));
    this.greenBlock.add(this.greenWire);
    this.group.add(this.greenBlock);

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

    let targetPink = new THREE.Vector3(1.2, 0.6 + Math.sin(time * 2.0) * 0.15, 0);
    let targetGreen = new THREE.Vector3(-0.5, -0.4 + Math.cos(time * 1.8) * 0.15, 0);

    if (hands.length >= 2) {
      const rightHand = hands[0].palmCenter.x > hands[1].palmCenter.x ? hands[0] : hands[1];
      const leftHand = rightHand === hands[0] ? hands[1] : hands[0];

      const rWorld = screenToThreeWorld(rightHand.indexTip.screenX, rightHand.indexTip.screenY, screenWidth, screenHeight);
      const lWorld = screenToThreeWorld(leftHand.palmCenter.screenX, leftHand.palmCenter.screenY, screenWidth, screenHeight);

      targetPink.set(rWorld.x + 0.3, rWorld.y + 0.4, rWorld.z + 0.2);
      targetGreen.set(lWorld.x, lWorld.y - 0.3, lWorld.z - 0.1);
    } else if (hands.length === 1) {
      const h = hands[0];
      const world = screenToThreeWorld(h.palmCenter.screenX, h.palmCenter.screenY, screenWidth, screenHeight);
      targetPink.set(world.x + 0.8, world.y + 0.3, world.z);
      targetGreen.set(world.x - 0.6, world.y - 0.4, world.z);
    }

    this.pinkPos.lerp(targetPink, 0.15);
    this.greenPos.lerp(targetGreen, 0.15);

    this.pinkBlock.position.copy(this.pinkPos);
    this.pinkBlock.rotation.x = time * 0.7;
    this.pinkBlock.rotation.y = time * 0.9;

    this.greenBlock.position.copy(this.greenPos);
    this.greenBlock.rotation.y = -time * 0.6;
    this.greenBlock.rotation.z = Math.sin(time) * 0.2;

    (this.pinkBlock.material as THREE.MeshStandardMaterial).opacity = opacity * 0.85;
    (this.greenBlock.material as THREE.MeshStandardMaterial).opacity = opacity * 0.8;
  }
}
