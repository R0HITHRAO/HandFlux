import React, { useState } from 'react';
import { Camera, Sparkles, Cpu, Play, Video, MonitorPlay } from 'lucide-react';

interface StartupScreenProps {
  onStartLive: (useSimulation: boolean) => void;
  onStartDemo: (useSimulation: boolean) => void;
}

export const StartupScreen: React.FC<StartupScreenProps> = ({ onStartLive, onStartDemo }) => {
  const [useSimulation, setUseSimulation] = useState(false);

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-black tech-grid-bg">
      {/* Background glow */}
      <div className="absolute w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none translate-x-32 -translate-y-24" />

      <div className="relative z-10 max-w-xl w-full mx-4 p-8 glass-panel rounded-lg shadow-2xl border border-white/15">
        {/* Header Status */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-emerald-400 font-mono tracking-widest uppercase">System Online</span>
          </div>
          <span className="text-[10px] text-white/50 font-mono">v1.0.0 / GPU PIPELINE</span>
        </div>

        {/* Title Card */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold font-mono tracking-wider text-white mb-2">
            HandFlux
          </h1>
          <p className="text-xs sm:text-sm font-mono tracking-widest text-cyan-400 uppercase">
            Real-Time Hand-Controlled Visual Effects
          </p>
          <p className="text-xs text-white/60 mt-3 max-w-md mx-auto leading-relaxed">
            Camera-powered interactive visual effects composited over 21-landmark hand tracking with procedural 3D geometry and GLSL shaders.
          </p>
        </div>

        {/* Capabilities Matrix */}
        <div className="grid grid-cols-2 gap-3 mb-8 text-[11px] font-mono">
          <div className="p-2.5 rounded bg-white/5 border border-white/10 flex items-center gap-2.5">
            <Camera className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-white/90">Mirrored Webcam</div>
              <div className="text-[9px] text-white/40">1280x720 60FPS Target</div>
            </div>
          </div>
          <div className="p-2.5 rounded bg-white/5 border border-white/10 flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-purple-400" />
            <div>
              <div className="text-white/90">MediaPipe Vision</div>
              <div className="text-[9px] text-white/40">21 Hand Landmarks</div>
            </div>
          </div>
          <div className="p-2.5 rounded bg-white/5 border border-white/10 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <div>
              <div className="text-white/90">GPU Shaders</div>
              <div className="text-[9px] text-white/40">Thermal / Halftone / Blur</div>
            </div>
          </div>
          <div className="p-2.5 rounded bg-white/5 border border-white/10 flex items-center gap-2.5">
            <MonitorPlay className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-white/90">Interactive AR</div>
              <div className="text-[9px] text-white/40">Dynamic 3D Geometry</div>
            </div>
          </div>
        </div>

        {/* Test Mode Toggle */}
        <div className="mb-6 p-3 rounded bg-white/5 border border-white/10 flex items-center justify-between text-xs font-mono">
          <span className="text-white/80">Test Mode (Synthetic Hand Motion)</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={useSimulation}
              onChange={(e) => setUseSimulation(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onStartLive(useSimulation)}
            className="flex-1 py-3 px-4 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold tech-btn flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
          >
            <Play className="w-4 h-4 fill-current" />
            LIVE EXPERIENCE
          </button>
          <button
            onClick={() => onStartDemo(useSimulation)}
            className="flex-1 py-3 px-4 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold tech-btn flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25"
          >
            <Video className="w-4 h-4" />
            34s DEMO SEQUENCE
          </button>
        </div>

        {/* Footer shortcuts */}
        <div className="mt-6 text-center text-[10px] text-white/40 font-mono">
          Press <span className="text-white/80 px-1 py-0.5 bg-white/10 rounded">H</span> for HUD, <span className="text-white/80 px-1 py-0.5 bg-white/10 rounded">1-7</span> for FX, <span className="text-white/80 px-1 py-0.5 bg-white/10 rounded">T</span> for Thermal, <span className="text-white/80 px-1 py-0.5 bg-white/10 rounded">SPACE</span> to Pause
        </div>
      </div>
    </div>
  );
};
