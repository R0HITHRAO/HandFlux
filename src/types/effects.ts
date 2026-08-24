export type AppMode = 'PRESENTATION' | 'VIEWER_3D' | 'AR_LAB';

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
  [VisualEffectState.RECTANGLE_TRACKING]: { name: 'HATCH', label: '1: HATCH', description: 'Laser-Hatched Quad Digital Plane', hotkey: '1', primaryColor: '#00f5ff', isObject: true },
  [VisualEffectState.PURPLE_PRISM]: { name: 'PRISM', label: '2: PRISM', description: 'Lavender Crystal Prism', hotkey: '2', primaryColor: '#c084fc', isObject: true },
  [VisualEffectState.TRIANGLE_EFFECT]: { name: 'WEDGES', label: '3: WEDGES', description: 'Neon Triangular Selection Wedges', hotkey: '3', primaryColor: '#f43f5e', isObject: true },
  [VisualEffectState.GLOW_BLOCKS]: { name: 'BLOCKS', label: '4: BLOCKS', description: 'Volumetric Holographic Cuboids', hotkey: '4', primaryColor: '#eab308', isObject: true },
  [VisualEffectState.BLUR_TRANSITION]: { name: 'BLUR', label: 'BLUR', description: 'GPU Camera Blur Pass', hotkey: 'B', primaryColor: '#9333ea', isObject: false },
  [VisualEffectState.ANGULAR_OBJECT]: { name: 'ANGULAR', label: 'ANGULAR', description: 'Polygonal Prism Object', hotkey: 'A', primaryColor: '#eab308', isObject: true },
  [VisualEffectState.RECTANGLE_DOTS]: { name: 'DOTS', label: '5: DOTS', description: 'Halftone Dot Matrix Plane', hotkey: '5', primaryColor: '#ec4899', isObject: true },
  [VisualEffectState.LARGE_GEOMETRY]: { name: '3D_FOLD', label: '6: 3D FOLD', description: 'Folded 3D Geometric Polyhedron', hotkey: '6', primaryColor: '#3b82f6', isObject: true },
  [VisualEffectState.THERMAL]: { name: 'THERMAL', label: '7: THERMAL', description: 'False-Color GPU Thermal Shader', hotkey: '7', primaryColor: '#10b981', isObject: false },
  [VisualEffectState.RAW_CAMERA]: { name: 'RAW_CAMERA', label: 'RAW CAM', description: 'Raw Mirror Webcam Stream', hotkey: 'C', primaryColor: '#ffffff', isObject: false }
};
