import { useEffect } from 'react';
import { GlassPanel } from '../components/GlassPanel';
import { useFocusStore } from '../store/useFocusStore';
import { useAppStore } from '../store/useAppStore';
import { Play, Pause, SkipForward, Maximize, Minimize, Waves } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { AudioVisualizer } from '../components/AudioVisualizer';
import EmbeddedMediaPlayer from '../components/EmbeddedMediaPlayer';
import { format } from 'date-fns';

const noises = [
  { id: 'white', label: 'White Noise' },
  { id: 'brown', label: 'Brown Noise' },
  { id: 'pink', label: 'Pink Noise' },
] as const;

const Focus = () => {
  const { 
    timeLeft, 
    isActive, 
    setIsActive, 
    setTimeLeft, 
    mode, 
    volumes,
    setVolume,
    pomodorosCompletedToday,
    currentCategory,
    setCurrentCategory,
    sessionHistory
  } = useFocusStore();
  
  const { isFocusModeActive, setFocusMode } = useAppStore();

  useEffect(() => {
    audioEngine.init();

    noises.forEach(noise => {
      audioEngine.registerNoise(noise.id);
      audioEngine.setNoiseVolume(noise.id, volumes[noise.id] || 0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    noises.forEach(noise => {
      audioEngine.setNoiseVolume(noise.id, volumes[noise.id] || 0);
    });
  }, [volumes]);

  const toggleTimer = () => {
    audioEngine.resume();
    setIsActive(!isActive);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (id: string, val: number) => {
    audioEngine.resume();
    setVolume(id, val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', gap: '24px' }}>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Timer Block */}
        <GlassPanel style={{ flex: 1, minWidth: '350px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', textTransform: 'capitalize', margin: 0 }}>
              {mode.replace(/([A-Z])/g, ' $1').trim()}
            </h2>
            <select 
              className="glass-input" 
              style={{ padding: '4px 8px', width: 'auto', fontSize: '0.9rem' }}
              value={currentCategory}
              onChange={(e) => setCurrentCategory(e.target.value)}
            >
              <option value="Deep Work">Deep Work</option>
              <option value="Coding">Coding</option>
              <option value="Reading">Reading</option>
              <option value="Writing">Writing</option>
              <option value="Studying">Studying</option>
            </select>
          </div>
          <div style={{ fontSize: '5rem', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '-2px', marginBottom: '24px' }}>
            {formatTime(timeLeft)}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
            <button className="glass-button primary" style={{ borderRadius: '50%', padding: '16px' }} onClick={toggleTimer}>
              {isActive ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '4px' }} />}
            </button>
            <button className="glass-button" style={{ borderRadius: '50%', padding: '16px' }} onClick={() => setTimeLeft(0)}>
              <SkipForward size={24} />
            </button>
          </div>

          <div style={{ width: '100%' }}>
            <AudioVisualizer />
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span>Pomodoros: <strong style={{ color: 'var(--text-primary)' }}>{pomodorosCompletedToday}</strong></span>
              <span>Streak: <strong style={{ color: 'var(--text-primary)' }}>{useFocusStore.getState().currentStreak || 0}</strong></span>
            </div>
            <button className="glass-button" style={{ padding: '6px 12px', zIndex: 50 }} onClick={() => setFocusMode(!isFocusModeActive)}>
              {isFocusModeActive ? <Minimize size={16} /> : <Maximize size={16} />}
              {isFocusModeActive ? 'Exit Focus' : 'Enter Focus'}
            </button>
          </div>
        </GlassPanel>

        {/* Media Player Block */}
        <EmbeddedMediaPlayer />
      </div>

      {/* Noise Block */}
      <GlassPanel className="focus-mixer">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}><Waves size={20} /> Noise Generators</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          {noises.map(noise => (
            <div key={noise.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>{noise.label}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{volumes[noise.id] || 0}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={volumes[noise.id] || 0} 
                onChange={(e) => handleVolumeChange(noise.id, Number(e.target.value))} 
                style={{ width: '100%' }} 
              />
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Session History */}
      {!isFocusModeActive && (
        <GlassPanel className="focus-mixer" style={{ marginTop: '0' }}>
          <h3 style={{ marginBottom: '16px' }}>Today's Sessions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
            {sessionHistory.filter(s => s.timestamp.startsWith(format(new Date(), 'yyyy-MM-dd'))).length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No sessions completed today yet.</p>
            ) : (
              sessionHistory
                .filter(s => s.timestamp.startsWith(format(new Date(), 'yyyy-MM-dd')))
                .map((session) => (
                  <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: '500' }}>{session.category}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{session.duration} min</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {format(new Date(session.timestamp), 'h:mm a')}
                    </span>
                  </div>
                ))
            )}
          </div>
        </GlassPanel>
      )}

    </div>
  );
};

export default Focus;
