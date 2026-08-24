import React from 'react';
import { Slide } from './PresentationController';
import { GestureMetrics } from '../types/gestures';
import { ChevronLeft, ChevronRight, Hand, Navigation } from 'lucide-react';

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

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-8 select-none">
      {/* Laser Pointer on Index Tip */}
      <div
        className="absolute pointer-events-none z-50 transition-transform duration-75"
        style={{
          transform: `translate(${gestures.pointerPosition.screenX - 12}px, ${gestures.pointerPosition.screenY - 12}px)`
        }}
      >
        <div className="w-6 h-6 rounded-full bg-red-500/80 border-2 border-red-200 shadow-[0_0_20px_#ff0055] animate-ping absolute inset-0" />
        <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow-[0_0_12px_#ff0000] flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </div>
        <div className="absolute top-7 left-3 bg-red-950/80 border border-red-500/60 px-2 py-0.5 rounded text-[10px] font-mono text-red-200 shadow-md whitespace-nowrap">
          LASER POINTER
        </div>
      </div>

      {/* Top Bar */}
      <div className="flex justify-between items-center bg-black/80 backdrop-blur-md border border-cyan-500/30 px-6 py-3 rounded-2xl max-w-4xl mx-auto w-full shadow-2xl pointer-events-auto">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-cyan-300">TOUCHLESS PRESENTATION CONTROLLER</span>
        </div>
        <div className="flex items-center space-x-4 font-mono text-xs text-white/80">
          <span className="bg-white/10 px-2.5 py-1 rounded-md text-cyan-300 font-bold">{slide.category}</span>
          <span>SLIDE {currentIndex + 1} / {totalSlides}</span>
        </div>
      </div>

      {/* Main Slide Card */}
      <div className="max-w-4xl mx-auto w-full bg-black/85 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl space-y-6 pointer-events-auto transition-all duration-300">
        <div className="border-b border-white/10 pb-4">
          <div className="text-xs font-mono text-cyan-400 font-bold tracking-wider mb-1">{slide.techBadge}</div>
          <h1 className="text-3xl font-black text-white tracking-tight">{slide.title}</h1>
          <p className="text-sm font-mono text-white/70 mt-1">{slide.subtitle}</p>
        </div>

        <div className="space-y-4">
          {slide.bullets.map((bullet, i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 shadow-[0_0_8px_#00f5ff]" />
              <p className="text-base text-white/90 leading-relaxed">{bullet}</p>
            </div>
          ))}
        </div>

        {/* Gesture Tip Callout */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs font-mono text-white/60">
          <div className="flex items-center space-x-2">
            <Hand className="w-4 h-4 text-cyan-400" />
            <span>Swipe Hand Left/Right to change slides • Point index finger to project laser</span>
          </div>
          {isSwipeActive && (
            <span className="text-pink-400 font-bold animate-bounce">SWIPE DETECTED ({gestures.swipeDirection})</span>
          )}
        </div>
      </div>

      {/* Bottom Navigation Thumbnails */}
      <div className="flex items-center justify-center space-x-4 pointer-events-auto max-w-md mx-auto">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="p-3 bg-black/80 hover:bg-black border border-white/20 rounded-full text-white disabled:opacity-30 disabled:pointer-events-none transition-transform active:scale-90 shadow-xl"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex space-x-2 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/15">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => onSelectSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                idx === currentIndex
                  ? 'bg-cyan-400 w-8 shadow-[0_0_10px_#00f5ff]'
                  : 'bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>

        <button
          onClick={onNext}
          disabled={currentIndex === totalSlides - 1}
          className="p-3 bg-black/80 hover:bg-black border border-white/20 rounded-full text-white disabled:opacity-30 disabled:pointer-events-none transition-transform active:scale-90 shadow-xl"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
