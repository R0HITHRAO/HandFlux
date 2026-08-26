import React from "react";
import { AtomData, MoleculeType } from "./MolecularScene";
import { GestureMetrics } from "../types/gestures";
import { Atom, Move, Rotate3D, Maximize2, MousePointer } from "lucide-react";

interface MolecularViewerProps {
  activeAtom: AtomData | null;
  gestures: GestureMetrics;
  currentMolecule: MoleculeType;
  onSelectMolecule: (type: MoleculeType) => void;
}

const MOLECULES: { id: MoleculeType; label: string; formula: string; color: string }[] = [
  { id: "CAFFEINE", label: "Caffeine",  formula: "C8H10N4O2", color: "#f472b6" },
  { id: "BENZENE",  label: "Benzene",   formula: "C6H6",       color: "#a78bfa" },
  { id: "ETHANOL",  label: "Ethanol",   formula: "C2H6O",      color: "#34d399" },
  { id: "WATER",    label: "Water",     formula: "H2O",         color: "#60a5fa" },
];

const ELEMENT_COLORS: Record<string, string> = {
  C: "#94a3b8", H: "#e2e8f0", O: "#ef4444", N: "#818cf8"
};

export const MolecularViewer: React.FC<MolecularViewerProps> = ({
  activeAtom, currentMolecule, gestures, onSelectMolecule
}) => {
  const mol = MOLECULES.find(m => m.id === currentMolecule)!;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem", height:"100%" }}>

      {/* Molecule selector */}
      <div style={{ background:"rgba(2,2,4,0.92)", backdropFilter:"blur(20px)", border:"1.5px solid rgba(168,85,247,0.35)", borderRadius:"0.85rem", padding:"0.5rem", display:"flex", flexWrap:"wrap", gap:"0.35rem", boxShadow:"0 8px 24px rgba(0,0,0,0.8)" }}>
        <span style={{ fontFamily:"monospace", fontSize:"0.58rem", color:"rgba(255,255,255,0.35)", alignSelf:"center", paddingLeft:"0.2rem", textTransform:"uppercase", letterSpacing:"0.08em" }}>MOLECULE:</span>
        {MOLECULES.map(m => {
          const isActive = currentMolecule === m.id;
          return (
            <button key={m.id} onClick={() => onSelectMolecule(m.id)}
              style={{
                display:"flex", alignItems:"center", gap:"0.35rem",
                padding:"0.35rem 0.7rem", borderRadius:"0.5rem",
                border: isActive ? `1.5px solid ${m.color}` : "1.5px solid transparent",
                background: isActive ? `${m.color}18` : "rgba(255,255,255,0.06)",
                color: isActive ? m.color : "rgba(255,255,255,0.6)",
                fontFamily:"monospace", fontSize:"0.68rem", fontWeight:700,
                cursor:"pointer", transition:"all 0.15s",
                boxShadow: isActive ? `0 0 12px ${m.color}44` : "none",
              }}>
              <span>{m.label}</span>
              <span style={{ fontSize:"0.58rem", opacity:0.7 }}>{m.formula}</span>
            </button>
          );
        })}
      </div>

      {/* Active molecule info */}
      <div style={{ background:"rgba(2,2,4,0.92)", backdropFilter:"blur(20px)", border:`1.5px solid ${mol.color}33`, borderRadius:"0.85rem", padding:"0.75rem 0.85rem", boxShadow:"0 8px 24px rgba(0,0,0,0.8)", display:"flex", alignItems:"center", gap:"0.75rem" }}>
        <div style={{ width:36, height:36, borderRadius:"50%", background:`${mol.color}18`, border:`2px solid ${mol.color}55`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Atom size={18} color={mol.color} />
        </div>
        <div>
          <div style={{ fontFamily:"monospace", fontSize:"0.78rem", fontWeight:700, color:"#fff" }}>{mol.label}</div>
          <div style={{ fontFamily:"monospace", fontSize:"0.65rem", color:"rgba(255,255,255,0.5)", marginTop:"0.1rem" }}>{mol.formula} — rotate with mouse drag or hand gestures</div>
        </div>
      </div>

      {/* Atom inspector — appears when hovering an atom */}
      {activeAtom ? (
        <div style={{ background:"rgba(2,2,4,0.95)", backdropFilter:"blur(20px)", border:"1.5px solid rgba(0,245,255,0.45)", borderRadius:"0.85rem", padding:"0.85rem", boxShadow:"0 8px 24px rgba(0,0,0,0.9)", fontFamily:"monospace" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid rgba(255,255,255,0.08)", paddingBottom:"0.6rem", marginBottom:"0.6rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.45rem" }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background: ELEMENT_COLORS[activeAtom.element] || "#888", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:"0.7rem", color:"#000", flexShrink:0 }}>
                {activeAtom.element}
              </div>
              <div>
                <div style={{ fontSize:"0.78rem", fontWeight:700, color:"#fff" }}>{activeAtom.name}</div>
                <div style={{ fontSize:"0.6rem", color:"rgba(255,255,255,0.45)" }}>Atomic No. {activeAtom.atomicNumber}</div>
              </div>
            </div>
            <div style={{ padding:"0.2rem 0.55rem", background:"rgba(0,245,255,0.1)", border:"1px solid rgba(0,245,255,0.5)", borderRadius:"0.4rem", fontSize:"0.68rem", color:"#a5f3fc", fontWeight:700, boxShadow:"0 0 8px rgba(0,245,255,0.3)" }}>
              {activeAtom.element}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.4rem 0.75rem", fontSize:"0.67rem" }}>
            <span style={{ color:"rgba(255,255,255,0.45)" }}>Hybridization</span>
            <span style={{ color:"#c4b5fd", fontWeight:700 }}>{activeAtom.hybridization}</span>
            <span style={{ color:"rgba(255,255,255,0.45)" }}>Valence e?</span>
            <span style={{ color:"#f9a8d4", fontWeight:700 }}>{activeAtom.valence}</span>
            <span style={{ color:"rgba(255,255,255,0.45)" }}>VDW Radius</span>
            <span style={{ color:"#fde68a" }}>{(activeAtom.radius * 100).toFixed(0)} pm</span>
          </div>
        </div>
      ) : (
        <div style={{ background:"rgba(2,2,4,0.88)", backdropFilter:"blur(16px)", border:"1.5px solid rgba(255,255,255,0.08)", borderRadius:"0.85rem", padding:"0.75rem", textAlign:"center", fontFamily:"monospace", fontSize:"0.68rem", color:"rgba(255,255,255,0.35)" }}>
          <MousePointer size={14} style={{ display:"inline-block", marginBottom:4, color:"rgba(255,255,255,0.25)" }} />
          <div>Hover over an atom in the 3D view to inspect it</div>
        </div>
      )}

      {/* Gesture guide */}
      <div style={{ marginTop:"auto", background:"rgba(2,2,4,0.88)", backdropFilter:"blur(16px)", border:"1.5px solid rgba(255,255,255,0.08)", borderRadius:"0.85rem", padding:"0.65rem 0.85rem", display:"flex", alignItems:"center", justifyContent:"space-around", fontFamily:"monospace", fontSize:"0.65rem", gap:"0.5rem", flexWrap:"wrap" }}>
        {[
          { icon:<Move size={12}/>, color:"#67e8f9", label:"Pinch: Move" },
          { icon:<Rotate3D size={12}/>, color:"#c4b5fd", label:"2 Hands: Rotate" },
          { icon:<Maximize2 size={12}/>, color:"#f9a8d4", label:"Spread: Scale" },
        ].map(({ icon, color, label }) => (
          <div key={label} style={{ display:"flex", alignItems:"center", gap:"0.3rem", color }}>
            {icon}<span style={{ color:"rgba(255,255,255,0.6)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
