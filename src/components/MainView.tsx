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
import { VisualEffectState } from '../types/effects';
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

  useEffect(() => {
    demoTimelineRef.current = new DemoTimeline(effectManagerRef.current);
    if (initialMode === 'DEMO') {
      demoTimelineRef.current.start();
    }
  }, [initialMode]);

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

      if (isDemo && demoTimelineRef.current) {
        const update = demoTimelineRef.current.update(dt);
        setDemoTime(update.time);
        setCurrentMode(update.state);
      } else {
        effectManagerRef.current.update(dt);
        setCurrentMode(effectManagerRef.current.getMode());
      }

      if (videoRef.current) {
        const thermalVal = effectManagerRef.current.getThermalIntensity();
        const blurVal = effectManagerRef.current.getBlurIntensity();

        if (thermalVal > 0.02) {
          const inv = (thermalVal * 100).toFixed(0);
          const rot = (thermalVal * 180).toFixed(0);
          const sat = (100 + thermalVal * 300).toFixed(0);
          const con = (100 + thermalVal * 80).toFixed(0);
          videoRef.current.style.filter = 'invert(' + inv + '%) hue-rotate(' + rot + 'deg) saturate(' + sat + '%) contrast(' + con + '%)';
        } else if (blurVal > 0.02) {
          videoRef.current.style.filter = 'blur(' + (blurVal * 16).toFixed(0) + 'px)';
        } else {
          videoRef.current.style.filter = 'none';
        }
      }

      const hands = latestHandsRef.current;
      const gestures = gestureEngineRef.current.processHands(hands, width, height);

      if (sceneManagerRef.current) {
        sceneManagerRef.current.updateAndRender(hands, effectManagerRef.current, timestamp / 1000.0);
      }

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

  const handleSelectMode = useCallback((mode: VisualEffectState) => {
    if (isDemo && demoTimelineRef.current) {
      demoTimelineRef.current.stop();
      setIsDemo(false);
    }
    effectManagerRef.current.setMode(mode, true);
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

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
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

      <div ref={arContainerRef} className="absolute inset-0 z-10 pointer-events-none" />

      <canvas ref={hudCanvasRef} className="absolute inset-0 z-20 pointer-events-none" />

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
