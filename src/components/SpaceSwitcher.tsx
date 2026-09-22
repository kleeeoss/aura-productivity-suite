import React from 'react';
import { useSettingsStore, type FocusSpace } from '../store/useSettingsStore';
import { Code2, GraduationCap, PenTool, Sparkles } from 'lucide-react';

const getSpaceIcon = (icon: FocusSpace['icon'], size = 16) => {
  switch (icon) {
    case 'code':
      return <Code2 size={size} />;
    case 'study':
      return <GraduationCap size={size} />;
    case 'write':
      return <PenTool size={size} />;
    default:
      return <Sparkles size={size} />;
  }
};

export const SpaceSwitcher: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { focusSpaces, activeSpaceId, setActiveSpace } = useSettingsStore();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px',
        background: 'var(--glass-bg)',
        borderRadius: '16px',
        border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(12px)',
        overflowX: 'auto',
        maxWidth: '100%',
      }}
    >
      {focusSpaces.map((space, index) => {
        const isActive = space.id === activeSpaceId;
        const shortcutNumber = index < 3 ? index + 1 : null;

        return (
          <button
            key={space.id}
            onClick={() => setActiveSpace(space.id)}
            title={`${space.name}: ${space.description}${shortcutNumber ? ` (Ctrl+${shortcutNumber})` : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: compact ? '4px 10px' : '6px 14px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              background: isActive ? 'var(--accent-primary)' : 'transparent',
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: isActive ? 600 : 500,
              fontSize: compact ? '0.8rem' : '0.85rem',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              whiteSpace: 'nowrap',
            }}
          >
            {getSpaceIcon(space.icon, compact ? 14 : 16)}
            <span>{space.name}</span>
            {shortcutNumber && !compact && (
              <span
                style={{
                  fontSize: '0.7rem',
                  opacity: isActive ? 0.9 : 0.5,
                  padding: '1px 4px',
                  borderRadius: '4px',
                  background: 'rgba(0,0,0,0.2)',
                  fontFamily: 'monospace',
                }}
              >
                ^{shortcutNumber}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
