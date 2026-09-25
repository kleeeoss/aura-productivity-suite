import { useState, useEffect } from 'react';
import { useJournalStore } from '../store/useJournalStore';
import type { JournalEntry } from '../store/useJournalStore';
import { GlassPanel } from '../components/GlassPanel';
import { BookOpen, Sunrise, Sunset, ChevronLeft, ChevronRight, Smile, Frown, Meh, Heart, Coffee, Target, Zap, Moon, Trophy, AlertTriangle, Lightbulb, ListTodo } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { toLocalDateString } from '../utils/date';

const Journal = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateString = toLocalDateString(currentDate);
  const { toast } = useToast();
  
  const { getEntryForDate, saveEntry } = useJournalStore();
  const [entry, setEntry] = useState<JournalEntry>({
    id: crypto.randomUUID(),
    date: dateString,
    morningIntentions: '',
    goals: '',
    gratitude: '',
    mood: null,
    energyLevel: null,
    sleepHours: null,
    stressLevel: null,
    eveningReflections: '',
    wins: '',
    challenges: '',
    lessonsLearned: '',
    tomorrowPriorities: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  useEffect(() => {
    const existing = getEntryForDate(dateString);
    if (existing) {
      setEntry(existing);
    } else {
      setEntry({
        id: crypto.randomUUID(),
        date: dateString,
        morningIntentions: '',
        goals: '',
        gratitude: '',
        mood: null,
        energyLevel: null,
        sleepHours: null,
        stressLevel: null,
        eveningReflections: '',
        wins: '',
        challenges: '',
        lessonsLearned: '',
        tomorrowPriorities: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }, [dateString, getEntryForDate]);

  const handleSave = (updated: Partial<JournalEntry>) => {
    const newEntry = { ...entry, ...updated };
    setEntry(newEntry);
    saveEntry(newEntry);
  };

  const navigateDate = (days: number) => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + days);
    setCurrentDate(nextDate);
  };

  const moods = [
    { value: 'great', icon: <Heart size={24} />, color: '#10b981', label: 'Great' },
    { value: 'good', icon: <Smile size={24} />, color: '#3b82f6', label: 'Good' },
    { value: 'okay', icon: <Coffee size={24} />, color: '#f59e0b', label: 'Okay' },
    { value: 'bad', icon: <Meh size={24} />, color: '#f97316', label: 'Bad' },
    { value: 'terrible', icon: <Frown size={24} />, color: '#ef4444', label: 'Terrible' },
  ] as const;

  const isToday = toLocalDateString() === dateString;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto', paddingBottom: '32px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BookOpen size={36} /> Daily Journal
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Reflect on your day, set intentions, and track your mood.</p>
        </div>
        
        <GlassPanel style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 24px' }}>
          <button className="glass-button icon-only" onClick={() => navigateDate(-1)}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '150px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              {currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
            {isToday && <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Today</span>}
          </div>
          <button className="glass-button icon-only" onClick={() => navigateDate(1)} disabled={isToday} style={{ opacity: isToday ? 0.3 : 1 }}>
            <ChevronRight size={20} />
          </button>
        </GlassPanel>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <GlassPanel style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '4px solid #f59e0b' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#f59e0b' }}>
            <Sunrise size={24} /> Morning Prep
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <div>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                 <Moon size={16} /> Sleep (hrs)
               </label>
               <input 
                 type="number"
                 className="glass-input"
                 value={entry.sleepHours || ''}
                 onChange={(e) => handleSave({ sleepHours: parseInt(e.target.value) || null })}
               />
             </div>
             <div>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                 <Zap size={16} /> Energy Level (1-5)
               </label>
               <input 
                 type="number"
                 min="1" max="5"
                 className="glass-input"
                 value={entry.energyLevel || ''}
                 onChange={(e) => handleSave({ energyLevel: parseInt(e.target.value) || null })}
               />
             </div>
             <div>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                 <AlertTriangle size={16} /> Stress Level (1-5)
               </label>
               <input 
                 type="number"
                 min="1" max="5"
                 className="glass-input"
                 value={entry.stressLevel || ''}
                 onChange={(e) => handleSave({ stressLevel: parseInt(e.target.value) || null })}
               />
             </div>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <Target size={16} /> Today's Goals
            </label>
            <textarea
              className="glass-input"
              value={entry.goals}
              onChange={(e) => handleSave({ goals: e.target.value })}
              placeholder="What are the 3 most important things to get done?"
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <Heart size={16} /> Gratitude
            </label>
            <textarea
              className="glass-input"
              value={entry.gratitude}
              onChange={(e) => handleSave({ gratitude: e.target.value })}
              placeholder="I am grateful for..."
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <Sunrise size={16} /> Morning Intentions
            </label>
            <textarea
              className="glass-input"
              value={entry.morningIntentions}
              onChange={(e) => handleSave({ morningIntentions: e.target.value })}
              placeholder="How do you want to show up today?"
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>
        </GlassPanel>

        <GlassPanel style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '4px solid #3b82f6' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#3b82f6' }}>
            <Sunset size={24} /> Evening Review
          </h2>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <Trophy size={16} /> Wins & Successes
            </label>
            <textarea
              className="glass-input"
              value={entry.wins}
              onChange={(e) => handleSave({ wins: e.target.value })}
              placeholder="What went well today?"
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <AlertTriangle size={16} /> Challenges
            </label>
            <textarea
              className="glass-input"
              value={entry.challenges}
              onChange={(e) => handleSave({ challenges: e.target.value })}
              placeholder="What held you back?"
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <Lightbulb size={16} /> Lessons Learned
            </label>
            <textarea
              className="glass-input"
              value={entry.lessonsLearned}
              onChange={(e) => handleSave({ lessonsLearned: e.target.value })}
              placeholder="What did you learn?"
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <ListTodo size={16} /> Tomorrow's Priorities
            </label>
            <textarea
              className="glass-input"
              value={entry.tomorrowPriorities}
              onChange={(e) => handleSave({ tomorrowPriorities: e.target.value })}
              placeholder="What needs to happen tomorrow?"
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>
        </GlassPanel>
      </div>

      <GlassPanel style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <h3>How was your day?</h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {moods.map((m) => {
            const isSelected = entry.mood === m.value;
            return (
              <button
                key={m.value}
                onClick={() => {
                  handleSave({ mood: m.value });
                  toast(`Mood set to ${m.label}`, 'success');
                }}
                style={{
                  background: isSelected ? `${m.color}33` : 'transparent',
                  border: `2px solid ${isSelected ? m.color : 'var(--glass-border)'}`,
                  color: isSelected ? m.color : 'var(--text-secondary)',
                  padding: '16px 24px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '100px'
                }}
              >
                {m.icon}
                <span style={{ fontWeight: isSelected ? 'bold' : 'normal' }}>{m.label}</span>
              </button>
            );
          })}
        </div>
      </GlassPanel>
    </div>
  );
};

export default Journal;
