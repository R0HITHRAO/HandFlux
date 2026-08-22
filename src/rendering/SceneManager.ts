import * as THREE from 'three';
import { ThermalShader } from '../shaders/thermalShader';
import { TrackedPlaneMesh } from '../geometry/TrackedPlaneMesh';
import { TriangleWedgesMesh } from '../geometry/TriangleWedgesMesh';
import { GlowingBlocksMesh } from '../geometry/GlowingBlocksMesh';
import { LargeStructureMesh } from '../geometry/LargeStructureMesh';
import { PurplePrismMesh } from '../geometry/PurplePrismMesh';
import { HandLandmarks } from '../types/vision';
import { VisualEffectState } from '../types/effects';
import { EffectStateMachine } from '../state/EffectStateMachine';

export class SceneManager {
  private container: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene3D: THREE.Scene;
  private camera3D: THREE.PerspectiveCamera;
  
  // Background Camera Quad
  private sceneBg: THREE.Scene;
  private cameraBg: THREE.OrthographicCamera;
  private bgQuad: THREE.Mesh;
  private bgMaterial: THREE.ShaderMaterial;
  private videoTexture: THREE.VideoTexture | THREE.CanvasTexture | null = null;
  private videoElement: HTMLVideoElement | null = null;

  // 3D Visual Meshes
  public trackedPlane: TrackedPlaneMesh;
  public triangleWedges: TriangleWedgesMesh;
  public glowingBlocks: GlowingBlocksMesh;
  public largeStructure: LargeStructureMesh;
  public purplePrism: PurplePrismMesh;

  private width: number = 1280;
  private height: number = 720;
  private isSyntheticBg: boolean = false;
  private dummyCanvas: HTMLCanvasElement;
  private dummyCtx: CanvasRenderingContext2D;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = container.clientWidth || window.innerWidth;
    this.height = container.clientHeight || window.innerHeight;

    // 1. Setup Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.autoClear = false;
    this.container.appendChild(this.renderer.domElement);

    // 2. Setup 3D Perspective Scene
    this.scene3D = new THREE.Scene();
    this.camera3D = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 100);
    this.camera3D.position.z = 5;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    this.scene3D.add(ambientLight);
    const dirLight1 = new THREE.DirectionalLight(0xff00ff, 3.0);
    dirLight1.position.set(5, 5, 5);
    this.scene3D.add(dirLight1);
    const dirLight2 = new THREE.DirectionalLight(0x00ffff, 3.0);
    dirLight2.position.set(-5, -5, 5);
    this.scene3D.add(dirLight2);

    // 3. Setup Background Quad with Orthographic Camera
    this.sceneBg = new THREE.Scene();
    this.cameraBg = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
    this.cameraBg.position.z = 1;

    // Dummy Canvas for synthetic fallback
    this.dummyCanvas = document.createElement('canvas');
    this.dummyCanvas.width = 640;
    this.dummyCanvas.height = 360;
    this.dummyCtx = this.dummyCanvas.getContext('2d')!;

    this.bgMaterial = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(ThermalShader.uniforms),
      vertexShader: ThermalShader.vertexShader,
      fragmentShader: ThermalShader.fragmentShader,
      depthTest: false,
      depthWrite: false
    });
    this.bgMaterial.uniforms.uResolution.value.set(this.width, this.height);

    const quadGeo = new THREE.PlaneGeometry(2, 2);
    this.bgQuad = new THREE.Mesh(quadGeo, this.bgMaterial);
    this.sceneBg.add(this.bgQuad);

    // Initialize 3D Visual Objects
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

  public setVideoSource(video: HTMLVideoElement | null): void {
    this.videoElement = video;
    if (video) {
      const tex = new THREE.VideoTexture(video);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      this.videoTexture = tex;
      this.bgMaterial.uniforms.tDiffuse.value = tex;
      this.isSyntheticBg = false;
    } else {
      this.isSyntheticBg = true;
    }
  }

  public updateAndRender(
    hands: HandLandmarks[],
    stateMachine: EffectStateMachine,
    time: number
  ): void {
    const isVideoLive = !!this.videoElement && this.videoElement.readyState >= 2 && this.videoElement.videoWidth > 0;

    if (!isVideoLive || this.isSyntheticBg || !this.videoTexture) {
      this.renderSyntheticBackground(time);
    } else if (this.videoTexture) {
      this.videoTexture.needsUpdate = true;
    }

    this.bgMaterial.uniforms.uThermalIntensity.value = stateMachine.getThermalIntensity();
    this.bgMaterial.uniforms.uBlurIntensity.value = stateMachine.getBlurIntensity();
    this.bgMaterial.uniforms.uTime.value = time;

    const rectHatchOpacity = stateMachine.getOpacity(VisualEffectState.RECTANGLE_TRACKING);
    const rectDotsOpacity = stateMachine.getOpacity(VisualEffectState.RECTANGLE_DOTS);
    const wedgeOpacity = Math.max(stateMachine.getOpacity(VisualEffectState.TRIANGLE_EFFECT), stateMachine.getOpacity(VisualEffectState.ANGULAR_OBJECT));
    const blocksOpacity = stateMachine.getOpacity(VisualEffectState.GLOW_BLOCKS);
    const largeOpacity = stateMachine.getOpacity(VisualEffectState.LARGE_GEOMETRY);
    const prismOpacity = stateMachine.getOpacity(VisualEffectState.PURPLE_PRISM);

    if (rectDotsOpacity > 0.05) {
      this.trackedPlane.update(hands, this.width, this.height, time, 1, rectDotsOpacity);
    } else {
      this.trackedPlane.update(hands, this.width, this.height, time, 0, rectHatchOpacity);
    }

    this.triangleWedges.update(hands, this.width, this.height, time, wedgeOpacity);
    this.glowingBlocks.update(hands, this.width, this.height, time, blocksOpacity);
    this.largeStructure.update(hands, this.width, this.height, time, largeOpacity);
    this.purplePrism.update(hands, this.width, this.height, time, prismOpacity);

    this.renderer.clear();
    this.renderer.render(this.sceneBg, this.cameraBg);
    this.renderer.clearDepth();
    this.renderer.render(this.scene3D, this.camera3D);
  }

  private renderSyntheticBackground(t: number): void {
    const ctx = this.dummyCtx;
    const w = this.dummyCanvas.width;
    const h = this.dummyCanvas.height;

    // Room studio gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#151522');
    grad.addColorStop(0.5, '#201c30');
    grad.addColorStop(1, '#0e0e18');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Studio grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Ambient room horizon
    const radial = ctx.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.45, w * 0.5);
    radial.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
    radial.addColorStop(0.7, 'rgba(6, 182, 212, 0.12)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, w, h);

    // Center silhouette
    ctx.fillStyle = 'rgba(32, 32, 50, 0.95)';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.88, w * 0.24, h * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.46, w * 0.095, h * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!this.videoTexture || !(this.videoTexture instanceof THREE.CanvasTexture)) {
      this.videoTexture = new THREE.CanvasTexture(this.dummyCanvas);
      this.bgMaterial.uniforms.tDiffuse.value = this.videoTexture;
    } else {
      this.videoTexture.needsUpdate = true;
    }
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.camera3D.aspect = width / height;
    this.camera3D.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.bgMaterial.uniforms.uResolution.value.set(width, height);
  }

  public getDomElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }
}
