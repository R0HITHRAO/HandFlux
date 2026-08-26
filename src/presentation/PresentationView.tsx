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
      {/* Laser Pointer — full-screen, always on top */}
      {gestures.isPointing && (
        <div style={{ position:"fixed", left:0, top:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:9800 }}>
          <div style={{ position:"absolute", transform:`translate(${pX - 12}px, ${pY - 12}px)` }}>
            <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"rgba(255,0,85,0.55)", border:"1px solid #fca5a5", boxShadow:"0 0 24px #ff0055", width:24, height:24 }} />
            <div style={{ position:"relative", width:24, height:24, borderRadius:"50%", background:"#dc2626", border:"2px solid #fff", boxShadow:"0 0 14px #ff0000", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#fff" }} />
            </div>
            <div style={{ position:"absolute", top:28, left:0, background:"rgba(60,0,0,0.95)", border:"1px solid rgba(239,68,68,0.7)", padding:"2px 6px", borderRadius:4, fontSize:"0.6rem", color:"#fca5a5", fontFamily:"monospace", whiteSpace:"nowrap" }}>
              LASER POINTER
            </div>
          </div>
        </div>
      )}

      {/* Swipe feedback */}
      {gestures.swipeDirection !== "NONE" && (
        <div style={{ position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none", zIndex:9700 }}>
          <div style={{ padding:"0.75rem 2rem", background:"rgba(0,20,30,0.95)", border:"2px solid #00f5ff", borderRadius:"1.5rem", backdropFilter:"blur(16px)", boxShadow:"0 0 50px #00f5ff", color:"#a5f3fc", fontFamily:"monospace", fontWeight:900, fontSize:"1.1rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
            {gestures.swipeDirection === "LEFT" ? "? NEXT SLIDE" : "? PREV SLIDE"}
          </div>
        </div>
      )}

      {/* Slide panel — fills the wrapper div */}
      <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem", height:"100%" }}>

        {/* Badge */}
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", background:"rgba(0,0,0,0.9)", border:"1.5px solid rgba(0,245,255,0.35)", borderRadius:"0.6rem", padding:"0.3rem 0.65rem", fontFamily:"monospace", fontSize:"0.65rem", whiteSpace:"nowrap" }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#00f5ff", boxShadow:"0 0 6px #00f5ff", display:"inline-block", flexShrink:0 }} />
            <span style={{ color:"#67e8f9", fontWeight:700 }}>{slide.category}</span>
            <span style={{ color:"rgba(255,255,255,0.25)" }}>|</span>
            <span style={{ color:"#fff", fontWeight:700 }}>SLIDE {currentIndex + 1} / {totalSlides}</span>
          </div>
        </div>

        {/* Main card */}
        <div style={{ flex:1, background:"rgba(0,0,0,0.92)", backdropFilter:"blur(20px)", border:"2px solid rgba(0,245,255,0.35)", borderRadius:"1rem", padding:"1.1rem", boxShadow:"0 20px 50px rgba(0,0,0,0.9)", overflowY:"auto", display:"flex", flexDirection:"column", gap:"0.75rem" }}>

          {/* Tech badge */}
          <div style={{ fontSize:"0.58rem", fontFamily:"monospace", color:"#00f5ff", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>
            {slide.techBadge}
          </div>

          {/* Title */}
          <div style={{ borderBottom:"1px solid rgba(255,255,255,0.1)", paddingBottom:"0.65rem" }}>
            <h1 style={{ margin:0, fontSize:"1.15rem", fontWeight:900, color:"#fff", lineHeight:1.25, letterSpacing:"-0.01em" }}>{slide.title}</h1>
            <p style={{ margin:"0.3rem 0 0", fontSize:"0.7rem", fontFamily:"monospace", color:"rgba(103,232,249,0.85)", fontWeight:600, lineHeight:1.4 }}>{slide.subtitle}</p>
          </div>

          {/* Bullets */}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.55rem" }}>
            {slide.bullets.map((b, i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:"0.55rem" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#00f5ff", boxShadow:"0 0 7px #00f5ff", flexShrink:0, marginTop:5 }} />
                <p style={{ margin:0, fontSize:"0.74rem", color:"rgba(255,255,255,0.9)", lineHeight:1.6 }}>{b}</p>
              </div>
            ))}
          </div>

          {/* Gesture cue */}
          <div style={{ marginTop:"auto", paddingTop:"0.65rem", borderTop:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"space-between", fontFamily:"monospace", fontSize:"0.62rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.35rem", color:"#67e8f9" }}>
              <Hand size={12} />
              <span>Swipe ? / ? or use arrow keys</span>
            </div>
            <span style={{ color:"#f472b6", fontWeight:700, letterSpacing:"0.05em" }}>TOUCHLESS</span>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.5rem" }}>
          <button onClick={onPrev} disabled={currentIndex === 0}
            style={{ padding:"0.45rem 0.6rem", background:"rgba(0,0,0,0.9)", border:"1.5px solid rgba(255,255,255,0.2)", borderRadius:"0.6rem", cursor:currentIndex===0?"not-allowed":"pointer", opacity:currentIndex===0?0.25:1, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
            <ChevronLeft size={16} color="#67e8f9" />
          </button>

          <div style={{ flex:1, display:"flex", justifyContent:"center", gap:"0.3rem", background:"rgba(0,0,0,0.9)", padding:"0.5rem 0.75rem", borderRadius:"0.6rem", border:"1.5px solid rgba(255,255,255,0.15)" }}>
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button key={idx} onClick={() => onSelectSlide(idx)}
                style={{ height:8, width:idx===currentIndex?24:8, borderRadius:8, border:"none", cursor:"pointer", background:idx===currentIndex?"#00f5ff":"rgba(255,255,255,0.2)", boxShadow:idx===currentIndex?"0 0 10px #00f5ff":"none", transition:"all 0.2s", padding:0 }} />
            ))}
          </div>

          <button onClick={onNext} disabled={currentIndex === totalSlides - 1}
            style={{ padding:"0.45rem 0.6rem", background:"rgba(0,0,0,0.9)", border:"1.5px solid rgba(255,255,255,0.2)", borderRadius:"0.6rem", cursor:currentIndex===totalSlides-1?"not-allowed":"pointer", opacity:currentIndex===totalSlides-1?0.25:1, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
            <ChevronRight size={16} color="#67e8f9" />
          </button>
        </div>
      </div>
    </>
  );
};
