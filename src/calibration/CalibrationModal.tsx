import React, { useState } from 'react';
import { GestureMetrics } from '../types/gestures';
import { CheckCircle2, X } from 'lucide-react';

interface CalibrationModalProps {
  isOpen: boolean;
  gestures: GestureMetrics;
  onClose: () => void;
  onComplete: (settings: { pinchThreshold: number; sensitivity: number }) => void;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({ isOpen, gestures, onClose, onComplete }) => {
  const [step, setStep] = useState<number>(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-gray-950 border border-cyan-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-white font-mono relative">
        <button onClick={onClose} className="absolute top-5 right-5 text-white/50 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 border-b border-white/10 pb-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="font-bold text-sm text-cyan-300">TOUCHLESS INTERFACE CALIBRATION</h2>
        </div>

        <div className="space-y-3">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-white/80">STEP 1: Place your hand in front of the camera.</p>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <span className={gestures.primaryGesture !== 'NONE' ? 'text-green-400 font-bold' : 'text-yellow-400'}>
                  {gestures.primaryGesture !== 'NONE' ? '✓ HAND DETECTED' : 'WAITING FOR HAND...'}
                </span>
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={gestures.primaryGesture === 'NONE'}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs disabled:opacity-40"
              >
                NEXT: PINCH CALIBRATION
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-white/80">STEP 2: Pinch your thumb and index finger together.</p>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <span className={gestures.isPinching ? 'text-green-400 font-bold' : 'text-pink-400'}>
                  {gestures.isPinching ? '✓ PINCH DETECTED' : 'PLEASE PINCH...'}
                </span>
              </div>
              <button
                onClick={() => setStep(3)}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs"
              >
                NEXT: SWIPE TEST
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs text-white/80">STEP 3: Swipe your hand smoothly to the left or right.</p>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <span className="text-cyan-300 font-bold">
                  {gestures.swipeDirection !== 'NONE' ? `✓ SWIPE ${gestures.swipeDirection} DETECTED` : 'SWIPE ACROSS SCREEN'}
                </span>
              </div>
              <button
                onClick={() => {
                  onComplete({ pinchThreshold: 65, sensitivity: 1.0 });
                  onClose();
                }}
                className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>COMPLETE & SAVE CALIBRATION</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
