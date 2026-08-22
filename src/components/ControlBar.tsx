import React from 'react';
import { VisualEffectState, EFFECT_CONFIGS } from '../types/effects';
import { Camera, Play, Pause, Square, Eye, EyeOff, Maximize2 } from 'lucide-react';

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
}) => {
  const visualButtons = [
    { state: VisualEffectState.RECTANGLE_TRACKING, label: '1: HATCH', hotkey: '1' },
    { state: VisualEffectState.TRIANGLE_EFFECT, label: '2: WEDGES', hotkey: '2' },
    { state: VisualEffectState.GLOW_BLOCKS, label: '3: BLOCKS', hotkey: '3' },
    { state: VisualEffectState.THERMAL, label: '4: THERMAL', hotkey: '4' },
    { state: VisualEffectState.RECTANGLE_DOTS, label: '5: DOTS', hotkey: '5' },
    { state: VisualEffectState.LARGE_GEOMETRY, label: '6: 3D FOLD', hotkey: '6' },
    { state: VisualEffectState.PURPLE_PRISM, label: '7: PRISM', hotkey: '7' },
    { state: VisualEffectState.RAW_CAMERA, label: 'RAW CAM', hotkey: 'C' }
  ];

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center space-y-2 pointer-events-auto">
      {/* Mode & Effect Buttons */}
      <div className="flex items-center space-x-1.5 p-1.5 bg-black/80 backdrop-blur-md border border-cyan-500/30 rounded-lg shadow-2xl">
        {/* Mode Toggle Button */}
        <button
          onClick={onToggleDemo}
          className={`px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider transition-all duration-150 flex items-center space-x-1 ${
            isDemo
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30'
              : 'bg-white/10 text-white/80 hover:bg-white/20'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>{isDemo ? `DEMO (${demoTime.toFixed(1)}s)` : 'LIVE MODE'}</span>
        </button>

        <div className="w-[1px] h-5 bg-white/20" />

        {/* 7 Functional Visual Effect Buttons */}
        {visualButtons.map(btn => {
          const isActive = currentState === btn.state;
          return (
            <button
              key={btn.state}
              onClick={() => onSelectState(btn.state)}
              className={`px-2.5 py-1.5 rounded text-xs font-mono font-bold tracking-wide transition-all duration-150 ${
                isActive
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/50 scale-105'
                  : 'bg-white/5 text-white/70 hover:bg-white/15 hover:text-white'
              }`}
              title={`Press ${btn.hotkey}`}
            >
              {btn.label}
            </button>
          );
        })}
      </div>

      {/* Quick Action Utilities */}
      <div className="flex items-center space-x-2 p-1 bg-black/60 backdrop-blur-sm border border-white/10 rounded-md">
        <button
          onClick={onCapture}
          className="px-2.5 py-1 text-[11px] font-mono text-white/80 hover:text-white hover:bg-white/10 rounded"
        >
          [ CAPTURE ]
        </button>

        <button
          onClick={onToggleRecord}
          className={`px-2.5 py-1 text-[11px] font-mono rounded flex items-center space-x-1.5 ${
            isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`} />
          <span>{isRecording ? 'STOP' : 'RECORD'}</span>
        </button>

        <button
          onClick={onToggleHUD}
          className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded"
          title="Toggle HUD (H)"
        >
          {showHUD ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-red-400" />}
        </button>

        <button
          onClick={onTogglePause}
          className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded"
          title="Pause / Resume (Space)"
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-green-400" /> : <Pause className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={onToggleFullscreen}
          className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded"
          title="Fullscreen (F)"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
