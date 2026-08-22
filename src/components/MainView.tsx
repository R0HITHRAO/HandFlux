import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager } from '../rendering/SceneManager';
import { TechnicalHUDCanvas, HUDOptions } from '../overlays/TechnicalHUDCanvas';
import { HandLandmarkerService } from '../vision/HandLandmarkerService';
import { SimulatedHandTracker } from '../vision/SimulatedHandTracker';
import { GestureEngine } from '../vision/GestureEngine';
import { CameraManager } from '../camera/CameraManager';
import { EffectStateMachine } from '../state/EffectStateMachine';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement>(null);

  const sceneManagerRef = useRef<SceneManager | null>(null);
  const hudRef = useRef<TechnicalHUDCanvas | null>(null);
  const cameraManagerRef = useRef<CameraManager>(new CameraManager());
  const visionServiceRef = useRef<HandLandmarkerService>(new HandLandmarkerService());
  const simTrackerRef = useRef<SimulatedHandTracker>(new SimulatedHandTracker());
  const gestureEngineRef = useRef<GestureEngine>(new GestureEngine());
  const stateMachineRef = useRef<EffectStateMachine>(new EffectStateMachine());
  const demoTimelineRef = useRef<DemoTimeline | null>(null);
  const perfMonitorRef = useRef<PerformanceMonitor>(new PerformanceMonitor());
  const recorderRef = useRef<CanvasRecorder>(new CanvasRecorder());

  const [isDemo, setIsDemo] = useState(initialMode === 'DEMO');
  const [isSimulated, setIsSimulated] = useState(initialUseSimulation);
  const [currentState, setCurrentState] = useState<VisualEffectState>(VisualEffectState.RECTANGLE_TRACKING);
  const [demoTime, setDemoTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showHUD, setShowHUD] = useState(true);
  const [showDebug, setShowDebug] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [perfMetrics, setPerfMetrics] = useState<PerformanceMetrics>({
    renderFps: 60,
    visionFps: 30,
    visionLatencyMs: 12,
    frameTimeMs: 16.6,
    qualityLevel: 'HIGH',
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
    demoTimelineRef.current = new DemoTimeline(stateMachineRef.current);
    if (initialMode === 'DEMO') {
      demoTimelineRef.current.start();
    }
  }, [initialMode]);

  useEffect(() => {
    if (!containerRef.current || !hudCanvasRef.current) return;

    const scene = new SceneManager(containerRef.current);
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

      if (!initialUseSimulation) {
        try {
          const video = await cameraManagerRef.current.startCamera();
          if (!isCancelled) {
            scene.setVideoSource(video);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('interrupted') || msg.includes('AbortError')) {
            console.warn('Benign mount interruption, continuing:', msg);
          } else {
            console.warn('Camera failed to start, falling back to simulated hands:', err);
            if (!isCancelled) {
              setErrorMessage(msg);
              setIsSimulated(true);
              scene.setVideoSource(null);
            }
          }
        }
      } else {
        scene.setVideoSource(null);
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
        setCurrentState(update.state);
      } else {
        stateMachineRef.current.update(dt);
        setCurrentState(stateMachineRef.current.getCurrentState());
      }

      let hands: HandLandmarks[] = [];
      const visionStart = performance.now();

      if (isSimulated) {
        hands = simTrackerRef.current.getSimulatedHands(width, height);
      } else {
        const video = cameraManagerRef.current.getVideo();
        if (video && cameraManagerRef.current.getIsReady()) {
          hands = visionServiceRef.current.detectHands(video, timestamp, width, height);
        }
        if (hands.length === 0 && isSimulated) {
          hands = simTrackerRef.current.getSimulatedHands(width, height);
        }
      }
      const visionLatency = performance.now() - visionStart;
      setHandCount(hands.length);

      const gestures = gestureEngineRef.current.processHands(hands, width, height);
      setGestureMetrics(gestures);

      if (sceneManagerRef.current) {
        sceneManagerRef.current.updateAndRender(hands, stateMachineRef.current, timestamp / 1000.0);
      }

      if (hudRef.current && showHUD) {
        hudRef.current.render(hands, gestures, stateMachineRef.current.getCurrentState(), hudOptionsRef.current, perfMetrics.renderFps);
      } else if (hudRef.current && !showHUD) {
        const ctx = hudCanvasRef.current?.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, width, height);
      }

      const metrics = perfMonitorRef.current.update(visionLatency);
      setPerfMetrics(metrics);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isDemo, isSimulated, isPaused, showHUD, perfMetrics.renderFps]);

  const handleSelectState = useCallback((state: VisualEffectState) => {
    if (isDemo && demoTimelineRef.current) {
      demoTimelineRef.current.stop();
      setIsDemo(false);
    }
    stateMachineRef.current.setState(state);
    setCurrentState(state);
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
      if (!next) {
        cameraManagerRef.current.startCamera().then(video => {
          sceneManagerRef.current?.setVideoSource(video);
        }).catch(err => {
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes('interrupted') && !msg.includes('AbortError')) {
            setErrorMessage(msg);
            setIsSimulated(true);
          }
        });
      } else {
        cameraManagerRef.current.stopCamera();
        sceneManagerRef.current?.setVideoSource(null);
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
      onSetState: handleSelectState,
      onToggleDemo: handleToggleDemo,
      onToggleSimulation: handleToggleSimulation,
      onToggleHUD: () => setShowHUD(p => !p),
      onToggleLandmarks: () => { hudOptionsRef.current.showLandmarks = !hudOptionsRef.current.showLandmarks; },
      onToggleCoordinates: () => { hudOptionsRef.current.showCoordinates = !hudOptionsRef.current.showCoordinates; },
      onToggleGuides: () => { hudOptionsRef.current.showGuides = !hudOptionsRef.current.showGuides; },
      onToggleThermal: () => handleSelectState(VisualEffectState.THERMAL),
      onTriggerBlur: () => handleSelectState(VisualEffectState.BLUR_TRANSITION),
      onCapture: handleCapture,
      onToggleRecord: handleToggleRecord,
      onToggleFullscreen: handleToggleFullscreen,
      onTogglePause: () => setIsPaused(p => !p),
      onReset: () => handleSelectState(VisualEffectState.RECTANGLE_TRACKING)
    });
  }, [handleSelectState, handleToggleDemo, handleToggleSimulation, handleCapture, handleToggleRecord, handleToggleFullscreen]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
      <div ref={containerRef} className="absolute inset-0 z-0" />
      <canvas ref={hudCanvasRef} className="absolute inset-0 z-10 pointer-events-none" />
      <div className="absolute inset-0 z-20 scanline-overlay pointer-events-none" />

      {showDebug && (
        <DebugHUD
          performance={perfMetrics}
          state={currentState}
          gestures={gestureMetrics}
          handCount={handCount}
          isSimulated={isSimulated}
          isDemo={isDemo}
          demoTimeSec={demoTime}
        />
      )}

      <ControlBar
        currentState={currentState}
        isDemo={isDemo}
        demoTime={demoTime}
        isPaused={isPaused}
        isRecording={isRecording}
        showHUD={showHUD}
        isSimulated={isSimulated}
        onSelectState={handleSelectState}
        onToggleDemo={handleToggleDemo}
        onToggleSimulation={handleToggleSimulation}
        onTogglePause={() => setIsPaused(p => !p)}
        onCapture={handleCapture}
        onToggleRecord={handleToggleRecord}
        onToggleHUD={() => setShowHUD(p => !p)}
        onToggleFullscreen={handleToggleFullscreen}
        onReset={() => handleSelectState(VisualEffectState.RECTANGLE_TRACKING)}
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
