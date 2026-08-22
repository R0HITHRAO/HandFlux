import React from 'react';
import { AlertTriangle, Play } from 'lucide-react';

interface ErrorModalProps {
  message: string;
  onFallbackToSimulation: () => void;
  onDismiss: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ message, onFallbackToSimulation, onDismiss }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="max-w-md w-full glass-panel-glow p-6 rounded-lg border border-purple-500/40 font-mono text-sm shadow-2xl">
        <div className="flex items-center gap-3 text-rose-400 mb-4 border-b border-white/10 pb-3">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="font-bold uppercase tracking-wider">Camera Warning</h2>
        </div>

        <p className="text-white/80 text-xs leading-relaxed mb-6">
          {message}
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={onFallbackToSimulation}
            className="flex-1 py-2.5 px-3 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Switch to Test Simulation
          </button>
          <button
            onClick={onDismiss}
            className="py-2.5 px-4 rounded bg-white/10 hover:bg-white/20 text-white text-xs uppercase"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
