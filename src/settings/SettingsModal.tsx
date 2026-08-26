import React from "react";
import { ShieldCheck, Sliders, X, Keyboard } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const overlay: React.CSSProperties = { position:"fixed", inset:0, zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)", padding:"1rem" };
  const card: React.CSSProperties = { background:"#0a0a0a", border:"1.5px solid rgba(255,255,255,0.18)", borderRadius:"1.25rem", padding:"1.5rem", maxWidth:480, width:"100%", boxShadow:"0 25px 60px rgba(0,0,0,0.95)", fontFamily:"monospace", color:"#fff", position:"relative" };

  const shortcuts = [
    ["? / ?",         "Navigate slides"],
    ["1 / 2 / 3",     "Switch modes"],
    ["D",             "Toggle debug HUD"],
    ["Swipe left",    "Next slide"],
    ["Swipe right",   "Prev slide"],
    ["Pinch",         "Select / Create"],
  ];

  return (
    <div style={overlay}>
      <div style={card}>
        <button onClick={onClose} style={{ position:"absolute", top:"1rem", right:"1rem", background:"none", border:"none", color:"rgba(255,255,255,0.45)", cursor:"pointer" }}><X size={16} /></button>

        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingBottom:"0.75rem", marginBottom:"1rem" }}>
          <Sliders size={16} color="#00f5ff" />
          <h2 style={{ margin:0, fontSize:"0.8rem", color:"#67e8f9", fontWeight:"bold" }}>SYSTEM SETTINGS & PRIVACY</h2>
        </div>

        {/* Privacy card */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:"0.75rem", background:"rgba(4,120,87,0.15)", border:"1px solid rgba(52,211,153,0.35)", borderRadius:"0.75rem", padding:"0.85rem", marginBottom:"1rem" }}>
          <ShieldCheck size={18} color="#34d399" style={{ flexShrink:0, marginTop:2 }} />
          <div>
            <div style={{ fontSize:"0.72rem", fontWeight:"bold", color:"#6ee7b7", marginBottom:"0.3rem" }}>100% LOCAL PRIVACY GUARANTEE</div>
            <p style={{ margin:0, fontSize:"0.68rem", color:"rgba(255,255,255,0.65)", lineHeight:1.5 }}>
              All computer vision landmark detection runs directly on your local GPU/Wasm. Zero video frames or personal biometrics are ever uploaded or transmitted.
            </p>
          </div>
        </div>

        {/* Keyboard shortcuts */}
        <div style={{ marginBottom:"1rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.7rem", fontWeight:"bold", color:"#c4b5fd", marginBottom:"0.5rem" }}>
            <Keyboard size={13} /> KEYBOARD & GESTURE SHORTCUTS
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.35rem", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"0.6rem", padding:"0.65rem", fontSize:"0.68rem" }}>
            {shortcuts.map(([key, desc]) => (
              <React.Fragment key={key}>
                <span style={{ color:"#67e8f9", fontWeight:"bold" }}>{key}:</span>
                <span style={{ color:"rgba(255,255,255,0.75)" }}>{desc}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        <button onClick={onClose} style={{ width:"100%", padding:"0.6rem", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"#fff", fontWeight:"bold", borderRadius:"0.6rem", cursor:"pointer", fontFamily:"monospace", fontSize:"0.75rem" }}>
          CLOSE SETTINGS
        </button>
      </div>
    </div>
  );
};
