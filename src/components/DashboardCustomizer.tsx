import React from 'react';
import { useSettingsStore, type DashboardWidgetId } from '../store/useSettingsStore';
import { GlassPanel } from './GlassPanel';
import { Sliders, Eye, EyeOff, ArrowUp, ArrowDown, RotateCcw, X, Check } from 'lucide-react';

interface DashboardCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DashboardCustomizer: React.FC<DashboardCustomizerProps> = ({ isOpen, onClose }) => {
  const { dashboardWidgets, toggleWidgetVisibility, moveWidgetOrder, resetDashboardWidgets } = useSettingsStore();

  if (!isOpen) return null;

  const sortedWidgets = [...dashboardWidgets].sort((a, b) => a.order - b.order);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: '520px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <GlassPanel style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sliders size={22} color="var(--accent-primary)" />
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Customize Dashboard</h2>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Toggle card visibility or reorder sections to create your personal flow workspace.
          </p>

          {/* Widget List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
            {sortedWidgets.map((widget, index) => (
              <div
                key={widget.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: widget.visible ? 'var(--glass-bg)' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  opacity: widget.visible ? 1 : 0.5,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => toggleWidgetVisibility(widget.id as DashboardWidgetId)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: widget.visible ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={widget.visible ? 'Hide widget' : 'Show widget'}
                  >
                    {widget.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{widget.label}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => moveWidgetOrder(widget.id as DashboardWidgetId, 'up')}
                    disabled={index === 0}
                    className="glass-button"
                    style={{ padding: '6px', opacity: index === 0 ? 0.3 : 1 }}
                    title="Move Up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => moveWidgetOrder(widget.id as DashboardWidgetId, 'down')}
                    disabled={index === sortedWidgets.length - 1}
                    className="glass-button"
                    style={{ padding: '6px', opacity: index === sortedWidgets.length - 1 ? 0.3 : 1 }}
                    title="Move Down"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
            <button
              onClick={resetDashboardWidgets}
              className="glass-button"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <RotateCcw size={14} /> Reset to Default
            </button>
            <button
              onClick={onClose}
              className="glass-button primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', fontSize: '0.9rem' }}
            >
              <Check size={16} /> Done
            </button>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};
