import React from 'react';
import { Slide } from './PresentationController';
import { GestureMetrics } from '../types/gestures';
import { ChevronLeft, ChevronRight, Hand, Sparkles, Navigation } from 'lucide-react';

interface PresentationViewProps {
  slide: Slide;
  currentIndex: number;
  totalSlides: number;
  gestures: GestureMetrics;
  onPrev: () => void;
  onNext: () => void;
  onSelectSlide: (idx: number) => void;
}

export const PresentationView: React.FC<PresentationViewProps> = ({
  slide,
  currentIndex,
  totalSlides,
  gestures,
  onPrev,
  onNext,
  onSelectSlide
}) => {
  const isSwipeActive = gestures.swipeDirection !== 'NONE';
  const pointerX = gestures.pointerPosition.screenX;
  const pointerY = gestures.pointerPosition.screenY;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6 select-none overflow-hidden">
      {/* Virtual Laser Pointer & Particle Glow on Index Fingertip */}
      {gestures.isPointing && (
        <div
          className="absolute pointer-events-none z-50 transition-transform duration-75"
          style={{ transform: `translate(${pointerX - 14}px, ${pointerY - 14}px)` }}
        >
          <div className="w-7 h-7 rounded-full bg-red-500/70 border border-red-300 shadow-[0_0_25px_#ff0055] animate-ping absolute inset-0" />
          <div className="w-7 h-7 rounded-full bg-red-600 border-2 border-white shadow-[0_0_16px_#ff0000] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <div className="absolute top-8 left-3 bg-red-950/90 border border-red-500/60 px-2 py-0.5 rounded text-[9px] font-mono text-red-200 shadow-xl whitespace-nowrap">
            LASER POINTER
          </div>
        </div>
      )}

      {/* Swipe Feedback Wave */}
      {isSwipeActive && (
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center pointer-events-none z-40 animate-out fade-out duration-500">
          <div className="px-8 py-4 bg-cyan-950/80 border-2 border-cyan-400 rounded-2xl backdrop-blur-md shadow-[0_0_40px_#00f5ff] text-cyan-200 font-mono font-black text-xl flex items-center space-x-3 animate-bounce">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            <span>{gestures.swipeDirection === 'LEFT' ? '◀ NEXT SLIDE' : 'PREVIOUS SLIDE ▶'}</span>
          </div>
        </div>
      )}

      {/* Top Floating Control Pill */}
      <div className="flex justify-between items-center bg-black/75 backdrop-blur-md border border-cyan-500/30 px-5 py-2.5 rounded-2xl max-w-xl ml-auto shadow-2xl pointer-events-auto">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-cyan-300">TOUCHLESS PRESENTATION</span>
        </div>
        <div className="flex items-center space-x-3 font-mono text-xs text-white/80">
          <span className="bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded text-cyan-300 font-bold">{slide.category}</span>
          <span>SLIDE {currentIndex + 1} / {totalSlides}</span>
        </div>
      </div>

      {/* Holographic Floating Slide Card (Placed on Right Side so Camera and User are Completely Visible) */}
      <div className="max-w-lg ml-auto w-full bg-black/70 backdrop-blur-xl border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4 pointer-events-auto transition-all duration-300 my-auto">
        <div className="border-b border-white/10 pb-3">
          <div className="text-[11px] font-mono text-cyan-400 font-bold tracking-wider mb-1">{slide.techBadge}</div>
          <h1 className="text-2xl font-black text-white tracking-tight leading-snug">{slide.title}</h1>
          <p className="text-xs font-mono text-white/70 mt-1">{slide.subtitle}</p>
        </div>

        <div className="space-y-2.5">
          {slide.bullets.map((bullet, i) => (
            <div key={i} className="flex items-start space-x-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0 shadow-[0_0_6px_#00f5ff]" />
              <p className="text-xs text-white/90 leading-relaxed font-sans">{bullet}</p>
            </div>
          ))}
        </div>

        {/* Gesture Cue Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[11px] font-mono text-white/60">
          <div className="flex items-center space-x-1.5">
            <Hand className="w-3.5 h-3.5 text-cyan-400" />
            <span>Swipe Hand ◀ / ▶ • Point index finger</span>
          </div>
          <span className="text-cyan-400 font-semibold">LIVE GESTURES</span>
        </div>
      </div>

      {/* Bottom Navigation Controls */}
      <div className="flex items-center justify-end space-x-3 pointer-events-auto ml-auto">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="p-2.5 bg-black/80 hover:bg-black border border-white/20 rounded-full text-white disabled:opacity-30 disabled:pointer-events-none transition-transform active:scale-90 shadow-xl"
          title="Previous Slide (Swipe Right / Left Arrow)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex space-x-1.5 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => onSelectSlide(idx)}
              className={`h-2 rounded-full transition-all duration-200 ${
                idx === currentIndex
                  ? 'bg-cyan-400 w-6 shadow-[0_0_8px_#00f5ff]'
                  : 'bg-white/30 hover:bg-white/60 w-2'
              }`}
            />
          ))}
        </div>

        <button
          onClick={onNext}
          disabled={currentIndex === totalSlides - 1}
          className="p-2.5 bg-black/80 hover:bg-black border border-white/20 rounded-full text-white disabled:opacity-30 disabled:pointer-events-none transition-transform active:scale-90 shadow-xl"
          title="Next Slide (Swipe Left / Right Arrow)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
