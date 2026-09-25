import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../store/useSettingsStore';
import { useFocusStore } from '../store/useFocusStore';

describe('Focus Spaces System', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset stores to default
    useSettingsStore.setState({
      activeSpaceId: 'deep-code',
      theme: 'glass',
      accentColor: '#3b82f6',
    });
    useFocusStore.setState({
      workDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      isActive: false,
      volumes: { lofi: 0, rain: 0, coffee: 0, fireplace: 0, ocean: 0, wind: 0, keyboard: 0, white: 0, brown: 0, pink: 0 },
    });
  });

  it('contains the 3 default built-in focus spaces', () => {
    const spaces = useSettingsStore.getState().focusSpaces;
    expect(spaces.length).toBeGreaterThanOrEqual(3);
    const ids = spaces.map((s) => s.id);
    expect(ids).toContain('deep-code');
    expect(ids).toContain('study-sprint');
    expect(ids).toContain('flow-writing');
  });

  it('switching to Deep Code preserves active multiverse theme, applies 50m timer, and brown noise', () => {
    useSettingsStore.setState({ theme: 'cyber-cli', accentColor: '#00ff66' });
    useSettingsStore.getState().setActiveSpace('deep-code');

    const settings = useSettingsStore.getState();
    const focus = useFocusStore.getState();

    expect(settings.activeSpaceId).toBe('deep-code');
    // Multiverse theme must be preserved and not overwritten to legacy theme
    expect(settings.theme).toBe('cyber-cli');
    expect(settings.accentColor).toBe('#00ff66');

    expect(focus.workDuration).toBe(50);
    expect(focus.breakDuration).toBe(10);
    expect(focus.currentCategory).toBe('Coding');
    expect(focus.volumes.brown).toBe(45);
  });

  it('switching to Study Sprint preserves active multiverse theme, applies 25m timer, and white noise', () => {
    useSettingsStore.setState({ theme: 'translucent-cockpit', accentColor: '#38bdf8' });
    useSettingsStore.getState().setActiveSpace('study-sprint');

    const settings = useSettingsStore.getState();
    const focus = useFocusStore.getState();

    expect(settings.activeSpaceId).toBe('study-sprint');
    // Multiverse theme must be preserved
    expect(settings.theme).toBe('translucent-cockpit');
    expect(settings.accentColor).toBe('#38bdf8');

    expect(focus.workDuration).toBe(25);
    expect(focus.breakDuration).toBe(5);
    expect(focus.currentCategory).toBe('Studying');
    expect(focus.volumes.white).toBe(25);
  });

  it('switching to Flow / Writing preserves active multiverse theme, applies 45m timer, and pink noise', () => {
    useSettingsStore.setState({ theme: 'neo-brutalist', accentColor: '#ff2e93' });
    useSettingsStore.getState().setActiveSpace('flow-writing');

    const settings = useSettingsStore.getState();
    const focus = useFocusStore.getState();

    expect(settings.activeSpaceId).toBe('flow-writing');
    expect(settings.theme).toBe('neo-brutalist');
    expect(settings.accentColor).toBe('#ff2e93');

    expect(focus.workDuration).toBe(45);
    expect(focus.breakDuration).toBe(10);
    expect(focus.currentCategory).toBe('Writing');
    expect(focus.volumes.pink).toBe(35);
  });

  it('allows creating a custom focus space', () => {
    useSettingsStore.getState().createCustomSpace({
      name: 'Late Night Hack',
      icon: 'sparkles',
      description: 'Zero distractions late night coding sprint',
      workDuration: 90,
      breakDuration: 20,
      longBreakDuration: 30,
      theme: 'midnight',
      accentColor: '#8b5cf6',
      noises: { white: 0, brown: 60, pink: 0 },
      category: 'Hacking',
    });

    const spaces = useSettingsStore.getState().focusSpaces;
    const custom = spaces.find((s) => s.name === 'Late Night Hack');
    expect(custom).toBeDefined();
    expect(custom?.workDuration).toBe(90);
    expect(custom?.isBuiltIn).toBe(false);

    // Can activate custom space while preserving active theme
    useSettingsStore.setState({ theme: '8bit-arcade', accentColor: '#ec4899' });
    useSettingsStore.getState().setActiveSpace(custom!.id);
    expect(useSettingsStore.getState().activeSpaceId).toBe(custom!.id);
    expect(useSettingsStore.getState().theme).toBe('8bit-arcade');
    expect(useSettingsStore.getState().accentColor).toBe('#ec4899');
    expect(useFocusStore.getState().workDuration).toBe(90);
  });

  it('prevents deleting built-in focus spaces', () => {
    useSettingsStore.getState().deleteCustomSpace('deep-code');
    const spaces = useSettingsStore.getState().focusSpaces;
    expect(spaces.some((s) => s.id === 'deep-code')).toBe(true);
  });
});
