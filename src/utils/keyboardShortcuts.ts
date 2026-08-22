import { VisualEffectState } from '../types/effects';

export interface ShortcutHandlers {
  onSetState: (state: VisualEffectState) => void;
  onToggleDemo: () => void;
  onToggleSimulation: () => void;
  onToggleHUD: () => void;
  onToggleLandmarks: () => void;
  onToggleCoordinates: () => void;
  onToggleGuides: () => void;
  onToggleThermal: () => void;
  onTriggerBlur: () => void;
  onCapture: () => void;
  onToggleRecord: () => void;
  onToggleFullscreen: () => void;
  onTogglePause: () => void;
  onReset: () => void;
}

export function registerKeyboardShortcuts(handlers: ShortcutHandlers): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
    // Ignore when typing inside input fields
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    switch (e.key.toLowerCase()) {
      case '1':
        handlers.onSetState(VisualEffectState.RECTANGLE_TRACKING);
        break;
      case '2':
        handlers.onSetState(VisualEffectState.TRIANGLE_EFFECT);
        break;
      case '3':
        handlers.onSetState(VisualEffectState.GLOW_BLOCKS);
        break;
      case '4':
        handlers.onSetState(VisualEffectState.THERMAL);
        break;
      case '5':
        handlers.onSetState(VisualEffectState.LARGE_GEOMETRY);
        break;
      case '6':
        handlers.onSetState(VisualEffectState.PURPLE_PRISM);
        break;
      case 'd':
        handlers.onToggleDemo();
        break;
      case 's':
        handlers.onToggleSimulation();
        break;
      case 't':
        handlers.onToggleThermal();
        break;
      case 'b':
        handlers.onTriggerBlur();
        break;
      case 'h':
        handlers.onToggleHUD();
        break;
      case 'l':
        handlers.onToggleLandmarks();
        break;
      case 'c':
        handlers.onToggleCoordinates();
        break;
      case 'g':
        handlers.onToggleGuides();
        break;
      case 'f':
        handlers.onToggleFullscreen();
        break;
      case 'r':
        handlers.onReset();
        break;
      case ' ':
        e.preventDefault();
        handlers.onTogglePause();
        break;
      case 'escape':
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        break;
    }
  };

  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}
