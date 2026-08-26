import React, { useEffect, useState } from "react";
import { AppMode } from "../types/gestures";
import { Sparkles, X } from "lucide-react";

interface RecruiterDemoTourProps {
  isActive: boolean;
  onStop: () => void;
  onSetMode: (mode: AppMode) => void;
}

const STAGES = [
  { from: 0,  to: 10, label: "STAGE 1: LIVE 21-LANDMARK HAND TRACKING" },
  { from: 10, to: 30, label: "STAGE 2: 3D MOLECULAR MANIPULATION & INSPECTION" },
  { from: 30, to: 50, label: "STAGE 3: TOUCHLESS PRESENTATION & LASER POINTER" },
  { from: 50, to: 75, label: "STAGE 4: AR SHADER LAB & 60 FPS BENCHMARKS" },
];

export const RecruiterDemoTour: React.FC<RecruiterDemoTourProps> = ({ isActive, onStop, onSetMode }) => {
  const [sec, setSec] = useState(0);

  useEffect(() => {
    if (!isActive) { setSec(0); return; }
    const id = setInterval(() => {
      setSec(prev => {
        const next = prev + 1;
        if (next === 10) onSetMode("VIEWER_3D");
        if (next === 30) onSetMode("PRESENTATION");
        if (next === 50) onSetMode("AR_LAB");
        if (next >= 75) { onStop(); return 0; }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isActive, onSetMode, onStop]);

  if (!isActive) return null;

  const stage = STAGES.find(s => sec >= s.from && sec < s.to) || STAGES[STAGES.length - 1];
  const pct = (sec / 75) * 100;

  return (
    <div style={{ position:"fixed", top:"5rem", left:"50%", transform:"translateX(-50%)", zIndex:9500, background:"rgba(0,0,0,0.92)", backdropFilter:"blur(16px)", border:"1.5px solid rgba(236,72,153,0.5)", borderRadius:"1rem", padding:"1rem 1.25rem", boxShadow:"0 20px 50px rgba(0,0,0,0.9)", maxWidth:480, width:"90vw", fontFamily:"monospace", color:"#fff", pointerEvents:"auto" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.5rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", color:"#f472b6", fontWeight:"bold", fontSize:"0.7rem" }}>
          <Sparkles size={13} />
          RECRUITER GUIDED TOUR IN PROGRESS
        </div>
        <button onClick={onStop} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.5)", display:"flex", alignItems:"center" }}>
          <X size={15} />
        </button>
      </div>
      <div style={{ fontSize:"0.7rem", color:"#67e8f9", fontWeight:"bold", marginBottom:"0.5rem" }}>{stage.label}</div>
      <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:9999, height:6, overflow:"hidden", marginBottom:"0.35rem" }}>
        <div style={{ width:`${pct}%`, height:"100%", background:"linear-gradient(90deg,#06b6d4,#ec4899)", transition:"width 1s linear" }} />
      </div>
      <div style={{ fontSize:"0.65rem", color:"rgba(255,255,255,0.45)", textAlign:"right" }}>{sec}s / 75s</div>
    </div>
  );
};
