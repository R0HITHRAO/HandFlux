import React, { Component, ErrorInfo, ReactNode } from "react";
import { MainView } from "./components/MainView";

interface EBState { hasError: boolean; error: string; }

class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error: error.message + "\n" + error.stack };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("HandFlux crash:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position:"fixed", inset:0, background:"#000", color:"#fff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"monospace", padding:"2rem", zIndex:9999 }}>
          <div style={{ color:"#f87171", fontSize:"1.25rem", fontWeight:"bold", marginBottom:"1rem" }}>
            HANDFLUX RUNTIME ERROR - CHECK CONSOLE
          </div>
          <pre style={{ background:"#111", border:"1px solid #333", padding:"1rem", borderRadius:"0.5rem", maxWidth:"80vw", overflow:"auto", fontSize:"0.7rem", color:"#fca5a5", whiteSpace:"pre-wrap" }}>
            {this.state.error}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop:"1rem", padding:"0.5rem 1.5rem", background:"#06b6d4", color:"#000", fontWeight:"bold", border:"none", borderRadius:"0.5rem", cursor:"pointer" }}>
            RELOAD
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => (
  <ErrorBoundary>
    <MainView />
  </ErrorBoundary>
);

export default App;
