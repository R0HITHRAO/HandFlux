import React from 'react';
import { VisualEffectState, EFFECT_CONFIGS } from '../types/effects';
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
  const toolConfigs = [
    { type: VisualEffectState.RECTANGLE_TRACKING, label: '📐 HATCH' },
    { type: VisualEffectState.PURPLE_PRISM, label: '💎 PRISM' },
    { type: VisualEffectState.TRIANGLE_EFFECT, label: '🔺 WEDGES' },
    { type: VisualEffectState.GLOW_BLOCKS, label: '🧊 BLOCKS' },
    { type: VisualEffectState.RECTANGLE_DOTS, label: '✨ DOTS' },
    { type: VisualEffectState.LARGE_GEOMETRY, label: '📦 3D FOLD' }
  ];

  const toolName = EFFECT_CONFIGS[activeTool]?.name || 'NONE';

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center space-y-2 pointer-events-auto max-w-[95vw]">
      {/* Tool Selector Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-black/85 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
        {toolConfigs.map(({ type, label }) => {
          const isSelected = activeTool === type;
          return (
            <button
              key={type}
              onClick={() => onSelectTool(isSelected ? VisualEffectState.NONE : type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                isSelected
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/50 scale-105'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
              }`}
            >
              <span>{label}</span>
            </button>
          );
        })}

        <div className="w-[1px] h-6 bg-white/20 mx-1" />

        {/* Create Button */}
        <button
          onClick={onCreateObject}
          className="px-3.5 py-1.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 shadow-lg shadow-pink-500/40 active:scale-95 transition-transform"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>CREATE {toolName !== 'NONE' ? toolName : ''}</span>
        </button>

        {/* Delete Button */}
        <button
          onClick={onDeleteSelected}
          disabled={objectCount === 0}
          className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 disabled:opacity-30 disabled:pointer-events-none border border-red-500/30 rounded-xl text-xs font-mono font-bold flex items-center space-x-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>DELETE</span>
        </button>

        {/* Clear Button */}
        <button
          onClick={onClearAll}
          disabled={objectCount === 0}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/15 text-white/70 disabled:opacity-30 disabled:pointer-events-none rounded-xl text-xs font-mono flex items-center space-x-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>CLEAR ({objectCount})</span>
        </button>
      </div>
    </div>
  );
};
