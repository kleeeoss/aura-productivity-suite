import { useSettingsStore, type AppTheme, type FontStyle } from '../store/useSettingsStore';
import { useAppStore } from '../store/useAppStore';
import { GlassPanel } from '../components/GlassPanel';
import { Settings as SettingsIcon, Palette, Type, Moon, Thermometer, Database, Download, Upload, User, Trash2, Clock, RotateCcw, AlertTriangle } from 'lucide-react';
import React, { useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import { validateBackupData } from '../utils/productivityMath';

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
    a.download = `productivity-backup-${new Date().toISOString().split('T')[0]}.json`;
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

        {/* Appearance Settings */}
        <GlassPanel>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Palette size={24} /> Appearance
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>App Theme</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}><Moon size={16} style={{ display: 'inline', verticalAlign: 'middle' }}/> App Mode</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setMode('light')} className={`glass-button ${mode === 'light' ? 'primary' : ''}`} style={{ flex: 1 }}>Light</button>
                <button onClick={() => setMode('dark')} className={`glass-button ${mode === 'dark' ? 'primary' : ''}`} style={{ flex: 1 }}>Dark</button>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Accent Color</label>
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
