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

  const handleToggleMute = () => {
    setIsMuted(audioService.toggleMute());
  };

  const btnBase: React.CSSProperties = {
    display:"flex", alignItems:"center", gap:"0.4rem",
    padding:"0.4rem 0.85rem", borderRadius:"0.6rem", border:"none",
    cursor:"pointer", fontFamily:"monospace", fontSize:"0.7rem",
    fontWeight:"bold", transition:"all 0.15s", whiteSpace:"nowrap" as const
  };

  const modeBtn = (mode: AppMode, label: string, icon: React.ReactNode, activeColor: string, activeShadow: string): React.ReactNode => {
    const isActive = activeMode === mode;
    return (
      <button onClick={() => { audioService.playClickSound(); onSelectMode(mode); }}
        style={{ ...btnBase, background: isActive ? activeColor : "transparent", color: isActive ? (mode==="PRESENTATION"?"#000":"#fff") : "rgba(255,255,255,0.75)", boxShadow: isActive ? activeShadow : "none", transform: isActive ? "scale(1.04)" : "none" }}>
        {icon}{label}
      </button>
    );
  };

  const iconBtn = (onClick: () => void, icon: React.ReactNode, title: string, highlight = false): React.ReactNode => (
    <button onClick={onClick} title={title}
      style={{ ...btnBase, padding:"0.4rem 0.5rem", background: highlight ? "rgba(0,245,255,0.15)" : "transparent", color: highlight ? "#67e8f9" : "rgba(255,255,255,0.65)", border: highlight ? "1px solid rgba(0,245,255,0.35)" : "none" }}>
      {icon}
    </button>
  );

  return (
    <header style={{ display:"flex", alignItems:"center", gap:"0.5rem", background:"rgba(0,0,0,0.95)", backdropFilter:"blur(24px)", border:"2px solid rgba(255,255,255,0.22)", padding:"0.4rem 0.85rem", borderRadius:"1rem", boxShadow:"0 15px 35px rgba(0,0,0,0.9)", userSelect:"none", maxWidth:"95vw", flexWrap:"wrap" }}>

      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", paddingRight:"0.75rem", borderRight:"1px solid rgba(255,255,255,0.18)", fontFamily:"monospace", fontSize:"0.7rem", fontWeight:900, letterSpacing:"0.12em", color:"#00f5ff" }}>
        <div style={{ width:9, height:9, borderRadius:"50%", background:"#00f5ff", boxShadow:"0 0 10px #00f5ff" }} />
        HANDFLUX
      </div>

      {/* Mode buttons */}
      <div style={{ display:"flex", gap:"0.25rem" }}>
        {modeBtn("PRESENTATION", "PRESENTATION", <Presentation size={14}/>, "#06b6d4", "0 0 15px rgba(0,245,255,0.7)")}
        {modeBtn("VIEWER_3D",    "3D MOLECULE",  <Atom size={14}/>,         "#9333ea", "0 0 15px rgba(147,51,234,0.7)")}
        {modeBtn("AR_LAB",       "AR VISUAL LAB",<Sparkles size={14}/>,     "#db2777", "0 0 15px rgba(236,72,153,0.7)")}
      </div>

      <div style={{ width:1, height:22, background:"rgba(255,255,255,0.18)" }} />

      {/* Utility buttons */}
      <div style={{ display:"flex", gap:"0.15rem" }}>
        <button onClick={() => { audioService.playClickSound(); onStartTour(); }}
          style={{ ...btnBase, background:"linear-gradient(135deg,#ec4899,#e11d48)", color:"#fff", boxShadow:"0 0 15px rgba(244,63,94,0.55)" }}>
          <PlayCircle size={14}/> TOUR
        </button>
        {iconBtn(handleToggleMute, isMuted ? <VolumeX size={15}/> : <Volume2 size={15}/>, isMuted?"Unmute":"Mute", !isMuted)}
        {iconBtn(onToggleDebug, <Activity size={15}/>, "Performance HUD (D)", showDebug)}
        {iconBtn(onOpenCalibration, <HelpCircle size={15}/>, "Calibration")}
        {iconBtn(onOpenSettings, <Settings size={15}/>, "Settings")}
      </div>
    </header>
  );
};
