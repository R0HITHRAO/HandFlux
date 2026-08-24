import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager } from '../rendering/SceneManager';
import { TechnicalHUDCanvas, HUDOptions } from '../overlays/TechnicalHUDCanvas';
import { HandLandmarkerService } from '../vision/HandLandmarkerService';
import { GestureEngine } from '../vision/GestureEngine';
import { CameraManager } from '../camera/CameraManager';
import { PerformanceMonitor } from '../rendering/PerformanceMonitor';
import { VisualEffectState, EFFECT_CONFIGS } from '../types/effects';
import { HandLandmarks } from '../types/vision';
import { PerformanceMetrics } from '../types/performance';
import { ControlBar } from './ControlBar';
import { captureCanvasScreenshot } from '../utils/recording';

interface MainViewProps {
  initialMode?: 'LIVE' | 'DEMO';
  initialUseSimulation?: boolean;
}

export const MainView: React.FC<MainViewProps> = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const arContainerRef = useRef<HTMLDivElement>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement>(null);

  const sceneManagerRef = useRef<SceneManager | null>(null);
  const hudRef = useRef<TechnicalHUDCanvas | null>(null);
  const cameraManagerRef = useRef<CameraManager>(new CameraManager());
  const visionServiceRef = useRef<HandLandmarkerService>(new HandLandmarkerService());
  const gestureEngineRef = useRef<GestureEngine>(new GestureEngine());
  const perfMonitorRef = useRef<PerformanceMonitor>(new PerformanceMonitor());

  const latestHandsRef = useRef<HandLandmarks[]>([]);

  const [activeTool, setActiveTool] = useState<VisualEffectState>(VisualEffectState.NONE);
  const [objectCount, setObjectCount] = useState<number>(0);
  const [showHUD, setShowHUD] = useState(true);
  const [showDebug, setShowDebug] = useState(true);
  const [cameraStatus, setCameraStatus] = useState<string>('INITIALIZING...');
  const [videoDimensions, setVideoDimensions] = useState<string>('0 x 0');

  // Low-frequency UI Debug State (Updated at 5 Hz to eliminate React re-render overhead)
  const [debugMetrics, setDebugMetrics] = useState<PerformanceMetrics>({
    cameraFps: 30,
    visionFps: 28,
    renderFps: 60,
    visionTimeMs: 6.0,
    visionLatencyMs: 6.0,
    arUpdateTimeMs: 0.8,
    renderTimeMs: 4.2,
    totalFrameTimeMs: 11.0,
    frameTimeMs: 11.0,
    qualityLevel: 'HIGH',
    activeParticles: 350,
    dpr: 1,
    renderScale: 1.0
  });

  const [debugSelected, setDebugSelected] = useState<string>('NONE');
  const [debugGesture, setDebugGesture] = useState<string>('OPEN_PALM');
  const [debugHandsCount, setDebugHandsCount] = useState<number>(0);

  const hudOptionsRef = useRef<HUDOptions>({
    showLandmarks: true,
    showCoordinates: true,
    showGuides: true,
    showReticles: true,
    showBoundingBox: true
  });

  // 1. Initial WebGL & Camera Setup
  useEffect(() => {
    if (!arContainerRef.current || !hudCanvasRef.current || !videoRef.current) return;

    const scene = new SceneManager(arContainerRef.current);
    sceneManagerRef.current = scene;

    const hud = new TechnicalHUDCanvas(hudCanvasRef.current);
    hudRef.current = hud;

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      scene.resize(w, h);
      if (hudCanvasRef.current) {
        hudCanvasRef.current.width = w;
        hudCanvasRef.current.height = h;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const initCameraAndVision = async () => {
      try {
        setCameraStatus('INITIALIZING VISION...');
        await visionServiceRef.current.initialize();

        if (videoRef.current) {
          setCameraStatus('REQUESTING WEBCAM...');
          await cameraManagerRef.current.attachToVideo(videoRef.current);
          setCameraStatus('ACTIVE');
          setVideoDimensions(videoRef.current.videoWidth + ' x ' + videoRef.current.videoHeight);
        }
      } catch (err: any) {
        console.error('Camera startup error:', err);
        setCameraStatus('ERROR: ' + (err.message || 'Access Denied'));
      }
    };

    initCameraAndVision();

    return () => {
      cameraManagerRef.current.stopCamera();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 2. Discrete Event Handlers
  const handleCreateObject = useCallback(() => {
    if (!sceneManagerRef.current) return;
    const hands = latestHandsRef.current;
    if (hands.length === 0) return;

    const newObj = sceneManagerRef.current.arobjectManager.createObjectAtHand(
      activeTool,
      hands[0],
      window.innerWidth,
      window.innerHeight
    );
    if (newObj) {
      setActiveTool(newObj.type);
      setObjectCount(sceneManagerRef.current.arobjectManager.getObjects().length);
    }
  }, [activeTool]);

  const handleDeleteSelected = useCallback(() => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.arobjectManager.deleteSelected();
    setObjectCount(sceneManagerRef.current.arobjectManager.getObjects().length);
  }, []);

  const handleClearAll = useCallback(() => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.arobjectManager.clearAll();
    setObjectCount(0);
  }, []);

  // 3. High-Efficiency Vision Loop (Decoupled, Throttled to ~28 FPS)
  useEffect(() => {
    let isRunning = true;
    let timerId: ReturnType<typeof setTimeout>;

    const runVisionStep = () => {
      if (!isRunning) return;
      if (document.hidden) {
        timerId = setTimeout(runVisionStep, 200);
        return;
      }

      const width = window.innerWidth;
      const height = window.innerHeight;
      const tStart = performance.now();

      let hands: HandLandmarks[] = [];
      const video = videoRef.current;

      if (video && cameraManagerRef.current.getIsReady()) {
        perfMonitorRef.current.recordCameraFrame(tStart);
        hands = visionServiceRef.current.detectHands(video, tStart, width, height);
      }

      const tEnd = performance.now();
      perfMonitorRef.current.recordVisionInference(tEnd - tStart, tEnd);
      latestHandsRef.current = hands;

      timerId = setTimeout(runVisionStep, 32);
    };

    runVisionStep();
    return () => {
      isRunning = false;
      clearTimeout(timerId);
    };
  }, []);

  // 4. Low-Frequency Telemetry Poller (5 Hz)
  useEffect(() => {
    const interval = setInterval(() => {
      const m = perfMonitorRef.current.getMetrics();
      const hands = latestHandsRef.current;
      const gestures = gestureEngineRef.current.processHands(hands, window.innerWidth, window.innerHeight);
      const selected = sceneManagerRef.current?.arobjectManager.getSelectedObject();

      let selectedLabel = 'NONE';
      if (selected) {
        const typeName = (selected.type === VisualEffectState.RECTANGLE_TRACKING) ? 'HATCH' : 'PRISM';
        selectedLabel = typeName + ' [' + selected.state + ']';
      }

      setDebugMetrics(m);
      setDebugHandsCount(hands.length);
      setDebugGesture(gestures.primaryGesture);
      setDebugSelected(selectedLabel);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // 5. 60 FPS Render Loop (Zero Allocations, Stage-Level Profiling)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (timestamp: number) => {
      animId = requestAnimationFrame(loop);
      const frameStart = performance.now();

      const dt = Math.max(0.001, Math.min(0.08, (timestamp - lastTime) * 0.001));
      lastTime = timestamp;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const hands = latestHandsRef.current;

      // Stage 1: Gesture Processing & Interaction Update
      const updateStart = performance.now();
      const gestures = gestureEngineRef.current.processHands(hands, width, height);

      let pinchHoldProgress = 0.0;
      if (sceneManagerRef.current) {
        sceneManagerRef.current.arobjectManager.setActiveTool(activeTool);
        const renderScale = perfMonitorRef.current.getRenderScale();
        const res = sceneManagerRef.current.updateAndRender(
          hands,
          gestures,
          activeTool,
          dt,
          timestamp * 0.001,
          renderScale
        );
        pinchHoldProgress = res.pinchHoldProgress;
        if (res.creationTriggered) {
          setObjectCount(sceneManagerRef.current.arobjectManager.getObjects().length);
        }
      }
      const updateEnd = performance.now();

      // Stage 2: 2D HUD Canvas Render
      const renderPassStart = performance.now();
      if (hudRef.current && showHUD && sceneManagerRef.current) {
        const objects = sceneManagerRef.current.arobjectManager.getObjects();
        const selected = sceneManagerRef.current.arobjectManager.getSelectedObject();
        const metrics = perfMonitorRef.current.getMetrics();
        hudRef.current.render(
          hands,
          gestures,
          activeTool,
          objects,
          selected ? selected.id : null,
          pinchHoldProgress,
          hudOptionsRef.current,
          metrics,
          timestamp * 0.001
        );
      } else if (hudRef.current && !showHUD) {
        const ctx = hudCanvasRef.current?.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, width, height);
      }
      const renderPassEnd = performance.now();

      const totalFrameEnd = performance.now();
      perfMonitorRef.current.recordRenderTimings(
        updateEnd - updateStart,
        renderPassEnd - renderPassStart,
        totalFrameEnd - frameStart,
        totalFrameEnd
      );
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [showHUD, activeTool]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1' || e.key === 'h' || e.key === 'H') {
        setActiveTool(prev => prev === VisualEffectState.RECTANGLE_TRACKING ? VisualEffectState.NONE : VisualEffectState.RECTANGLE_TRACKING);
      }
      if (e.key === '2' || e.key === 'p' || e.key === 'P') {
        setActiveTool(prev => prev === VisualEffectState.PURPLE_PRISM ? VisualEffectState.NONE : VisualEffectState.PURPLE_PRISM);
      }
      if (e.key === ' ' || e.key === 'Enter') handleCreateObject();
      if (e.key === 'Delete' || e.key === 'Backspace') handleDeleteSelected();
      if (e.key === 'd' || e.key === 'D') setShowDebug(p => !p);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCreateObject, handleDeleteSelected]);

  const handleCapture = useCallback(() => {
    if (sceneManagerRef.current && hudCanvasRef.current) {
      captureCanvasScreenshot(sceneManagerRef.current.getDomElement(), hudCanvasRef.current, 'handflux-audit.png');
    }
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
      {/* LAYER 0: LIVE MIRRORED WEBCAM */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover z-0 transition-all duration-150"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* LAYER 1: TRANSPARENT THREE.JS WebGL ON-DEMAND AR CANVAS */}
      <div ref={arContainerRef} className="absolute inset-0 z-10 pointer-events-none" />

      {/* LAYER 2: 2D HUD CANVAS (RED LANDMARKS, GREEN SKELETON, METER, DUAL FPS) */}
      <canvas ref={hudCanvasRef} className="absolute inset-0 z-20 pointer-events-none" />

      {/* PERFORMANCE AUDIT HUD (TOP-RIGHT) */}
      {showDebug && (
        <div className="absolute top-4 right-4 z-30 p-3.5 bg-black/90 backdrop-blur-md border border-cyan-500/40 rounded-xl text-xs font-mono space-y-1.5 shadow-2xl text-white pointer-events-none min-w-[240px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5 font-bold text-cyan-400">
            <span>PERFORMANCE AUDIT</span>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>

          {/* Frame Rates */}
          <div className="grid grid-cols-3 gap-1 py-1 border-b border-white/10 text-center font-bold">
            <div><div className="text-[10px] text-white/50">CAMERA</div><div className="text-emerald-400">{debugMetrics.cameraFps} FPS</div></div>
            <div><div className="text-[10px] text-white/50">VISION</div><div className="text-cyan-300">{debugMetrics.visionFps} FPS</div></div>
            <div><div className="text-[10px] text-white/50">RENDER</div><div className="text-pink-400">{debugMetrics.renderFps} FPS</div></div>
          </div>

          {/* Frame Stage Timings */}
          <div className="space-y-1 py-1 border-b border-white/10 text-[11px]">
            <div className="flex justify-between"><span className="text-white/60">VISION TIME:</span> <span className="text-cyan-300">{debugMetrics.visionTimeMs} ms</span></div>
            <div className="flex justify-between"><span className="text-white/60">UPDATE TIME:</span> <span className="text-yellow-300">{debugMetrics.arUpdateTimeMs} ms</span></div>
            <div className="flex justify-between"><span className="text-white/60">RENDER TIME:</span> <span className="text-purple-300">{debugMetrics.renderTimeMs} ms</span></div>
            <div className="flex justify-between font-bold"><span className="text-white/80">TOTAL FRAME:</span> <span className="text-green-400">{debugMetrics.totalFrameTimeMs} ms</span></div>
          </div>

          {/* Runtime State */}
          <div className="space-y-1 pt-1 text-[11px]">
            <div className="flex justify-between"><span className="text-white/60">OBJECTS:</span> <span className="text-yellow-300 font-bold">{objectCount}/5</span></div>
            <div className="flex justify-between"><span className="text-white/60">PARTICLES:</span> <span>{debugMetrics.activeParticles}</span></div>
            <div className="flex justify-between"><span className="text-white/60">QUALITY / DPR:</span> <span className="text-emerald-300">{debugMetrics.qualityLevel} ({debugMetrics.dpr}x)</span></div>
            <div className="flex justify-between"><span className="text-white/60">RENDER SCALE:</span> <span>{debugMetrics.renderScale.toFixed(2)}x</span></div>
            <div className="flex justify-between"><span className="text-white/60">SELECTED:</span> <span className="text-pink-400 font-bold">{debugSelected}</span></div>
          </div>
          <div className="pt-1 text-[10px] text-white/40 border-t border-white/10">Press D to toggle HUD</div>
        </div>
      )}

      {/* LAYER 3: TOOLBAR WITH HATCH & PRISM SELECTORS, CREATE, DELETE & CLEAR */}
      <ControlBar
        activeTool={activeTool}
        isThermalActive={false}
        showHUD={showHUD}
        objectCount={objectCount}
        onSelectTool={setActiveTool}
        onToggleThermal={() => {}}
        onCreateObject={handleCreateObject}
        onDeleteSelected={handleDeleteSelected}
        onClearAll={handleClearAll}
        onCapture={handleCapture}
        onToggleHUD={() => setShowHUD(p => !p)}
        onToggleFullscreen={handleToggleFullscreen}
      />
    </div>
  );
};
