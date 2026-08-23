import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager } from '../rendering/SceneManager';
import { TechnicalHUDCanvas, HUDOptions } from '../overlays/TechnicalHUDCanvas';
import { HandLandmarkerService } from '../vision/HandLandmarkerService';
import { GestureEngine } from '../vision/GestureEngine';
import { CameraManager } from '../camera/CameraManager';
import { PerformanceMonitor } from '../rendering/PerformanceMonitor';
import { VisualEffectState, EFFECT_CONFIGS } from '../types/effects';
import { PerformanceMetrics } from '../types/performance';
import { GestureMetrics } from '../types/gestures';
import { HandLandmarks } from '../types/vision';
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

  // States
  const [activeTool, setActiveTool] = useState<VisualEffectState>(VisualEffectState.PURPLE_PRISM);
  const [isThermalActive, setIsThermalActive] = useState<boolean>(false);
  const [objectCount, setObjectCount] = useState<number>(0);
  const [showHUD, setShowHUD] = useState(true);
  const [showDebug, setShowDebug] = useState(true);
  const [cameraStatus, setCameraStatus] = useState<string>('INITIALIZING...');
  const [videoDimensions, setVideoDimensions] = useState<string>('0 x 0');

  const [perfMetrics, setPerfMetrics] = useState<PerformanceMetrics>({
    renderFps: 60,
    visionFps: 30,
    visionLatencyMs: 12,
    frameTimeMs: 16.6,
    qualityLevel: 'AUTO',
    activeParticles: 350,
    glslPasses: 3
  });

  const [gestureMetrics, setGestureMetrics] = useState<GestureMetrics>({
    primaryGesture: 'UNKNOWN',
    pinchDistance: 1,
    isPinching: false,
    twoHandDistance: 0,
    twoHandAngle: 0,
    twoHandMidpoint: { x: 0.5, y: 0.5, screenX: 0, screenY: 0 },
    spread: 0,
    overallVelocity: 0
  });

  const hudOptionsRef = useRef<HUDOptions>({
    showLandmarks: true,
    showCoordinates: true,
    showGuides: true,
    showReticles: true,
    showBoundingBox: true
  });

  // 1. Initialize Scene & Transparent WebGL
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

  // 2. Explicit User Creation Handler (Button / Spacebar)
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

  const handleToggleThermal = useCallback(() => {
    setIsThermalActive(prev => !prev);
  }, []);

  // 3. Vision Loop (~30 FPS)
  useEffect(() => {
    let visionTimer: ReturnType<typeof setTimeout>;
    let isRunning = true;

    const runVisionStep = () => {
      if (!isRunning) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const timestamp = performance.now();

      let hands: HandLandmarks[] = [];
      const video = videoRef.current;

      if (video && cameraManagerRef.current.getIsReady()) {
        hands = visionServiceRef.current.detectHands(video, timestamp, width, height);
      }

      latestHandsRef.current = hands;
      const gestures = gestureEngineRef.current.processHands(hands, width, height);
      setGestureMetrics(gestures);

      visionTimer = setTimeout(runVisionStep, 28);
    };

    runVisionStep();
    return () => {
      isRunning = false;
      clearTimeout(visionTimer);
    };
  }, []);

  // 4. Smooth 60 FPS Render Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let currThermal = 0.0;

    const loop = (timestamp: number) => {
      animId = requestAnimationFrame(loop);

      const dt = Math.max(0.001, Math.min(0.1, (timestamp - lastTime) / 1000.0));
      lastTime = timestamp;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const hands = latestHandsRef.current;
      const gestures = gestureEngineRef.current.processHands(hands, width, height);

      // Thermal Transition Easing
      const targetThermal = isThermalActive ? 1.0 : 0.0;
      currThermal += (targetThermal - currThermal) * Math.min(1.0, dt * 5.0);
      if (videoRef.current) {
        if (currThermal > 0.02) {
          const inv = (currThermal * 100).toFixed(0);
          const rot = (currThermal * 180).toFixed(0);
          const sat = (100 + currThermal * 300).toFixed(0);
          const con = (100 + currThermal * 80).toFixed(0);
          videoRef.current.style.filter = 'invert(' + inv + '%) hue-rotate(' + rot + 'deg) saturate(' + sat + '%) contrast(' + con + '%)';
        } else {
          videoRef.current.style.filter = 'none';
        }
      }

      // Update 3D Perspective Scene & Handle Pinch Timer
      let pinchHoldProgress = 0.0;
      if (sceneManagerRef.current) {
        sceneManagerRef.current.arobjectManager.setActiveTool(activeTool);
        const res = sceneManagerRef.current.updateAndRender(
          hands,
          gestures,
          activeTool,
          dt,
          timestamp / 1000.0
        );
        pinchHoldProgress = res.pinchHoldProgress;
        if (res.creationTriggered) {
          setObjectCount(sceneManagerRef.current.arobjectManager.getObjects().length);
        }
      }

      // Render 2D Technical HUD Overlay
      if (hudRef.current && showHUD && sceneManagerRef.current) {
        const objects = sceneManagerRef.current.arobjectManager.getObjects();
        const selected = sceneManagerRef.current.arobjectManager.getSelectedObject();
        hudRef.current.render(
          hands,
          gestures,
          activeTool,
          objects,
          selected ? selected.id : null,
          pinchHoldProgress,
          hudOptionsRef.current,
          perfMetrics.renderFps,
          timestamp / 1000.0
        );
      } else if (hudRef.current && !showHUD) {
        const ctx = hudCanvasRef.current?.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, width, height);
      }

      const metrics = perfMonitorRef.current.update(0);
      setPerfMetrics(metrics);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [showHUD, isThermalActive, activeTool, perfMetrics.renderFps]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') setActiveTool(VisualEffectState.RECTANGLE_TRACKING);
      if (e.key === '2') setActiveTool(VisualEffectState.TRIANGLE_EFFECT);
      if (e.key === '3') setActiveTool(VisualEffectState.GLOW_BLOCKS);
      if (e.key === '4') handleToggleThermal();
      if (e.key === '5') setActiveTool(VisualEffectState.RECTANGLE_DOTS);
      if (e.key === '6') setActiveTool(VisualEffectState.LARGE_GEOMETRY);
      if (e.key === '7') setActiveTool(VisualEffectState.PURPLE_PRISM);
      if (e.key === ' ' || e.key === 'Enter') handleCreateObject();
      if (e.key === 'Delete' || e.key === 'Backspace') handleDeleteSelected();
      if (e.key === 'h' || e.key === 'H') setShowHUD(p => !p);
      if (e.key === 'd' || e.key === 'D') setShowDebug(p => !p);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCreateObject, handleDeleteSelected, handleToggleThermal]);

  const handleCapture = useCallback(() => {
    if (sceneManagerRef.current && hudCanvasRef.current) {
      captureCanvasScreenshot(sceneManagerRef.current.getDomElement(), hudCanvasRef.current, 'handflux-capture.png');
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

      {/* LAYER 2: 2D HUD CANVAS (RED LANDMARKS, GREEN SKELETON, METER, MAGENTA FPS) */}
      <canvas ref={hudCanvasRef} className="absolute inset-0 z-20 pointer-events-none" />

      {/* COMPACT ARCHITECTURE DEBUG PANEL (TOP-RIGHT) */}
      {showDebug && (
        <div className="absolute top-4 right-4 z-30 p-3 bg-black/85 backdrop-blur-md border border-cyan-500/30 rounded-lg text-xs font-mono space-y-1.5 shadow-2xl text-white pointer-events-none min-w-[210px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-1 font-bold text-cyan-400">
            <span>CORE PIPELINE</span>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
          <div className="flex justify-between"><span className="text-white/60">CAMERA:</span> <span className={cameraStatus === 'ACTIVE' ? 'text-green-400 font-bold' : 'text-yellow-400'}>{cameraStatus}</span></div>
          <div className="flex justify-between"><span className="text-white/60">VIDEO:</span> <span>{videoDimensions}</span></div>
          <div className="flex justify-between"><span className="text-white/60">HANDS:</span> <span className="text-pink-400 font-bold">{latestHandsRef.current.length}</span></div>
          <div className="flex justify-between"><span className="text-white/60">VISION FPS:</span> <span>{perfMetrics.visionFps}</span></div>
          <div className="flex justify-between"><span className="text-white/60">RENDER FPS:</span> <span>{perfMetrics.renderFps}</span></div>
          <div className="flex justify-between"><span className="text-white/60">CURRENT TOOL:</span> <span className="text-cyan-300 font-bold">{EFFECT_CONFIGS[activeTool]?.name || 'NONE'}</span></div>
          <div className="flex justify-between"><span className="text-white/60">OBJECTS:</span> <span className="text-yellow-300 font-bold">{objectCount}/5</span></div>
          <div className="flex justify-between"><span className="text-white/60">WEBGL:</span> <span className="text-emerald-400">OK (TRANSPARENT)</span></div>
          <div className="pt-1 text-[10px] text-white/40 border-t border-white/10">Press D to toggle panel</div>
        </div>
      )}

      {/* LAYER 3: TOOLBAR WITH OBJECT TOOLS, THERMAL TOGGLE & CREATE/DELETE */}
      <ControlBar
        activeTool={activeTool}
        isThermalActive={isThermalActive}
        showHUD={showHUD}
        objectCount={objectCount}
        onSelectTool={setActiveTool}
        onToggleThermal={handleToggleThermal}
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
