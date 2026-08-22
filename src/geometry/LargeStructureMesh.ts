import * as THREE from 'three';
import { HandLandmarks } from '../types/vision';
import { screenToThreeWorld, lerp } from '../utils/mathUtils';

export class LargeStructureMesh {
  public group: THREE.Group;
  private segments: { mesh: THREE.Mesh; wire: THREE.LineSegments; basePos: THREE.Vector3 }[] = [];
  private currentCenter: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private currentRotation: number = 0;
  private currentWidth: number = 3.6;

  constructor() {
    this.group = new THREE.Group();

    const panelConfigs = [
      { color: 0x9333ea, edgeColor: 0xd8b4fe, size: [1.1, 0.7, 0.35], pos: [-1.4, 0.25, 0.1] },
      { color: 0x00f5ff, edgeColor: 0xa5f3fc, size: [1.3, 0.6, 0.3], pos: [-0.6, -0.15, 0.2] },
      { color: 0x22c55e, edgeColor: 0x86efac, size: [1.2, 0.75, 0.35], pos: [0.1, 0.3, -0.1] },
      { color: 0xfacc15, edgeColor: 0xfef08a, size: [1.2, 0.55, 0.4], pos: [0.8, -0.25, 0.15] },
      { color: 0xf97316, edgeColor: 0xfed7aa, size: [1.0, 0.65, 0.3], pos: [1.5, 0.15, -0.1] },
      { color: 0xec4899, edgeColor: 0xfbcfe8, size: [1.4, 0.7, 0.4], pos: [0.0, 0.0, 0.25] },
      { color: 0x3b82f6, edgeColor: 0x93c5fd, size: [1.1, 0.5, 0.3], pos: [-0.9, 0.35, -0.15] },
      { color: 0xa855f7, edgeColor: 0xe9d5ff, size: [1.2, 0.6, 0.35], pos: [0.9, 0.35, -0.1] }
    ];

    panelConfigs.forEach((cfg) => {
      const geo = new THREE.BoxGeometry(cfg.size[0], cfg.size[1], cfg.size[2]);
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.65,
        roughness: 0.15,
        metalness: 0.2,
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);

      const wireGeo = new THREE.EdgesGeometry(geo);
      const wireMat = new THREE.LineBasicMaterial({ color: cfg.edgeColor, linewidth: 2, transparent: true, opacity: 0.95 });
      const wire = new THREE.LineSegments(wireGeo, wireMat);
      mesh.add(wire);

      this.group.add(mesh);
      this.segments.push({
        mesh,
        wire,
        basePos: new THREE.Vector3(cfg.pos[0], cfg.pos[1], cfg.pos[2])
      });
    });

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

    let targetCenter = new THREE.Vector3(0, -0.1 + Math.sin(time) * 0.1, 0);
    let targetRotation = Math.sin(time * 0.5) * 0.15;
    let targetWidth = 3.6 + Math.sin(time * 0.8) * 0.4;

    if (hands.length >= 2) {
      const leftHand = hands[0].palmCenter.x < hands[1].palmCenter.x ? hands[0] : hands[1];
      const rightHand = leftHand === hands[0] ? hands[1] : hands[0];

      const lWorld = screenToThreeWorld(leftHand.palmCenter.screenX, leftHand.palmCenter.screenY, screenWidth, screenHeight);
      const rWorld = screenToThreeWorld(rightHand.palmCenter.screenX, rightHand.palmCenter.screenY, screenWidth, screenHeight);

      targetCenter.set((lWorld.x + rWorld.x) * 0.5, (lWorld.y + rWorld.y) * 0.5, 0);
      const dist = Math.sqrt((rWorld.x - lWorld.x) ** 2 + (rWorld.y - lWorld.y) ** 2);
      targetWidth = Math.max(2.0, dist * 1.35);
      targetRotation = Math.atan2(rWorld.y - lWorld.y, rWorld.x - lWorld.x);
    } else if (hands.length === 1) {
      const h = hands[0];
      const world = screenToThreeWorld(h.palmCenter.screenX, h.palmCenter.screenY, screenWidth, screenHeight);
      targetCenter.set(world.x, world.y - 0.2, 0);
      targetWidth = 3.2;
    }

    this.currentCenter.lerp(targetCenter, 0.16);
    this.currentRotation = lerp(this.currentRotation, targetRotation, 0.16);
    this.currentWidth = lerp(this.currentWidth, targetWidth, 0.16);

    this.group.position.copy(this.currentCenter);
    this.group.rotation.z = this.currentRotation;
    this.group.rotation.y = Math.sin(time * 0.8) * 0.25;
    this.group.rotation.x = Math.cos(time * 0.6) * 0.18;

    const stretchFactor = this.currentWidth / 3.6;
    this.segments.forEach((seg, i) => {
      seg.mesh.scale.x = stretchFactor;
      seg.mesh.position.y = seg.basePos.y + Math.sin(time * 2.5 + i) * 0.04;

      const mat = seg.mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = opacity * 0.88;
      const wireMat = seg.wire.material as THREE.LineBasicMaterial;
      wireMat.opacity = opacity * 0.95;
    });
  }
}
