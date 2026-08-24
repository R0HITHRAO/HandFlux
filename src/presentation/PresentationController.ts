export interface Slide {
  id: number;
  category: string;
  title: string;
  subtitle: string;
  bullets: string[];
  techBadge: string;
  codeSnippet?: string;
}

export const DEMO_SLIDES: Slide[] = [
  {
    id: 1,
    category: 'EXECUTIVE OVERVIEW',
    title: 'HandFlux: Touchless Human-Computer Interaction',
    subtitle: 'Real-Time Computer Vision & GPU-Accelerated Gesture Interface',
    bullets: [
      'Transforms ordinary consumer webcams into zero-latency touchless input devices.',
      '100% on-device MediaPipe landmark detection with WebGL hardware compositing.',
      'Eliminates physical contact for presentations, public kiosks, and 3D manipulation.'
    ],
    techBadge: 'MediaPipe • Three.js • React • WebGL'
  },
  {
    id: 2,
    category: 'SYSTEM ARCHITECTURE',
    title: 'Decoupled Multi-Loop Architecture',
    subtitle: 'Zero-Locking Vision and Rendering Pipelines',
    bullets: [
      'Camera Pipeline: Hardware video decoding at 30 FPS.',
      'Vision Pipeline: Asynchronous GPU inference at 28-30 FPS with downscaled texture buffers.',
      'Render Pipeline: 60 FPS Three.js rendering with OneEuro landmark jitter suppression.'
    ],
    techBadge: '60 FPS Target • Zero GC • Frame-Decoupled'
  },
  {
    id: 3,
    category: 'ENGINEERING BENCHMARKS',
    title: 'Measured Real-World Performance',
    subtitle: 'Sub-12ms Main Thread Frame Execution',
    bullets: [
      'Vision Latency: 5.8 ms inference duration on WebAssembly/GPU delegate.',
      'Interaction Update: 0.8 ms for 6-DOF geometric raycasting & bounding checks.',
      'Memory Stability: 0 byte leaks across 100 continuous object create/destroy cycles.'
    ],
    techBadge: '5.8ms Vision • 11ms Total Frame • 0 Leaks'
  },
  {
    id: 4,
    category: 'PORTFOLIO HIGHLIGHTS',
    title: 'Technical Capabilities & Skills Demonstrated',
    subtitle: 'Full-Stack Modern Frontend & Computer Vision Engineering',
    bullets: [
      'Frontend Architecture: Strict TypeScript, modular lifecycle state machines, Vite.',
      'Shader Graphics: Custom GLSL fragment shaders for halftone, laser hatching, and thermal false-color.',
      'HCI Design: Velocity-confirmed directional swiping, laser pointer tracking, and spatial bounding.'
    ],
    techBadge: 'TypeScript • GLSL • WebAssembly • Vitest'
  }
];

export class PresentationController {
  private currentSlideIndex: number = 0;
  private slides: Slide[] = DEMO_SLIDES;
  private laserPos: { x: number; y: number } = { x: 0.5, y: 0.5 };

  public nextSlide(): boolean {
    if (this.currentSlideIndex < this.slides.length - 1) {
      this.currentSlideIndex++;
      return true;
    }
    return false;
  }

  public prevSlide(): boolean {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
      return true;
    }
    return false;
  }

  public setSlide(index: number): void {
    if (index >= 0 && index < this.slides.length) {
      this.currentSlideIndex = index;
    }
  }

  public getCurrentSlide(): Slide {
    return this.slides[this.currentSlideIndex];
  }

  public getSlideCount(): number {
    return this.slides.length;
  }

  public getCurrentIndex(): number {
    return this.currentSlideIndex;
  }

  public updateLaser(screenX: number, screenY: number, w: number, h: number): void {
    this.laserPos = { x: screenX / w, y: screenY / h };
  }

  public getLaserPos(): { x: number; y: number } {
    return this.laserPos;
  }
}
