import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore, DEFAULT_DASHBOARD_WIDGETS } from '../store/useSettingsStore';

describe('Dashboard Customization System', () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({
      dashboardWidgets: DEFAULT_DASHBOARD_WIDGETS,
    });
  });

  it('initializes with default dashboard widgets all visible', () => {
    const widgets = useSettingsStore.getState().dashboardWidgets;
    expect(widgets).toHaveLength(7);
    expect(widgets.every((w) => w.visible)).toBe(true);
  });

  it('toggles widget visibility on and off', () => {
    useSettingsStore.getState().toggleWidgetVisibility('weather');
    let weatherWidget = useSettingsStore.getState().dashboardWidgets.find((w) => w.id === 'weather');
    expect(weatherWidget?.visible).toBe(false);

    useSettingsStore.getState().toggleWidgetVisibility('weather');
    weatherWidget = useSettingsStore.getState().dashboardWidgets.find((w) => w.id === 'weather');
    expect(weatherWidget?.visible).toBe(true);
  });

  it('swaps widget order when moving up or down', () => {
    const initialWidgets = [...useSettingsStore.getState().dashboardWidgets].sort((a, b) => a.order - b.order);
    const secondWidgetId = initialWidgets[1].id;

    useSettingsStore.getState().moveWidgetOrder(secondWidgetId, 'up');

    const updatedWidgets = [...useSettingsStore.getState().dashboardWidgets].sort((a, b) => a.order - b.order);
    expect(updatedWidgets[0].id).toBe(secondWidgetId);
    expect(updatedWidgets[0].order).toBe(0);
  });

  it('resets dashboard widgets to default', () => {
    useSettingsStore.getState().toggleWidgetVisibility('clock');
    useSettingsStore.getState().toggleWidgetVisibility('weather');
    useSettingsStore.getState().toggleWidgetVisibility('quote');

    expect(useSettingsStore.getState().dashboardWidgets.filter((w) => w.visible).length).toBe(4);

    useSettingsStore.getState().resetDashboardWidgets();
    expect(useSettingsStore.getState().dashboardWidgets.filter((w) => w.visible).length).toBe(7);
  });

  it('reorders widgets using drag and drop reorderWidgets', () => {
    // Initially: clock(0), weather(1), score(2), habits(3), tasks(4), activity(5), quote(6)
    useSettingsStore.getState().reorderWidgets('tasks', 'clock');

    const updatedWidgets = [...useSettingsStore.getState().dashboardWidgets].sort((a, b) => a.order - b.order);
    expect(updatedWidgets[0].id).toBe('tasks');
    expect(updatedWidgets[0].order).toBe(0);
    expect(updatedWidgets[1].id).toBe('clock');
    expect(updatedWidgets[1].order).toBe(1);

    // Verify all orders are sequential from 0 to 6
    updatedWidgets.forEach((w, idx) => {
      expect(w.order).toBe(idx);
    });
  });

  it('reorders widgets backwards correctly', () => {
    // Move clock (at top) to quote (at bottom)
    useSettingsStore.getState().reorderWidgets('clock', 'quote');

    const updatedWidgets = [...useSettingsStore.getState().dashboardWidgets].sort((a, b) => a.order - b.order);
    expect(updatedWidgets[updatedWidgets.length - 1].id).toBe('clock');
    expect(updatedWidgets[updatedWidgets.length - 1].order).toBe(6);

    // Verify sequential orders
    updatedWidgets.forEach((w, idx) => {
      expect(w.order).toBe(idx);
    });
  });

  it('handles reorderWidgets edge cases safely', () => {
    const beforeWidgets = [...useSettingsStore.getState().dashboardWidgets];
    
    // Non-existent ID
    useSettingsStore.getState().reorderWidgets('non-existent' as any, 'clock');
    expect(useSettingsStore.getState().dashboardWidgets).toEqual(beforeWidgets);

    // Same ID
    useSettingsStore.getState().reorderWidgets('clock', 'clock');
    expect(useSettingsStore.getState().dashboardWidgets).toEqual(beforeWidgets);
  });

  it('correctly reorders visible widgets when intermediate widgets are hidden', () => {
    // Hide weather (originally between clock and score)
    useSettingsStore.getState().toggleWidgetVisibility('weather');

    const visibleBefore = useSettingsStore.getState().dashboardWidgets
      .filter((w) => w.visible)
      .sort((a, b) => a.order - b.order);
    expect(visibleBefore[0].id).toBe('clock');
    expect(visibleBefore[1].id).toBe('score');

    // Simulate clicking Move Up on 'score' targeting the adjacent visible widget 'clock'
    useSettingsStore.getState().reorderWidgets('score', 'clock');

    const visibleAfter = useSettingsStore.getState().dashboardWidgets
      .filter((w) => w.visible)
      .sort((a, b) => a.order - b.order);
    expect(visibleAfter[0].id).toBe('score');
    expect(visibleAfter[1].id).toBe('clock');

    // All orders remain clean sequential integers 0..n-1
    const allWidgets = [...useSettingsStore.getState().dashboardWidgets].sort((a, b) => a.order - b.order);
    allWidgets.forEach((w, idx) => {
      expect(w.order).toBe(idx);
    });
  });

  it('preserves DEFAULT_DASHBOARD_WIDGETS immutability on reset', () => {
    const defaultCopy = JSON.parse(JSON.stringify(DEFAULT_DASHBOARD_WIDGETS));

    useSettingsStore.getState().reorderWidgets('tasks', 'clock');
    useSettingsStore.getState().resetDashboardWidgets();

    expect(DEFAULT_DASHBOARD_WIDGETS).toEqual(defaultCopy);
    expect(useSettingsStore.getState().dashboardWidgets).toEqual(defaultCopy);
  });
});
