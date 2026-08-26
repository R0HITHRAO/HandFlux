import React from 'react';
import { Slide } from './PresentationController';
import { GestureMetrics } from '../types/gestures';
import { ChevronLeft, ChevronRight, Hand, Sparkles, Navigation, Layers } from 'lucide-react';

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
    <div className="absolute inset-0 z-20 pointer-events-none p-6 select-none flex flex-col justify-between overflow-hidden">
      {/* Virtual Laser Pointer (Follows Index Tip) */}
      {gestures.isPointing && (
        <div
          className="absolute pointer-events-none z-50 transition-transform duration-75"
          style={{ transform: `translate(${pointerX - 12}px, ${pointerY - 12}px)` }}
        >
          <div className="w-6 h-6 rounded-full bg-red-500/70 border border-red-300 shadow-[0_0_20px_#ff0055] animate-ping absolute inset-0" />
          <div className="w-6 h-6 rounded-full bg-red-600 border-2 border-white shadow-[0_0_14px_#ff0000] flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
          <div className="absolute top-7 left-3 bg-red-950/95 border border-red-500/80 px-2 py-0.5 rounded text-[9px] font-mono text-red-200 shadow-xl whitespace-nowrap">
            LASER POINTER
          </div>
        </div>
      )}

      {/* Swipe Feedback Banner */}
      {isSwipeActive && (
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center pointer-events-none z-40 animate-out fade-out duration-500">
          <div className="px-8 py-4 bg-cyan-950/90 border-2 border-cyan-400 rounded-3xl backdrop-blur-xl shadow-[0_0_40px_#00f5ff] text-cyan-200 font-mono font-black text-xl flex items-center space-x-3 animate-bounce">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            <span>{gestures.swipeDirection === 'LEFT' ? '◀ NEXT SLIDE' : 'PREVIOUS SLIDE ▶'}</span>
          </div>
        </div>
      )}

      {/* Top Right Header Indicator */}
      <div className="flex justify-end pt-12 pr-2 pointer-events-auto">
        <div className="flex items-center space-x-3 bg-black/90 backdrop-blur-xl border border-cyan-500/40 px-4 py-2 rounded-2xl shadow-2xl text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-300 font-bold">{slide.category}</span>
          <span className="text-white/40">|</span>
          <span className="text-white/80">SLIDE {currentIndex + 1} / {totalSlides}</span>
        </div>
      </div>

      {/* Main Slide Card: DOCKED ON THE RIGHT SIDE (Keeps user and webcam 100% visible) */}
      <div className="max-w-md w-full ml-auto bg-black/90 backdrop-blur-2xl border-2 border-cyan-500/40 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)] space-y-4 pointer-events-auto my-auto">
        <div className="border-b border-white/15 pb-3">
          <div className="text-[10px] font-mono text-cyan-400 font-bold tracking-wider mb-1.5 uppercase">{slide.techBadge}</div>
          <h1 className="text-2xl font-black text-white tracking-tight leading-tight">{slide.title}</h1>
          <p className="text-xs font-mono text-cyan-200/80 mt-1 font-semibold">{slide.subtitle}</p>
        </div>

        <div className="space-y-3">
          {slide.bullets.map((bullet, i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0 shadow-[0_0_8px_#00f5ff]" />
              <p className="text-xs text-white/95 leading-relaxed font-sans font-medium">{bullet}</p>
            </div>
          ))}
        </div>

        {/* Gesture Cue Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-white/15 text-[11px] font-mono text-white/70">
          <div className="flex items-center space-x-1.5 text-cyan-300">
            <Hand className="w-3.5 h-3.5" />
            <span>Swipe Hand ◀ / ▶ • Point index finger</span>
          </div>
          <span className="text-pink-400 font-bold">TOUCHLESS</span>
        </div>
      </div>

      {/* Bottom Navigation Toolbar */}
      <div className="flex items-center justify-end space-x-3 pointer-events-auto ml-auto pb-2 pr-2">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="p-3 bg-black/90 hover:bg-black border border-white/25 rounded-2xl text-white disabled:opacity-25 disabled:pointer-events-none transition-transform active:scale-90 shadow-2xl flex items-center justify-center"
          title="Previous Slide (Swipe Right / Left Arrow)"
        >
          <ChevronLeft className="w-5 h-5 text-cyan-300" />
        </button>

        <div className="flex space-x-1.5 bg-black/90 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/20 shadow-2xl">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => onSelectSlide(idx)}
              className={`h-2.5 rounded-full transition-all duration-200 ${
                idx === currentIndex
                  ? 'bg-cyan-400 w-7 shadow-[0_0_10px_#00f5ff]'
                  : 'bg-white/30 hover:bg-white/70 w-2.5'
              }`}
            />
          ))}
        </div>

        <button
          onClick={onNext}
          disabled={currentIndex === totalSlides - 1}
          className="p-3 bg-black/90 hover:bg-black border border-white/25 rounded-2xl text-white disabled:opacity-25 disabled:pointer-events-none transition-transform active:scale-90 shadow-2xl flex items-center justify-center"
          title="Next Slide (Swipe Left / Right Arrow)"
        >
          <ChevronRight className="w-5 h-5 text-cyan-300" />
        </button>
      </div>
    </div>
  );
};
