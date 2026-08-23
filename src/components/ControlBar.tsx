import React from 'react';
import { VisualEffectState } from '../types/effects';
import { PlusCircle, Trash2, RotateCcw, Eye, EyeOff, Maximize2 } from 'lucide-react';

interface ControlBarProps {
  activeTool: VisualEffectState;
  isThermalActive: boolean;
  showHUD: boolean;
  objectCount: number;
  onSelectTool: (tool: VisualEffectState) => void;
  onToggleThermal: () => void;
  onCreateObject: () => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  onCapture: () => void;
  onToggleHUD: () => void;
  onToggleFullscreen: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  activeTool,
  showHUD,
  objectCount,
  onSelectTool,
  onCreateObject,
  onDeleteSelected,
  onClearAll,
  onCapture,
  onToggleHUD,
  onToggleFullscreen,
}) => {
  const isPrismSelected = activeTool === VisualEffectState.PURPLE_PRISM;

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center space-y-2 pointer-events-auto max-w-[95vw]">
      {/* Top Status Banner */}
      <div className="px-3.5 py-1.5 bg-black/90 backdrop-blur-md border border-purple-500/40 rounded-full text-xs font-mono flex items-center space-x-2.5 shadow-xl">
        <span className={`w-2 h-2 rounded-full ${isPrismSelected ? 'bg-purple-400 animate-pulse' : 'bg-gray-400'}`} />
        <span className="text-white/70">TOOL:</span>
        <span className="text-purple-300 font-bold">{isPrismSelected ? 'PRISM' : 'NONE'}</span>
        <span className="text-white/40">|</span>
        <span className="text-pink-400 font-semibold">{isPrismSelected ? 'PINCH & HOLD (400ms) OR PRESS [ ✚ CREATE ]' : 'CLICK [ PRISM ] TO SELECT TOOL'}</span>
      </div>

      {/* Main Action Bar */}
      <div className="flex items-center space-x-2 p-1.5 bg-black/85 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl">
        {/* PRISM Tool Selector */}
        <button
          onClick={() => onSelectTool(isPrismSelected ? VisualEffectState.NONE : VisualEffectState.PURPLE_PRISM)}
          className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all duration-150 flex items-center space-x-1.5 ${
            isPrismSelected
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50 scale-105'
              : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
          }`}
          title="Select Prism Tool (Press 1 or P)"
        >
          <span>💎 PRISM</span>
        </button>

        <div className="w-[1px] h-6 bg-white/20" />

        {/* CREATE Button */}
        <button
          onClick={onCreateObject}
          className="px-3.5 py-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 shadow-lg shadow-pink-500/40 active:scale-95 transition-transform"
          title="Create Prism at Hand Position (Space / Enter / Pinch-Hold)"
        >
          <PlusCircle className="w-4 h-4" />
          <span>CREATE PRISM</span>
        </button>

        {/* DELETE Button */}
        <button
          onClick={onDeleteSelected}
          disabled={objectCount === 0}
          className="px-3 py-2 bg-red-950/50 hover:bg-red-900/80 text-red-300 disabled:opacity-30 disabled:pointer-events-none border border-red-500/30 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5"
          title="Delete Selected Prism (Delete / Backspace)"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>DELETE</span>
        </button>

        {/* CLEAR ALL Button */}
        <button
          onClick={onClearAll}
          disabled={objectCount === 0}
          className="px-3 py-2 bg-white/5 hover:bg-white/15 text-white/70 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-xs font-mono flex items-center space-x-1.5"
          title="Clear all prisms"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>CLEAR ({objectCount})</span>
        </button>
      </div>

      {/* Utilities */}
      <div className="flex items-center space-x-2 p-1 bg-black/60 backdrop-blur-sm border border-white/10 rounded-md">
        <button
          onClick={onCapture}
          className="px-2.5 py-1 text-[11px] font-mono text-white/80 hover:text-white hover:bg-white/10 rounded"
        >
          [ CAPTURE ]
        </button>

        <button
          onClick={onToggleHUD}
          className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded"
          title="Toggle HUD (H)"
        >
          {showHUD ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-red-400" />}
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
