import React from "react";
import { VisualEffectState, EFFECT_CONFIGS } from "../types/effects";
import { PlusCircle, Trash2, RotateCcw, Camera, Maximize2, Eye, EyeOff } from "lucide-react";

interface ControlBarProps {
  activeTool: VisualEffectState;
  isThermalActive: boolean;
  showHUD: boolean;
  objectCount: number;
  onSelectTool: (tool: VisualEffectState) => void;
  onToggleThermal: () => void;
  onCreateObject: () => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  onCapture: () => void;
  onToggleHUD: () => void;
  onToggleFullscreen: () => void;
}

const TOOLS = [
  { type: VisualEffectState.RECTANGLE_TRACKING, label: "HATCH",  color: "#00f5ff" },
  { type: VisualEffectState.PURPLE_PRISM,        label: "PRISM",  color: "#c084fc" },
  { type: VisualEffectState.TRIANGLE_EFFECT,     label: "WEDGES", color: "#f43f5e" },
  { type: VisualEffectState.GLOW_BLOCKS,         label: "BLOCKS", color: "#eab308" },
  { type: VisualEffectState.RECTANGLE_DOTS,      label: "DOTS",   color: "#ec4899" },
  { type: VisualEffectState.LARGE_GEOMETRY,      label: "3D FOLD",color: "#3b82f6" },
];

export const ControlBar: React.FC<ControlBarProps> = ({
  activeTool, objectCount, showHUD,
  onSelectTool, onCreateObject, onDeleteSelected, onClearAll, onCapture, onToggleHUD, onToggleFullscreen
}) => {
  const selected = TOOLS.find(t => t.type === activeTool);
  const toolName = selected ? selected.label : "";
  const toolColor = selected ? selected.color : "#06b6d4";

  const wrap: React.CSSProperties = {
    display:"flex", flexDirection:"column", alignItems:"center", gap:"0.5rem",
    background:"rgba(2,2,4,0.95)", backdropFilter:"blur(24px)",
    border:"1.5px solid rgba(255,255,255,0.16)", borderRadius:"1rem",
    padding:"0.7rem 0.9rem",
    boxShadow:"0 -8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)",
    maxWidth:"95vw",
  };

  const toolRow: React.CSSProperties = {
    display:"flex", alignItems:"center", gap:"0.35rem", flexWrap:"wrap", justifyContent:"center"
  };

  const actionRow: React.CSSProperties = {
    display:"flex", alignItems:"center", gap:"0.35rem",
    paddingTop:"0.5rem", borderTop:"1px solid rgba(255,255,255,0.08)"
  };

  return (
    <div style={wrap}>
      {/* Tool selector */}
      <div style={toolRow}>
        <span style={{ fontFamily:"monospace", fontSize:"0.6rem", color:"rgba(255,255,255,0.4)", marginRight:"0.2rem", textTransform:"uppercase", letterSpacing:"0.08em" }}>TOOL:</span>
        {TOOLS.map(({ type, label, color }) => {
          const isActive = activeTool === type;
          return (
            <button key={type}
              onClick={() => onSelectTool(isActive ? VisualEffectState.NONE : type)}
              style={{
                padding:"0.35rem 0.7rem", borderRadius:"0.5rem",
                border: isActive ? `1.5px solid ${color}` : "1.5px solid transparent",
                background: isActive ? `${color}22` : "rgba(255,255,255,0.07)",
                color: isActive ? color : "rgba(255,255,255,0.7)",
                fontFamily:"monospace", fontSize:"0.68rem", fontWeight:700,
                cursor:"pointer", transition:"all 0.15s",
                boxShadow: isActive ? `0 0 12px ${color}55` : "none",
              }}>
              {label}
            </button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div style={actionRow}>
        {/* Create */}
        <button onClick={onCreateObject}
          style={{ display:"flex", alignItems:"center", gap:"0.4rem", padding:"0.4rem 1rem", background: activeTool !== VisualEffectState.NONE ? toolColor : "rgba(255,255,255,0.12)", border:"none", borderRadius:"0.6rem", color: activeTool !== VisualEffectState.NONE ? "#000" : "rgba(255,255,255,0.5)", fontFamily:"monospace", fontSize:"0.7rem", fontWeight:700, cursor:"pointer", boxShadow: activeTool !== VisualEffectState.NONE ? `0 0 14px ${toolColor}66` : "none", transition:"all 0.15s" }}>
          <PlusCircle size={13}/> CREATE {toolName}
        </button>

        <div style={{ width:1, height:20, background:"rgba(255,255,255,0.12)" }} />

        {/* Delete */}
        <button onClick={onDeleteSelected} disabled={objectCount === 0}
          style={{ display:"flex", alignItems:"center", gap:"0.35rem", padding:"0.4rem 0.7rem", background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:"0.6rem", color: objectCount === 0 ? "rgba(255,255,255,0.2)" : "#fca5a5", fontFamily:"monospace", fontSize:"0.68rem", fontWeight:700, cursor: objectCount===0 ? "not-allowed" : "pointer", transition:"all 0.15s" }}>
          <Trash2 size={13}/> DEL
        </button>

        {/* Clear */}
        <button onClick={onClearAll} disabled={objectCount === 0}
          style={{ display:"flex", alignItems:"center", gap:"0.35rem", padding:"0.4rem 0.7rem", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"0.6rem", color: objectCount === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)", fontFamily:"monospace", fontSize:"0.68rem", cursor: objectCount===0 ? "not-allowed" : "pointer", transition:"all 0.15s" }}>
          <RotateCcw size={13}/> CLEAR ({objectCount})
        </button>

        <div style={{ width:1, height:20, background:"rgba(255,255,255,0.12)" }} />

        {/* HUD toggle */}
        <button onClick={onToggleHUD} title={showHUD ? "Hide HUD" : "Show HUD"}
          style={{ padding:"0.4rem 0.6rem", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"0.6rem", color:"rgba(255,255,255,0.6)", cursor:"pointer", display:"flex", alignItems:"center" }}>
          {showHUD ? <Eye size={13}/> : <EyeOff size={13}/>}
        </button>

        {/* Capture */}
        <button onClick={onCapture} title="Screenshot"
          style={{ padding:"0.4rem 0.6rem", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"0.6rem", color:"rgba(255,255,255,0.6)", cursor:"pointer", display:"flex", alignItems:"center" }}>
          <Camera size={13}/>
        </button>

        {/* Fullscreen */}
        <button onClick={onToggleFullscreen} title="Fullscreen"
          style={{ padding:"0.4rem 0.6rem", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"0.6rem", color:"rgba(255,255,255,0.6)", cursor:"pointer", display:"flex", alignItems:"center" }}>
          <Maximize2 size={13}/>
        </button>
      </div>
    </div>
  );
};
