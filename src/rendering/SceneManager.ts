import * as THREE from 'three';
import { ARObjectManager } from '../state/ARObjectManager';
import { HandLandmarks } from '../types/vision';
import { GestureMetrics } from '../types/gestures';
import { VisualEffectState } from '../types/effects';

export class SceneManager {
  private container: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene3D: THREE.Scene;
  private camera3D: THREE.PerspectiveCamera;
  private objectsGroup: THREE.Group;
  private ghostPreviewGroup: THREE.Group;

  public arobjectManager: ARObjectManager;

  private width: number = 1280;
  private height: number = 720;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = container.clientWidth || window.innerWidth;
    this.height = container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });

    const dpr = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.autoClear = true;

    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.pointerEvents = 'none';

    this.container.appendChild(this.renderer.domElement);

    this.scene3D = new THREE.Scene();
    this.scene3D.background = null;

    this.camera3D = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 100);
    this.camera3D.position.set(0, 0, 5);
    this.camera3D.lookAt(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    this.scene3D.add(ambientLight);
    
    const magentaLight = new THREE.DirectionalLight(0xff00ff, 4.0);
    magentaLight.position.set(5, 5, 5);
    this.scene3D.add(magentaLight);

    const cyanLight = new THREE.DirectionalLight(0x00f5ff, 4.0);
    cyanLight.position.set(-5, -5, 5);
    this.scene3D.add(cyanLight);

    this.objectsGroup = new THREE.Group();
    this.scene3D.add(this.objectsGroup);

    // Ghost Preview Outline at spawn location
    this.ghostPreviewGroup = new THREE.Group();
    const ghostGeo = new THREE.PlaneGeometry(0.7, 0.42);
    const ghostMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff, wireframe: true, transparent: true, opacity: 0.35 });
    const ghostMesh = new THREE.Mesh(ghostGeo, ghostMat);
    this.ghostPreviewGroup.add(ghostMesh);
    this.ghostPreviewGroup.visible = false;
    this.scene3D.add(this.ghostPreviewGroup);

    this.arobjectManager = new ARObjectManager(this.objectsGroup);
  }

  public updateAndRender(
    hands: HandLandmarks[],
    gestures: GestureMetrics,
    activeTool: VisualEffectState,
    dt: number,
    time: number,
    renderScale: number = 1.0
  ): { creationTriggered: boolean; pinchHoldProgress: number } {
    const result = this.arobjectManager.update(hands, gestures, this.width, this.height, dt, time);

    if (hands.length > 0 && (activeTool === VisualEffectState.PURPLE_PRISM || activeTool === VisualEffectState.RECTANGLE_TRACKING)) {
      this.ghostPreviewGroup.visible = true;
      const { worldPos } = this.arobjectManager.calculateSpawnPosition(hands[0], this.width, this.height);
      this.ghostPreviewGroup.position.copy(worldPos);
      this.ghostPreviewGroup.rotation.z = time * 1.0;
    } else {
      this.ghostPreviewGroup.visible = false;
    }

    this.renderer.render(this.scene3D, this.camera3D);
    return result;
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
