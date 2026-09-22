import React from 'react';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ children, className = '', style, ...rest }) => (
  <div className={`glass-panel ${className}`} style={{ padding: 'var(--panel-padding, 24px)', ...style }} {...rest}>
    {children}
  </div>
);
