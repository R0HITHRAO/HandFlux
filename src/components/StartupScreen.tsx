import React, { useEffect, useState } from "react";

interface StartupScreenProps {
  isVisible: boolean;
}

const STEPS = [
  { label: "Loading MediaPipe vision model...",  duration: 2000 },
  { label: "Initializing WebGL GPU context...",  duration: 800  },
  { label: "Calibrating gesture engine...",       duration: 600  },
  { label: "Connecting webcam stream...",         duration: 400  },
];

export const StartupScreen: React.FC<StartupScreenProps> = ({ isVisible }) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [dots, setDots] = useState(".");

  useEffect(() => {
    if (!isVisible) return;
    let i = 0;
    const advance = () => {
      i++;
      if (i < STEPS.length) {
        setStepIdx(i);
        setTimeout(advance, STEPS[i].duration);
      }
    };
    setTimeout(advance, STEPS[0].duration);

    const dotTimer = setInterval(() => {
      setDots(d => d.length >= 3 ? "." : d + ".");
    }, 350);

    return () => clearInterval(dotTimer);
  }, [isVisible]);

  if (!isVisible) return null;

  const progress = ((stepIdx) / STEPS.length) * 100;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:99999,
      background:"#000",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      fontFamily:"monospace", color:"#fff",
      gap:"1.5rem", padding:"2rem",
    }}>
      {/* Logo */}
      <div style={{ textAlign:"center" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.75rem", marginBottom:"0.5rem" }}>
          <div style={{ width:14, height:14, borderRadius:"50%", background:"#00f5ff", boxShadow:"0 0 20px #00f5ff" }} />
          <span style={{ fontSize:"2rem", fontWeight:900, letterSpacing:"0.18em", color:"#fff" }}>HANDFLUX</span>
          <div style={{ width:14, height:14, borderRadius:"50%", background:"#00f5ff", boxShadow:"0 0 20px #00f5ff" }} />
        </div>
        <p style={{ margin:0, fontSize:"0.75rem", color:"rgba(0,245,255,0.7)", letterSpacing:"0.12em", textTransform:"uppercase" }}>
          Touchless Human-Computer Interaction
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ width:"min(360px, 80vw)" }}>
        <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:9999, height:3, overflow:"hidden", marginBottom:"0.75rem" }}>
          <div style={{ width:`${progress}%`, height:"100%", background:"linear-gradient(90deg, #00f5ff, #9333ea)", transition:"width 0.5s ease", boxShadow:"0 0 12px #00f5ff" }} />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.7rem", color:"rgba(255,255,255,0.55)" }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"#00f5ff", boxShadow:"0 0 8px #00f5ff", flexShrink:0, animation:"none" }} />
          <span>{STEPS[stepIdx]?.label}{dots}</span>
        </div>
      </div>

      {/* Feature list */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.5rem 1.5rem", fontSize:"0.65rem", color:"rgba(255,255,255,0.35)", maxWidth:340 }}>
        {["21-point Hand Tracking","Real-time Gesture Engine","Three.js 3D Renderer","Synthesized Audio FX",
          "GPU/CPU Auto-fallback","Touchless Navigation","3D Molecule Inspector","AR Shader Lab"].map(f => (
          <div key={f} style={{ display:"flex", alignItems:"center", gap:"0.35rem" }}>
            <div style={{ width:4, height:4, borderRadius:"50%", background:"rgba(0,245,255,0.4)", flexShrink:0 }} />
            {f}
          </div>
        ))}
      </div>

      <p style={{ margin:0, fontSize:"0.62rem", color:"rgba(255,255,255,0.2)", textAlign:"center", maxWidth:300 }}>
        All processing runs 100% locally on your device.<br/>No video is ever uploaded or transmitted.
      </p>
    </div>
  );
};
