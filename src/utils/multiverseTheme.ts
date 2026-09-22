import type { AppTheme } from '../store/useSettingsStore';

export type ThemeWorldId =
  | 'translucent-cockpit'
  | 'cyber-cli'
  | 'neo-brutalist'
  | 'editorial-broadsheet'
  | 'technical-blueprint'
  | '8bit-arcade'
  | 'obsidian-monolith'
  | 'zen-botanical';

export interface DimensionDefinition {
  id: number;
  name: string;
  role: string;
  scope: string;
}

export const DIMENSION_DEFINITIONS: DimensionDefinition[] = [
  { id: 1, name: 'Theme World', role: 'Overarching artistic philosophy & mood', scope: 'Aesthetic foundation and atmosphere' },
  { id: 2, name: 'Typography System', role: '4-role typographic hierarchy', scope: 'Display, Body, Data/Mono, and Accent/Kicker' },
  { id: 3, name: 'Component Shapes', role: 'Silhouette geometry', scope: 'Radii, chamfers, cockpit curve, asymmetric organic pebble' },
  { id: 4, name: 'Borders & Linework', role: 'Hairline vs bold graphic vs ASCII borders', scope: 'Stroke width, dash patterns, and accent bounding lines' },
  { id: 5, name: 'Shadows & Depth', role: 'Refractive blur vs hard offset vs flat paper', scope: 'Elevation, ambient glow, and tactile compression' },
  { id: 6, name: 'Surfaces & Textures', role: 'Material overlay and backdrop optics', scope: 'Acrylic glass, scanlines, CAD grid, linen grain, obsidian OLED' },
  { id: 7, name: 'Spacing & Density', role: 'Spatial calibration', scope: 'Telemetry compact cockpit vs spacious literary broadsheet' },
  { id: 8, name: 'Motion Dynamics', role: 'Animation physics & timing', scope: 'Spring curves, 0ms mechanical steps, stepped 8-bit frames' },
  { id: 9, name: 'Interaction Feedback', role: 'Haptic-visual tactile responses', scope: 'Shadow compression, CRT bloom, laser illuminate' },
  { id: 10, name: 'Telemetry & Progress', role: 'Progress visualization geometry', scope: 'HUD arc, ASCII bracket meter, segmented blocks, caliper gauge, laser ring' },
];

export interface ThemeWorldConfig {
  id: ThemeWorldId;
  name: string;
  subtitle: string;
  concept: string;
  typography: {
    display: string;
    body: string;
    mono: string;
    accent: string;
  };
  shapes: {
    radius: string;
    radiusSm: string;
    radiusLg: string;
  };
  linework: {
    borderWidth: string;
    borderStyle: 'solid' | 'dashed' | 'dotted' | 'double';
    borderColor: string;
  };
  depth: {
    shadow: string;
    shadowActive: string;
  };
  surfaces: {
    blur: string;
    background: string;
    textureClass: string;
  };
  density: {
    padding: 'compact' | 'standard' | 'spacious';
    gap: string;
  };
  motion: {
    duration: string;
    timing: string;
  };
  feedback: {
    transformHover: string;
    transformActive: string;
  };
  telemetry: {
    style: 'hud-arc' | 'ascii' | 'segmented' | 'ink-sweep' | 'caliper' | '8bit' | 'laser-ring' | 'water-ripple';
  };
  palette: {
    bgGradient: string;
    panelBg: string;
    accentPrimary: string;
    accentSecondary: string;
    textPrimary: string;
    textSecondary: string;
  };
}

