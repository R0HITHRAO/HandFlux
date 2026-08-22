import * as THREE from 'three';
import { TrackedPlaneMesh } from '../geometry/TrackedPlaneMesh';
import { TriangleWedgesMesh } from '../geometry/TriangleWedgesMesh';
import { GlowingBlocksMesh } from '../geometry/GlowingBlocksMesh';
import { LargeStructureMesh } from '../geometry/LargeStructureMesh';
import { PurplePrismMesh } from '../geometry/PurplePrismMesh';
import { HandLandmarks } from '../types/vision';
import { VisualEffectState } from '../types/effects';
import { EffectManager } from '../state/EffectManager';

export class SceneManager {
  private container: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene3D: THREE.Scene;
  private camera3D: THREE.PerspectiveCamera;

  // 3D Visual Meshes
  public trackedPlane: TrackedPlaneMesh;
  public triangleWedges: TriangleWedgesMesh;
  public glowingBlocks: GlowingBlocksMesh;
  public largeStructure: LargeStructureMesh;
  public purplePrism: PurplePrismMesh;

  private width: number = 1280;
  private height: number = 720;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = container.clientWidth || window.innerWidth;
    this.height = container.clientHeight || window.innerHeight;

    // 1. Transparent WebGL Renderer (NEVER PAINT BLACK)
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0); // 100% transparent clear color
    this.container.appendChild(this.renderer.domElement);

    // 2. 3D Perspective Scene
    this.scene3D = new THREE.Scene();
    this.scene3D.background = null; // NEVER use opaque scene background!

    this.camera3D = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 100);
    this.camera3D.position.z = 5;

    // Vibrant Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    this.scene3D.add(ambientLight);
    
    const magentaLight = new THREE.DirectionalLight(0xff00ff, 4.0);
    magentaLight.position.set(5, 5, 5);
    this.scene3D.add(magentaLight);

    const cyanLight = new THREE.DirectionalLight(0x00f5ff, 4.0);
    cyanLight.position.set(-5, -5, 5);
    this.scene3D.add(cyanLight);

    const goldLight = new THREE.DirectionalLight(0xfacc15, 3.0);
    goldLight.position.set(0, 5, -2);
    this.scene3D.add(goldLight);

    // 3. Initialize All 3D Visual Geometries
    this.trackedPlane = new TrackedPlaneMesh();
    this.scene3D.add(this.trackedPlane.group);

    this.triangleWedges = new TriangleWedgesMesh();
    this.scene3D.add(this.triangleWedges.group);

    this.glowingBlocks = new GlowingBlocksMesh();
    this.scene3D.add(this.glowingBlocks.group);

    this.largeStructure = new LargeStructureMesh();
    this.scene3D.add(this.largeStructure.group);

    this.purplePrism = new PurplePrismMesh();
    this.scene3D.add(this.purplePrism.group);
  }

  public updateAndRender(
    hands: HandLandmarks[],
    effectManager: EffectManager,
    time: number
  ): void {
    if (effectManager.isRawCamera()) {
      // In RAW CAMERA mode, hide all AR geometry
      this.renderer.clear();
      return;
    }

    // Retrieve live opacities from EffectManager
    const rectHatchOpacity = effectManager.getOpacity(VisualEffectState.RECTANGLE_TRACKING);
    const rectDotsOpacity = effectManager.getOpacity(VisualEffectState.RECTANGLE_DOTS);
    const wedgeOpacity = Math.max(
      effectManager.getOpacity(VisualEffectState.TRIANGLE_EFFECT),
      effectManager.getOpacity(VisualEffectState.ANGULAR_OBJECT)
    );
    const blocksOpacity = effectManager.getOpacity(VisualEffectState.GLOW_BLOCKS);
    const largeOpacity = effectManager.getOpacity(VisualEffectState.LARGE_GEOMETRY);
    const prismOpacity = effectManager.getOpacity(VisualEffectState.PURPLE_PRISM);

    // Update 3D Geometries
    if (rectDotsOpacity > 0.05) {
      this.trackedPlane.update(hands, this.width, this.height, time, 1, rectDotsOpacity);
    } else {
      this.trackedPlane.update(hands, this.width, this.height, time, 0, rectHatchOpacity);
    }

    this.triangleWedges.update(hands, this.width, this.height, time, wedgeOpacity);
    this.glowingBlocks.update(hands, this.width, this.height, time, blocksOpacity);
    this.largeStructure.update(hands, this.width, this.height, time, largeOpacity);
    this.purplePrism.update(hands, this.width, this.height, time, prismOpacity);

    // Render transparent 3D AR layer
    this.renderer.render(this.scene3D, this.camera3D);
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.camera3D.aspect = width / height;
    this.camera3D.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public getDomElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }
}
