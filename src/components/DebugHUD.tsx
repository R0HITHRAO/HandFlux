import React from 'react';
import { PerformanceMetrics } from '../types/performance';
import { VisualEffectState } from '../types/effects';
import { GestureMetrics } from '../types/gestures';

interface DebugHUDProps {
  performance: PerformanceMetrics;
  state: VisualEffectState;
  gestures: GestureMetrics;
  handCount: number;
  isSimulated: boolean;
  isDemo: boolean;
  demoTimeSec: number;
}

export const DebugHUD: React.FC<DebugHUDProps> = ({
  performance,
  state,
  gestures,
  handCount,
  isSimulated,
  isDemo,
  demoTimeSec
}) => {
  return (
    <div className="absolute top-4 left-4 z-40 p-3.5 rounded glass-panel text-[11px] font-mono leading-tight space-y-1.5 border border-white/15 pointer-events-none min-w-[210px]">
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
        <span className="text-cyan-400 font-bold tracking-wider">TELEMETRY</span>
        <span className="text-[9px] px-1.5 py-0.5 bg-white/10 rounded text-white/70">
          {isSimulated ? 'SIMULATED' : 'WEBCAM'}
        </span>
      </div>

      <div className="flex justify-between">
        <span className="text-white/50">RENDER FPS:</span>
        <span className={performance.renderFps >= 55 ? 'text-emerald-400' : 'text-amber-400 font-bold'}>
          {performance.renderFps}
        </span>
      </div>

      <div className="flex justify-between">
        <span className="text-white/50">VISION FPS:</span>
        <span className="text-white/90">{performance.visionFps} ({performance.visionTimeMs}ms)</span>
      </div>

      <div className="flex justify-between">
        <span className="text-white/50">HANDS DETECTED:</span>
        <span className="text-purple-400 font-bold">{handCount}</span>
      </div>

      <div className="flex justify-between">
        <span className="text-white/50">PRIMARY GESTURE:</span>
        <span className="text-pink-400">{gestures.primaryGesture}</span>
      </div>

      <div className="flex justify-between">
        <span className="text-white/50">ACTIVE STATE:</span>
        <span className="text-amber-300 font-bold truncate max-w-[110px]">{state}</span>
      </div>

      {isDemo && (
        <div className="flex justify-between border-t border-white/10 pt-1">
          <span className="text-white/50">DEMO TIME:</span>
          <span className="text-cyan-400">{demoTimeSec.toFixed(1)}s / 34.0s</span>
        </div>
      )}

      <div className="flex justify-between">
        <span className="text-white/50">QUALITY:</span>
        <span className="text-white/80">{performance.qualityLevel}</span>
      </div>
    </div>
  );
};