export const THEME_WORLDS: Record<ThemeWorldId, ThemeWorldConfig> = {
  'translucent-cockpit': {
    id: 'translucent-cockpit',
    name: 'Translucent Cockpit',
    subtitle: 'Aerospace Flight HUD',
    concept: 'Focused, precise, modern ambient glassmorphism with aerospace telemetry highlights.',
    typography: {
      display: "'Space Grotesk', system-ui, sans-serif",
      body: "'Inter', system-ui, sans-serif",
      mono: "'JetBrains Mono', monospace",
      accent: "'Space Grotesk', sans-serif",
    },
    shapes: {
      radius: '14px',
      radiusSm: '8px',
      radiusLg: '20px',
    },
    linework: {
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    depth: {
      shadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
      shadowActive: '0 4px 16px rgba(0, 0, 0, 0.25)',
    },
    surfaces: {
      blur: '16px',
      background: 'rgba(30, 41, 59, 0.72)',
      textureClass: 'texture-cockpit',
    },
    density: {
      padding: 'standard',
      gap: '16px',
    },
    motion: {
      duration: '250ms',
      timing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
    feedback: {
      transformHover: 'translateY(-2px)',
      transformActive: 'translateY(0)',
    },
    telemetry: {
      style: 'hud-arc',
    },
    palette: {
      bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      panelBg: 'rgba(30, 41, 59, 0.72)',
      accentPrimary: '#6366f1',
      accentSecondary: '#ec4899',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
    },
  },

  'cyber-cli': {
    id: 'cyber-cli',
    name: 'Terminal / Cyber-CLI 1984',
    subtitle: 'VT220 Distraction-Free Console',
    concept: 'Phosphor CRT glow, instant 0ms response, ASCII linework, and monospaced purity.',
    typography: {
      display: "'VT323', 'Fira Code', monospace",
      body: "'Fira Code', 'Courier New', monospace",
      mono: "'Fira Code', monospace",
      accent: "'VT323', monospace",
    },
    shapes: {
      radius: '0px',
      radiusSm: '0px',
      radiusLg: '0px',
    },
    linework: {
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#22c55e',
    },
    depth: {
      shadow: '0 0 14px rgba(34, 197, 94, 0.25)',
      shadowActive: '0 0 4px rgba(34, 197, 94, 0.4)',
    },
    surfaces: {
      blur: '0px',
      background: 'rgba(10, 15, 12, 0.95)',
      textureClass: 'texture-scanlines',
    },
    density: {
      padding: 'compact',
      gap: '12px',
    },
    motion: {
      duration: '0ms',
      timing: 'step-end',
    },
    feedback: {
      transformHover: 'none',
      transformActive: 'none',
    },
    telemetry: {
      style: 'ascii',
    },
    palette: {
      bgGradient: 'linear-gradient(180deg, #050a06 0%, #031008 100%)',
      panelBg: 'rgba(8, 18, 12, 0.92)',
      accentPrimary: '#22c55e',
      accentSecondary: '#16a34a',
      textPrimary: '#86efac',
      textSecondary: '#4ade80',
    },
  },

  'neo-brutalist': {
    id: 'neo-brutalist',
    name: 'Neo-Brutalist Studio',
    subtitle: 'High-Contrast Tactile Poster',
    concept: 'Hard 3px pitch-black borders, physical 4px offset shadows, bold confidence, zero glass transparency.',
    typography: {
      display: "'Archivo Black', 'Space Grotesk', sans-serif",
      body: "'Space Grotesk', system-ui, sans-serif",
      mono: "'Space Mono', monospace",
      accent: "'Archivo Black', sans-serif",
    },
    shapes: {
      radius: '4px',
      radiusSm: '2px',
      radiusLg: '6px',
    },
    linework: {
      borderWidth: '3px',
      borderStyle: 'solid',
      borderColor: '#0f172a',
    },
    depth: {
      shadow: '4px 4px 0px #0f172a',
      shadowActive: '0px 0px 0px #0f172a',
    },
    surfaces: {
      blur: '0px',
      background: '#ffffff',
      textureClass: 'texture-brutalist',
    },
    density: {
      padding: 'standard',
      gap: '20px',
    },
    motion: {
      duration: '100ms',
      timing: 'cubic-bezier(0, 0, 0.2, 1)',
    },
    feedback: {
      transformHover: 'translate(-2px, -2px)',
      transformActive: 'translate(2px, 2px)',
    },
    telemetry: {
      style: 'segmented',
    },
    palette: {
      bgGradient: 'linear-gradient(135deg, #fef08a 0%, #fed7aa 100%)',
      panelBg: '#ffffff',
      accentPrimary: '#f97316',
      accentSecondary: '#eab308',
      textPrimary: '#0f172a',
      textSecondary: '#334155',
    },
  },

  'editorial-broadsheet': {
    id: 'editorial-broadsheet',
    name: 'Editorial Broadsheet',
    subtitle: 'Antique Literary Sanctuary',
    concept: 'Delicate warm ink rules, cream linen base, graceful serif typography, and calm broadsheet focus.',
    typography: {
      display: "'Fraunces', 'Merriweather', Georgia, serif",
      body: "'Merriweather', Georgia, serif",
      mono: "'JetBrains Mono', monospace",
      accent: "'Fraunces', Georgia, serif",
    },
    shapes: {
      radius: '2px',
      radiusSm: '2px',
      radiusLg: '4px',
    },
    linework: {
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#d7cfc1',
    },
    depth: {
      shadow: 'none',
      shadowActive: 'none',
    },
    surfaces: {
      blur: '0px',
      background: '#faf7f0',
      textureClass: 'texture-broadsheet',
    },
    density: {
      padding: 'spacious',
      gap: '24px',
    },
    motion: {
      duration: '400ms',
      timing: 'ease-in-out',
    },
    feedback: {
      transformHover: 'translateY(-1px)',
      transformActive: 'translateY(0)',
    },
    telemetry: {
      style: 'ink-sweep',
    },
    palette: {
      bgGradient: 'linear-gradient(135deg, #f5f0e6 0%, #ece5d8 100%)',
      panelBg: '#fbf8f2',
      accentPrimary: '#9a3412',
      accentSecondary: '#b45309',
      textPrimary: '#292524',
      textSecondary: '#57534e',
    },
  },

  'technical-blueprint': {
    id: 'technical-blueprint',
    name: 'Technical Blueprint',
    subtitle: 'CAD Draftsman Workstation',
    concept: 'Millimeter coordinate grids, cyan dashed borders, registration crosshairs, and engineering telemetry.',
    typography: {
      display: "'Space Mono', monospace",
      body: "'Roboto', monospace, sans-serif",
      mono: "'Space Mono', monospace",
      accent: "'Space Mono', monospace",
    },
    shapes: {
      radius: '2px',
      radiusSm: '0px',
      radiusLg: '4px',
    },
    linework: {
      borderWidth: '1px',
      borderStyle: 'dashed',
      borderColor: '#0284c7',
    },
    depth: {
      shadow: '0 0 10px rgba(2, 132, 199, 0.18)',
      shadowActive: '0 0 2px rgba(2, 132, 199, 0.3)',
    },
    surfaces: {
      blur: '0px',
      background: 'rgba(12, 30, 54, 0.94)',
      textureClass: 'texture-cad-grid',
    },
    density: {
      padding: 'compact',
      gap: '16px',
    },
    motion: {
      duration: '160ms',
      timing: 'linear',
    },
    feedback: {
      transformHover: 'scale(1.01)',
      transformActive: 'scale(1)',
    },
    telemetry: {
      style: 'caliper',
    },
    palette: {
      bgGradient: 'linear-gradient(135deg, #0b1e36 0%, #081729 100%)',
      panelBg: 'rgba(11, 30, 54, 0.92)',
      accentPrimary: '#38bdf8',
      accentSecondary: '#0284c7',
      textPrimary: '#f0f9ff',
      textSecondary: '#7dd3fc',
    },
  },

  '8bit-arcade': {
    id: '8bit-arcade',
    name: '8-Bit Arcade',
    subtitle: 'Microcomputer Nostalgia',
    concept: 'Stepped pixel borders, 2-tone bevel buttons, pixelated health/XP progress bars, and chiptune vitality.',
    typography: {
      display: "'Press Start 2P', monospace",
      body: "'Fira Code', monospace",
      mono: "'Press Start 2P', monospace",
      accent: "'Press Start 2P', monospace",
    },
    shapes: {
      radius: '0px',
      radiusSm: '0px',
      radiusLg: '0px',
    },
    linework: {
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: '#18181b',
    },
    depth: {
      shadow: '3px 3px 0px #18181b',
      shadowActive: '0px 0px 0px #18181b',
    },
    surfaces: {
      blur: '0px',
      background: '#8ba364',
      textureClass: 'texture-pixel-matrix',
    },
    density: {
      padding: 'standard',
      gap: '16px',
    },
    motion: {
      duration: '60ms',
      timing: 'steps(2, jump-none)',
    },
    feedback: {
      transformHover: 'translate(-2px, -2px)',
      transformActive: 'translate(2px, 2px)',
    },
    telemetry: {
      style: '8bit',
    },
    palette: {
      bgGradient: 'linear-gradient(135deg, #8ba364 0%, #6f824e 100%)',
      panelBg: '#9bbc0f',
      accentPrimary: '#0f380f',
      accentSecondary: '#306230',
      textPrimary: '#0f380f',
      textSecondary: '#306230',
    },
  },

  'obsidian-monolith': {
    id: 'obsidian-monolith',
    name: 'Obsidian Monolith',
    subtitle: 'Neo-Noir OLED Cockpit',
    concept: 'Stealth, zero-eye-strain nocturnal cockpit with pure OLED black and whisper-quiet laser edges.',
    typography: {
      display: "'Space Grotesk', system-ui, sans-serif",
      body: "'Inter', system-ui, sans-serif",
      mono: "'JetBrains Mono', monospace",
      accent: "'Inter', sans-serif",
    },
    shapes: {
      radius: '12px',
      radiusSm: '8px',
      radiusLg: '16px',
    },
    linework: {
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#262626',
    },
    depth: {
      shadow: '0 4px 24px rgba(0, 0, 0, 0.9)',
      shadowActive: '0 2px 10px rgba(0, 0, 0, 0.95)',
    },
    surfaces: {
      blur: '4px',
      background: 'rgba(10, 10, 10, 0.92)',
      textureClass: 'texture-obsidian',
    },
    density: {
      padding: 'standard',
      gap: '16px',
    },
    motion: {
      duration: '150ms',
      timing: 'ease-out',
    },
    feedback: {
      transformHover: 'translateY(-1px)',
      transformActive: 'translateY(0)',
    },
    telemetry: {
      style: 'laser-ring',
    },
    palette: {
      bgGradient: 'linear-gradient(180deg, #050505 0%, #0a0a0a 100%)',
      panelBg: '#09090b',
      accentPrimary: '#a855f7',
      accentSecondary: '#c084fc',
      textPrimary: '#f4f4f5',
      textSecondary: '#71717a',
    },
  },

  'zen-botanical': {
    id: 'zen-botanical',
    name: 'Zen Botanical',
    subtitle: 'Wabi-Sabi Meditative Sanctuary',
    concept: 'Organic earthy matcha & stone tones, asymmetric pebble geometry, and water basin telemetry.',
    typography: {
      display: "'Fraunces', 'Merriweather', Georgia, serif",
      body: "'Plus Jakarta Sans', 'Inter', sans-serif",
      mono: "'Space Mono', monospace",
      accent: "'Fraunces', serif",
    },
    shapes: {
      radius: '18px 6px 18px 6px',
      radiusSm: '10px 4px 10px 4px',
      radiusLg: '24px 8px 24px 8px',
    },
    linework: {
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(132, 169, 140, 0.35)',
    },
    depth: {
      shadow: '0 8px 30px rgba(40, 55, 40, 0.1)',
      shadowActive: '0 2px 12px rgba(40, 55, 40, 0.08)',
    },
    surfaces: {
      blur: '8px',
      background: 'rgba(240, 245, 241, 0.85)',
      textureClass: 'texture-zen',
    },
    density: {
      padding: 'spacious',
      gap: '20px',
    },
    motion: {
      duration: '350ms',
      timing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    feedback: {
      transformHover: 'translateY(-2px) scale(1.01)',
      transformActive: 'translateY(0) scale(1)',
    },
    telemetry: {
      style: 'water-ripple',
    },
    palette: {
      bgGradient: 'linear-gradient(135deg, #2d372e 0%, #1e261f 100%)',
      panelBg: 'rgba(45, 55, 46, 0.85)',
      accentPrimary: '#52b788',
      accentSecondary: '#74c69d',
      textPrimary: '#edf2f4',
      textSecondary: '#a3b18a',
    },
  },
};

export const LEGACY_THEME_MAP: Record<string, ThemeWorldId> = {
  glass: 'translucent-cockpit',
  ocean: 'translucent-cockpit',
  midnight: 'obsidian-monolith',
  sunset: 'neo-brutalist',
  forest: 'zen-botanical',
  minimalist: 'obsidian-monolith',
};

export function getThemeWorld(theme: AppTheme | string | undefined | null): ThemeWorldConfig {
  if (theme && theme in THEME_WORLDS) {
    return THEME_WORLDS[theme as ThemeWorldId];
  }
  const mappedId = (theme && LEGACY_THEME_MAP[theme]) || 'translucent-cockpit';
  return THEME_WORLDS[mappedId] || THEME_WORLDS['translucent-cockpit'];
}

export interface TelemetryProgressResult {
  type: 'hud-arc' | 'ascii' | 'segmented' | 'ink-sweep' | 'caliper' | '8bit' | 'laser-ring' | 'water-ripple';
  percent: number;
  rendered?: string;
  segmentsTotal?: number;
  segmentsActive?: number;
}

export function renderThemeTelemetry(progressPercent: number, theme: AppTheme): TelemetryProgressResult {
  const world = getThemeWorld(theme);
  const num = Number(progressPercent);
  const safeProgress = Number.isFinite(num) ? num : 0;
  const clamped = Math.min(100, Math.max(0, Math.round(safeProgress)));

  switch (world.telemetry.style) {
    case 'ascii': {
      const barLength = 14;
      const filled = Math.round((clamped / 100) * barLength);
      const empty = barLength - filled;
      const bar = '█'.repeat(filled) + '░'.repeat(empty);
      return {
        type: 'ascii',
        percent: clamped,
        rendered: `[${bar}] ${clamped}%`,
      };
    }
    case 'segmented': {
      const segmentsTotal = 10;
      const segmentsActive = Math.round((clamped / 100) * segmentsTotal);
      return {
        type: 'segmented',
        percent: clamped,
        segmentsTotal,
        segmentsActive,
      };
    }
    case '8bit': {
      const totalHearts = 5;
      const activeHearts = Math.round((clamped / 100) * totalHearts);
      const hearts = '♥'.repeat(activeHearts) + '♡'.repeat(totalHearts - activeHearts);
      return {
        type: '8bit',
        percent: clamped,
        rendered: `HP: [${hearts}] ${clamped}%`,
      };
    }
    case 'caliper': {
      return {
        type: 'caliper',
        percent: clamped,
        rendered: `CAL-${clamped.toString().padStart(3, '0')}mm`,
      };
    }
    case 'laser-ring': {
      return {
        type: 'laser-ring',
        percent: clamped,
      };
    }
    case 'ink-sweep': {
      return {
        type: 'ink-sweep',
        percent: clamped,
      };
    }
    case 'water-ripple': {
      return {
        type: 'water-ripple',
        percent: clamped,
      };
    }
    case 'hud-arc':
    default: {
      return {
        type: 'hud-arc',
        percent: clamped,
      };
    }
  }
}
