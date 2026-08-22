import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager } from '../rendering/SceneManager';
import { TechnicalHUDCanvas, HUDOptions } from '../overlays/TechnicalHUDCanvas';
import { HandLandmarkerService } from '../vision/HandLandmarkerService';
import { SimulatedHandTracker } from '../vision/SimulatedHandTracker';
import { GestureEngine } from '../vision/GestureEngine';
import { CameraManager } from '../camera/CameraManager';
import { EffectManager } from '../state/EffectManager';
import { DemoTimeline } from '../state/DemoTimeline';
import { PerformanceMonitor } from '../rendering/PerformanceMonitor';
import { VisualEffectState, EFFECT_CONFIGS } from '../types/effects';
import { PerformanceMetrics } from '../types/performance';
import { GestureMetrics } from '../types/gestures';
import { HandLandmarks } from '../types/vision';
import { ControlBar } from './ControlBar';
import { DebugHUD } from './DebugHUD';
import { ErrorModal } from './ErrorModal';
import { captureCanvasScreenshot, CanvasRecorder } from '../utils/recording';
import { registerKeyboardShortcuts } from '../utils/keyboardShortcuts';

interface MainViewProps {
  initialMode: 'LIVE' | 'DEMO';
  initialUseSimulation: boolean;
}

export const MainView: React.FC<MainViewProps> = ({ initialMode, initialUseSimulation }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const arContainerRef = useRef<HTMLDivElement>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement>(null);

  // Engines
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const hudRef = useRef<TechnicalHUDCanvas | null>(null);
  const cameraManagerRef = useRef<CameraManager>(new CameraManager());
  const visionServiceRef = useRef<HandLandmarkerService>(new HandLandmarkerService());
  const simTrackerRef = useRef<SimulatedHandTracker>(new SimulatedHandTracker());
  const gestureEngineRef = useRef<GestureEngine>(new GestureEngine());
  const effectManagerRef = useRef<EffectManager>(new EffectManager());
  const demoTimelineRef = useRef<DemoTimeline | null>(null);
  const perfMonitorRef = useRef<PerformanceMonitor>(new PerformanceMonitor());
  const recorderRef = useRef<CanvasRecorder>(new CanvasRecorder());

  const latestHandsRef = useRef<HandLandmarks[]>([]);

  // States
  const [isDemo, setIsDemo] = useState(initialMode === 'DEMO');
  const [isSimulated, setIsSimulated] = useState(initialUseSimulation);
  const [currentMode, setCurrentMode] = useState<VisualEffectState>(VisualEffectState.RECTANGLE_TRACKING);
  const [demoTime, setDemoTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showHUD, setShowHUD] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const [handCount, setHandCount] = useState(0);

  const hudOptionsRef = useRef<HUDOptions>({
    showLandmarks: true,
    showCoordinates: true,
    showGuides: true,
    showReticles: true,
    showBoundingBox: true
  });

  // 1. Initialize Demo Timeline
  useEffect(() => {
    demoTimelineRef.current = new DemoTimeline(effectManagerRef.current);
    if (initialMode === 'DEMO') {
      demoTimelineRef.current.start();
    }
  }, [initialMode]);

  // 2. Initialize Camera & Transparent Three.js WebGL Layer
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

  // 3. Asynchronous Vision Tracking Loop (~30 FPS)
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
      setHandCount(hands.length);

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

  // 4. Smooth 60 FPS Render Loop (Transparent AR over Camera)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (timestamp: number) => {
      animId = requestAnimationFrame(loop);
      if (isPaused) return;

      const dt = Math.max(0.001, Math.min(0.1, (timestamp - lastTime) / 1000.0));
      lastTime = timestamp;

      const width = window.innerWidth;
      const height = window.innerHeight;

      // Update EffectManager / Timeline
      if (isDemo && demoTimelineRef.current) {
        const update = demoTimelineRef.current.update(dt);
        setDemoTime(update.time);
        setCurrentMode(update.state);
      } else {
        effectManagerRef.current.update(dt);
        setCurrentMode(effectManagerRef.current.getMode());
      }

      const hands = latestHandsRef.current;
      const gestures = gestureEngineRef.current.processHands(hands, width, height);

      // Render 3D Perspective AR Geometries (Transparent Overlay)
      if (sceneManagerRef.current) {
        sceneManagerRef.current.updateAndRender(hands, effectManagerRef.current, timestamp / 1000.0);
      }

      // Render 2D Technical HUD Overlay (Green Skeleton, Red Landmarks, Left Meter, Magenta FPS)
      if (hudRef.current && showHUD && !effectManagerRef.current.isRawCamera()) {
        hudRef.current.render(
          hands,
          gestures,
          effectManagerRef.current.getMode(),
          hudOptionsRef.current,
          perfMetrics.renderFps,
          timestamp / 1000.0
        );
      } else if (hudRef.current && (!showHUD || effectManagerRef.current.isRawCamera())) {
        const ctx = hudCanvasRef.current?.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, width, height);
      }

      const metrics = perfMonitorRef.current.update(0);
      setPerfMetrics(metrics);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isDemo, isPaused, showHUD, perfMetrics.renderFps]);

  // Actions
  const handleSelectMode = useCallback((mode: VisualEffectState) => {
    if (isDemo && demoTimelineRef.current) {
      demoTimelineRef.current.stop();
      setIsDemo(false);
    }
    effectManagerRef.current.setMode(mode);
    setCurrentMode(mode);
  }, [isDemo]);

  const handleToggleDemo = useCallback(() => {
    setIsDemo(prev => {
      const next = !prev;
      if (next && demoTimelineRef.current) {
        demoTimelineRef.current.start();
      } else if (demoTimelineRef.current) {
        demoTimelineRef.current.stop();
      }
      return next;
    });
  }, []);

  const handleToggleSimulation = useCallback(async () => {
    setIsSimulated(prev => {
      const next = !prev;
      if (!next && videoRef.current) {
        cameraManagerRef.current.attachToVideo(videoRef.current).catch(err => {
          setErrorMessage(err instanceof Error ? err.message : String(err));
          setIsSimulated(true);
        });
      } else {
        cameraManagerRef.current.stopCamera();
      }
      return next;
    });
  }, []);

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

  useEffect(() => {
    return registerKeyboardShortcuts({
      onSetState: handleSelectMode,
      onToggleDemo: handleToggleDemo,
      onToggleSimulation: handleToggleSimulation,
      onToggleHUD: () => setShowHUD(p => !p),
      onToggleLandmarks: () => { hudOptionsRef.current.showLandmarks = !hudOptionsRef.current.showLandmarks; },
      onToggleCoordinates: () => { hudOptionsRef.current.showCoordinates = !hudOptionsRef.current.showCoordinates; },
      onToggleGuides: () => { hudOptionsRef.current.showGuides = !hudOptionsRef.current.showGuides; },
      onToggleThermal: () => handleSelectMode(VisualEffectState.THERMAL),
      onTriggerBlur: () => handleSelectMode(VisualEffectState.BLUR_TRANSITION),
      onCapture: handleCapture,
      onToggleRecord: handleToggleRecord,
      onToggleFullscreen: handleToggleFullscreen,
      onTogglePause: () => setIsPaused(p => !p),
      onReset: () => handleSelectMode(VisualEffectState.RECTANGLE_TRACKING)
    });
  }, [handleSelectMode, handleToggleDemo, handleToggleSimulation, handleCapture, handleToggleRecord, handleToggleFullscreen]);

  // Video Filter for Thermal & Blur Shaders
  const thermalOpacity = effectManagerRef.current.getThermalIntensity();
  const blurOpacity = effectManagerRef.current.getBlurIntensity();
  const videoFilterStyle = thermalOpacity > 0.05
    ? `invert(${(thermalOpacity * 100).toFixed(0)}%) hue-rotate(${(thermalOpacity * 180).toFixed(0)}deg) saturate(${(100 + thermalOpacity * 300).toFixed(0)}%) contrast(${(100 + thermalOpacity * 80).toFixed(0)}%)`
    : blurOpacity > 0.05
    ? `blur(${(blurOpacity * 16).toFixed(0)}px)`
    : 'none';

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* LAYER 0: LIVE MIRRORED WEBCAM (FULL VIEWPORT - REAL PERSON & ROOM VISIBLE) */}
      {/* ========================================================================= */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover z-0 transition-all duration-200"
        style={{
          transform: 'scaleX(-1)', // Real mirror reflection so left is left, right is right
          filter: videoFilterStyle
        }}
      />

      {/* Fallback ambient grid only if camera is offline / test simulation */}
      {isSimulated && (
        <div className="absolute inset-0 z-0 tech-grid-bg opacity-30 pointer-events-none" />
      )}

      {/* ========================================================================= */}
      {/* LAYER 1: TRANSPARENT 3D WebGL AR GEOMETRY (HATCH, WEDGES, BLOCKS, 3D FOLD)*/}
      {/* ========================================================================= */}
      <div ref={arContainerRef} className="absolute inset-0 z-10 pointer-events-none" />

      {/* ========================================================================= */}
      {/* LAYER 2: 2D HUD CANVAS (RED LANDMARKS, GREEN SKELETON, METER, MAGENTA FPS)*/}
      {/* ========================================================================= */}
      <canvas ref={hudCanvasRef} className="absolute inset-0 z-20 pointer-events-none" />

      {/* ========================================================================= */}
      {/* LAYER 3: TOP MINIMAL BRAND STATUS BAR */}
      {/* ========================================================================= */}
      <div className="absolute top-4 right-4 z-30 flex items-center space-x-2 pointer-events-none">
        <div className="px-3 py-1 bg-black/60 backdrop-blur-md border border-cyan-500/40 rounded text-cyan-400 font-mono text-xs tracking-wider flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-bold">HANDFLUX</span>
          <span className="text-white/40">|</span>
          <span className="text-white/70">{isDemo ? '34s DEMO' : 'LIVE AR'}</span>
          <span className="text-white/40">|</span>
          <span className="text-pink-400 font-bold">{currentMode}</span>
        </div>
      </div>

      {/* Telemetry Debug Panel (Press D) */}
      {showDebug && (
        <DebugHUD
          performance={perfMetrics}
          state={currentMode}
          gestures={gestureMetrics}
          handCount={handCount}
          isSimulated={isSimulated}
          isDemo={isDemo}
          demoTimeSec={demoTime}
        />
      )}

      {/* ========================================================================= */}
      {/* LAYER 4: BOTTOM FUNCTIONAL CONTROL BAR (EVERY BUTTON WORKS INSTANTLY)   */}
      {/* ========================================================================= */}
      <ControlBar
        currentState={currentMode}
        isDemo={isDemo}
        demoTime={demoTime}
        isPaused={isPaused}
        isRecording={isRecording}
        showHUD={showHUD}
        isSimulated={isSimulated}
        onSelectState={handleSelectMode}
        onToggleDemo={handleToggleDemo}
        onToggleSimulation={handleToggleSimulation}
        onTogglePause={() => setIsPaused(p => !p)}
        onCapture={handleCapture}
        onToggleRecord={handleToggleRecord}
        onToggleHUD={() => setShowHUD(p => !p)}
        onToggleFullscreen={handleToggleFullscreen}
        onReset={() => handleSelectMode(VisualEffectState.RECTANGLE_TRACKING)}
      />

      {/* Error Modal */}
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
