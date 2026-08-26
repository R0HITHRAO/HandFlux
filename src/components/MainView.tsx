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
import { MolecularScene, AtomData, MoleculeType } from '../viewer3d/MolecularScene';
import { MolecularViewer } from '../viewer3d/MolecularViewer';
import { CalibrationModal } from '../calibration/CalibrationModal';
import { SettingsModal } from '../settings/SettingsModal';
import { RecruiterDemoTour } from './RecruiterDemoTour';
import { captureCanvasScreenshot } from '../utils/recording';
import { screenToThreeWorld } from '../utils/mathUtils';
import { audioService } from '../utils/audioService';
import { Video, RefreshCw } from 'lucide-react';
import * as THREE from 'three';

export const MainView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
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
  const mouseRef = useRef<{ isDown: boolean; x: number; y: number; prevX: number; prevY: number }>({
    isDown: false, x: 0, y: 0, prevX: 0, prevY: 0
  });

  // Application States
  const [activeMode, setActiveMode] = useState<AppMode>('PRESENTATION');
  const [activeTool, setActiveTool] = useState<VisualEffectState>(VisualEffectState.NONE);
  const [objectCount, setObjectCount] = useState<number>(0);
  const [showHUD, setShowHUD] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<'INITIALIZING' | 'ACTIVE' | 'ERROR'>('INITIALIZING');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Mode States
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [currentMolecule, setCurrentMolecule] = useState<MoleculeType>('CAFFEINE');
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

  const startCamera = async () => {
    try {
      setCameraStatus('INITIALIZING');
      await visionServiceRef.current.initialize();
      if (videoRef.current) {
        await cameraManagerRef.current.attachToVideo(videoRef.current);
        setCameraStatus('ACTIVE');
        setErrorMessage('');
      }
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setCameraStatus('ERROR');
      setErrorMessage(err.message || 'Camera permission required');
    }
  };

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

    startCamera();

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
          audioService.playSwipeSound();
          presentationRef.current.nextSlide();
          setCurrentSlideIndex(presentationRef.current.getCurrentIndex());
        } else if (event.type === 'SWIPE_RIGHT') {
          audioService.playSwipeSound();
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

      // Mouse fallback position when hand is not tracking
      if (hands.length === 0 && mouseRef.current.x > 0) {
        gestures.pointerPosition = { screenX: mouseRef.current.x, screenY: mouseRef.current.y };
        gestures.isPointing = true;
        if (mouseRef.current.isDown) {
          gestures.isPinching = true;
        }
      }

      // 3D Molecule Manipulation & Raycasting
      if (activeMode === 'VIEWER_3D' && molecularSceneRef.current && sceneManagerRef.current) {
        const mol = molecularSceneRef.current.group;
        molecularSceneRef.current.updateOrbitals(timestamp * 0.001);

        // Raycast atoms on pointer or mouse
        const rayX = gestures.isPointing ? gestures.pointerPosition.screenX : mouseRef.current.x;
        const rayY = gestures.isPointing ? gestures.pointerPosition.screenY : mouseRef.current.y;
        const normX = (rayX / width) * 2 - 1;
        const normY = -(rayY / height) * 2 + 1;
        raycasterRef.current.setFromCamera(new THREE.Vector2(normX, normY), sceneManagerRef.current['camera3D']);
        const hitAtom = molecularSceneRef.current.raycastAtom(raycasterRef.current);
        if (hitAtom && !activeAtom) audioService.playAtomInspectSound();
        setActiveAtom(hitAtom);

        // Mouse drag fallback for 3D rotation
        if (mouseRef.current.isDown && hands.length === 0) {
          const deltaX = (mouseRef.current.x - mouseRef.current.prevX) * 0.01;
          const deltaY = (mouseRef.current.y - mouseRef.current.prevY) * 0.01;
          mol.rotation.y += deltaX;
          mol.rotation.x += deltaY;
        } else if (gestures.isPinching && hands.length > 0) {
          const w = screenToThreeWorld(gestures.pointerPosition.screenX, gestures.pointerPosition.screenY, width, height);
          mol.position.set(w.x, w.y, w.z);
        }

        if (hands.length >= 2) {
          mol.scale.setScalar(Math.max(0.5, Math.min(2.5, gestures.twoHandDistance * 2.2)));
          mol.rotation.z = gestures.twoHandAngle;
        } else if (!gestures.isPinching && !mouseRef.current.isDown) {
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
          audioService.playSpawnSound();
          setObjectCount(sceneManagerRef.current.arobjectManager.getObjects().length);
        }
      }
      const updateEnd = performance.now();

      // Stage 2: 2D HUD Canvas Render
      const renderPassStart = performance.now();
      if (hudRef.current && showHUD && sceneManagerRef.current) {
        const objects = activeMode === 'AR_LAB' ? sceneManagerRef.current.arobjectManager.getObjects() : [];
        const selected = sceneManagerRef.current.arobjectManager.getSelectedObject();
        const metrics = perfMonitorRef.current.getMetrics();
        hudRef.current.render(
          hands,
          gestures,
          activeTool,
          objects,
          selected ? selected.id : null,
          pinchHoldProgress,
          { showLandmarks: true, showCoordinates: false, showGuides: false, showReticles: false, showBoundingBox: false },
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
  }, [showHUD, activeTool, activeMode, activeAtom]);

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

  // Mouse Interactivity Event Listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.prevX = mouseRef.current.x;
      mouseRef.current.prevY = mouseRef.current.y;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    const handleMouseDown = () => { mouseRef.current.isDown = true; };
    const handleMouseUp = () => { mouseRef.current.isDown = false; };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        audioService.playSwipeSound();
        presentationRef.current.nextSlide();
        setCurrentSlideIndex(presentationRef.current.getCurrentIndex());
      }
      if (e.key === 'ArrowLeft') {
        audioService.playSwipeSound();
        presentationRef.current.prevSlide();
        setCurrentSlideIndex(presentationRef.current.getCurrentIndex());
      }
      if (e.key === '1') handleSelectMode('PRESENTATION');
      if (e.key === '2') handleSelectMode('VIEWER_3D');
      if (e.key === '3') handleSelectMode('AR_LAB');
      if (e.key === 'd' || e.key === 'D') setShowDebug(p => !p);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
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

      {/* LAYER 2: 2D HUD CANVAS (NEON SKELETON, RED JOINTS, LASER POINT) */}
      <canvas ref={hudCanvasRef} className="absolute inset-0 z-20 pointer-events-none" />

      {/* CAMERA PERMISSION / STATUS BANNER */}
      {cameraStatus === 'INITIALIZING' && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-black/90 backdrop-blur-2xl border-2 border-cyan-400 px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 text-cyan-300 font-mono text-xs animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
          <span>CONNECTING TO WEBCAM & VISION MODEL...</span>
        </div>
      )}

      {cameraStatus === 'ERROR' && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-950/95 backdrop-blur-2xl border-2 border-red-500 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-4 text-white font-mono text-xs pointer-events-auto">
          <div className="flex items-center space-x-2 text-red-300">
            <Video className="w-4 h-4 text-red-400" />
            <span>CAMERA ACCESS DENIED ({errorMessage})</span>
          </div>
          <button
            onClick={startCamera}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95"
          >
            RETRY WEBCAM
          </button>
        </div>
      )}

      {/* MODE SELECTOR (TOP FLOATING NAVBAR) */}
      <ModeSelector
        activeMode={activeMode}
        showDebug={showDebug}
        onSelectMode={handleSelectMode}
        onStartTour={() => setIsTourActive(true)}
        onOpenCalibration={() => setIsCalibrationOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleDebug={() => setShowDebug(p => !p)}
      />

      {/* MODE 1: PRESENTATION VIEW (SIDE-DOCKED HOLOGRAPHIC HUD) */}
      {activeMode === 'PRESENTATION' && (
        <PresentationView
          slide={presentationRef.current.getCurrentSlide()}
          currentIndex={currentSlideIndex}
          totalSlides={presentationRef.current.getSlideCount()}
          gestures={latestGestures}
          onPrev={() => {
            audioService.playSwipeSound();
            presentationRef.current.prevSlide();
            setCurrentSlideIndex(presentationRef.current.getCurrentIndex());
          }}
          onNext={() => {
            audioService.playSwipeSound();
            presentationRef.current.nextSlide();
            setCurrentSlideIndex(presentationRef.current.getCurrentIndex());
          }}
          onSelectSlide={(idx) => {
            audioService.playClickSound();
            presentationRef.current.setSlide(idx);
            setCurrentSlideIndex(idx);
          }}
        />
      )}

      {/* MODE 2: 3D MOLECULAR VIEWER OVERLAY */}
      {activeMode === 'VIEWER_3D' && (
        <MolecularViewer
          activeAtom={activeAtom}
          gestures={latestGestures}
          currentMolecule={currentMolecule}
          onSelectMolecule={(molType) => {
            audioService.playClickSound();
            setCurrentMolecule(molType);
            molecularSceneRef.current?.loadMolecule(molType);
          }}
        />
      )}

      {/* MODE 3: AR LAB CONTROLS */}
      {activeMode === 'AR_LAB' && (
        <ControlBar
          activeTool={activeTool}
          isThermalActive={false}
          showHUD={showHUD}
          objectCount={objectCount}
          onSelectTool={(tool) => {
            audioService.playClickSound();
            setActiveTool(tool);
          }}
          onToggleThermal={() => {}}
          onCreateObject={() => {
            if (sceneManagerRef.current && latestHandsRef.current.length > 0) {
              audioService.playSpawnSound();
              sceneManagerRef.current.arobjectManager.createObjectAtHand(activeTool, latestHandsRef.current[0], window.innerWidth, window.innerHeight);
              setObjectCount(sceneManagerRef.current.arobjectManager.getObjects().length);
            }
          }}
          onDeleteSelected={() => {
            audioService.playClickSound();
            sceneManagerRef.current?.arobjectManager.deleteSelected();
            setObjectCount(sceneManagerRef.current?.arobjectManager.getObjects().length || 0);
          }}
          onClearAll={() => {
            audioService.playClickSound();
            sceneManagerRef.current?.arobjectManager.clearAll();
            setObjectCount(0);
          }}
          onCapture={() => {
            audioService.playClickSound();
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

      {/* COLLAPSIBLE PERFORMANCE TELEMETRY CARD (TRIGGERED BY 'D' OR ACTIVITY ICON) */}
      {showDebug && (
        <div className="fixed top-20 left-6 z-40 p-4 bg-black/95 backdrop-blur-2xl border-2 border-cyan-500/50 rounded-2xl text-xs font-mono space-y-2 shadow-2xl text-white pointer-events-auto min-w-[240px] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-white/15 pb-1.5 font-bold text-cyan-400">
            <span>STAGE TELEMETRY</span>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-1 py-1 text-center font-bold border-b border-white/10">
            <div><div className="text-[9px] text-white/50">CAM</div><div className="text-emerald-400">{debugMetrics.cameraFps}</div></div>
            <div><div className="text-[9px] text-white/50">VISION</div><div className="text-cyan-300">{debugMetrics.visionFps}</div></div>
            <div><div className="text-[9px] text-white/50">RENDER</div><div className="text-pink-400">{debugMetrics.renderFps}</div></div>
          </div>
          <div className="space-y-1 py-1 text-[11px]">
            <div className="flex justify-between"><span className="text-white/60">VISION TIME:</span> <span className="text-cyan-300">{debugMetrics.visionTimeMs} ms</span></div>
            <div className="flex justify-between"><span className="text-white/60">UPDATE TIME:</span> <span className="text-yellow-300">{debugMetrics.arUpdateTimeMs} ms</span></div>
            <div className="flex justify-between"><span className="text-white/60">RENDER TIME:</span> <span className="text-purple-300">{debugMetrics.renderTimeMs} ms</span></div>
            <div className="flex justify-between font-bold"><span className="text-white/80">TOTAL FRAME:</span> <span className="text-green-400">{debugMetrics.totalFrameTimeMs} ms</span></div>
          </div>
        </div>
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
