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
  const mouseRef = useRef<{ isDown: boolean; x: number; y: number; prevX: number; prevY: number }>({
    isDown: false, x: 0, y: 0, prevX: 0, prevY: 0
  });

  const [activeMode, setActiveMode] = useState<AppMode>('PRESENTATION');
  const [activeTool, setActiveTool] = useState<VisualEffectState>(VisualEffectState.NONE);
  const [objectCount, setObjectCount] = useState<number>(0);
  const [showHUD, setShowHUD] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<'INITIALIZING' | 'ACTIVE' | 'ERROR'>('INITIALIZING');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [currentMolecule, setCurrentMolecule] = useState<MoleculeType>('CAFFEINE');
  const [activeAtom, setActiveAtom] = useState<AtomData | null>(null);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [debugMetrics, setDebugMetrics] = useState<PerformanceMetrics>({
    cameraFps: 30, visionFps: 28, renderFps: 60, visionTimeMs: 6.0,
    visionLatencyMs: 6.0, arUpdateTimeMs: 0.8, renderTimeMs: 4.2,
    totalFrameTimeMs: 11.0, frameTimeMs: 11.0, qualityLevel: 'HIGH',
    activeParticles: 350, dpr: 1, renderScale: 1.0
  });
  const [latestGestures, setLatestGestures] = useState<GestureMetrics>({
    primaryGesture: 'NONE', isPinching: false, isPointing: false,
    isOpenPalm: false, isFist: false, pinchDistance: 1, spread: 0,
    pointerPosition: { screenX: 0, screenY: 0 }, twoHandDistance: 0,
    twoHandAngle: 0, twoHandMidpoint: { screenX: 0, screenY: 0 },
    swipeDirection: 'NONE', swipeVelocity: 0
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

  // 4. Vision Loop (~28 FPS)
  useEffect(() => {
    let isRunning = true;
    let timerId: ReturnType<typeof setTimeout>;

    const runVisionStep = () => {
      if (!isRunning) return;
      if (document.hidden) { timerId = setTimeout(runVisionStep, 200); return; }

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
    return () => { isRunning = false; clearTimeout(timerId); };
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

      const gestures = gestureEngineRef.current.processHands(hands, width, height, timestamp);

      if (hands.length === 0 && mouseRef.current.x > 0) {
        gestures.pointerPosition = { screenX: mouseRef.current.x, screenY: mouseRef.current.y };
        gestures.isPointing = true;
        if (mouseRef.current.isDown) gestures.isPinching = true;
      }

      if (activeMode === 'VIEWER_3D' && molecularSceneRef.current && sceneManagerRef.current) {
        const mol = molecularSceneRef.current.group;
        molecularSceneRef.current.updateOrbitals(timestamp * 0.001);

        const rayX = gestures.isPointing ? gestures.pointerPosition.screenX : mouseRef.current.x;
        const rayY = gestures.isPointing ? gestures.pointerPosition.screenY : mouseRef.current.y;
        const normX = (rayX / width) * 2 - 1;
        const normY = -(rayY / height) * 2 + 1;
        raycasterRef.current.setFromCamera(new THREE.Vector2(normX, normY), sceneManagerRef.current['camera3D']);
        const hitAtom = molecularSceneRef.current.raycastAtom(raycasterRef.current);
        if (hitAtom && !activeAtom) audioService.playAtomInspectSound();
        setActiveAtom(hitAtom);

        if (mouseRef.current.isDown && hands.length === 0) {
          mol.rotation.y += (mouseRef.current.x - mouseRef.current.prevX) * 0.01;
          mol.rotation.x += (mouseRef.current.y - mouseRef.current.prevY) * 0.01;
        } else if (!gestures.isPinching && !mouseRef.current.isDown) {
          mol.rotation.y += dt * 0.35;
          mol.rotation.x += dt * 0.15;
        }
        if (hands.length >= 2) {
          mol.scale.setScalar(Math.max(0.5, Math.min(2.5, gestures.twoHandDistance * 2.2)));
          mol.rotation.z = gestures.twoHandAngle;
        }
      }

      let pinchHoldProgress = 0.0;
      if (sceneManagerRef.current) {
        sceneManagerRef.current.arobjectManager.setActiveTool(activeMode === 'AR_LAB' ? activeTool : VisualEffectState.NONE);
        const renderScale = perfMonitorRef.current.getRenderScale();
        const res = sceneManagerRef.current.updateAndRender(
          hands, gestures, activeMode === 'AR_LAB' ? activeTool : VisualEffectState.NONE,
          dt, timestamp * 0.001, renderScale
        );
        pinchHoldProgress = res.pinchHoldProgress;
        if (res.creationTriggered) {
          audioService.playSpawnSound();
          setObjectCount(sceneManagerRef.current.arobjectManager.getObjects().length);
        }
      }

      if (hudRef.current && showHUD && sceneManagerRef.current) {
        const objects = activeMode === 'AR_LAB' ? sceneManagerRef.current.arobjectManager.getObjects() : [];
        const selected = sceneManagerRef.current.arobjectManager.getSelectedObject();
        const metrics = perfMonitorRef.current.getMetrics();
        hudRef.current.render(
          hands, gestures, activeTool, objects,
          selected ? selected.id : null, pinchHoldProgress,
          { showLandmarks: true, showCoordinates: false, showGuides: false, showReticles: false, showBoundingBox: false },
          metrics, timestamp * 0.001
        );
      } else if (hudRef.current && !showHUD) {
        const ctx = hudCanvasRef.current?.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, width, height);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [showHUD, activeTool, activeMode, activeAtom]);

  // 6. UI Poller
  useEffect(() => {
    const interval = setInterval(() => {
      setDebugMetrics(perfMonitorRef.current.getMetrics());
      const hands = latestHandsRef.current;
      const g = gestureEngineRef.current.processHands(hands, window.innerWidth, window.innerHeight);
      setLatestGestures(g);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // 7. Mouse Events
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current.prevX = mouseRef.current.x;
      mouseRef.current.prevY = mouseRef.current.y;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    const onDown = () => { mouseRef.current.isDown = true; };
    const onUp = () => { mouseRef.current.isDown = false; };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { audioService.playSwipeSound(); presentationRef.current.nextSlide(); setCurrentSlideIndex(presentationRef.current.getCurrentIndex()); }
      if (e.key === 'ArrowLeft') { audioService.playSwipeSound(); presentationRef.current.prevSlide(); setCurrentSlideIndex(presentationRef.current.getCurrentIndex()); }
      if (e.key === '1') handleSelectMode('PRESENTATION');
      if (e.key === '2') handleSelectMode('VIEWER_3D');
      if (e.key === '3') handleSelectMode('AR_LAB');
      if (e.key === 'd' || e.key === 'D') setShowDebug(p => !p);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('keydown', onKey);
    };
  }, [handleSelectMode]);

  // ---- INLINE STYLES for guaranteed visibility ----
  const S = {
    root: { position: 'fixed' as const, inset: 0, background: '#000', overflow: 'hidden' },
    video: { position: 'absolute' as const, inset: 0, width: '100%', height: '100%', objectFit: 'cover' as const, transform: 'scaleX(-1)', zIndex: 0 },
    arCanvas: { position: 'absolute' as const, inset: 0, zIndex: 10, pointerEvents: 'none' as const },
    hudCanvas: { position: 'absolute' as const, inset: 0, zIndex: 20, pointerEvents: 'none' as const },
    topBar: { position: 'fixed' as const, top: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9000, pointerEvents: 'auto' as const },
    statusBanner: { position: 'fixed' as const, top: '5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9001, pointerEvents: 'auto' as const },
    modePanel: { position: 'fixed' as const, top: '5rem', right: '1.25rem', bottom: '5rem', width: 360, maxWidth: '38vw', zIndex: 8000, pointerEvents: 'auto' as const, overflowY: 'auto' as const },
    debugPanel: { position: 'fixed' as const, top: '5rem', left: '1.5rem', zIndex: 8000 },
    bottomBar: { position: 'fixed' as const, bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9000, pointerEvents: 'auto' as const },
  };

  return (
    <div style={S.root}>
      {/* LAYER 0: WEBCAM */}
      <video ref={videoRef} autoPlay playsInline muted style={S.video} />

      {/* LAYER 1: THREE.JS 3D CANVAS */}
      <div ref={arContainerRef} style={S.arCanvas} />

      {/* LAYER 2: 2D HUD CANVAS */}
      <canvas ref={hudCanvasRef} style={S.hudCanvas} />

      {/* STATUS BANNER */}
      {cameraStatus === 'INITIALIZING' && (
        <div style={{ ...S.statusBanner, background: 'rgba(0,0,0,0.9)', border: '1px solid #00f5ff', borderRadius: '1rem', padding: '0.5rem 1.25rem', color: '#00f5ff', fontFamily: 'monospace', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#00f5ff', animation: 'pulse 1s infinite' }} />
          CONNECTING TO WEBCAM &amp; VISION MODEL...
        </div>
      )}
      {cameraStatus === 'ERROR' && (
        <div style={{ ...S.statusBanner, background: 'rgba(60,0,0,0.95)', border: '1px solid #f87171', borderRadius: '1rem', padding: '0.75rem 1.25rem', color: '#fff', fontFamily: 'monospace', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: '#f87171' }}>? CAMERA: {errorMessage}</span>
          <button onClick={startCamera} style={{ padding: '0.25rem 0.75rem', background: '#dc2626', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'monospace' }}>
            RETRY
          </button>
        </div>
      )}

      {/* TOP NAVBAR */}
      <div style={S.topBar}>
        <ModeSelector
          activeMode={activeMode}
          showDebug={showDebug}
          onSelectMode={handleSelectMode}
          onStartTour={() => setIsTourActive(true)}
          onOpenCalibration={() => setIsCalibrationOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleDebug={() => setShowDebug(p => !p)}
        />
      </div>

      {/* MODE PANELS */}
      {activeMode === 'PRESENTATION' && (
        <div style={S.modePanel}>
          <PresentationView
            slide={presentationRef.current.getCurrentSlide()}
            currentIndex={currentSlideIndex}
            totalSlides={presentationRef.current.getSlideCount()}
            gestures={latestGestures}
            onPrev={() => { audioService.playSwipeSound(); presentationRef.current.prevSlide(); setCurrentSlideIndex(presentationRef.current.getCurrentIndex()); }}
            onNext={() => { audioService.playSwipeSound(); presentationRef.current.nextSlide(); setCurrentSlideIndex(presentationRef.current.getCurrentIndex()); }}
            onSelectSlide={(idx) => { audioService.playClickSound(); presentationRef.current.setSlide(idx); setCurrentSlideIndex(idx); }}
          />
        </div>
      )}

      {activeMode === 'VIEWER_3D' && (
        <div style={S.modePanel}>
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
        </div>
      )}

      {activeMode === 'AR_LAB' && (
        <div style={S.bottomBar}>
          <ControlBar
            activeTool={activeTool}
            isThermalActive={false}
            showHUD={showHUD}
            objectCount={objectCount}
            onSelectTool={(tool) => { audioService.playClickSound(); setActiveTool(tool); }}
            onToggleThermal={() => {}}
            onCreateObject={() => {
              if (sceneManagerRef.current && latestHandsRef.current.length > 0) {
                audioService.playSpawnSound();
                sceneManagerRef.current.arobjectManager.createObjectAtHand(activeTool, latestHandsRef.current[0], window.innerWidth, window.innerHeight);
                setObjectCount(sceneManagerRef.current.arobjectManager.getObjects().length);
              }
            }}
            onDeleteSelected={() => { audioService.playClickSound(); sceneManagerRef.current?.arobjectManager.deleteSelected(); setObjectCount(sceneManagerRef.current?.arobjectManager.getObjects().length || 0); }}
            onClearAll={() => { audioService.playClickSound(); sceneManagerRef.current?.arobjectManager.clearAll(); setObjectCount(0); }}
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
        </div>
      )}

      {/* DEBUG PANEL */}
      {showDebug && (
        <div style={{ ...S.debugPanel, background: 'rgba(0,0,0,0.95)', border: '1px solid rgba(0,245,255,0.4)', borderRadius: '1rem', padding: '1rem', minWidth: 220, fontFamily: 'monospace', fontSize: '0.7rem', color: '#fff' }}>
          <div style={{ color: '#00f5ff', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>TELEMETRY</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>VISION FPS:</span><span style={{ color: '#67e8f9' }}>{debugMetrics.visionFps}</span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>RENDER FPS:</span><span style={{ color: '#f0abfc' }}>{debugMetrics.renderFps}</span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>VISION MS:</span><span style={{ color: '#86efac' }}>{debugMetrics.visionTimeMs}ms</span>
          </div>
        </div>
      )}

      {/* MODALS */}
      <RecruiterDemoTour isActive={isTourActive} onStop={() => setIsTourActive(false)} onSetMode={handleSelectMode} />
      <CalibrationModal isOpen={isCalibrationOpen} gestures={latestGestures} onClose={() => setIsCalibrationOpen(false)} onComplete={({ pinchThreshold }) => { gestureEngineRef.current.setPinchThreshold(pinchThreshold); }} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};
