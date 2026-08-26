import React, { useState } from 'react';
import { AppMode } from '../types/gestures';
import { Presentation, Atom, Sparkles, PlayCircle, Settings, HelpCircle, Activity, Volume2, VolumeX } from 'lucide-react';
import { audioService } from '../utils/audioService';

interface ModeSelectorProps {
  activeMode: AppMode;
  showDebug: boolean;
  onSelectMode: (mode: AppMode) => void;
  onStartTour: () => void;
  onOpenCalibration: () => void;
  onOpenSettings: () => void;
  onToggleDebug: () => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  activeMode,
  showDebug,
  onSelectMode,
  onStartTour,
  onOpenCalibration,
  onOpenSettings,
  onToggleDebug
}) => {
  const [isMuted, setIsMuted] = useState(audioService.getIsMuted());

  const handleToggleMute = () => {
    const muted = audioService.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-3 bg-black/95 backdrop-blur-2xl border-2 border-white/25 px-4 py-2 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.9)] pointer-events-auto select-none max-w-[95vw]">
      {/* Project Logo */}
      <div className="px-3 py-1 text-xs font-mono font-black tracking-widest text-cyan-400 border-r border-white/20 flex items-center space-x-2">
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#00f5ff]" />
        <span>HANDFLUX</span>
      </div>

      {/* Mode Switches */}
      <nav className="flex items-center space-x-2">
        <button
          onClick={() => { audioService.playClickSound(); onSelectMode('PRESENTATION'); }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all ${
            activeMode === 'PRESENTATION'
              ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,245,255,0.7)] scale-105'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          <Presentation className="w-4 h-4" />
          <span>PRESENTATION</span>
        </button>

        <button
          onClick={() => { audioService.playClickSound(); onSelectMode('VIEWER_3D'); }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all ${
            activeMode === 'VIEWER_3D'
              ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.7)] scale-105'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          <Atom className="w-4 h-4" />
          <span>3D MOLECULE</span>
        </button>

        <button
          onClick={() => { audioService.playClickSound(); onSelectMode('AR_LAB'); }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all ${
            activeMode === 'AR_LAB'
              ? 'bg-pink-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.7)] scale-105'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AR VISUAL LAB</span>
        </button>
      </nav>

      <div className="w-[1px] h-6 bg-white/20" />

      {/* Tour & Tools */}
      <div className="flex items-center space-x-1.5">
        <button
          onClick={() => { audioService.playClickSound(); onStartTour(); }}
          className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white flex items-center space-x-1.5 shadow-[0_0_15px_rgba(244,63,94,0.6)] transition-all active:scale-95"
          title="75s Recruiter Guided Tour"
        >
          <PlayCircle className="w-4 h-4" />
          <span>TOUR</span>
        </button>

        <button
          onClick={handleToggleMute}
          className={`p-2 rounded-xl text-xs font-mono transition-all ${!isMuted ? 'text-cyan-300 hover:bg-white/10' : 'text-red-400 hover:bg-white/10'}`}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <button
          onClick={onToggleDebug}
          className={`p-2 rounded-xl text-xs font-mono transition-all ${showDebug ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          title="Toggle Performance HUD (D)"
        >
          <Activity className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenCalibration}
          className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          title="Interface Calibration"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          title="Settings & Privacy"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
