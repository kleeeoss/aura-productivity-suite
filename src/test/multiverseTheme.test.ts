import { describe, it, expect } from 'vitest';
import { 
  THEME_WORLDS, 
  getThemeWorld, 
  renderThemeTelemetry,
  DIMENSION_DEFINITIONS,
  type ThemeWorldId 
} from '../utils/multiverseTheme';
import { useSettingsStore, type AppTheme } from '../store/useSettingsStore';

describe('AURA Multiverse Visual Engine', () => {
  it('defines all 8 canonical theme worlds with full 10-dimension profiles', () => {
    const canonicalIds: ThemeWorldId[] = [
      'translucent-cockpit',
      'cyber-cli',
      'neo-brutalist',
      'editorial-broadsheet',
      'technical-blueprint',
      '8bit-arcade',
      'obsidian-monolith',
      'zen-botanical',
    ];

    expect(Object.keys(THEME_WORLDS).length).toBeGreaterThanOrEqual(8);

    for (const id of canonicalIds) {
      const world = THEME_WORLDS[id];
      expect(world, `Theme world ${id} must exist`).toBeDefined();
      expect(world.id).toBe(id);
      expect(world.name).toBeTruthy();
      expect(world.concept).toBeTruthy();
      
      // Check 10 Dimensions presence
      expect(world.typography.display).toBeTruthy();
      expect(world.typography.body).toBeTruthy();
      expect(world.typography.mono).toBeTruthy();
      expect(world.typography.accent).toBeTruthy();

      expect(world.shapes.radius).toBeDefined();
      expect(world.linework.borderWidth).toBeDefined();
      expect(world.linework.borderStyle).toBeDefined();
      expect(world.depth.shadow).toBeDefined();
      expect(world.surfaces.blur).toBeDefined();
      expect(world.surfaces.background).toBeDefined();
      expect(world.density.padding).toBeDefined();
      expect(world.motion.duration).toBeDefined();
      expect(world.feedback.transformHover).toBeDefined();
      expect(world.telemetry.style).toBeDefined();

      // Check Palette tokens
      expect(world.palette.accentPrimary).toBeTruthy();
      expect(world.palette.accentSecondary).toBeTruthy();
      expect(world.palette.bgGradient).toBeTruthy();
      expect(world.palette.textPrimary).toBeTruthy();
    }
  });

  it('provides complete definitions for the 10 orthogonal dimensions', () => {
    expect(DIMENSION_DEFINITIONS.length).toBe(10);
    const dimensionNames = DIMENSION_DEFINITIONS.map(d => d.name);
    expect(dimensionNames).toContain('Theme World');
    expect(dimensionNames).toContain('Typography System');
    expect(dimensionNames).toContain('Component Shapes');
    expect(dimensionNames).toContain('Borders & Linework');
    expect(dimensionNames).toContain('Shadows & Depth');
    expect(dimensionNames).toContain('Surfaces & Textures');
    expect(dimensionNames).toContain('Spacing & Density');
    expect(dimensionNames).toContain('Motion Dynamics');
    expect(dimensionNames).toContain('Interaction Feedback');
    expect(dimensionNames).toContain('Telemetry & Progress');
  });

  it('resolves legacy themes gracefully through getThemeWorld', () => {
    const legacyThemes: AppTheme[] = ['glass', 'ocean', 'midnight', 'sunset', 'forest', 'minimalist'];
    for (const legacy of legacyThemes) {
      const world = getThemeWorld(legacy);
      expect(world).toBeDefined();
      expect(world.typography.display).toBeTruthy();
      expect(world.shapes.radius).toBeDefined();
      expect(world.palette.accentPrimary).toBeTruthy();
    }
  });

  it('handles unknown, null, and undefined theme names safely', () => {
    const fallbackForNull = getThemeWorld(null as any);
    expect(fallbackForNull.id).toBe('translucent-cockpit');

    const fallbackForUndefined = getThemeWorld(undefined as any);
    expect(fallbackForUndefined.id).toBe('translucent-cockpit');

    const fallbackForUnknown = getThemeWorld('non-existent-theme' as any);
    expect(fallbackForUnknown.id).toBe('translucent-cockpit');
  });

  it('renders ASCII telemetry progress correctly for Cyber-CLI', () => {
    const asciiProgress = renderThemeTelemetry(50, 'cyber-cli');
    expect(asciiProgress.type).toBe('ascii');
    expect(asciiProgress.rendered).toContain('[');
    expect(asciiProgress.rendered).toContain(']');
    expect(asciiProgress.rendered).toContain('50%');
  });

  it('renders segmented block telemetry correctly for Neo-Brutalist', () => {
    const blockProgress = renderThemeTelemetry(75, 'neo-brutalist');
    expect(blockProgress.type).toBe('segmented');
    expect(blockProgress.segmentsTotal).toBe(10);
    expect(blockProgress.segmentsActive).toBe(8); // Math.round(10 * 0.75) = 8
  });

  it('renders 8-bit health/XP telemetry correctly for 8-Bit Arcade', () => {
    const arcadeProgress = renderThemeTelemetry(40, '8bit-arcade');
    expect(arcadeProgress.type).toBe('8bit');
    expect(arcadeProgress.rendered).toContain('HP:');
    expect(arcadeProgress.rendered).toContain('40%');
  });

  it('renders caliper telemetry for Technical Blueprint', () => {
    const caliperProgress = renderThemeTelemetry(62.8, 'technical-blueprint');
    expect(caliperProgress.type).toBe('caliper');
    expect(caliperProgress.percent).toBe(63);
    expect(caliperProgress.rendered).toBe('CAL-063mm');
  });

  it('renders laser ring, ink sweep, and water ripple telemetry styles', () => {
    const laserProgress = renderThemeTelemetry(90, 'obsidian-monolith');
    expect(laserProgress.type).toBe('laser-ring');
    expect(laserProgress.percent).toBe(90);

    const inkProgress = renderThemeTelemetry(33, 'editorial-broadsheet');
    expect(inkProgress.type).toBe('ink-sweep');
    expect(inkProgress.percent).toBe(33);

    const rippleProgress = renderThemeTelemetry(15, 'zen-botanical');
    expect(rippleProgress.type).toBe('water-ripple');
    expect(rippleProgress.percent).toBe(15);
  });

  it('handles telemetry progress boundary values and invalid numbers safely', () => {
    // 0%
    const zeroProgress = renderThemeTelemetry(0, 'cyber-cli');
    expect(zeroProgress.percent).toBe(0);
    expect(zeroProgress.rendered).toContain('0%');

    // 100%
    const hundredProgress = renderThemeTelemetry(100, 'cyber-cli');
    expect(hundredProgress.percent).toBe(100);
    expect(hundredProgress.rendered).toContain('100%');

    // Negative progress clamped to 0
    const negProgress = renderThemeTelemetry(-25, 'neo-brutalist');
    expect(negProgress.percent).toBe(0);
    expect(negProgress.segmentsActive).toBe(0);

    // Overflow progress clamped to 100
    const overProgress = renderThemeTelemetry(150, '8bit-arcade');
    expect(overProgress.percent).toBe(100);
    expect(overProgress.rendered).toContain('100%');

    // NaN handled defensively as 0
    const nanProgress = renderThemeTelemetry(NaN, 'technical-blueprint');
    expect(nanProgress.percent).toBe(0);
    expect(nanProgress.rendered).toBe('CAL-000mm');
  });

  it('synchronizes accentColor to theme world palette when setTheme is called', () => {
    // Setting Cyber-CLI should sync green accent #22c55e
    useSettingsStore.getState().setTheme('cyber-cli');
    expect(useSettingsStore.getState().theme).toBe('cyber-cli');
    expect(useSettingsStore.getState().accentColor).toBe('#22c55e');

    // Setting Neo-Brutalist should sync orange accent #f97316
    useSettingsStore.getState().setTheme('neo-brutalist');
    expect(useSettingsStore.getState().theme).toBe('neo-brutalist');
    expect(useSettingsStore.getState().accentColor).toBe('#f97316');

    // Setting Technical Blueprint should sync cyan accent #38bdf8
    useSettingsStore.getState().setTheme('technical-blueprint');
    expect(useSettingsStore.getState().theme).toBe('technical-blueprint');
    expect(useSettingsStore.getState().accentColor).toBe('#38bdf8');

    // Setting Zen Botanical should sync matcha green accent #52b788
    useSettingsStore.getState().setTheme('zen-botanical');
    expect(useSettingsStore.getState().theme).toBe('zen-botanical');
    expect(useSettingsStore.getState().accentColor).toBe('#52b788');

    // Reset back to translucent-cockpit
    useSettingsStore.getState().setTheme('translucent-cockpit');
    expect(useSettingsStore.getState().theme).toBe('translucent-cockpit');
    expect(useSettingsStore.getState().accentColor).toBe('#6366f1');
  });

  it('supports font setting with theme-default mode', () => {
    useSettingsStore.getState().setFont('theme');
    expect(useSettingsStore.getState().font).toBe('theme');

    useSettingsStore.getState().setFont('monospace');
    expect(useSettingsStore.getState().font).toBe('monospace');

    useSettingsStore.getState().setFont('theme');
    expect(useSettingsStore.getState().font).toBe('theme');
  });
});
