export type AppMode = 'STARTUP' | 'LIVE' | 'DEMO';

export enum VisualEffectState {
  NONE = 'NONE',
  PURPLE_PRISM = 'PRISM',
  RECTANGLE_TRACKING = 'HATCH',
  TRIANGLE_EFFECT = 'WEDGES',
  GLOW_BLOCKS = 'BLOCKS',
  BLUR_TRANSITION = 'BLUR',
  ANGULAR_OBJECT = 'ANGULAR',
  RECTANGLE_DOTS = 'DOTS',
  LARGE_GEOMETRY = '3D_FOLD',
  THERMAL = 'THERMAL',
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
  [VisualEffectState.PURPLE_PRISM]: { name: 'PRISM', label: 'PRISM', description: 'Translucent Lavender Crystal Prism', hotkey: '1', primaryColor: '#c084fc', isObject: true },
  [VisualEffectState.RECTANGLE_TRACKING]: { name: 'HATCH', label: 'HATCH', description: 'Hatched Quad Plane', hotkey: '2', primaryColor: '#00f5ff', isObject: true },
  [VisualEffectState.TRIANGLE_EFFECT]: { name: 'WEDGES', label: 'WEDGES', description: 'Triangular Wedges', hotkey: '3', primaryColor: '#b829ea', isObject: true },
  [VisualEffectState.GLOW_BLOCKS]: { name: 'BLOCKS', label: 'BLOCKS', description: 'Glowing Cuboids', hotkey: '4', primaryColor: '#ff007f', isObject: true },
  [VisualEffectState.BLUR_TRANSITION]: { name: 'BLUR', label: 'BLUR', description: 'GPU Camera Blur', hotkey: 'B', primaryColor: '#9333ea', isObject: false },
  [VisualEffectState.ANGULAR_OBJECT]: { name: 'ANGULAR', label: 'ANGULAR', description: 'Polygonal Prism', hotkey: 'A', primaryColor: '#eab308', isObject: true },
  [VisualEffectState.RECTANGLE_DOTS]: { name: 'DOTS', label: 'DOTS', description: 'Halftone Plane', hotkey: '5', primaryColor: '#ec4899', isObject: true },
  [VisualEffectState.LARGE_GEOMETRY]: { name: '3D_FOLD', label: '3D FOLD', description: '3D Folded Structure', hotkey: '6', primaryColor: '#3b82f6', isObject: true },
  [VisualEffectState.THERMAL]: { name: 'THERMAL', label: 'THERMAL', description: 'Thermal Camera', hotkey: 'T', primaryColor: '#00ff88', isObject: false },
  [VisualEffectState.RAW_CAMERA]: { name: 'RAW_CAMERA', label: 'RAW CAM', description: 'Raw Webcam', hotkey: 'C', primaryColor: '#ffffff', isObject: false }
};
