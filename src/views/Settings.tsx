import { useSettingsStore, type AppTheme, type FontStyle } from '../store/useSettingsStore';
import { useAppStore } from '../store/useAppStore';
import { GlassPanel } from '../components/GlassPanel';
import { Settings as SettingsIcon, Type, Moon, Thermometer, Database, Download, Upload, User, Trash2, Clock, RotateCcw, AlertTriangle, Layers, Sparkles } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { validateBackupData } from '../utils/productivityMath';
import { THEME_WORLDS, getThemeWorld, renderThemeTelemetry, type ThemeWorldId } from '../utils/multiverseTheme';
import { toLocalDateString } from '../utils/date';

const Settings = () => {
  const { 
    theme, mode, font, tempUnit, accentColor, disableAnimations, reduceMotion,
    defaultPomodoroLength, defaultShortBreakLength, defaultLongBreakLength,
    setTheme, setMode, setFont, setTempUnit, setAccentColor, 
    setDisableAnimations, setReduceMotion, setDefaultPomodoroLength, 
    setDefaultShortBreakLength, setDefaultLongBreakLength, uiScale, setUiScale
  } = useSettingsStore();
  const { userName, avatar, setUserName, setAvatar } = useAppStore();
  const { toast } = useToast();
  
  const [previewProgress, setPreviewProgress] = useState(65);
  const activeWorld = getThemeWorld(theme);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast('Image must be less than 1MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatar(event.target?.result as string);
      toast('Avatar updated', 'success');
    };
    reader.readAsDataURL(file);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const themes: { value: AppTheme; label: string }[] = [
    { value: 'glass', label: 'Glass (Default)' },
    { value: 'ocean', label: 'Ocean' },
    { value: 'midnight', label: 'Midnight' },
    { value: 'sunset', label: 'Sunset' },
    { value: 'forest', label: 'Forest' },
    { value: 'minimalist', label: 'Minimalist' },
  ];

  const fonts: { value: FontStyle; label: string }[] = [
    { value: 'theme', label: 'Theme Default (Multiverse)' },
    { value: 'inter', label: 'Inter (Sans-serif)' },
    { value: 'roboto', label: 'Roboto' },
    { value: 'monospace', label: 'Fira Code (Monospace)' },
    { value: 'serif', label: 'Merriweather (Serif)' },
  ];

  const handleExport = () => {
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('-storage') || key === 'app-settings')) {
        data[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productivity-backup-${toLocalDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawJson = JSON.parse(event.target?.result as string);
        const validation = validateBackupData(rawJson);

        if (!validation.valid || !validation.sanitizedData) {
          alert(`Backup validation failed: ${validation.error || 'Invalid format'}`);
          return;
        }

        for (const [key, value] of Object.entries(validation.sanitizedData)) {
          localStorage.setItem(key, value);
        }
        alert('Data imported successfully! The application will now reload to apply changes.');
        window.location.reload();
      } catch {
        alert('Failed to parse backup file. Please ensure it is a valid JSON backup.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This will permanently delete your tasks, habits, notes, and journal entries. Settings will remain intact.')) {
      localStorage.removeItem('task-storage');
      localStorage.removeItem('habit-storage');
      localStorage.removeItem('note-storage');
      localStorage.removeItem('journal-storage-v2');
      localStorage.removeItem('journal-storage');
      localStorage.removeItem('focus-storage-v2');
      localStorage.removeItem('focus-storage');
      localStorage.removeItem('activity-storage');
      toast('All user data cleared', 'success');
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleResetApp = () => {
    if (confirm('Are you sure you want to factory reset the app? This deletes everything, including settings.')) {
      localStorage.clear();
      toast('Application reset', 'success');
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', maxWidth: '800px', margin: '0 auto', paddingBottom: '32px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <SettingsIcon size={32} />
        <h1 style={{ fontSize: '2.5rem' }}>Settings</h1>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Profile Settings */}
        <GlassPanel>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <User size={24} /> Profile
          </h2>
          
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '40px', 
              background: avatar ? `url(${avatar}) center/cover` : 'var(--accent-gradient)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: '2rem', fontWeight: 'bold', color: '#fff', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
            }}>
              {!avatar && userName.charAt(0).toUpperCase()}
            </div>
            
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Display Name</label>
              <input 
                type="text" 
                className="glass-input" 
                value={userName} 
                onChange={(e) => setUserName(e.target.value)}
                maxLength={30}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
              <button className="glass-button" onClick={() => avatarInputRef.current?.click()}>
                <Upload size={16} /> Upload Avatar
              </button>
              {avatar && (
                <button className="glass-button" style={{ color: 'var(--danger)' }} onClick={() => setAvatar(null)}>
                  <Trash2 size={16} /> Remove
                </button>
              )}
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                ref={avatarInputRef}
                onChange={handleAvatarUpload}
              />
            </div>
          </div>
        </GlassPanel>

        {/* AURA Multiverse Visual Engine */}
        <GlassPanel>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Layers size={24} /> Multiverse Visual Engine
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
              10 Orthogonal Dimensions Active
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
            Every theme is a cohesive architectural world structured across 10 design dimensions — typography hierarchy, silhouette geometry, tactile shadows, surfaces, and telemetry.
          </p>

          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
            Canonical Theme Worlds
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {(Object.keys(THEME_WORLDS) as ThemeWorldId[]).map((id) => {
              const world = THEME_WORLDS[id];
              const isSelected = theme === id;
              return (
                <div
                  key={id}
                  onClick={() => setTheme(id)}
                  style={{
                    padding: '14px',
                    borderRadius: world.shapes.radiusSm,
                    border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    background: isSelected ? 'var(--glass-hover)' : 'var(--glass-bg)',
                    boxShadow: isSelected ? 'var(--glass-shadow)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{world.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{world.subtitle}</div>
                    </div>
                    {isSelected && (
                      <span style={{ fontSize: '0.7rem', background: 'var(--accent-primary)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                    {world.concept}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 10-Dimension Live Inspector Specimen */}
          <div style={{ background: 'var(--glass-bg)', borderRadius: 'var(--shape-radius-sm)', border: '1px solid var(--border-color)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="var(--accent-primary)" /> 10-Dimension Visual Matrix Specimen
              </h3>
              <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                World: <strong>{activeWorld.name}</strong>
              </span>
            </div>

            {/* Typography Specimen */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '6px' }}>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>1. Display Font</span>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 'bold' }}>AURA Cockpit</div>
              </div>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>2. Body Font</span>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>Flow-state focus suite</div>
              </div>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>3. Data / Mono</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-primary)' }}>25:00 ┼ 100%</div>
              </div>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>4. Accent Kicker</span>
                <div style={{ fontFamily: 'var(--font-accent)', fontSize: '0.8rem', textTransform: 'uppercase' }}>TURBO FOCUS</div>
              </div>
            </div>

            {/* Silhouette & Tactile Specimen */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Radius: <code>{activeWorld.shapes.radius}</code> | Linework: <code>{activeWorld.linework.borderWidth} {activeWorld.linework.borderStyle}</code> | Blur: <code>{activeWorld.surfaces.blur}</code>
              </div>
              <button className="glass-button primary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                Tactile Specimen Button
              </button>
            </div>

            {/* Live Telemetry Progress Specimen */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                <span>Dimension 10: Telemetry Progress ({activeWorld.telemetry.style})</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{previewProgress}%</span>
              </div>
              
              <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.15)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(() => {
                  const sampleTelemetry = renderThemeTelemetry(previewProgress, theme);
                  if (sampleTelemetry.type === 'ascii') {
                    return <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontSize: '1.1rem' }}>{sampleTelemetry.rendered}</div>;
                  }
                  if (sampleTelemetry.type === 'segmented') {
                    return (
                      <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              height: '10px',
                              background: i < (sampleTelemetry.segmentsActive || 0) ? 'var(--accent-primary)' : 'rgba(0,0,0,0.2)',
                              border: '2px solid var(--border-color)',
                            }}
                          />
                        ))}
                      </div>
                    );
                  }
                  if (sampleTelemetry.type === '8bit') {
                    return <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontSize: '0.9rem' }}>{sampleTelemetry.rendered}</div>;
                  }
                  if (sampleTelemetry.type === 'caliper') {
                    return (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
                          <span>├ CAL-000</span>
                          <span>{sampleTelemetry.rendered}</span>
                          <span>CAL-100 ┤</span>
                        </div>
                        <div style={{ height: '4px', width: '100%', background: 'rgba(2,132,199,0.2)' }}>
                          <div style={{ height: '100%', width: `${sampleTelemetry.percent}%`, background: 'var(--accent-primary)' }} />
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${sampleTelemetry.percent}%`, background: 'var(--accent-gradient, var(--accent-primary))', borderRadius: '999px' }} />
                    </div>
                  );
                })()}
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={previewProgress}
                onChange={(e) => setPreviewProgress(Number(e.target.value))}
                style={{ width: '100%', marginTop: '8px' }}
              />
            </div>
          </div>

          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Legacy Color Palettes</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`glass-button ${theme === t.value ? 'primary' : ''}`}
                style={{ flex: '1 1 calc(33% - 8px)', justifyContent: 'center' }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}><Moon size={16} style={{ display: 'inline', verticalAlign: 'middle' }}/> App Mode</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setMode('light')} className={`glass-button ${mode === 'light' ? 'primary' : ''}`} style={{ flex: 1 }}>Light</button>
                <button onClick={() => setMode('dark')} className={`glass-button ${mode === 'dark' ? 'primary' : ''}`} style={{ flex: 1 }}>Dark</button>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ margin: 0, color: 'var(--text-secondary)' }}>Accent Color</label>
                {accentColor !== activeWorld.palette.accentPrimary && (
                  <button
                    onClick={() => setAccentColor(activeWorld.palette.accentPrimary)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Reset to {activeWorld.name} Accent
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#10b981', '#14b8a6'].map(color => (
                  <button 
                    key={color} 
                    onClick={() => setAccentColor(color)}
                    style={{ 
                      width: '32px', height: '32px', borderRadius: '16px', background: color, border: 'none', cursor: 'pointer',
                      boxShadow: accentColor === color ? `0 0 0 2px var(--bg-primary), 0 0 0 4px ${color}` : 'none'
                    }} 
                  />
                ))}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '24px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={disableAnimations} onChange={(e) => setDisableAnimations(e.target.checked)} />
                Disable Animations
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={reduceMotion} onChange={(e) => setReduceMotion(e.target.checked)} />
                Reduce Motion
              </label>
            </div>
            
            <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                <span>UI Scaling</span>
                <span>{uiScale}%</span>
              </label>
              <input 
                type="range" 
                min="80" 
                max="150" 
                step="5" 
                value={uiScale} 
                onChange={(e) => setUiScale(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                <span>Smaller</span>
                <span>Default</span>
                <span>Larger</span>
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* Focus Settings */}
        <GlassPanel>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Clock size={24} /> Focus Defaults
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Pomodoro (min)</label>
              <input type="number" className="glass-input" value={defaultPomodoroLength} onChange={(e) => setDefaultPomodoroLength(parseInt(e.target.value) || 25)} min="1" max="120" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Short Break (min)</label>
              <input type="number" className="glass-input" value={defaultShortBreakLength} onChange={(e) => setDefaultShortBreakLength(parseInt(e.target.value) || 5)} min="1" max="30" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Long Break (min)</label>
              <input type="number" className="glass-input" value={defaultLongBreakLength} onChange={(e) => setDefaultLongBreakLength(parseInt(e.target.value) || 15)} min="1" max="60" />
            </div>
          </div>
        </GlassPanel>

        {/* Typography Settings */}
        <GlassPanel>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Type size={24} /> Typography
          </h2>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Font Style</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {fonts.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFont(f.value)}
                  className={`glass-button ${font === f.value ? 'primary' : ''}`}
                  style={{ flex: '1 1 calc(50% - 8px)' }}
                >
                  <span style={{ fontFamily: `var(--font-family)`, fontSize: '1.1rem' }}>{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        </GlassPanel>

        {/* Region Settings */}
        <GlassPanel>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Thermometer size={24} /> Region & Units
          </h2>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Temperature Unit</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setTempUnit('celsius')} className={`glass-button ${tempUnit === 'celsius' ? 'primary' : ''}`} style={{ flex: 1 }}>Celsius (°C)</button>
              <button onClick={() => setTempUnit('fahrenheit')} className={`glass-button ${tempUnit === 'fahrenheit' ? 'primary' : ''}`} style={{ flex: 1 }}>Fahrenheit (°F)</button>
            </div>
          </div>
        </GlassPanel>

        {/* Data & Backup */}
        <GlassPanel>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Database size={24} /> Data & Backup
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Your data is stored locally in your browser. Export it to keep it safe or move it to another device.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button className="glass-button primary" onClick={handleExport}>
              <Download size={18} /> Export Data (.json)
            </button>
            <button className="glass-button" onClick={() => fileInputRef.current?.click()}>
              <Upload size={18} /> Import Data
            </button>
            <button className="glass-button" style={{ color: 'var(--warning)' }} onClick={handleClearData}>
              <RotateCcw size={18} /> Clear Data
            </button>
            <button className="glass-button" style={{ color: 'var(--danger)' }} onClick={handleResetApp}>
              <AlertTriangle size={18} /> Reset App
            </button>
            <input 
              type="file" 
              accept=".json" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleImport}
            />
          </div>
        </GlassPanel>

      </div>
    </div>
  );
};

export default Settings;
