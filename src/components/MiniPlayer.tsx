import React, { useState } from 'react';
import { useFocusStore } from '../store/useFocusStore';
import { useAppStore } from '../store/useAppStore';
import { GlassPanel } from './GlassPanel';
import { Play, Pause, Volume2, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioEngine } from '../utils/audioEngine';

const tracks = [
  { id: 'lofi', label: '🎵 Lo-fi', synthetic: false },
  { id: 'rain', label: '🌧 Rain', synthetic: true },
  { id: 'coffee', label: '☕ Coffee', synthetic: true },
  { id: 'fireplace', label: '🔥 Fire', synthetic: true },
  { id: 'ocean', label: '🌊 Ocean', synthetic: true },
  { id: 'wind', label: '🌬 Wind', synthetic: true },
  { id: 'keyboard', label: '⌨ Keys', synthetic: true },
];

const noises = [
  { id: 'white', label: 'White' },
  { id: 'brown', label: 'Brown' },
  { id: 'pink', label: 'Pink' },
];

export const MiniPlayer = () => {
  const { isActive, timeLeft, setIsActive, volumes, setVolume } = useFocusStore();
  const { activeTab: appActiveTab, setActiveTab } = useAppStore();
  const [showSounds, setShowSounds] = useState(false);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const shouldShow = appActiveTab !== 'focus' && isActive;

  const handleVolumeChange = (id: string, val: number, isNoise = false) => {
    audioEngine.resume();
    setVolume(id, val);
    const track = tracks.find(t => t.id === id);
    if (isNoise) {
      audioEngine.setNoiseVolume(id, val);
    } else if (track?.synthetic) {
      audioEngine.setSyntheticVolume(id, val);
    } else {
      audioEngine.setVolume(id, val);
    }
  };

  const hasActiveSounds = Object.values(volumes).some(v => v > 0);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9900,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '12px'
          }}
        >
          <AnimatePresence>
            {showSounds && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <GlassPanel style={{ padding: '16px', borderRadius: '16px', width: '280px', maxHeight: '400px', overflowY: 'auto' }}>
                  <h4 style={{ marginBottom: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Volume2 size={16} /> Ambient Sounds
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {tracks.map(t => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '0.8rem', width: '80px', color: volumes[t.id] > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{t.label}</span>
                        <input 
                          type="range" 
                          min="0" max="1" step="0.01" 
                          value={volumes[t.id] || 0}
                          onChange={(e) => handleVolumeChange(t.id, parseFloat(e.target.value))}
                          style={{ flex: 1, cursor: 'pointer' }}
                        />
                      </div>
                    ))}
                    <div style={{ height: '1px', background: 'var(--glass-border)', margin: '8px 0' }} />
                    <h4 style={{ marginBottom: '4px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Waves size={16} /> Color Noise
                    </h4>
                    {noises.map(n => (
                      <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '0.8rem', width: '80px', color: volumes[n.id] > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{n.label}</span>
                        <input 
                          type="range" 
                          min="0" max="1" step="0.01" 
                          value={volumes[n.id] || 0}
                          onChange={(e) => handleVolumeChange(n.id, parseFloat(e.target.value), true)}
                          style={{ flex: 1, cursor: 'pointer' }}
                        />
                      </div>
                    ))}
                  </div>
                </GlassPanel>
              </motion.div>
            )}
          </AnimatePresence>

          <GlassPanel style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 24px', borderRadius: '32px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => setActiveTab('focus')}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '1px' }}>
                Focus
              </span>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {timeString}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--glass-border)', paddingLeft: '12px', marginLeft: '4px' }}>
              <button 
                className={`glass-button icon-only ${hasActiveSounds ? 'primary' : ''}`}
                onClick={(e) => { e.stopPropagation(); setShowSounds(!showSounds); }}
                style={{ width: '36px', height: '36px', padding: 0 }}
                title="Ambient Sounds"
              >
                <Volume2 size={16} />
              </button>
              <button 
                className="glass-button icon-only" 
                onClick={(e) => { e.stopPropagation(); setIsActive(!isActive); }}
                style={{ width: '36px', height: '36px', padding: 0 }}
              >
                {isActive ? <Pause size={16} /> : <Play size={16} />}
              </button>
            </div>
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
