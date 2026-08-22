import React from 'react';
import { VisualEffectState, EFFECT_CONFIGS } from '../types/effects';
import { Camera, Video, Circle, Maximize, Play, Pause, RefreshCw, Eye, Sparkles } from 'lucide-react';

interface ControlBarProps {
  currentState: VisualEffectState;
  isDemo: boolean;
  demoTime: number;
  isPaused: boolean;
  isRecording: boolean;
  showHUD: boolean;
  isSimulated: boolean;
  onSelectState: (state: VisualEffectState) => void;
  onToggleDemo: () => void;
  onToggleSimulation: () => void;
  onTogglePause: () => void;
  onCapture: () => void;
  onToggleRecord: () => void;
  onToggleHUD: () => void;
  onToggleFullscreen: () => void;
  onReset: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  currentState,
  isDemo,
  demoTime,
  isPaused,
  isRecording,
  showHUD,
  isSimulated,
  onSelectState,
  onToggleDemo,
  onToggleSimulation,
  onTogglePause,
  onCapture,
  onToggleRecord,
  onToggleHUD,
  onToggleFullscreen,
  onReset
}) => {
  const stateList = [
    { key: VisualEffectState.RECTANGLE_TRACKING, label: '1: HATCH' },
    { key: VisualEffectState.TRIANGLE_EFFECT, label: '2: WEDGES' },
    { key: VisualEffectState.GLOW_BLOCKS, label: '3: BLOCKS' },
    { key: VisualEffectState.THERMAL, label: '4: THERMAL' },
    { key: VisualEffectState.RECTANGLE_DOTS, label: '5: DOTS' },
    { key: VisualEffectState.LARGE_GEOMETRY, label: '6: 3D FOLD' },
    { key: VisualEffectState.PURPLE_PRISM, label: '7: PRISM' }
  ];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[calc(100%-2rem)] flex flex-col gap-2">
      {/* Demo Timeline Progress Bar */}
      {isDemo && (
        <div className="glass-panel px-3 py-1.5 rounded flex items-center gap-3 text-[10px] font-mono">
          <span className="text-purple-400 font-bold uppercase tracking-wider whitespace-nowrap">
            DEMO: {EFFECT_CONFIGS[currentState]?.displayName || currentState}
          </span>
          <div className="relative flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 bottom-0 bg-purple-500 transition-all duration-100"
              style={{ width: `${(demoTime / 34.0) * 100}%` }}
            />
          </div>
          <span className="text-white/60">{demoTime.toFixed(1)}s / 34s</span>
        </div>
      )}

      {/* Main Control Strip */}
      <div className="glass-panel p-2 rounded-lg flex flex-wrap items-center justify-between gap-2">
        {/* Left: Mode Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleDemo}
            className={`px-3 py-1.5 rounded text-[11px] font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 ${
              isDemo ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            {isDemo ? 'DEMO MODE' : 'LIVE MODE'}
          </button>

          <button
            onClick={onToggleSimulation}
            className={`px-2.5 py-1.5 rounded text-[10px] font-mono uppercase transition-all ${
              isSimulated ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
            title="Toggle synthetic hand simulation vs real webcam"
          >
            {isSimulated ? 'TEST SIM: ON' : 'CAMERA'}
          </button>
        </div>

        {/* Center: Quick State Selectors */}
        <div className="hidden md:flex items-center gap-1 overflow-x-auto">
          {stateList.map((st) => (
            <button
              key={st.key}
              onClick={() => onSelectState(st.key)}
              className={`px-2 py-1 rounded text-[10px] font-mono tracking-wider transition-all ${
                currentState === st.key
                  ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/30'
                  : 'bg-white/5 text-white/70 hover:bg-white/15'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onCapture}
            className="px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] font-mono flex items-center gap-1"
            title="Save PNG snapshot"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CAPTURE</span>
          </button>

          <button
            onClick={onToggleRecord}
            className={`px-2.5 py-1.5 rounded text-[10px] font-mono flex items-center gap-1 transition-all ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Record WebM video"
          >
            <Circle className={`w-3 h-3 ${isRecording ? 'fill-white' : 'fill-rose-500 text-rose-500'}`} />
            <span>{isRecording ? 'STOP' : 'RECORD'}</span>
          </button>

          <button
            onClick={onToggleHUD}
            className={`p-1.5 rounded text-white transition-all ${showHUD ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/10 text-white/50'}`}
            title="Toggle Technical HUD (H)"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onTogglePause}
            className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white"
            title="Pause/Resume (Space)"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white"
            title="Toggle Fullscreen (F)"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
