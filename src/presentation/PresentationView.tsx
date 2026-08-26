import React from "react";
import { Slide } from "./PresentationController";
import { GestureMetrics } from "../types/gestures";
import { ChevronLeft, ChevronRight, Hand } from "lucide-react";

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
  slide, currentIndex, totalSlides, gestures, onPrev, onNext, onSelectSlide
}) => {
  const pX = gestures.pointerPosition.screenX;
  const pY = gestures.pointerPosition.screenY;

  return (
    <>
      {/* Laser Pointer — rendered fixed over entire screen */}
      {gestures.isPointing && (
        <div style={{ position:"fixed", left:0, top:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:8500 }}>
          <div style={{ position:"absolute", transform:`translate(${pX-12}px,${pY-12}px)`, width:24, height:24 }}>
            <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"rgba(255,0,85,0.6)", border:"1px solid #fca5a5", boxShadow:"0 0 20px #ff0055", animation:"ping 1s infinite" }} />
            <div style={{ position:"relative", width:24, height:24, borderRadius:"50%", background:"#dc2626", border:"2px solid #fff", boxShadow:"0 0 14px #ff0000", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#fff" }} />
            </div>
          </div>
        </div>
      )}

      {/* Slide Panel — self-contained card, fills the parent wrapper */}
      <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem", height:"100%", paddingTop:"0.5rem" }}>

        {/* Slide counter badge */}
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", background:"rgba(0,0,0,0.95)", border:"1.5px solid rgba(0,245,255,0.4)", borderRadius:"0.75rem", padding:"0.35rem 0.75rem", fontFamily:"monospace", fontSize:"0.7rem" }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:"#00f5ff", boxShadow:"0 0 8px #00f5ff", display:"inline-block" }} />
            <span style={{ color:"#67e8f9", fontWeight:"bold" }}>{slide.category}</span>
            <span style={{ color:"rgba(255,255,255,0.3)" }}>|</span>
            <span style={{ color:"#fff", fontWeight:"bold" }}>SLIDE {currentIndex + 1} / {totalSlides}</span>
          </div>
        </div>

        {/* Main slide card */}
        <div style={{ flex:1, background:"rgba(0,0,0,0.95)", backdropFilter:"blur(24px)", border:"2px solid rgba(0,245,255,0.4)", borderRadius:"1.25rem", padding:"1.25rem", boxShadow:"0 25px 60px rgba(0,0,0,0.95)", overflowY:"auto", display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          <div style={{ borderBottom:"1px solid rgba(255,255,255,0.12)", paddingBottom:"0.75rem" }}>
            <div style={{ fontSize:"0.65rem", fontFamily:"monospace", color:"#00f5ff", fontWeight:"bold", letterSpacing:"0.1em", marginBottom:"0.4rem", textTransform:"uppercase" }}>{slide.techBadge}</div>
            <h1 style={{ margin:0, fontSize:"1.3rem", fontWeight:900, color:"#fff", lineHeight:1.2 }}>{slide.title}</h1>
            <p style={{ margin:"0.3rem 0 0", fontSize:"0.72rem", fontFamily:"monospace", color:"rgba(103,232,249,0.9)", fontWeight:600 }}>{slide.subtitle}</p>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
            {slide.bullets.map((b, i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:"0.6rem" }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:"#00f5ff", boxShadow:"0 0 8px #00f5ff", flexShrink:0, marginTop:4 }} />
                <p style={{ margin:0, fontSize:"0.72rem", color:"#fff", lineHeight:1.5 }}>{b}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop:"auto", paddingTop:"0.75rem", borderTop:"1px solid rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"space-between", fontFamily:"monospace", fontSize:"0.68rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", color:"#67e8f9" }}>
              <Hand size={13} />
              <span>Swipe hand ? / ? to navigate</span>
            </div>
            <span style={{ color:"#f472b6", fontWeight:"bold" }}>TOUCHLESS</span>
          </div>
        </div>

        {/* Nav row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:"0.5rem" }}>
          <button onClick={onPrev} disabled={currentIndex === 0}
            style={{ padding:"0.5rem", background:"rgba(0,0,0,0.95)", border:"2px solid rgba(255,255,255,0.25)", borderRadius:"0.75rem", cursor:currentIndex===0?"not-allowed":"pointer", opacity:currentIndex===0?0.25:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <ChevronLeft size={18} color="#67e8f9" />
          </button>

          <div style={{ display:"flex", gap:"0.35rem", background:"rgba(0,0,0,0.95)", padding:"0.6rem 0.75rem", borderRadius:"0.75rem", border:"1.5px solid rgba(255,255,255,0.2)" }}>
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button key={idx} onClick={() => onSelectSlide(idx)}
                style={{ height:9, width:idx===currentIndex?28:9, borderRadius:9, border:"none", cursor:"pointer", background:idx===currentIndex?"#00f5ff":"rgba(255,255,255,0.25)", boxShadow:idx===currentIndex?"0 0 12px #00f5ff":"none", transition:"all 0.2s", padding:0 }} />
            ))}
          </div>

          <button onClick={onNext} disabled={currentIndex === totalSlides - 1}
            style={{ padding:"0.5rem", background:"rgba(0,0,0,0.95)", border:"2px solid rgba(255,255,255,0.25)", borderRadius:"0.75rem", cursor:currentIndex===totalSlides-1?"not-allowed":"pointer", opacity:currentIndex===totalSlides-1?0.25:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <ChevronRight size={18} color="#67e8f9" />
          </button>
        </div>
      </div>
    </>
  );
};
