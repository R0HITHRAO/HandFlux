import React from 'react';
import { VisualEffectState, EFFECT_CONFIGS } from '../types/effects';
import { PlusCircle, Trash2, RotateCcw, Camera, Play, Pause, Eye, EyeOff, Maximize2 } from 'lucide-react';

interface ControlBarProps {
  activeTool: VisualEffectState;
  isThermalActive: boolean;
  isDemo: boolean;
  demoTime: number;
  isPaused: boolean;
  isRecording: boolean;
  showHUD: boolean;
  isSimulated: boolean;
  objectCount: number;
  onSelectTool: (tool: VisualEffectState) => void;
  onToggleThermal: () => void;
  onCreateObject: () => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  onToggleDemo: () => void;
  onTogglePause: () => void;
  onCapture: () => void;
  onToggleRecord: () => void;
  onToggleHUD: () => void;
  onToggleFullscreen: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  activeTool,
  isThermalActive,
  isDemo,
  demoTime,
  isPaused,
  isRecording,
  showHUD,
  objectCount,
  onSelectTool,
  onToggleThermal,
  onCreateObject,
  onDeleteSelected,
  onClearAll,
  onToggleDemo,
  onTogglePause,
  onCapture,
  onToggleRecord,
  onToggleHUD,
  onToggleFullscreen,
}) => {
  const objectTools = [
    { state: VisualEffectState.RECTANGLE_TRACKING, label: '1: HATCH', hotkey: '1' },
    { state: VisualEffectState.TRIANGLE_EFFECT, label: '2: WEDGES', hotkey: '2' },
    { state: VisualEffectState.GLOW_BLOCKS, label: '3: BLOCKS', hotkey: '3' },
    { state: VisualEffectState.RECTANGLE_DOTS, label: '5: DOTS', hotkey: '5' },
    { state: VisualEffectState.LARGE_GEOMETRY, label: '6: 3D FOLD', hotkey: '6' },
    { state: VisualEffectState.PURPLE_PRISM, label: '7: PRISM', hotkey: '7' }
  ];

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center space-y-2 pointer-events-auto max-w-[95vw]">
      {/* Top Banner: Tool Guidance */}
      <div className="px-3 py-1 bg-black/90 backdrop-blur-md border border-cyan-500/40 rounded-full text-xs font-mono flex items-center space-x-2 shadow-xl">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-white/60">SELECTED TOOL:</span>
        <span className="text-cyan-400 font-bold">{EFFECT_CONFIGS[activeTool]?.name || 'NONE'}</span>
        <span className="text-white/40">|</span>
        <span className="text-pink-400">PINCH & HOLD HAND OR CLICK [ ✚ CREATE ]</span>
      </div>

      {/* Main Tool Bar */}
      <div className="flex items-center space-x-1.5 p-1.5 bg-black/85 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl overflow-x-auto">
        {/* Mode Toggle */}
        <button
          onClick={onToggleDemo}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-150 flex items-center space-x-1 ${
            isDemo
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30'
              : 'bg-white/10 text-white/80 hover:bg-white/20'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>{isDemo ? `DEMO (${demoTime.toFixed(1)}s)` : 'LIVE MODE'}</span>
        </button>

        <div className="w-[1px] h-5 bg-white/20" />

        {/* 6 AR Object Tools */}
        {objectTools.map(tool => {
          const isSelected = activeTool === tool.state;
          return (
            <button
              key={tool.state}
              onClick={() => onSelectTool(tool.state)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all duration-150 ${
                isSelected
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/50 scale-105'
                  : 'bg-white/5 text-white/70 hover:bg-white/15 hover:text-white'
              }`}
              title={`Select ${tool.label} (Press ${tool.hotkey})`}
            >
              {tool.label}
            </button>
          );
        })}

        <div className="w-[1px] h-5 bg-white/20" />

        {/* Camera Shader: THERMAL Toggle */}
        <button
          onClick={onToggleThermal}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all duration-150 flex items-center space-x-1 ${
            isThermalActive
              ? 'bg-gradient-to-r from-green-400 to-emerald-600 text-black shadow-lg shadow-green-500/50'
              : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/50'
          }`}
          title="Toggle Thermal Camera Shader (4)"
        >
          <span>4: THERMAL</span>
          <span className="text-[10px] opacity-75">{isThermalActive ? '[ON]' : '[OFF]'}</span>
        </button>

        <div className="w-[1px] h-5 bg-white/20" />

        {/* Action: CREATE */}
        <button
          onClick={onCreateObject}
          className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white rounded-lg text-xs font-mono font-bold flex items-center space-x-1 shadow-lg shadow-pink-500/40 active:scale-95 transition-transform"
          title="Create Shape at Hand (Space / Pinch & Hold)"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>CREATE</span>
        </button>

        {/* Action: DELETE */}
        <button
          onClick={onDeleteSelected}
          disabled={objectCount === 0}
          className="px-2.5 py-1.5 bg-red-950/50 hover:bg-red-900/80 text-red-300 disabled:opacity-30 disabled:pointer-events-none border border-red-500/30 rounded-lg text-xs font-mono font-bold flex items-center space-x-1"
          title="Delete Selected Shape (Delete / Backspace)"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>DELETE</span>
        </button>

        {/* Action: CLEAR ALL */}
        <button
          onClick={onClearAll}
          disabled={objectCount === 0}
          className="px-2.5 py-1.5 bg-white/5 hover:bg-white/15 text-white/70 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-xs font-mono"
          title="Clear all active objects"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>CLEAR ({objectCount})</span>
        </button>
      </div>

      {/* Utilities Bar */}
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
          title="Pause / Resume (P)"
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
