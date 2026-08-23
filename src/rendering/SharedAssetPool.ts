import * as THREE from 'three';
import { VisualEffectState } from '../types/effects';
import { HalftoneShader } from '../shaders/halftoneShader';

export class SharedAssetPool {
  private static instance: SharedAssetPool;

  // Cached Geometries
  public prismCylinderGeo: THREE.CylinderGeometry;
  public prismInnerOctGeo: THREE.OctahedronGeometry;
  public wedgeConeGeo: THREE.ConeGeometry;
  public blockCubeGeo: THREE.BoxGeometry;
  public blockCuboidGeo: THREE.BoxGeometry;
  public ribbonBoxGeo: THREE.BoxGeometry;
  public planeHatchGeo: THREE.PlaneGeometry;

  // Cached Shared Materials
  public prismOuterMat: THREE.MeshStandardMaterial;
  public prismInnerMat: THREE.MeshStandardMaterial;
  public prismWireMat: THREE.LineBasicMaterial;
  public whiteWireMat: THREE.LineBasicMaterial;
  public wedgeMaterials: THREE.MeshStandardMaterial[];
  public blockPinkMat: THREE.MeshStandardMaterial;
  public blockMintMat: THREE.MeshStandardMaterial;
  public ribbonMaterials: THREE.MeshStandardMaterial[];

  private constructor() {
    // Geometries (Moderate size, 12-18% viewport height)
    this.prismCylinderGeo = new THREE.CylinderGeometry(0.32, 0.44, 0.75, 6, 1, false);
    this.prismInnerOctGeo = new THREE.OctahedronGeometry(0.24, 0);
    this.wedgeConeGeo = new THREE.ConeGeometry(0.25, 0.65, 3);
    this.blockCubeGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    this.blockCuboidGeo = new THREE.BoxGeometry(0.28, 0.55, 0.28);
    this.ribbonBoxGeo = new THREE.BoxGeometry(0.35, 0.22, 0.14);
    this.planeHatchGeo = new THREE.PlaneGeometry(0.9, 0.55, 4, 4);

    // Materials
    this.prismOuterMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide
    });

    this.prismInnerMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0xdb2777,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });

    this.prismWireMat = new THREE.LineBasicMaterial({ color: 0x4c1d95, linewidth: 2.5, transparent: true, opacity: 0.95 });
    this.whiteWireMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });

    const wedgeColors = [0x9333ea, 0xd946ef, 0xec4899];
    this.wedgeMaterials = wedgeColors.map(col => new THREE.MeshStandardMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: 0.85,
      roughness: 0.1,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide
    }));

    this.blockPinkMat = new THREE.MeshStandardMaterial({
      color: 0xff007f,
      emissive: 0xff007f,
      emissiveIntensity: 1.0,
      roughness: 0.1,
      transparent: true,
      opacity: 0.9
    });

    this.blockMintMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 1.0,
      roughness: 0.1,
      transparent: true,
      opacity: 0.9
    });

    const ribbonColors = [0x9333ea, 0x00f5ff, 0x22c55e, 0xfacc15, 0xf97316, 0xec4899];
    this.ribbonMaterials = ribbonColors.map(col => new THREE.MeshStandardMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9
    }));
  }

  public static getInstance(): SharedAssetPool {
    if (!SharedAssetPool.instance) {
      SharedAssetPool.instance = new SharedAssetPool();
    }
    return SharedAssetPool.instance;
  }

  public createShaderMaterial(isDots: boolean): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uOpacity: { value: 0.95 },
        uColorPrimary: { value: new THREE.Color(isDots ? 0xff007f : 0x00f5ff) },
        uColorSecondary: { value: new THREE.Color(isDots ? 0xff4081 : 0xb829ea) },
        uMode: { value: isDots ? 1 : 0 }
      },
      vertexShader: HalftoneShader.vertexShader,
      fragmentShader: HalftoneShader.fragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
  }
}
