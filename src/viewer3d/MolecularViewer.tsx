import React from 'react';
import { AtomData } from './MolecularScene';
import { GestureMetrics } from '../types/gestures';
import { Atom, Move, Rotate3D, Maximize2 } from 'lucide-react';

interface MolecularViewerProps {
  activeAtom: AtomData | null;
  gestures: GestureMetrics;
}

export const MolecularViewer: React.FC<MolecularViewerProps> = ({ activeAtom, gestures }) => {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none p-8 flex flex-col justify-between select-none">
      {/* Top Header Card */}
      <div className="flex justify-between items-center bg-black/80 backdrop-blur-md border border-purple-500/30 px-6 py-3 rounded-2xl max-w-4xl mx-auto w-full shadow-2xl pointer-events-auto">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-purple-300">INTERACTIVE 3D MOLECULAR EXPLORER (CAFFEINE C8H10N4O2)</span>
        </div>
        <div className="flex items-center space-x-3 font-mono text-xs text-white/80">
          <span className="bg-purple-900/60 px-2.5 py-1 rounded-md text-purple-300 font-bold">PBR BALL-AND-STICK</span>
        </div>
      </div>

      {/* Right-Hand Atom Inspector Panel */}
      {activeAtom && (
        <div className="absolute right-8 top-28 bg-black/90 backdrop-blur-xl border border-cyan-500/50 rounded-2xl p-5 shadow-2xl max-w-xs w-full text-white font-mono space-y-3 pointer-events-auto animate-in fade-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center space-x-2">
              <Atom className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-sm text-cyan-300">{activeAtom.name}</span>
            </div>
            <span className="text-xs px-2 py-0.5 bg-cyan-950 border border-cyan-400/50 rounded text-cyan-200 font-bold">{activeAtom.element}</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-white/50">ATOMIC NUMBER:</span> <span className="text-white font-bold">{activeAtom.atomicNumber}</span></div>
            <div className="flex justify-between"><span className="text-white/50">HYBRIDIZATION:</span> <span className="text-purple-300 font-bold">{activeAtom.hybridization}</span></div>
            <div className="flex justify-between"><span className="text-white/50">VALENCE ELECTRONS:</span> <span className="text-pink-300 font-bold">{activeAtom.valence}</span></div>
            <div className="flex justify-between"><span className="text-white/50">VDW RADIUS:</span> <span className="text-yellow-300">{(activeAtom.radius * 100).toFixed(0)} pm</span></div>
          </div>
        </div>
      )}

      {/* Bottom Gesture Controls Guide */}
      <div className="max-w-xl mx-auto w-full bg-black/80 backdrop-blur-md border border-white/15 rounded-2xl p-4 shadow-xl flex items-center justify-around font-mono text-xs text-white/80 pointer-events-auto">
        <div className="flex items-center space-x-2">
          <Move className="w-4 h-4 text-cyan-400" />
          <span>Pinch: Grab/Move</span>
        </div>
        <div className="flex items-center space-x-2">
          <Rotate3D className="w-4 h-4 text-purple-400" />
          <span>Two-Hand: Rotate</span>
        </div>
        <div className="flex items-center space-x-2">
          <Maximize2 className="w-4 h-4 text-pink-400" />
          <span>Distance: Scale</span>
        </div>
      </div>
    </div>
  );
};
