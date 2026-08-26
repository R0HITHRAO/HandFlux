import React from "react";
import { AtomData, MoleculeType } from "./MolecularScene";
import { GestureMetrics } from "../types/gestures";
import { Atom, Move, Rotate3D, Maximize2 } from "lucide-react";

interface MolecularViewerProps {
  activeAtom: AtomData | null;
  gestures: GestureMetrics;
  currentMolecule: MoleculeType;
  onSelectMolecule: (type: MoleculeType) => void;
}

export const MolecularViewer: React.FC<MolecularViewerProps> = ({
  activeAtom, currentMolecule, onSelectMolecule
}) => {
  const molecules: { id: MoleculeType; label: string; formula: string }[] = [
    { id: "CAFFEINE", label: "Caffeine", formula: "C8H10N4O2" },
    { id: "BENZENE",  label: "Benzene",  formula: "C6H6"      },
    { id: "ETHANOL",  label: "Ethanol",  formula: "C2H6O"     },
    { id: "WATER",    label: "Water",    formula: "H2O"       },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem", height:"100%", paddingTop:"0.5rem" }}>

      {/* Molecule Switcher */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:"0.4rem", background:"rgba(0,0,0,0.95)", backdropFilter:"blur(24px)", border:"2px solid rgba(168,85,247,0.45)", borderRadius:"1rem", padding:"0.5rem", boxShadow:"0 15px 35px rgba(0,0,0,0.9)" }}>
        {molecules.map(m => (
          <button key={m.id} onClick={() => onSelectMolecule(m.id)}
            style={{ padding:"0.4rem 0.75rem", borderRadius:"0.6rem", border:"none", cursor:"pointer", fontFamily:"monospace", fontSize:"0.7rem", fontWeight:"bold", transition:"all 0.15s",
              background: currentMolecule===m.id ? "#9333ea" : "transparent",
              color: currentMolecule===m.id ? "#fff" : "rgba(255,255,255,0.65)",
              boxShadow: currentMolecule===m.id ? "0 0 15px #a855f7" : "none",
              transform: currentMolecule===m.id ? "scale(1.05)" : "none"
            }}>
            {m.label} <span style={{ color:"#c4b5fd", fontSize:"0.65rem" }}>({m.formula})</span>
          </button>
        ))}
      </div>

      {/* Atom inspector */}
      {activeAtom && (
        <div style={{ background:"rgba(0,0,0,0.95)", backdropFilter:"blur(24px)", border:"2px solid rgba(0,245,255,0.5)", borderRadius:"1.25rem", padding:"1rem", boxShadow:"0 25px 60px rgba(0,0,0,0.95)", fontFamily:"monospace" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid rgba(255,255,255,0.12)", paddingBottom:"0.6rem", marginBottom:"0.6rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
              <Atom size={16} color="#00f5ff" />
              <span style={{ color:"#67e8f9", fontWeight:"bold", fontSize:"0.8rem" }}>{activeAtom.name}</span>
            </div>
            <span style={{ fontSize:"0.7rem", padding:"0.15rem 0.5rem", background:"rgba(0,30,40,0.9)", border:"1px solid rgba(0,245,255,0.7)", borderRadius:"0.4rem", color:"#a5f3fc", fontWeight:"bold", boxShadow:"0 0 10px #00f5ff" }}>
              {activeAtom.element}
            </span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.35rem", fontSize:"0.68rem" }}>
            <span style={{ color:"rgba(255,255,255,0.55)" }}>ATOMIC NO:</span><span style={{ color:"#fff", fontWeight:"bold" }}>{activeAtom.atomicNumber}</span>
            <span style={{ color:"rgba(255,255,255,0.55)" }}>HYBRID:</span><span style={{ color:"#c4b5fd", fontWeight:"bold" }}>{activeAtom.hybridization}</span>
            <span style={{ color:"rgba(255,255,255,0.55)" }}>VALENCE e?:</span><span style={{ color:"#f9a8d4", fontWeight:"bold" }}>{activeAtom.valence}</span>
            <span style={{ color:"rgba(255,255,255,0.55)" }}>VDW RADIUS:</span><span style={{ color:"#fde68a" }}>{(activeAtom.radius*100).toFixed(0)} pm</span>
          </div>
        </div>
      )}

      {/* Gesture guide */}
      <div style={{ marginTop:"auto", background:"rgba(0,0,0,0.95)", backdropFilter:"blur(24px)", border:"1.5px solid rgba(255,255,255,0.2)", borderRadius:"1rem", padding:"0.75rem", display:"flex", alignItems:"center", justifyContent:"space-around", fontFamily:"monospace", fontSize:"0.68rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.35rem", color:"#67e8f9" }}><Move size={13} /><span>Pinch: Move</span></div>
        <div style={{ display:"flex", alignItems:"center", gap:"0.35rem", color:"#c4b5fd" }}><Rotate3D size={13} /><span>2-Hand: Rotate</span></div>
        <div style={{ display:"flex", alignItems:"center", gap:"0.35rem", color:"#f9a8d4" }}><Maximize2 size={13} /><span>Spread: Scale</span></div>
      </div>
    </div>
  );
};
