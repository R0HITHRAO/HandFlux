import React, { useEffect, useState } from 'react';
import { AppMode } from '../types/gestures';
import { Play, Sparkles, X, CheckCircle2 } from 'lucide-react';

interface RecruiterDemoTourProps {
  isActive: boolean;
  onStop: () => void;
  onSetMode: (mode: AppMode) => void;
}

export const RecruiterDemoTour: React.FC<RecruiterDemoTourProps> = ({ isActive, onStop, onSetMode }) => {
  const [progressSec, setProgressSec] = useState<number>(0);

  useEffect(() => {
    if (!isActive) {
      setProgressSec(0);
      return;
    }

    const interval = setInterval(() => {
      setProgressSec(prev => {
        const next = prev + 1;
        if (next === 10) onSetMode('VIEWER_3D');
        if (next === 30) onSetMode('PRESENTATION');
        if (next === 50) onSetMode('AR_LAB');
        if (next >= 75) {
          onStop();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onSetMode, onStop]);

  if (!isActive) return null;

  let currentStage = 'STAGE 1: LIVE 21-LANDMARK HAND TRACKING (0-10s)';
  if (progressSec >= 10 && progressSec < 30) currentStage = 'STAGE 2: 3D MOLECULAR MANIPULATION & INSPECTION (10-30s)';
  if (progressSec >= 30 && progressSec < 50) currentStage = 'STAGE 3: TOUCHLESS PRESENTATION SWIPE & LASER POINTER (30-50s)';
  if (progressSec >= 50) currentStage = 'STAGE 4: AR SHADER LAB & 60 FPS BENCHMARKS (50-75s)';

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-black/90 backdrop-blur-xl border border-pink-500/50 rounded-2xl px-6 py-4 shadow-2xl max-w-xl w-full text-white font-mono space-y-2.5 pointer-events-auto animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5 text-pink-400 font-bold text-xs">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>RECRUITER GUIDED TOUR IN PROGRESS</span>
        </div>
        <button onClick={onStop} className="text-white/50 hover:text-white"><X className="w-4 h-4" /></button>
      </div>

      <div className="text-xs font-bold text-cyan-300">{currentStage}</div>

      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-cyan-400 to-pink-500 h-full transition-all duration-1000"
          style={{ width: `${(progressSec / 75) * 100}%` }}
        />
      </div>
      <div className="text-[10px] text-white/50 text-right">{progressSec}s / 75s</div>
    </div>
  );
};
