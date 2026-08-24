import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager } from '../rendering/SceneManager';
import { TechnicalHUDCanvas } from '../overlays/TechnicalHUDCanvas';
import { HandLandmarkerService } from '../vision/HandLandmarkerService';
import { GestureEngine } from '../vision/GestureEngine';
import { CameraManager } from '../camera/CameraManager';
import { PerformanceMonitor } from '../rendering/PerformanceMonitor';
import { VisualEffectState } from '../types/effects';
import { HandLandmarks } from '../types/vision';
import { PerformanceMetrics } from '../types/performance';
import { AppMode, GestureMetrics } from '../types/gestures';
import { ControlBar } from './ControlBar';
import { ModeSelector } from './ModeSelector';
import { PresentationView } from '../presentation/PresentationView';
import { PresentationController } from '../presentation/PresentationController';
import { MolecularScene, AtomData } from '../viewer3d/MolecularScene';
import { MolecularViewer } from '../viewer3d/MolecularViewer';
import { CalibrationModal } from '../calibration/CalibrationModal';
import { SettingsModal } from '../settings/SettingsModal';
import { RecruiterDemoTour } from './RecruiterDemoTour';
import { captureCanvasScreenshot } from '../utils/recording';
import { screenToThreeWorld } from '../utils/mathUtils';
import * as THREE from 'three';

