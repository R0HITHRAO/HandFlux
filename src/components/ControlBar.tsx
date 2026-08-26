import React from "react";
import { VisualEffectState, EFFECT_CONFIGS } from "../types/effects";
import { PlusCircle, Trash2, RotateCcw } from "lucide-react";

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

export const ControlBar: React.FC<ControlBarProps> = ({
  activeTool, objectCount, onSelectTool, onCreateObject, onDeleteSelected, onClearAll
}) => {
  const tools = [
    { type: VisualEffectState.RECTANGLE_TRACKING, label: "HATCH"  },
    { type: VisualEffectState.PURPLE_PRISM,        label: "PRISM"  },
    { type: VisualEffectState.TRIANGLE_EFFECT,     label: "WEDGES" },
    { type: VisualEffectState.GLOW_BLOCKS,         label: "BLOCKS" },
    { type: VisualEffectState.RECTANGLE_DOTS,      label: "DOTS"   },
    { type: VisualEffectState.LARGE_GEOMETRY,      label: "3D FOLD"},
  ];

  const toolName = EFFECT_CONFIGS[activeTool]?.name || "";

  return (
    <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"center", gap:"0.5rem", background:"rgba(0,0,0,0.9)", backdropFilter:"blur(24px)", border:"2px solid rgba(255,255,255,0.18)", borderRadius:"1rem", padding:"0.6rem 0.9rem", boxShadow:"0 20px 50px rgba(0,0,0,0.9)", maxWidth:"95vw" }}>

      {/* Tool buttons */}
      {tools.map(({ type, label }) => {
        const active = activeTool === type;
        return (
          <button key={type} onClick={() => onSelectTool(active ? VisualEffectState.NONE : type)}
            style={{ padding:"0.4rem 0.75rem", borderRadius:"0.6rem", border:"none", cursor:"pointer", fontFamily:"monospace", fontSize:"0.7rem", fontWeight:"bold", transition:"all 0.15s",
              background: active ? "#06b6d4" : "rgba(255,255,255,0.1)",
              color: active ? "#000" : "rgba(255,255,255,0.8)",
              boxShadow: active ? "0 0 15px rgba(0,245,255,0.7)" : "none",
              transform: active ? "scale(1.05)" : "none"
            }}>
            {label}
          </button>
        );
      })}

      <div style={{ width:1, height:24, background:"rgba(255,255,255,0.18)", margin:"0 0.25rem" }} />

      {/* Create */}
      <button onClick={onCreateObject}
        style={{ display:"flex", alignItems:"center", gap:"0.4rem", padding:"0.45rem 0.9rem", background:"linear-gradient(135deg,#ec4899,#e11d48)", border:"none", borderRadius:"0.6rem", color:"#fff", fontFamily:"monospace", fontSize:"0.7rem", fontWeight:"bold", cursor:"pointer", boxShadow:"0 0 15px rgba(244,63,94,0.6)", transition:"transform 0.1s" }}>
        <PlusCircle size={14} />
        CREATE {toolName}
      </button>

      {/* Delete */}
      <button onClick={onDeleteSelected} disabled={objectCount===0}
        style={{ display:"flex", alignItems:"center", gap:"0.35rem", padding:"0.45rem 0.75rem", background:"rgba(60,0,0,0.8)", border:"1px solid rgba(239,68,68,0.4)", borderRadius:"0.6rem", color:"#fca5a5", fontFamily:"monospace", fontSize:"0.7rem", fontWeight:"bold", cursor:objectCount===0?"not-allowed":"pointer", opacity:objectCount===0?0.3:1 }}>
        <Trash2 size={13} />
        DELETE
      </button>

      {/* Clear */}
      <button onClick={onClearAll} disabled={objectCount===0}
        style={{ display:"flex", alignItems:"center", gap:"0.35rem", padding:"0.45rem 0.75rem", background:"rgba(255,255,255,0.08)", border:"none", borderRadius:"0.6rem", color:"rgba(255,255,255,0.75)", fontFamily:"monospace", fontSize:"0.7rem", cursor:objectCount===0?"not-allowed":"pointer", opacity:objectCount===0?0.3:1 }}>
        <RotateCcw size={13} />
        CLEAR ({objectCount})
      </button>
    </div>
  );
};
