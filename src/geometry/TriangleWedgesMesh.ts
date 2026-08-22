import * as THREE from 'three';
import { HandLandmarks } from '../types/vision';
import { screenToThreeWorld, lerp } from '../utils/mathUtils';

export class TriangleWedgesMesh {
  public group: THREE.Group;
  private wedges: { mesh: THREE.Mesh; wire: THREE.LineSegments; targetPos: THREE.Vector3; currPos: THREE.Vector3; rotSpeed: number }[] = [];

  constructor() {
    this.group = new THREE.Group();

    const configs = [
      { color: 0x9333ea, emissive: 0xc026d3, edgeColor: 0xff00ff, scale: [0.8, 1.8, 0.45] },
      { color: 0xd946ef, emissive: 0xec4899, edgeColor: 0x38bdf8, scale: [0.7, 1.5, 0.4] },
      { color: 0x7e22ce, emissive: 0xa855f7, edgeColor: 0xf43f5e, scale: [0.9, 2.0, 0.5] },
      { color: 0xa855f7, emissive: 0x9333ea, edgeColor: 0x00f5ff, scale: [0.75, 1.6, 0.4] }
    ];

    configs.forEach((cfg, idx) => {
      const geom = this.createPrismGeometry();
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.emissive,
        emissiveIntensity: 0.8,
        roughness: 0.15,
        metalness: 0.2,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);

      const wireGeo = new THREE.EdgesGeometry(geom);
      const wireMat = new THREE.LineBasicMaterial({ color: cfg.edgeColor, linewidth: 2, transparent: true, opacity: 0.95 });
      const wire = new THREE.LineSegments(wireGeo, wireMat);
      mesh.add(wire);

      this.group.add(mesh);
      this.wedges.push({
        mesh,
        wire,
        targetPos: new THREE.Vector3(0, 0, 0),
        currPos: new THREE.Vector3(0, 0, 0),
        rotSpeed: 0.6 + idx * 0.3
      });
    });

    this.group.visible = false;
  }

  private createPrismGeometry(): THREE.BufferGeometry {
    const geom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
       0.0,  0.7,  0.3,
      -0.4, -0.5,  0.3,
       0.4, -0.5,  0.3,
       0.0,  0.7, -0.3,
      -0.4, -0.5, -0.3,
       0.4, -0.5, -0.3
    ]);

    const indices = [
      0, 1, 2,  3, 5, 4,
      0, 3, 4,  0, 4, 1,
      0, 2, 5,  0, 5, 3,
      1, 4, 5,  1, 5, 2
    ];

    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
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

    this.wedges.forEach((w, idx) => {
      let targetX = (idx % 2 === 0 ? -1.3 : 1.3) + Math.sin(time * 0.8 + idx) * 0.4;
      let targetY = 0.4 + Math.cos(time * 0.6 + idx) * 0.4;
      let targetZ = Math.sin(time * 1.2 + idx) * 0.3;

      if (hands.length > 0) {
        const hand = hands[idx % hands.length];
        const tip = (idx === 0) ? hand.indexTip : (idx === 1) ? hand.thumbTip : (idx === 2) ? hand.pinkyTip : hand.palmCenter;
        const world = screenToThreeWorld(tip.screenX, tip.screenY, screenWidth, screenHeight);
        
        const angleOffset = (idx - 1.5) * 0.55;
        targetX = world.x + Math.sin(angleOffset) * 0.65;
        targetY = world.y + 0.45 + Math.cos(angleOffset) * 0.3;
        targetZ = world.z + (idx % 2 === 0 ? 0.25 : -0.25);
      }

      w.targetPos.set(targetX, targetY, targetZ);
      w.currPos.x = lerp(w.currPos.x, w.targetPos.x, 0.16);
      w.currPos.y = lerp(w.currPos.y, w.targetPos.y, 0.16);
      w.currPos.z = lerp(w.currPos.z, w.targetPos.z, 0.16);

      w.mesh.position.copy(w.currPos);
      w.mesh.rotation.y = time * w.rotSpeed;
      w.mesh.rotation.z = Math.sin(time + idx) * 0.35;
      w.mesh.rotation.x = Math.cos(time * 0.6 + idx) * 0.3;

      const mat = w.mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = opacity * 0.88;
      const wireMat = w.wire.material as THREE.LineBasicMaterial;
      wireMat.opacity = opacity * 0.95;
    });
  }
}