export const MainView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const arContainerRef = useRef<HTMLDivElement>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement>(null);

  const sceneManagerRef = useRef<SceneManager | null>(null);
  const molecularSceneRef = useRef<MolecularScene | null>(null);
  const hudRef = useRef<TechnicalHUDCanvas | null>(null);
  const cameraManagerRef = useRef<CameraManager>(new CameraManager());
  const visionServiceRef = useRef<HandLandmarkerService>(new HandLandmarkerService());
  const gestureEngineRef = useRef<GestureEngine>(new GestureEngine());
  const presentationRef = useRef<PresentationController>(new PresentationController());
  const perfMonitorRef = useRef<PerformanceMonitor>(new PerformanceMonitor());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());

  const latestHandsRef = useRef<HandLandmarks[]>([]);

  const [activeMode, setActiveMode] = useState<AppMode>('PRESENTATION');
  const [activeTool, setActiveTool] = useState<VisualEffectState>(VisualEffectState.NONE);
  const [objectCount, setObjectCount] = useState<number>(0);
  const [showHUD, setShowHUD] = useState(true);
  const [showDebug, setShowDebug] = useState(true);
  const [cameraStatus, setCameraStatus] = useState<string>('INITIALIZING...');
  const [videoDimensions, setVideoDimensions] = useState<string>('0 x 0');

  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [activeAtom, setActiveAtom] = useState<AtomData | null>(null);

  const [isCalibrationOpen, setIsCalibrationOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTourActive, setIsTourActive] = useState<boolean>(false);

  const [latestGestures, setLatestGestures] = useState<GestureMetrics>({
    primaryGesture: 'NONE',
    isPinching: false,
    isPointing: false,
    isOpenPalm: false,
    isFist: false,
    pinchDistance: 1,
    spread: 0,
    pointerPosition: { screenX: 0, screenY: 0 },
    twoHandDistance: 0,
    twoHandAngle: 0,
    twoHandMidpoint: { screenX: 0, screenY: 0 },
    swipeDirection: 'NONE',
    swipeVelocity: 0
  });

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

  // 1. Initial Setup
  useEffect(() => {
    if (!arContainerRef.current || !hudCanvasRef.current || !videoRef.current) return;

    const scene = new SceneManager(arContainerRef.current);
    sceneManagerRef.current = scene;

    const mol = new MolecularScene();
    molecularSceneRef.current = mol;
    scene.arobjectManager.sceneGroup.add(mol.group);
    mol.group.visible = false;

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

  // 2. Mode Switching
  const handleSelectMode = useCallback((mode: AppMode) => {
    setActiveMode(mode);
    if (molecularSceneRef.current) {
      molecularSceneRef.current.group.visible = (mode === 'VIEWER_3D');
    }
  }, []);

  // 3. Gesture Subscriptions for Swipes
  useEffect(() => {
    const unsub = gestureEngineRef.current.addEventListener((event) => {
      if (activeMode === 'PRESENTATION') {
        if (event.type === 'SWIPE_LEFT') {
          presentationRef.current.nextSlide();
          setCurrentSlideIndex(presentationRef.current.getCurrentIndex());
        } else if (event.type === 'SWIPE_RIGHT') {
          presentationRef.current.prevSlide();
          setCurrentSlideIndex(presentationRef.current.getCurrentIndex());
        }
      }
    });
    return unsub;
  }, [activeMode]);

  // 4. Asynchronous Vision Loop (~28 FPS)
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

  // 5. 60 FPS Render Loop
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

      // Stage 1: Gesture Processing
      const updateStart = performance.now();
      const gestures = gestureEngineRef.current.processHands(hands, width, height, timestamp);

      // 3D Molecule Manipulation & Raycasting
      if (activeMode === 'VIEWER_3D' && molecularSceneRef.current && sceneManagerRef.current) {
        const mol = molecularSceneRef.current.group;
        molecularSceneRef.current.updateOrbitals(timestamp * 0.001);

        // Raycast atoms on pointer
        const normX = (gestures.pointerPosition.screenX / width) * 2 - 1;
        const normY = -(gestures.pointerPosition.screenY / height) * 2 + 1;
        raycasterRef.current.setFromCamera(new THREE.Vector2(normX, normY), sceneManagerRef.current['camera3D']);
        const hitAtom = molecularSceneRef.current.raycastAtom(raycasterRef.current);
        setActiveAtom(hitAtom);

        if (gestures.isPinching && hands.length > 0) {
          const w = screenToThreeWorld(gestures.pointerPosition.screenX, gestures.pointerPosition.screenY, width, height);
          mol.position.set(w.x, w.y, w.z);
        }
        if (hands.length >= 2) {
          mol.scale.setScalar(Math.max(0.5, Math.min(2.5, gestures.twoHandDistance * 2.2)));
          mol.rotation.z = gestures.twoHandAngle;
        } else if (!gestures.isPinching) {
          mol.rotation.y += dt * 0.35;
          mol.rotation.x += dt * 0.15;
        }
      }

      let pinchHoldProgress = 0.0;
      if (sceneManagerRef.current) {
        sceneManagerRef.current.arobjectManager.setActiveTool(activeMode === 'AR_LAB' ? activeTool : VisualEffectState.NONE);
        const renderScale = perfMonitorRef.current.getRenderScale();
        const res = sceneManagerRef.current.updateAndRender(
          hands,
          gestures,
          activeMode === 'AR_LAB' ? activeTool : VisualEffectState.NONE,
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
          { showLandmarks: true, showCoordinates: true, showGuides: true, showReticles: true, showBoundingBox: true },
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
  }, [showHUD, activeTool, activeMode]);

  // 6. 5 Hz UI Telemetry Poller
  useEffect(() => {
    const interval = setInterval(() => {
      setDebugMetrics(perfMonitorRef.current.getMetrics());
      const hands = latestHandsRef.current;
      const g = gestureEngineRef.current.processHands(hands, window.innerWidth, window.innerHeight);
      setLatestGestures(g);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Keyboard Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        presentationRef.current.nextSlide();
        setCurrentSlideIndex(presentationRef.current.getCurrentIndex());
      }
      if (e.key === 'ArrowLeft') {
        presentationRef.current.prevSlide();
        setCurrentSlideIndex(presentationRef.current.getCurrentIndex());
      }
      if (e.key === '1') handleSelectMode('PRESENTATION');
      if (e.key === '2') handleSelectMode('VIEWER_3D');
      if (e.key === '3') handleSelectMode('AR_LAB');
      if (e.key === 'd' || e.key === 'D') setShowDebug(p => !p);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectMode]);

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

      {/* LAYER 1: THREE.JS 3D CANVAS (MOLECULE & AR OBJECTS) */}
      <div ref={arContainerRef} className="absolute inset-0 z-10 pointer-events-none" />

      {/* LAYER 2: 2D HUD CANVAS (LANDMARKS, SKELETON, METER, FPS) */}
      <canvas ref={hudCanvasRef} className="absolute inset-0 z-20 pointer-events-none" />

      {/* MODE SELECTOR (TOP NAVBAR) */}
      <ModeSelector
        activeMode={activeMode}
        onSelectMode={handleSelectMode}
        onStartTour={() => setIsTourActive(true)}
        onOpenCalibration={() => setIsCalibrationOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* MODE 1: PRESENTATION VIEW */}
      {activeMode === 'PRESENTATION' && (
        <PresentationView
          slide={presentationRef.current.getCurrentSlide()}
          currentIndex={currentSlideIndex}
          totalSlides={presentationRef.current.getSlideCount()}
          gestures={latestGestures}
          onPrev={() => {
            presentationRef.current.prevSlide();
            setCurrentSlideIndex(presentationRef.current.getCurrentIndex());
          }}
          onNext={() => {
            presentationRef.current.nextSlide();
            setCurrentSlideIndex(presentationRef.current.getCurrentIndex());
          }}
          onSelectSlide={(idx) => {
            presentationRef.current.setSlide(idx);
            setCurrentSlideIndex(idx);
          }}
        />
      )}

      {/* MODE 2: 3D MOLECULAR VIEWER OVERLAY */}
      {activeMode === 'VIEWER_3D' && (
        <MolecularViewer activeAtom={activeAtom} gestures={latestGestures} />
      )}

      {/* MODE 3: AR LAB CONTROLS */}
      {activeMode === 'AR_LAB' && (
        <ControlBar
          activeTool={activeTool}
          isThermalActive={false}
          showHUD={showHUD}
          objectCount={objectCount}
          onSelectTool={setActiveTool}
          onToggleThermal={() => {}}
          onCreateObject={() => {
            if (sceneManagerRef.current && latestHandsRef.current.length > 0) {
              sceneManagerRef.current.arobjectManager.createObjectAtHand(activeTool, latestHandsRef.current[0], window.innerWidth, window.innerHeight);
              setObjectCount(sceneManagerRef.current.arobjectManager.getObjects().length);
            }
          }}
          onDeleteSelected={() => {
            sceneManagerRef.current?.arobjectManager.deleteSelected();
            setObjectCount(sceneManagerRef.current?.arobjectManager.getObjects().length || 0);
          }}
          onClearAll={() => {
            sceneManagerRef.current?.arobjectManager.clearAll();
            setObjectCount(0);
          }}
          onCapture={() => {
            if (sceneManagerRef.current && hudCanvasRef.current) {
              captureCanvasScreenshot(sceneManagerRef.current.getDomElement(), hudCanvasRef.current, 'handflux-portfolio.png');
            }
          }}
          onToggleHUD={() => setShowHUD(p => !p)}
          onToggleFullscreen={() => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
            else document.exitFullscreen().catch(() => {});
          }}
        />
      )}

      {/* RECRUITER DEMO TOUR */}
      <RecruiterDemoTour
        isActive={isTourActive}
        onStop={() => setIsTourActive(false)}
        onSetMode={handleSelectMode}
      />

      {/* CALIBRATION & SETTINGS MODALS */}
      <CalibrationModal
        isOpen={isCalibrationOpen}
        gestures={latestGestures}
        onClose={() => setIsCalibrationOpen(false)}
        onComplete={({ pinchThreshold }) => {
          gestureEngineRef.current.setPinchThreshold(pinchThreshold);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
