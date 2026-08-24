import * as THREE from 'three';

export interface AtomData {
  element: string;
  name: string;
  atomicNumber: number;
  color: number;
  radius: number;
  position: THREE.Vector3;
  hybridization: string;
  valence: number;
}

export class MolecularScene {
  public group: THREE.Group;
  private atomMeshes: { mesh: THREE.Mesh; data: AtomData }[] = [];
  private highlightedMesh: THREE.Mesh | null = null;
  private orbitalRing: THREE.Line | null = null;

  constructor() {
    this.group = new THREE.Group();
    this.buildCaffeineMolecule();
  }

  private buildCaffeineMolecule(): void {
    const atoms: AtomData[] = [
      // Carbon Atoms (Charcoal Slate with Metallic Luster)
      { element: 'C', name: 'Carbon (C-Ring)', atomicNumber: 6, color: 0x475569, radius: 0.28, position: new THREE.Vector3(-0.7, 0.7, 0), hybridization: 'sp2', valence: 4 },
      { element: 'C', name: 'Carbon (C-Ring)', atomicNumber: 6, color: 0x475569, radius: 0.28, position: new THREE.Vector3(0.7, 0.7, 0), hybridization: 'sp2', valence: 4 },
      { element: 'C', name: 'Carbon (Carbonyl)', atomicNumber: 6, color: 0x475569, radius: 0.28, position: new THREE.Vector3(1.3, -0.4, 0), hybridization: 'sp2', valence: 4 },
      { element: 'C', name: 'Carbon (C-Ring)', atomicNumber: 6, color: 0x475569, radius: 0.28, position: new THREE.Vector3(0.0, -1.2, 0), hybridization: 'sp2', valence: 4 },
      { element: 'C', name: 'Carbon (Methyl)', atomicNumber: 6, color: 0x475569, radius: 0.25, position: new THREE.Vector3(-1.9, 1.4, 0), hybridization: 'sp3', valence: 4 },
      { element: 'C', name: 'Carbon (Methyl)', atomicNumber: 6, color: 0x475569, radius: 0.25, position: new THREE.Vector3(1.9, 1.4, 0), hybridization: 'sp3', valence: 4 },

      // Nitrogen Atoms (Electric Blue)
      { element: 'N', name: 'Nitrogen (Amide)', atomicNumber: 7, color: 0x3b82f6, radius: 0.29, position: new THREE.Vector3(-1.2, -0.4, 0), hybridization: 'sp2', valence: 3 },
      { element: 'N', name: 'Nitrogen (Ring)', atomicNumber: 7, color: 0x3b82f6, radius: 0.29, position: new THREE.Vector3(0.0, 1.4, 0), hybridization: 'sp2', valence: 3 },
      { element: 'N', name: 'Nitrogen (Imidaz)', atomicNumber: 7, color: 0x3b82f6, radius: 0.29, position: new THREE.Vector3(-0.7, -1.9, 0), hybridization: 'sp2', valence: 3 },

      // Oxygen Atoms (Vibrant Crimson)
      { element: 'O', name: 'Oxygen (Carbonyl)', atomicNumber: 8, color: 0xef4444, radius: 0.30, position: new THREE.Vector3(2.4, -0.6, 0), hybridization: 'sp2', valence: 2 },
      { element: 'O', name: 'Oxygen (Carbonyl)', atomicNumber: 8, color: 0xef4444, radius: 0.30, position: new THREE.Vector3(-0.1, -2.5, 0), hybridization: 'sp2', valence: 2 },

      // Hydrogen Atoms (Clean White)
      { element: 'H', name: 'Hydrogen', atomicNumber: 1, color: 0xffffff, radius: 0.18, position: new THREE.Vector3(-2.5, 1.2, 0.6), hybridization: 's', valence: 1 },
      { element: 'H', name: 'Hydrogen', atomicNumber: 1, color: 0xffffff, radius: 0.18, position: new THREE.Vector3(-1.9, 2.3, -0.4), hybridization: 's', valence: 1 },
      { element: 'H', name: 'Hydrogen', atomicNumber: 1, color: 0xffffff, radius: 0.18, position: new THREE.Vector3(2.5, 1.2, -0.5), hybridization: 's', valence: 1 }
    ];

    const sphereGeo = new THREE.SphereGeometry(1, 28, 28);
    const cylinderGeo = new THREE.CylinderGeometry(0.07, 0.07, 1, 14);
    const bondMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.4, roughness: 0.2 });

    // Create Atoms with High-Spec PBR Materials
    atoms.forEach(atom => {
      const mat = new THREE.MeshStandardMaterial({
        color: atom.color,
        metalness: 0.3,
        roughness: 0.2,
        emissive: atom.color,
        emissiveIntensity: 0.3
      });
      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.scale.setScalar(atom.radius);
      mesh.position.copy(atom.position);
      mesh.userData = { atomData: atom };
      this.group.add(mesh);
      this.atomMeshes.push({ mesh, data: atom });
    });

    // Create Bonds
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const d = atoms[i].position.distanceTo(atoms[j].position);
        if (d > 0.4 && d < 1.7) {
          const p1 = atoms[i].position;
          const p2 = atoms[j].position;
          const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
          const bond = new THREE.Mesh(cylinderGeo, bondMat);
          bond.scale.set(1, d, 1);
          bond.position.copy(mid);
          bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(p2, p1).normalize());
          this.group.add(bond);
        }
      }
    }

    // Glowing Orbital Rings
    const ringGeo = new THREE.RingGeometry(2.8, 2.85, 48);
    const ringMat = new THREE.LineBasicMaterial({ color: 0x00f5ff, transparent: true, opacity: 0.35 });
    const ring = new THREE.Line(ringGeo, ringMat);
    ring.rotation.x = Math.PI * 0.4;
    this.group.add(ring);
    this.orbitalRing = ring;
  }

  public updateOrbitals(time: number): void {
    if (this.orbitalRing) {
      this.orbitalRing.rotation.z = time * 0.5;
    }
  }

  public raycastAtom(raycaster: THREE.Raycaster): AtomData | null {
    const meshes = this.atomMeshes.map(a => a.mesh);
    const intersects = raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      if (this.highlightedMesh !== hit) {
        if (this.highlightedMesh) {
          ((this.highlightedMesh.material as THREE.MeshStandardMaterial).emissiveIntensity) = 0.3;
          this.highlightedMesh.scale.divideScalar(1.25);
        }
        this.highlightedMesh = hit;
        ((hit.material as THREE.MeshStandardMaterial).emissiveIntensity) = 1.2;
        hit.scale.multiplyScalar(1.25);
      }
      return hit.userData.atomData || null;
    } else {
      if (this.highlightedMesh) {
        ((this.highlightedMesh.material as THREE.MeshStandardMaterial).emissiveIntensity) = 0.3;
        this.highlightedMesh.scale.divideScalar(1.25);
        this.highlightedMesh = null;
      }
      return null;
    }
  }
}
