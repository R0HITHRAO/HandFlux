import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager } from '../rendering/SceneManager';
import { TechnicalHUDCanvas, HUDOptions } from '../overlays/TechnicalHUDCanvas';
import { HandLandmarkerService } from '../vision/HandLandmarkerService';
import { GestureEngine } from '../vision/GestureEngine';
import { CameraManager } from '../camera/CameraManager';
import { PerformanceMonitor } from '../rendering/PerformanceMonitor';
import { VisualEffectState, EFFECT_CONFIGS } from '../types/effects';
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

  // Milestone 1 Requirement: Initial state CURRENT TOOL = NONE, OBJECTS = 0
  const [activeTool, setActiveTool] = useState<VisualEffectState>(VisualEffectState.NONE);
  const [objectCount, setObjectCount] = useState<number>(0);
  const [showHUD, setShowHUD] = useState(true);
  const [showDebug, setShowDebug] = useState(true);
  const [cameraStatus, setCameraStatus] = useState<string>('INITIALIZING...');
  const [videoDimensions, setVideoDimensions] = useState<string>('0 x 0');

  // Low-frequency UI Debug State (5 Hz)
  const [debugStats, setDebugStats] = useState({
    renderFps: 60,
    visionFps: 30,
    handsCount: 0,
    gesture: 'OPEN_PALM',
    selectedId: 'NONE'
  });

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

  // 2. Discrete Event Handlers (Never inside render loop)
  const handleCreateObject = useCallback(() => {
    if (!sceneManagerRef.current) return;
    const hands = latestHandsRef.current;
    if (hands.length === 0) return;

    const newObj = sceneManagerRef.current.arobjectManager.createObjectAtHand(
      VisualEffectState.PURPLE_PRISM,
      hands[0],
      window.innerWidth,
      window.innerHeight
    );
    if (newObj) {
      setActiveTool(VisualEffectState.PURPLE_PRISM);
      setObjectCount(sceneManagerRef.current.arobjectManager.getObjects().length);
    }
  }, []);

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

  // 3. Vision Loop (Throttled to 25-30 FPS, Async)
  useEffect(() => {
    let visionTimer: ReturnType<typeof setTimeout>;
    let isRunning = true;

    const runVisionStep = () => {
      if (!isRunning) return;
      if (document.hidden) {
        visionTimer = setTimeout(runVisionStep, 200);
        return;
      }

      const width = window.innerWidth;
      const height = window.innerHeight;
      const tStart = performance.now();

      let hands: HandLandmarks[] = [];
      const video = videoRef.current;

      if (video && cameraManagerRef.current.getIsReady()) {
        hands = visionServiceRef.current.detectHands(video, tStart, width, height);
      }

      const tEnd = performance.now();
      perfMonitorRef.current.recordVisionInference(tEnd - tStart, tEnd);
      latestHandsRef.current = hands;

      visionTimer = setTimeout(runVisionStep, 32);
    };

    runVisionStep();
    return () => {
      isRunning = false;
      clearTimeout(visionTimer);
    };
  }, []);

  // 4. Low-Frequency UI Statistics Poller (5 Hz)
  useEffect(() => {
    const interval = setInterval(() => {
      const m = perfMonitorRef.current.getMetrics();
      const hands = latestHandsRef.current;
      const gestures = gestureEngineRef.current.processHands(hands, window.innerWidth, window.innerHeight);
      const selected = sceneManagerRef.current?.arobjectManager.getSelectedObject();

      setDebugStats({
        renderFps: m.renderFps,
        visionFps: m.visionFps,
        handsCount: hands.length,
        gesture: gestures.primaryGesture,
        selectedId: selected ? (selected.state === 'GRABBED' ? 'PRISM [GRABBED]' : 'PRISM [SELECTED]') : 'NONE'
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // 5. 60 FPS Render Loop (Zero Allocations)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (timestamp: number) => {
      animId = requestAnimationFrame(loop);
      perfMonitorRef.current.recordRenderFrame(timestamp);

      const dt = Math.max(0.001, Math.min(0.08, (timestamp - lastTime) / 1000.0));
      lastTime = timestamp;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const hands = latestHandsRef.current;
      const gestures = gestureEngineRef.current.processHands(hands, width, height);

      // Update 3D Perspective Scene & Interaction State
      let pinchHoldProgress = 0.0;
      if (sceneManagerRef.current) {
        sceneManagerRef.current.arobjectManager.setActiveTool(activeTool);
        const renderScale = perfMonitorRef.current.getRenderScale();
        const res = sceneManagerRef.current.updateAndRender(
          hands,
          gestures,
          activeTool,
          dt,
          timestamp / 1000.0,
          renderScale
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
        const metrics = perfMonitorRef.current.getMetrics();
        hudRef.current.render(
          hands,
          gestures,
          activeTool,
          objects,
          selected ? selected.id : null,
          pinchHoldProgress,
          hudOptionsRef.current,
          metrics.renderFps,
          metrics.visionFps,
          timestamp / 1000.0
        );
      } else if (hudRef.current && !showHUD) {
        const ctx = hudCanvasRef.current?.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, width, height);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [showHUD, activeTool]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1' || e.key === 'p' || e.key === 'P') {
        setActiveTool(prev => prev === VisualEffectState.PURPLE_PRISM ? VisualEffectState.NONE : VisualEffectState.PURPLE_PRISM);
      }
      if (e.key === ' ' || e.key === 'Enter') handleCreateObject();
      if (e.key === 'Delete' || e.key === 'Backspace') handleDeleteSelected();
      if (e.key === 'h' || e.key === 'H') setShowHUD(p => !p);
      if (e.key === 'd' || e.key === 'D') setShowDebug(p => !p);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCreateObject, handleDeleteSelected]);

  const handleCapture = useCallback(() => {
    if (sceneManagerRef.current && hudCanvasRef.current) {
      captureCanvasScreenshot(sceneManagerRef.current.getDomElement(), hudCanvasRef.current, 'handflux-prism.png');
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

      {/* MILESTONE DEBUG PANEL (TOP-RIGHT) */}
      {showDebug && (
        <div className="absolute top-4 right-4 z-30 p-3 bg-black/85 backdrop-blur-md border border-purple-500/30 rounded-lg text-xs font-mono space-y-1.5 shadow-2xl text-white pointer-events-none min-w-[220px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-1 font-bold text-purple-400">
            <span>PRISM MILESTONE</span>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
          <div className="flex justify-between"><span className="text-white/60">CAMERA:</span> <span className={cameraStatus === 'ACTIVE' ? 'text-green-400 font-bold' : 'text-yellow-400'}>{cameraStatus}</span></div>
          <div className="flex justify-between"><span className="text-white/60">VIDEO:</span> <span>{videoDimensions}</span></div>
          <div className="flex justify-between"><span className="text-white/60">HANDS:</span> <span className="text-pink-400 font-bold">{debugStats.handsCount}</span></div>
          <div className="flex justify-between"><span className="text-white/60">GESTURE:</span> <span className="text-yellow-300 font-bold">{debugStats.gesture}</span></div>
          <div className="flex justify-between"><span className="text-white/60">RENDER:</span> <span className="text-green-400 font-bold">{debugStats.renderFps} FPS</span></div>
          <div className="flex justify-between"><span className="text-white/60">VISION:</span> <span className="text-cyan-300 font-bold">{debugStats.visionFps} FPS</span></div>
          <div className="flex justify-between"><span className="text-white/60">CURRENT TOOL:</span> <span className="text-purple-300 font-bold">{EFFECT_CONFIGS[activeTool]?.name || 'NONE'}</span></div>
          <div className="flex justify-between"><span className="text-white/60">OBJECTS:</span> <span className="text-yellow-300 font-bold">{objectCount}/5</span></div>
          <div className="flex justify-between"><span className="text-white/60">SELECTED:</span> <span className="text-pink-400 font-bold">{debugStats.selectedId}</span></div>
          <div className="pt-1 text-[10px] text-white/40 border-t border-white/10">Press D to toggle panel</div>
        </div>
      )}

      {/* LAYER 3: TOOLBAR WITH PRISM SELECTOR, CREATE, DELETE & CLEAR */}
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
