import React, { useState } from 'react';
import { useHabitStore, calculateStreak } from '../store/useHabitStore';
import { GlassPanel } from '../components/GlassPanel';
import { Plus, Trash2, Calendar as CalendarIcon, Trophy, Check, TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

import { useToast } from '../contexts/ToastContext';

// Override react-calendar default styles in CSS later if needed

const Habits = () => {
  const { habits, addHabit, deleteHabit, toggleHabitDate } = useHabitStore();
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Generate last 7 days
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    return format(d, 'yyyy-MM-dd');
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
    const color = colors[habits.length % colors.length];
    addHabit(newHabitName, color);
    setNewHabitName('');
    toast('Habit created successfully', 'success');
  };

  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <header>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Habits</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Build consistency and track your daily routines.</p>
      </header>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '12px' }}>
        <input 
          type="text" 
          className="glass-input" 
          placeholder="New Habit (e.g. Drink Water, Read 10 Pages)" 
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
        />
        <button type="submit" className="glass-button primary"><Plus size={20} /> Add</button>
      </form>

      <div style={{ display: 'flex', gap: '24px', flex: 1, overflowY: 'hidden' }}>
        <GlassPanel style={{ flex: 2, overflowY: 'auto', padding: '0', display: 'flex', flexDirection: 'column' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.02)' }}>
                <th style={{ padding: '16px', textAlign: 'left' }}>Habit</th>
                {last7Days.map(date => (
                  <th key={date} style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', width: '60px' }}>
                    {format(new Date(date), 'EEE')} <br/>
                    <span style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>{format(new Date(date), 'd')}</span>
                  </th>
                ))}
                <th style={{ padding: '16px', textAlign: 'center', width: '80px' }}>Streak</th>
                <th style={{ padding: '16px', textAlign: 'center', width: '80px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {habits.map(habit => (
                <tr 
                  key={habit.id} 
                  style={{ 
                    borderBottom: '1px solid var(--glass-border)', 
                    background: selectedHabitId === habit.id ? 'var(--glass-hover)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => setSelectedHabitId(habit.id)}
                >
                  <td style={{ padding: '16px', fontWeight: '500' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: habit.color }}></div>
                      {habit.name}
                    </div>
                  </td>
                  {last7Days.map(date => {
                    const completed = habit.completedDates.includes(date);
                    return (
                      <td key={date} style={{ padding: '16px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button 
                          style={{ 
                            width: '32px', height: '32px', borderRadius: '8px', 
                            background: completed ? habit.color : 'var(--glass-bg)', 
                            border: `1px solid ${completed ? habit.color : 'var(--glass-border)'}`,
                            color: completed ? 'white' : 'transparent',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: completed ? `0 2px 8px ${habit.color}40` : 'none'
                          }}
                          onClick={() => {
                            toggleHabitDate(habit.id, date);
                            if (!completed) toast(`Completed ${habit.name}`, 'success');
                          }}
                        >
                          <Check size={16} strokeWidth={3} />
                        </button>
                      </td>
                    );
                  })}
                  <td style={{ padding: '16px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {calculateStreak(habit.completedDates)} 🔥
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <button className="glass-button" style={{ padding: '8px', color: 'var(--danger)', border: 'none', background: 'transparent' }} onClick={() => { deleteHabit(habit.id); toast('Habit deleted', 'info'); }}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {habits.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No habits created yet. Add one above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </GlassPanel>

        <GlassPanel style={{ flex: 1, minWidth: '350px', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
          {selectedHabit ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: selectedHabit.color }}></div>
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{selectedHabit.name}</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}><TrendingUp size={16} /> Current Streak</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{calculateStreak(selectedHabit.completedDates)} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>days</span></div>
                </div>
                <div style={{ padding: '16px', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}><Trophy size={16} /> Best Streak</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{selectedHabit.bestStreak} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>days</span></div>
                </div>
                <div style={{ padding: '16px', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}><Check size={16} /> Total Completions</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{selectedHabit.completedDates.length} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>times</span></div>
                </div>
                <div style={{ padding: '16px', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>Completion %</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {Math.min(100, Math.round((selectedHabit.completedDates.length / Math.max(1, (new Date().getTime() - new Date(selectedHabit.createdAt).getTime()) / (1000 * 60 * 60 * 24))) * 100))}%
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-secondary)' }}><CalendarIcon size={18} /> History</h3>
                <div style={{ background: 'var(--glass-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <Calendar 
                    className="custom-calendar"
                    tileClassName={({ date, view }) => {
                      if (view === 'month') {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        if (selectedHabit.completedDates.includes(dateStr)) {
                          return 'habit-completed';
                        }
                      }
                      return null;
                    }}
                  />
                  <style>{`
                    .custom-calendar {
                      width: 100%;
                      background: transparent;
                      border: none;
                      font-family: inherit;
                      color: var(--text-primary);
                    }
                    .custom-calendar .react-calendar__navigation button {
                      color: var(--text-primary);
                      min-width: 44px;
                      background: none;
                      border: none;
                      font-size: 1.1rem;
                      font-weight: bold;
                    }
                    .custom-calendar .react-calendar__navigation button:enabled:hover,
                    .custom-calendar .react-calendar__navigation button:enabled:focus {
                      background-color: var(--glass-hover);
                      border-radius: 8px;
                    }
                    .custom-calendar .react-calendar__month-view__weekdays {
                      font-weight: 600;
                      text-transform: uppercase;
                      font-size: 0.75rem;
                      color: var(--text-secondary);
                    }
                    .custom-calendar .react-calendar__month-view__weekdays__weekday abbr {
                      text-decoration: none;
                    }
                    .custom-calendar .react-calendar__tile {
                      padding: 10px 6px;
                      background: none;
                      color: var(--text-primary);
                      border-radius: 8px;
                    }
                    .custom-calendar .react-calendar__tile:enabled:hover,
                    .custom-calendar .react-calendar__tile:enabled:focus {
                      background-color: var(--glass-hover);
                    }
                    .custom-calendar .react-calendar__tile--now {
                      background: rgba(255,255,255,0.1);
                      font-weight: bold;
                    }
                    .custom-calendar .react-calendar__tile--active {
                      background: var(--accent-primary) !important;
                      color: white;
                    }
                    .habit-completed {
                      background: ${selectedHabit.color}40 !important;
                      color: ${selectedHabit.color} !important;
                      font-weight: bold;
                      border: 1px solid ${selectedHabit.color} !important;
                    }
                  `}</style>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>
              <CalendarIcon size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3>Select a Habit</h3>
              <p>Click on any habit from the list to view its detailed history and statistics.</p>
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
};

export default Habits;
