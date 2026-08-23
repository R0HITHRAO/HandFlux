import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager } from '../rendering/SceneManager';
import { TechnicalHUDCanvas, HUDOptions } from '../overlays/TechnicalHUDCanvas';
import { HandLandmarkerService } from '../vision/HandLandmarkerService';
import { SimulatedHandTracker } from '../vision/SimulatedHandTracker';
import { GestureEngine } from '../vision/GestureEngine';
import { CameraManager } from '../camera/CameraManager';
import { PerformanceMonitor } from '../rendering/PerformanceMonitor';
import { VisualEffectState } from '../types/effects';
import { PerformanceMetrics } from '../types/performance';
import { GestureMetrics } from '../types/gestures';
import { HandLandmarks } from '../types/vision';
import { ControlBar } from './ControlBar';
import { DebugHUD } from './DebugHUD';
import { ErrorModal } from './ErrorModal';
import { captureCanvasScreenshot, CanvasRecorder } from '../utils/recording';

interface MainViewProps {
  initialMode: 'LIVE' | 'DEMO';
  initialUseSimulation: boolean;
}

export const MainView: React.FC<MainViewProps> = ({ initialMode, initialUseSimulation }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const arContainerRef = useRef<HTMLDivElement>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement>(null);

  const sceneManagerRef = useRef<SceneManager | null>(null);
  const hudRef = useRef<TechnicalHUDCanvas | null>(null);
  const cameraManagerRef = useRef<CameraManager>(new CameraManager());
  const visionServiceRef = useRef<HandLandmarkerService>(new HandLandmarkerService());
  const simTrackerRef = useRef<SimulatedHandTracker>(new SimulatedHandTracker());
  const gestureEngineRef = useRef<GestureEngine>(new GestureEngine());
  const perfMonitorRef = useRef<PerformanceMonitor>(new PerformanceMonitor());
  const recorderRef = useRef<CanvasRecorder>(new CanvasRecorder());

  const latestHandsRef = useRef<HandLandmarks[]>([]);

  const [isDemo, setIsDemo] = useState(initialMode === 'DEMO');
  const [isSimulated, setIsSimulated] = useState(initialUseSimulation);
  const [activeTool, setActiveTool] = useState<VisualEffectState>(VisualEffectState.PURPLE_PRISM);
  const [isThermalActive, setIsThermalActive] = useState<boolean>(false);
  const [objectCount, setObjectCount] = useState<number>(0);
  const [demoTime, setDemoTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showHUD, setShowHUD] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pinchHoldDurationRef = useRef<number>(0);
  const isPinchHoldTriggeredRef = useRef<boolean>(false);

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

    let isCancelled = false;

    const initVision = async () => {
      await visionServiceRef.current.initialize();

      if (!initialUseSimulation && videoRef.current) {
        try {
          await cameraManagerRef.current.attachToVideo(videoRef.current);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('Camera failed, switching to simulation:', err);
          if (!isCancelled) {
            setErrorMessage(msg);
            setIsSimulated(true);
          }
        }
      }
    };

    initVision();

    return () => {
      isCancelled = true;
      cameraManagerRef.current.stopCamera();
      window.removeEventListener('resize', handleResize);
    };
  }, [initialUseSimulation]);

  // 2. Creation Handlers
  const handleCreateObject = useCallback(() => {
    if (!sceneManagerRef.current) return;
    const hands = latestHandsRef.current;
    if (hands.length === 0) return;

    sceneManagerRef.current.arobjectManager.createObjectAtHand(
      activeTool,
      hands[0],
      window.innerWidth,
      window.innerHeight
    );
    setObjectCount(sceneManagerRef.current.arobjectManager.getObjects().length);
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

      if (isSimulated) {
        hands = simTrackerRef.current.getSimulatedHands(width, height);
      } else {
        const video = videoRef.current;
        if (video && cameraManagerRef.current.getIsReady()) {
          hands = visionServiceRef.current.detectHands(video, timestamp, width, height);
        }
        if (hands.length === 0 && isSimulated) {
          hands = simTrackerRef.current.getSimulatedHands(width, height);
        }
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
  }, [isSimulated]);

  // 4. Smooth 60 FPS Render Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let currThermal = 0.0;

    const loop = (timestamp: number) => {
      animId = requestAnimationFrame(loop);
      if (isPaused) return;

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

      // Pinch-and-Hold to Create Trigger (Hold pinch for 350ms)
      let holdProgress = 0.0;
      if (gestures.isPinching && hands.length > 0 && activeTool !== VisualEffectState.NONE && activeTool !== VisualEffectState.THERMAL) {
        pinchHoldDurationRef.current += dt;
        holdProgress = Math.min(1.0, pinchHoldDurationRef.current / 0.35);

        if (pinchHoldDurationRef.current >= 0.35 && !isPinchHoldTriggeredRef.current) {
          isPinchHoldTriggeredRef.current = true;
          if (sceneManagerRef.current) {
            sceneManagerRef.current.arobjectManager.createObjectAtHand(activeTool, hands[0], width, height);
            setObjectCount(sceneManagerRef.current.arobjectManager.getObjects().length);
          }
        }
      } else {
        pinchHoldDurationRef.current = 0.0;
        isPinchHoldTriggeredRef.current = false;
        holdProgress = 0.0;
      }

      // Render 3D Perspective Scene
      if (sceneManagerRef.current) {
        sceneManagerRef.current.updateAndRender(
          hands,
          gestures,
          activeTool,
          false,
          dt,
          timestamp / 1000.0
        );
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
          holdProgress,
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
  }, [isDemo, isPaused, showHUD, isThermalActive, activeTool, perfMetrics.renderFps]);

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

  const handleToggleRecord = useCallback(() => {
    if (!sceneManagerRef.current || !hudCanvasRef.current) return;
    if (recorderRef.current.getIsRecording()) {
      recorderRef.current.stopRecording();
      setIsRecording(false);
    } else {
      recorderRef.current.startRecording(sceneManagerRef.current.getDomElement(), hudCanvasRef.current);
      setIsRecording(true);
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

      {isSimulated && (
        <div className="absolute inset-0 z-0 tech-grid-bg opacity-30 pointer-events-none" />
      )}

      {/* LAYER 1: TRANSPARENT THREE.JS WebGL ON-DEMAND AR CANVAS */}
      <div ref={arContainerRef} className="absolute inset-0 z-10 pointer-events-none" />

      {/* LAYER 2: 2D HUD CANVAS (RED LANDMARKS, GREEN SKELETON, METER, MAGENTA FPS) */}
      <canvas ref={hudCanvasRef} className="absolute inset-0 z-20 pointer-events-none" />

      {/* Top Status Bar */}
      <div className="absolute top-4 right-4 z-30 flex items-center space-x-2 pointer-events-none">
        <div className="px-3 py-1 bg-black/60 backdrop-blur-md border border-cyan-500/40 rounded text-cyan-400 font-mono text-xs tracking-wider flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-bold">HANDFLUX</span>
          <span className="text-white/40">|</span>
          <span className="text-white/70">ON-DEMAND AR</span>
          <span className="text-white/40">|</span>
          <span className="text-pink-400 font-bold">{objectCount} ACTIVE</span>
        </div>
      </div>

      {showDebug && (
        <DebugHUD
          performance={perfMetrics}
          state={activeTool}
          gestures={gestureMetrics}
          handCount={latestHandsRef.current.length}
          isSimulated={isSimulated}
          isDemo={isDemo}
          demoTimeSec={demoTime}
        />
      )}

      {/* LAYER 3: TOOLBAR WITH SEGMENTED OBJECT TOOLS, THERMAL TOGGLE & CREATE/DELETE */}
      <ControlBar
        activeTool={activeTool}
        isThermalActive={isThermalActive}
        isDemo={isDemo}
        demoTime={demoTime}
        isPaused={isPaused}
        isRecording={isRecording}
        showHUD={showHUD}
        isSimulated={isSimulated}
        objectCount={objectCount}
        onSelectTool={setActiveTool}
        onToggleThermal={handleToggleThermal}
        onCreateObject={handleCreateObject}
        onDeleteSelected={handleDeleteSelected}
        onClearAll={handleClearAll}
        onToggleDemo={() => setIsDemo(p => !p)}
        onTogglePause={() => setIsPaused(p => !p)}
        onCapture={handleCapture}
        onToggleRecord={handleToggleRecord}
        onToggleHUD={() => setShowHUD(p => !p)}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {errorMessage && (
        <ErrorModal
          message={errorMessage}
          onFallbackToSimulation={() => {
            setIsSimulated(true);
            setErrorMessage(null);
          }}
          onDismiss={() => setErrorMessage(null)}
        />
      )}
    </div>
  );
};
