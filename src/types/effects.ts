export enum VisualEffectState {
  IDLE = 'IDLE',
  RECTANGLE_TRACKING = 'RECTANGLE_TRACKING', // 0-4s (Blue/purple hatching)
  TRIANGLE_EFFECT = 'TRIANGLE_EFFECT',       // 5-8s (Purple/pink wedges)
  GLOW_BLOCKS = 'GLOW_BLOCKS',               // 9-11s (Magenta & mint blocks)
  BLUR_TRANSITION = 'BLUR_TRANSITION',       // 12s (GPU camera blur)
  ANGULAR_OBJECT = 'ANGULAR_OBJECT',         // 13-14s (Multicolor polygon prism)
  THERMAL = 'THERMAL',                       // 15-16s (False-color thermal)
  RECTANGLE_DOTS = 'RECTANGLE_DOTS',         // 18-22s (Pink halftone dots)
  LARGE_GEOMETRY = 'LARGE_GEOMETRY',         // 23-29s (Big horizontal 3D structure)
  PURPLE_PRISM = 'PURPLE_PRISM'              // 30-33s (Translucent lavender/purple crystal)
}

export type AppMode = 'STARTUP' | 'LIVE' | 'DEMO';

export interface EffectStateConfig {
  name: VisualEffectState;
  displayName: string;
  startSec: number;
  durationSec: number;
  description: string;
  colorTheme: string;
}

export const EFFECT_CONFIGS: Record<VisualEffectState, EffectStateConfig> = {
  [VisualEffectState.IDLE]: {
    name: VisualEffectState.IDLE,
    displayName: 'STANDBY / TRACKING',
    startSec: 0,
    durationSec: 0,
    description: 'Real-time coordinate overlays & landmark tracking instrumentation',
    colorTheme: '#ffffff'
  },
  [VisualEffectState.RECTANGLE_TRACKING]: {
    name: VisualEffectState.RECTANGLE_TRACKING,
    displayName: 'CYAN/PURPLE HATCHED PLANE',
    startSec: 0,
    durationSec: 4,
    description: 'Tracked deformable plane with procedural animated diagonal hatching',
    colorTheme: '#00d2ff'
  },
  [VisualEffectState.TRIANGLE_EFFECT]: {
    name: VisualEffectState.TRIANGLE_EFFECT,
    displayName: 'PURPLE TRIANGULAR WEDGES',
    startSec: 4,
    durationSec: 4,
    description: 'Elongated purple/pink triangular prisms with inertia attached to fingertips',
    colorTheme: '#b829ea'
  },
  [VisualEffectState.GLOW_BLOCKS]: {
    name: VisualEffectState.GLOW_BLOCKS,
    displayName: 'LUMINOUS GLOW BLOCKS',
    startSec: 8,
    durationSec: 3,
    description: 'Magenta & mint-green emissive cuboids with additive bloom',
    colorTheme: '#ff007f'
  },
  [VisualEffectState.BLUR_TRANSITION]: {
    name: VisualEffectState.BLUR_TRANSITION,
    displayName: 'GPU BLUR TRANSITION',
    startSec: 11,
    durationSec: 1.5,
    description: 'Fullscreen multi-tap Gaussian camera blur transition',
    colorTheme: '#ffffff'
  },
  [VisualEffectState.ANGULAR_OBJECT]: {
    name: VisualEffectState.ANGULAR_OBJECT,
    displayName: 'ANGULAR MULTI-COLOR PRISM',
    startSec: 12.5,
    durationSec: 2,
    description: 'Multi-faceted vibrant polygonal prism attached to upper raised hand',
    colorTheme: '#00ffcc'
  },
  [VisualEffectState.THERMAL]: {
    name: VisualEffectState.THERMAL,
    displayName: 'FALSE-COLOR THERMAL VISION',
    startSec: 14.5,
    durationSec: 3,
    description: 'GPU fragment shader mapping camera luminance to false-color spectrum',
    colorTheme: '#ffea00'
  },
  [VisualEffectState.RECTANGLE_DOTS]: {
    name: VisualEffectState.RECTANGLE_DOTS,
    displayName: 'PINK HALFTONE DOTTED PLANE',
    startSec: 17.5,
    durationSec: 4.5,
    description: 'Dense pink/red procedural halftone dot matrix tracked between hands',
    colorTheme: '#ff2d55'
  },
  [VisualEffectState.LARGE_GEOMETRY]: {
    name: VisualEffectState.LARGE_GEOMETRY,
    displayName: 'LARGE 3D FOLDED STRUCTURE',
    startSec: 22,
    durationSec: 7,
    description: 'Massive multi-colored folded architectural structure stretching between hands',
    colorTheme: '#ff9500'
  },
  [VisualEffectState.PURPLE_PRISM]: {
    name: VisualEffectState.PURPLE_PRISM,
    displayName: 'TRANSLUCENT PURPLE CRYSTAL',
    startSec: 29,
    durationSec: 5,
    description: 'Large translucent lavender digital crystal with dark purple structural edges',
    colorTheme: '#c084fc'
  }
};
