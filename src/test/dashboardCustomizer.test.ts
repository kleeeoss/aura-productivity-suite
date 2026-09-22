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
});
