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

  it('switching to Deep Code applies midnight theme, 50m timer, and brown noise', () => {
    useSettingsStore.getState().setActiveSpace('deep-code');

    const settings = useSettingsStore.getState();
    const focus = useFocusStore.getState();

    expect(settings.activeSpaceId).toBe('deep-code');
    expect(settings.theme).toBe('midnight');
    expect(settings.accentColor).toBe('#6366f1');

    expect(focus.workDuration).toBe(50);
    expect(focus.breakDuration).toBe(10);
    expect(focus.currentCategory).toBe('Coding');
    expect(focus.volumes.brown).toBe(45);
  });

  it('switching to Study Sprint applies forest theme, 25m timer, and white noise', () => {
    useSettingsStore.getState().setActiveSpace('study-sprint');

    const settings = useSettingsStore.getState();
    const focus = useFocusStore.getState();

    expect(settings.activeSpaceId).toBe('study-sprint');
    expect(settings.theme).toBe('forest');
    expect(settings.accentColor).toBe('#10b981');

    expect(focus.workDuration).toBe(25);
    expect(focus.breakDuration).toBe(5);
    expect(focus.currentCategory).toBe('Studying');
    expect(focus.volumes.white).toBe(25);
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

    // Can activate custom space
    useSettingsStore.getState().setActiveSpace(custom!.id);
    expect(useSettingsStore.getState().activeSpaceId).toBe(custom!.id);
    expect(useFocusStore.getState().workDuration).toBe(90);
  });

  it('prevents deleting built-in focus spaces', () => {
    useSettingsStore.getState().deleteCustomSpace('deep-code');
    const spaces = useSettingsStore.getState().focusSpaces;
    expect(spaces.some((s) => s.id === 'deep-code')).toBe(true);
  });
});
