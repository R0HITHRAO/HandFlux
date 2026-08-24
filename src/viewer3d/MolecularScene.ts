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

  constructor() {
    this.group = new THREE.Group();
    this.buildCaffeineMolecule();
  }

  private buildCaffeineMolecule(): void {
    // Caffeine (C8H10N4O2) Atomic Coordinates
    const atoms: AtomData[] = [
      // Carbon Atoms (Grey / Charcoal)
      { element: 'C', name: 'Carbon (Ring)', atomicNumber: 6, color: 0x334155, radius: 0.26, position: new THREE.Vector3(-0.6, 0.7, 0), hybridization: 'sp2', valence: 4 },
      { element: 'C', name: 'Carbon (Ring)', atomicNumber: 6, color: 0x334155, radius: 0.26, position: new THREE.Vector3(0.6, 0.7, 0), hybridization: 'sp2', valence: 4 },
      { element: 'C', name: 'Carbon (Carbonyl)', atomicNumber: 6, color: 0x334155, radius: 0.26, position: new THREE.Vector3(1.2, -0.4, 0), hybridization: 'sp2', valence: 4 },
      { element: 'C', name: 'Carbon (Ring)', atomicNumber: 6, color: 0x334155, radius: 0.26, position: new THREE.Vector3(0.0, -1.2, 0), hybridization: 'sp2', valence: 4 },
      { element: 'C', name: 'Carbon (Methyl)', atomicNumber: 6, color: 0x334155, radius: 0.24, position: new THREE.Vector3(-1.8, 1.4, 0), hybridization: 'sp3', valence: 4 },
      { element: 'C', name: 'Carbon (Methyl)', atomicNumber: 6, color: 0x334155, radius: 0.24, position: new THREE.Vector3(1.8, 1.4, 0), hybridization: 'sp3', valence: 4 },

      // Nitrogen Atoms (Blue)
      { element: 'N', name: 'Nitrogen (Ring)', atomicNumber: 7, color: 0x3b82f6, radius: 0.27, position: new THREE.Vector3(-1.1, -0.4, 0), hybridization: 'sp2', valence: 3 },
      { element: 'N', name: 'Nitrogen (Ring)', atomicNumber: 7, color: 0x3b82f6, radius: 0.27, position: new THREE.Vector3(0.0, 1.3, 0), hybridization: 'sp2', valence: 3 },
      { element: 'N', name: 'Nitrogen (Bridge)', atomicNumber: 7, color: 0x3b82f6, radius: 0.27, position: new THREE.Vector3(-0.7, -1.8, 0), hybridization: 'sp2', valence: 3 },

      // Oxygen Atoms (Red / Coral)
      { element: 'O', name: 'Oxygen (Carbonyl)', atomicNumber: 8, color: 0xef4444, radius: 0.28, position: new THREE.Vector3(2.3, -0.6, 0), hybridization: 'sp2', valence: 2 },
      { element: 'O', name: 'Oxygen (Carbonyl)', atomicNumber: 8, color: 0xef4444, radius: 0.28, position: new THREE.Vector3(-0.1, -2.4, 0), hybridization: 'sp2', valence: 2 },

      // Hydrogen Atoms (White)
      { element: 'H', name: 'Hydrogen', atomicNumber: 1, color: 0xf8fafc, radius: 0.16, position: new THREE.Vector3(-2.4, 1.2, 0.6), hybridization: 's', valence: 1 },
      { element: 'H', name: 'Hydrogen', atomicNumber: 1, color: 0xf8fafc, radius: 0.16, position: new THREE.Vector3(-1.8, 2.3, -0.4), hybridization: 's', valence: 1 },
      { element: 'H', name: 'Hydrogen', atomicNumber: 1, color: 0xf8fafc, radius: 0.16, position: new THREE.Vector3(2.4, 1.2, -0.5), hybridization: 's', valence: 1 }
    ];

    const sphereGeo = new THREE.SphereGeometry(1, 24, 24);
    const cylinderGeo = new THREE.CylinderGeometry(0.06, 0.06, 1, 12);
    const bondMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.3, roughness: 0.3 });

    // Create Atoms
    atoms.forEach(atom => {
      const mat = new THREE.MeshStandardMaterial({
        color: atom.color,
        metalness: 0.2,
        roughness: 0.2,
        emissive: atom.color,
        emissiveIntensity: 0.25
      });
      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.scale.setScalar(atom.radius);
      mesh.position.copy(atom.position);
      mesh.userData = { atomData: atom };
      this.group.add(mesh);
      this.atomMeshes.push({ mesh, data: atom });
    });

    // Connect Bonds between nearby atoms
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const d = atoms[i].position.distanceTo(atoms[j].position);
        if (d > 0.4 && d < 1.6) {
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
  }

  public raycastAtom(raycaster: THREE.Raycaster): AtomData | null {
    const intersects = raycaster.intersectObjects(this.atomMeshes.map(a => a.mesh));
    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      if (this.highlightedMesh !== hit) {
        if (this.highlightedMesh) {
          ((this.highlightedMesh.material as THREE.MeshStandardMaterial).emissiveIntensity) = 0.25;
        }
        this.highlightedMesh = hit;
        ((hit.material as THREE.MeshStandardMaterial).emissiveIntensity) = 1.0;
      }
      return hit.userData.atomData || null;
    } else {
      if (this.highlightedMesh) {
        ((this.highlightedMesh.material as THREE.MeshStandardMaterial).emissiveIntensity) = 0.25;
        this.highlightedMesh = null;
      }
      return null;
    }
  }
}
