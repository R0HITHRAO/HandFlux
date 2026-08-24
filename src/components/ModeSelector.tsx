import React from 'react';
import { AppMode } from '../types/gestures';
import { Presentation, Atom, Sparkles, PlayCircle, Settings, HelpCircle } from 'lucide-react';

interface ModeSelectorProps {
  activeMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  onStartTour: () => void;
  onOpenCalibration: () => void;
  onOpenSettings: () => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  activeMode,
  onSelectMode,
  onStartTour,
  onOpenCalibration,
  onOpenSettings
}) => {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-2 bg-black/85 backdrop-blur-md border border-white/20 p-1.5 rounded-2xl shadow-2xl pointer-events-auto select-none">
      {/* Logo */}
      <div className="px-3 py-1 text-xs font-mono font-black tracking-wider text-cyan-400 border-r border-white/10 flex items-center space-x-1.5">
        <span>HANDFLUX</span>
      </div>

      {/* Modes */}
      <button
        onClick={() => onSelectMode('PRESENTATION')}
        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
          activeMode === 'PRESENTATION'
            ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/40 scale-105'
            : 'text-white/70 hover:text-white hover:bg-white/10'
        }`}
      >
        <Presentation className="w-3.5 h-3.5" />
        <span>PRESENTATION</span>
      </button>

      <button
        onClick={() => onSelectMode('VIEWER_3D')}
        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
          activeMode === 'VIEWER_3D'
            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40 scale-105'
            : 'text-white/70 hover:text-white hover:bg-white/10'
        }`}
      >
        <Atom className="w-3.5 h-3.5" />
        <span>3D MOLECULE</span>
      </button>

      <button
        onClick={() => onSelectMode('AR_LAB')}
        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
          activeMode === 'AR_LAB'
            ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/40 scale-105'
            : 'text-white/70 hover:text-white hover:bg-white/10'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>AR VISUAL LAB</span>
      </button>

      <div className="w-[1px] h-5 bg-white/20" />

      {/* Tour & Calibration */}
      <button
        onClick={onStartTour}
        className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:opacity-90 flex items-center space-x-1 shadow-md shadow-pink-500/30"
        title="Run 75-second automated recruiter interview tour"
      >
        <PlayCircle className="w-3.5 h-3.5" />
        <span>TOUR</span>
      </button>

      <button
        onClick={onOpenCalibration}
        className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
        title="Interface Calibration"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      <button
        onClick={onOpenSettings}
        className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
        title="Settings & Privacy"
      >
        <Settings className="w-4 h-4" />
      </button>
    </div>
  );
};
