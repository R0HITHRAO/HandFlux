export type AppMode = 'STARTUP' | 'LIVE' | 'DEMO';

export enum VisualEffectState {
  NONE = 'NONE',
  RECTANGLE_TRACKING = 'HATCH',
  TRIANGLE_EFFECT = 'WEDGES',
  GLOW_BLOCKS = 'BLOCKS',
  BLUR_TRANSITION = 'BLUR',
  ANGULAR_OBJECT = 'ANGULAR',
  THERMAL = 'THERMAL',
  RECTANGLE_DOTS = 'DOTS',
  LARGE_GEOMETRY = '3D_FOLD',
  PURPLE_PRISM = 'PRISM',
  RAW_CAMERA = 'RAW_CAMERA'
}

export interface EffectConfig {
  name: string;
  label: string;
  description: string;
  hotkey: string;
  primaryColor: string;
  isObject: boolean;
}

export const EFFECT_CONFIGS: Record<VisualEffectState, EffectConfig> = {
  [VisualEffectState.NONE]: { name: 'NONE', label: 'SELECT TOOL', description: 'No tool selected', hotkey: '0', primaryColor: '#ffffff', isObject: false },
  [VisualEffectState.RECTANGLE_TRACKING]: { name: 'HATCH', label: '1: HATCH', description: 'Laser-Hatched Quad Plane', hotkey: '1', primaryColor: '#00f5ff', isObject: true },
  [VisualEffectState.TRIANGLE_EFFECT]: { name: 'WEDGES', label: '2: WEDGES', description: 'Purple Crystal Triangular Wedges', hotkey: '2', primaryColor: '#b829ea', isObject: true },
  [VisualEffectState.GLOW_BLOCKS]: { name: 'BLOCKS', label: '3: BLOCKS', description: 'Neon Pink & Mint Cuboids', hotkey: '3', primaryColor: '#ff007f', isObject: true },
  [VisualEffectState.BLUR_TRANSITION]: { name: 'BLUR', label: 'BLUR', description: 'GPU Camera Blur', hotkey: 'B', primaryColor: '#9333ea', isObject: false },
  [VisualEffectState.ANGULAR_OBJECT]: { name: 'ANGULAR', label: 'ANGULAR', description: 'Polygonal Prism', hotkey: 'A', primaryColor: '#eab308', isObject: true },
  [VisualEffectState.THERMAL]: { name: 'THERMAL', label: '4: THERMAL', description: 'False-Color Thermal Camera', hotkey: '4', primaryColor: '#00ff88', isObject: false },
  [VisualEffectState.RECTANGLE_DOTS]: { name: 'DOTS', label: '5: DOTS', description: 'Pink Halftone Dotted Plane', hotkey: '5', primaryColor: '#ec4899', isObject: true },
  [VisualEffectState.LARGE_GEOMETRY]: { name: '3D_FOLD', label: '6: 3D FOLD', description: 'Folded Architectural 3D Ribbon', hotkey: '6', primaryColor: '#3b82f6', isObject: true },
  [VisualEffectState.PURPLE_PRISM]: { name: 'PRISM', label: '7: PRISM', description: 'Translucent Lavender Crystal Prism', hotkey: '7', primaryColor: '#c084fc', isObject: true },
  [VisualEffectState.RAW_CAMERA]: { name: 'RAW_CAMERA', label: 'RAW CAM', description: 'Pure Unmodified Webcam', hotkey: 'C', primaryColor: '#ffffff', isObject: false }
};
