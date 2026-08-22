import * as THREE from 'three';
import { HandLandmarks } from '../types/vision';
import { screenToThreeWorld, lerp } from '../utils/mathUtils';

export class TriangleWedgesMesh {
  public group: THREE.Group;
  private wedges: { mesh: THREE.Mesh; wire: THREE.LineSegments; targetPos: THREE.Vector3; currPos: THREE.Vector3; rotSpeed: number }[] = [];

  constructor() {
    this.group = new THREE.Group();

    const wedgeConfigs = [
      { color: 0xb829ea, edgeColor: 0xff00ff, scale: [0.7, 1.4, 0.4] },
      { color: 0x9333ea, edgeColor: 0xf43f5e, scale: [0.6, 1.2, 0.35] },
      { color: 0xd946ef, edgeColor: 0x38bdf8, scale: [0.5, 1.0, 0.3] },
      { color: 0x7e22ce, edgeColor: 0xa855f7, scale: [0.8, 1.5, 0.45] }
    ];

    wedgeConfigs.forEach((cfg, idx) => {
      const geom = this.createPrismGeometry();
      const mat = new THREE.MeshPhysicalMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.3,
        roughness: 0.15,
        transmission: 0.7,
        thickness: 0.5,
        transparent: true,
        opacity: 0.8,
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
        rotSpeed: 0.4 + idx * 0.2
      });
    });

    this.group.visible = false;
  }

  private createPrismGeometry(): THREE.BufferGeometry {
    const geom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // Front triangle
       0.0,  0.6,  0.3,
      -0.4, -0.4,  0.3,
       0.4, -0.4,  0.3,
      // Back triangle
       0.0,  0.6, -0.3,
      -0.4, -0.4, -0.3,
       0.4, -0.4, -0.3
    ]);

    const indices = [
      0, 1, 2,
      3, 5, 4,
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
      let targetX = (idx % 2 === 0 ? -1.2 : 1.2) + Math.sin(time + idx) * 0.3;
      let targetY = 0.5 + Math.cos(time * 0.8 + idx) * 0.4;
      let targetZ = Math.sin(time * 1.5 + idx) * 0.2;

      if (hands.length > 0) {
        const hand = hands[idx % hands.length];
        const tip = (idx === 0) ? hand.indexTip : (idx === 1) ? hand.thumbTip : (idx === 2) ? hand.pinkyTip : hand.palmCenter;
        const world = screenToThreeWorld(tip.screenX, tip.screenY, screenWidth, screenHeight);
        
        const angleOffset = (idx - 1.5) * 0.6;
        targetX = world.x + Math.sin(angleOffset) * 0.6;
        targetY = world.y + 0.4 + Math.cos(angleOffset) * 0.3;
        targetZ = world.z + (idx % 2 === 0 ? 0.2 : -0.2);
      }

      w.targetPos.set(targetX, targetY, targetZ);

      w.currPos.x = lerp(w.currPos.x, w.targetPos.x, 0.12);
      w.currPos.y = lerp(w.currPos.y, w.targetPos.y, 0.12);
      w.currPos.z = lerp(w.currPos.z, w.targetPos.z, 0.12);

      w.mesh.position.copy(w.currPos);
      w.mesh.rotation.y = time * w.rotSpeed;
      w.mesh.rotation.z = Math.sin(time + idx) * 0.25;
      w.mesh.rotation.x = Math.cos(time * 0.5 + idx) * 0.2;

      const mat = w.mesh.material as THREE.MeshPhysicalMaterial;
      mat.opacity = opacity * 0.85;
      const wireMat = w.wire.material as THREE.LineBasicMaterial;
      wireMat.opacity = opacity * 0.95;
    });
  }
}
