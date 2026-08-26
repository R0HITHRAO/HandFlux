import React, { useState } from "react";
import { GestureMetrics } from "../types/gestures";
import { CheckCircle2, X } from "lucide-react";

interface CalibrationModalProps {
  isOpen: boolean;
  gestures: GestureMetrics;
  onClose: () => void;
  onComplete: (settings: { pinchThreshold: number }) => void;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({ isOpen, gestures, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  if (!isOpen) return null;

  const overlay: React.CSSProperties = { position:"fixed", inset:0, zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)", padding:"1rem" };
  const card: React.CSSProperties = { background:"#0a0a0a", border:"1.5px solid rgba(0,245,255,0.4)", borderRadius:"1.25rem", padding:"1.5rem", maxWidth:400, width:"100%", boxShadow:"0 25px 60px rgba(0,0,0,0.95)", fontFamily:"monospace", color:"#fff", position:"relative" };
  const btn = (primary = false): React.CSSProperties => ({ width:"100%", padding:"0.6rem", background: primary ? "#06b6d4" : "rgba(255,255,255,0.08)", border: primary ? "none" : "1px solid rgba(255,255,255,0.12)", color: primary ? "#000" : "#fff", fontWeight:"bold", borderRadius:"0.6rem", cursor:"pointer", fontFamily:"monospace", fontSize:"0.75rem", marginTop:"0.5rem" });

  return (
    <div style={overlay}>
      <div style={card}>
        <button onClick={onClose} style={{ position:"absolute", top:"1rem", right:"1rem", background:"none", border:"none", color:"rgba(255,255,255,0.5)", cursor:"pointer" }}><X size={16} /></button>

        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingBottom:"0.75rem", marginBottom:"0.75rem" }}>
          <div style={{ width:10, height:10, borderRadius:"50%", background:"#00f5ff", boxShadow:"0 0 8px #00f5ff" }} />
          <h2 style={{ margin:0, fontSize:"0.8rem", color:"#67e8f9", fontWeight:"bold" }}>TOUCHLESS INTERFACE CALIBRATION</h2>
        </div>

        {step === 1 && (
          <div>
            <p style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.75)", marginBottom:"0.75rem" }}>STEP 1: Place your hand in front of the camera.</p>
            <div style={{ padding:"0.75rem", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"0.75rem", textAlign:"center", marginBottom:"0.5rem" }}>
              <span style={{ color: gestures.primaryGesture !== "NONE" ? "#4ade80" : "#fbbf24", fontWeight:"bold", fontSize:"0.75rem" }}>
                {gestures.primaryGesture !== "NONE" ? "? HAND DETECTED" : "WAITING FOR HAND..."}
              </span>
            </div>
            <button style={btn(true)} onClick={() => setStep(2)}>NEXT: PINCH CALIBRATION ?</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <p style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.75)", marginBottom:"0.75rem" }}>STEP 2: Pinch your thumb and index finger together.</p>
            <div style={{ padding:"0.75rem", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"0.75rem", textAlign:"center", marginBottom:"0.5rem" }}>
              <span style={{ color: gestures.isPinching ? "#4ade80" : "#f472b6", fontWeight:"bold", fontSize:"0.75rem" }}>
                {gestures.isPinching ? "? PINCH DETECTED" : "PLEASE PINCH FINGERS..."}
              </span>
            </div>
            <button style={btn(true)} onClick={() => setStep(3)}>NEXT: SWIPE TEST ?</button>
          </div>
        )}

        {step === 3 && (
          <div>
            <p style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.75)", marginBottom:"0.75rem" }}>STEP 3: Swipe your hand left or right.</p>
            <div style={{ padding:"0.75rem", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"0.75rem", textAlign:"center", marginBottom:"0.5rem" }}>
              <span style={{ color:"#67e8f9", fontWeight:"bold", fontSize:"0.75rem" }}>
                {gestures.swipeDirection !== "NONE" ? `? SWIPE ${gestures.swipeDirection} DETECTED` : "SWIPE ACROSS THE SCREEN"}
              </span>
            </div>
            <button style={{ ...btn(true), display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem" }}
              onClick={() => { onComplete({ pinchThreshold: 65 }); onClose(); setStep(1); }}>
              <CheckCircle2 size={14} /> COMPLETE CALIBRATION
            </button>
          </div>
        )}

        <button style={btn()} onClick={() => { onClose(); setStep(1); }}>CANCEL</button>
      </div>
    </div>
  );
};
