import React from 'react';
import { AtomData, MoleculeType } from './MolecularScene';
import { GestureMetrics } from '../types/gestures';
import { Atom, Move, Rotate3D, Maximize2 } from 'lucide-react';

interface MolecularViewerProps {
  activeAtom: AtomData | null;
  gestures: GestureMetrics;
  currentMolecule: MoleculeType;
  onSelectMolecule: (type: MoleculeType) => void;
}

export const MolecularViewer: React.FC<MolecularViewerProps> = ({
  activeAtom,
  currentMolecule,
  onSelectMolecule
}) => {
  const molecules: { id: MoleculeType; label: string; formula: string }[] = [
    { id: 'CAFFEINE', label: 'Caffeine', formula: 'C8H10N4O2' },
    { id: 'BENZENE', label: 'Benzene', formula: 'C6H6' },
    { id: 'ETHANOL', label: 'Ethanol', formula: 'C2H6O' },
    { id: 'WATER', label: 'Water', formula: 'H2O' }
  ];

  return (
    <div className="fixed inset-0 z-20 pointer-events-none p-6 flex flex-col justify-between select-none overflow-hidden">
      {/* Top Molecule Switcher Pill (Docked neatly below top navbar) */}
      <div className="flex justify-center pt-16 pointer-events-auto">
        <div className="flex items-center space-x-2 bg-black/95 backdrop-blur-2xl border-2 border-purple-500/50 p-2 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.9)]">
          {molecules.map(m => (
            <button
              key={m.id}
              onClick={() => onSelectMolecule(m.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                currentMolecule === m.id
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_#a855f7] scale-105'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{m.label}</span>
              <span className="ml-1.5 text-[10px] text-purple-300 font-semibold">({m.formula})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right-Hand Atom Inspector Panel */}
      {activeAtom && (
        <div className="absolute right-8 top-32 bg-black/95 backdrop-blur-2xl border-2 border-cyan-500/60 rounded-3xl p-5 shadow-[0_25px_60px_rgba(0,0,0,0.95)] max-w-xs w-full text-white font-mono space-y-3 pointer-events-auto animate-in fade-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
            <div className="flex items-center space-x-2">
              <Atom className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-sm text-cyan-300">{activeAtom.name}</span>
            </div>
            <span className="text-xs px-2.5 py-0.5 bg-cyan-950 border border-cyan-400/80 rounded-lg text-cyan-200 font-bold shadow-[0_0_10px_#00f5ff]">
              {activeAtom.element}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-white/60">ATOMIC NUMBER:</span> <span className="text-white font-bold">{activeAtom.atomicNumber}</span></div>
            <div className="flex justify-between"><span className="text-white/60">HYBRIDIZATION:</span> <span className="text-purple-300 font-bold">{activeAtom.hybridization}</span></div>
            <div className="flex justify-between"><span className="text-white/60">VALENCE ELECTRONS:</span> <span className="text-pink-300 font-bold">{activeAtom.valence}</span></div>
            <div className="flex justify-between"><span className="text-white/60">VDW RADIUS:</span> <span className="text-yellow-300">{(activeAtom.radius * 100).toFixed(0)} pm</span></div>
          </div>
        </div>
      )}

      {/* Bottom Gesture Controls Guide */}
      <div className="max-w-md mx-auto w-full bg-black/95 backdrop-blur-2xl border-2 border-white/25 rounded-2xl p-4 shadow-[0_15px_35px_rgba(0,0,0,0.9)] flex items-center justify-around font-mono text-xs text-white/90 pointer-events-auto mb-2">
        <div className="flex items-center space-x-2 text-cyan-300">
          <Move className="w-4 h-4" />
          <span>Pinch: Move</span>
        </div>
        <div className="flex items-center space-x-2 text-purple-300">
          <Rotate3D className="w-4 h-4" />
          <span>Two-Hand: Rotate</span>
        </div>
        <div className="flex items-center space-x-2 text-pink-300">
          <Maximize2 className="w-4 h-4" />
          <span>Distance: Scale</span>
        </div>
      </div>
    </div>
  );
};
