import React from 'react';
import { ShieldCheck, Sliders, X, Keyboard } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-gray-950 border border-white/20 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6 text-white font-mono relative">
        <button onClick={onClose} className="absolute top-5 right-5 text-white/50 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 border-b border-white/10 pb-3">
          <Sliders className="w-5 h-5 text-cyan-400" />
          <h2 className="font-bold text-sm text-cyan-300">SYSTEM SETTINGS & PRIVACY</h2>
        </div>

        {/* Privacy Notice Card */}
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-start space-x-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-emerald-300">100% LOCAL PRIVACY GUARANTEE</div>
            <p className="text-white/70 leading-relaxed">All computer vision landmark detection runs directly on your local GPU/Wasm. Zero video frames or personal biometrics are ever uploaded or transmitted.</p>
          </div>
        </div>

        {/* Keyboard Fallback Table */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-purple-300">
            <Keyboard className="w-4 h-4" />
            <span>ACCESSIBILITY / KEYBOARD FALLBACKS</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-white/80 bg-white/5 p-3 rounded-xl border border-white/10">
            <div><span className="font-bold text-cyan-300">Left / Right Arrow:</span> Prev/Next Slide</div>
            <div><span className="font-bold text-cyan-300">Space / Enter:</span> Create Object / Pinch</div>
            <div><span className="font-bold text-cyan-300">1 / 2 / 3:</span> Switch Modes</div>
            <div><span className="font-bold text-cyan-300">D:</span> Toggle Performance HUD</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 font-bold rounded-xl text-xs"
        >
          CLOSE SETTINGS
        </button>
      </div>
    </div>
  );
};
