import React, { useState } from "react";
import { AppMode } from "../types/gestures";
import { Presentation, Atom, Sparkles, PlayCircle, Settings, HelpCircle, Activity, Volume2, VolumeX } from "lucide-react";
import { audioService } from "../utils/audioService";

interface ModeSelectorProps {
  activeMode: AppMode;
  showDebug: boolean;
  onSelectMode: (mode: AppMode) => void;
  onStartTour: () => void;
  onOpenCalibration: () => void;
  onOpenSettings: () => void;
  onToggleDebug: () => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  activeMode, showDebug, onSelectMode, onStartTour, onOpenCalibration, onOpenSettings, onToggleDebug
}) => {
  const [isMuted, setIsMuted] = useState(audioService.getIsMuted());
  const toggleMute = () => setIsMuted(audioService.toggleMute());

  const modeBtn = (
    mode: AppMode, label: string, icon: React.ReactNode,
    activeBg: string, activeShadow: string, activeColor = "#fff"
  ) => {
    const isActive = activeMode === mode;
    return (
      <button
        onClick={() => { audioService.playClickSound(); onSelectMode(mode); }}
        style={{
          display:"flex", alignItems:"center", gap:"0.35rem",
          padding:"0.45rem 0.9rem", borderRadius:"0.6rem", border:"none",
          cursor:"pointer", fontFamily:"monospace", fontSize:"0.72rem", fontWeight:700,
          transition:"all 0.15s", whiteSpace:"nowrap" as const,
          background: isActive ? activeBg : "transparent",
          color: isActive ? activeColor : "rgba(255,255,255,0.7)",
          boxShadow: isActive ? activeShadow : "none",
          transform: isActive ? "scale(1.04)" : "none",
        }}>
        {icon}{label}
      </button>
    );
  };

  const iconBtn = (onClick: () => void, icon: React.ReactNode, title: string, active = false) => (
    <button onClick={onClick} title={title}
      style={{ padding:"0.45rem 0.5rem", borderRadius:"0.6rem", border: active ? "1px solid rgba(0,245,255,0.4)" : "none", background: active ? "rgba(0,245,255,0.12)" : "transparent", color: active ? "#67e8f9" : "rgba(255,255,255,0.6)", cursor:"pointer", display:"flex", alignItems:"center", transition:"all 0.15s" }}>
      {icon}
    </button>
  );

  return (
    <nav style={{
      display:"flex", alignItems:"center", gap:"0.5rem", flexWrap:"wrap",
      background:"rgba(2,2,4,0.96)", backdropFilter:"blur(24px)",
      border:"1.5px solid rgba(255,255,255,0.18)",
      padding:"0.45rem 0.9rem", borderRadius:"1rem",
      boxShadow:"0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)",
      userSelect:"none", maxWidth:"95vw"
    }}>

      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.45rem", paddingRight:"0.75rem", borderRight:"1px solid rgba(255,255,255,0.15)", fontFamily:"monospace", fontSize:"0.72rem", fontWeight:900, letterSpacing:"0.14em", color:"#00f5ff", whiteSpace:"nowrap" }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:"#00f5ff", boxShadow:"0 0 10px #00f5ff" }} />
        HAND FLUX
      </div>

      {/* Mode buttons */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.2rem" }}>
        {modeBtn("PRESENTATION", "PRESENTATION", <Presentation size={14}/>, "#06b6d4", "0 0 18px rgba(6,182,212,0.65)", "#000")}
        {modeBtn("VIEWER_3D",    "3D MOLECULE",  <Atom size={14}/>,         "#9333ea", "0 0 18px rgba(147,51,234,0.65)")}
        {modeBtn("AR_LAB",       "AR VISUAL LAB",<Sparkles size={14}/>,     "#db2777", "0 0 18px rgba(219,39,119,0.65)")}
      </div>

      <div style={{ width:1, height:22, background:"rgba(255,255,255,0.15)", flexShrink:0 }} />

      {/* Actions */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.15rem" }}>
        <button
          onClick={() => { audioService.playClickSound(); onStartTour(); }}
          style={{ display:"flex", alignItems:"center", gap:"0.35rem", padding:"0.45rem 0.8rem", background:"linear-gradient(135deg,#ec4899,#e11d48)", border:"none", borderRadius:"0.6rem", color:"#fff", fontFamily:"monospace", fontSize:"0.72rem", fontWeight:700, cursor:"pointer", boxShadow:"0 0 15px rgba(244,63,94,0.5)", whiteSpace:"nowrap" }}>
          <PlayCircle size={14}/> TOUR
        </button>
        {iconBtn(toggleMute, isMuted ? <VolumeX size={15}/> : <Volume2 size={15}/>, isMuted ? "Unmute" : "Mute", !isMuted)}
        {iconBtn(onToggleDebug, <Activity size={15}/>, "Performance HUD (D)", showDebug)}
        {iconBtn(onOpenCalibration, <HelpCircle size={15}/>, "Calibration")}
        {iconBtn(onOpenSettings, <Settings size={15}/>, "Settings")}
      </div>
    </nav>
  );
};
