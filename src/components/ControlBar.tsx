import React from 'react';
import { VisualEffectState, EFFECT_CONFIGS } from '../types/effects';
import { PlusCircle, Trash2, RotateCcw } from 'lucide-react';

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
  objectCount,
  onSelectTool,
  onCreateObject,
  onDeleteSelected,
  onClearAll,
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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center space-y-2 pointer-events-auto max-w-[95vw]">
      {/* Tool Selector Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-2 bg-black/90 backdrop-blur-2xl border-2 border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
        {toolConfigs.map(({ type, label }) => {
          const isSelected = activeTool === type;
          return (
            <button
              key={type}
              onClick={() => onSelectTool(isSelected ? VisualEffectState.NONE : type)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                isSelected
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,245,255,0.7)] scale-105'
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
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 shadow-[0_0_15px_rgba(244,63,94,0.6)] active:scale-95 transition-transform"
        >
          <PlusCircle className="w-4 h-4" />
          <span>CREATE {toolName !== 'NONE' ? toolName : ''}</span>
        </button>

        {/* Delete Button */}
        <button
          onClick={onDeleteSelected}
          disabled={objectCount === 0}
          className="px-3.5 py-2 bg-red-950/80 hover:bg-red-900 text-red-200 disabled:opacity-30 disabled:pointer-events-none border border-red-500/40 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>DELETE</span>
        </button>

        {/* Clear Button */}
        <button
          onClick={onClearAll}
          disabled={objectCount === 0}
          className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white/80 disabled:opacity-30 disabled:pointer-events-none rounded-xl text-xs font-mono flex items-center space-x-1.5 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>CLEAR ({objectCount})</span>
        </button>
      </div>
    </div>
  );
};
