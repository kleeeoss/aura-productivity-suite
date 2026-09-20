import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useFocusStore } from '../store/useFocusStore';
import { useTaskStore } from '../store/useTaskStore';
import { useNoteStore } from '../store/useNoteStore';
import { useHabitStore } from '../store/useHabitStore';
import { useJournalStore } from '../store/useJournalStore';
import { Search, Home, CheckSquare, Clock, FileText, BarChart2, Settings, Moon, Play, Pause, Edit3, Target, BookOpen } from 'lucide-react';
import { GlassPanel } from './GlassPanel';

interface Command {
  id: string;
  name: string;
  icon: React.ReactNode;
  action: () => void;
  keywords: string[];
  type?: 'nav' | 'action' | 'task' | 'note';
}

export const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { setActiveTab } = useAppStore();
  const { mode, setMode } = useSettingsStore();
  const { isActive, setIsActive } = useFocusStore();
  const { tasks } = useTaskStore();
  const { notes, setActiveNote } = useNoteStore();
  const { habits } = useHabitStore();
  const { entries } = useJournalStore();

  const baseCommands: Command[] = [
    { id: 'nav-dashboard', name: 'Go to Dashboard', icon: <Home size={18} />, action: () => setActiveTab('dashboard'), keywords: ['home', 'start'], type: 'nav' },
    { id: 'nav-tasks', name: 'Go to Tasks', icon: <CheckSquare size={18} />, action: () => setActiveTab('tasks'), keywords: ['todo', 'kanban'], type: 'nav' },
    { id: 'nav-focus', name: 'Go to Focus', icon: <Clock size={18} />, action: () => setActiveTab('focus'), keywords: ['pomodoro', 'timer', 'music', 'noise'], type: 'nav' },
    { id: 'nav-notes', name: 'Go to Notes', icon: <FileText size={18} />, action: () => setActiveTab('notes'), keywords: ['write', 'markdown'], type: 'nav' },
    { id: 'nav-journal', name: 'Go to Journal', icon: <BookOpen size={18} />, action: () => setActiveTab('journal'), keywords: ['diary', 'intentions', 'reflections', 'mood'], type: 'nav' },
    { id: 'nav-habits', name: 'Go to Habits', icon: <Target size={18} />, action: () => setActiveTab('habits'), keywords: ['tracker', 'streak'], type: 'nav' },
    { id: 'nav-stats', name: 'Go to Statistics', icon: <BarChart2 size={18} />, action: () => setActiveTab('statistics'), keywords: ['graphs', 'analytics', 'heatmap'], type: 'nav' },
    { id: 'nav-settings', name: 'Go to Settings', icon: <Settings size={18} />, action: () => setActiveTab('settings'), keywords: ['preferences', 'theme', 'dark mode'], type: 'nav' },
    { id: 'toggle-mode', name: 'Toggle Dark/Light Mode', icon: <Moon size={18} />, action: () => setMode(mode === 'dark' ? 'light' : 'dark'), keywords: ['dark', 'light', 'theme', 'color'], type: 'action' },
    { id: 'toggle-timer', name: isActive ? 'Pause Focus Timer' : 'Start Focus Timer', icon: isActive ? <Pause size={18} /> : <Play size={18} />, action: () => setIsActive(!isActive), keywords: ['pomodoro', 'start', 'stop', 'pause', 'play'], type: 'action' },
    { id: 'quick-task', name: 'Create New Task', icon: <CheckSquare size={18} />, action: () => setActiveTab('tasks'), keywords: ['new task', 'create', 'add'], type: 'action' },
    { id: 'quick-note', name: 'Create New Note', icon: <FileText size={18} />, action: () => setActiveTab('notes'), keywords: ['new note', 'create', 'add'], type: 'action' },
  ];

  const taskCommands: Command[] = tasks.map(task => ({
    id: `task-${task.id}`,
    name: `Task: ${task.title}`,
    icon: <CheckSquare size={18} />,
    action: () => setActiveTab('tasks'),
    keywords: [task.title, task.description || '', 'task', 'todo', task.status],
    type: 'task'
  }));

  const noteCommands: Command[] = notes.map(note => ({
    id: `note-${note.id}`,
    name: `Note: ${note.title}`,
    icon: <Edit3 size={18} />,
    action: () => {
      setActiveTab('notes');
      setActiveNote(note.id);
    },
    keywords: [note.title, note.content || '', 'note', 'document', ...(note.tags || [])],
    type: 'note'
  }));

  const habitCommands: Command[] = habits.map(habit => ({
    id: `habit-${habit.id}`,
    name: `Habit: ${habit.name}`,
    icon: <Target size={18} />,
    action: () => setActiveTab('habits'),
    keywords: [habit.name, 'habit', 'streak'],
    type: 'action'
  }));

  const journalCommands: Command[] = Object.values(entries).map(entry => ({
    id: `journal-${entry.id}`,
    name: `Journal: ${entry.date}`,
    icon: <BookOpen size={18} />,
    action: () => setActiveTab('journal'),
    keywords: [entry.date, entry.morningIntentions || '', entry.eveningReflections || '', entry.mood || ''],
    type: 'nav'
  }));

  const allCommands = [...baseCommands, ...taskCommands, ...noteCommands, ...habitCommands, ...journalCommands];

  const filteredCommands = allCommands.filter(cmd => 
    cmd.name.toLowerCase().includes(query.toLowerCase()) || 
    cmd.keywords.some(kw => kw.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 15); // Limit to 15 results

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleExecute = (cmd: Command) => {
    cmd.action();
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleExecute(filteredCommands[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '10vh',
      zIndex: 9999
    }} onClick={() => setIsOpen(false)}>
      
      <GlassPanel 
        style={{ width: '100%', maxWidth: '600px', padding: 0, overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--glass-border)' }}>
          <Search size={20} style={{ color: 'var(--text-secondary)', marginRight: '12px' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, notes, or tasks... (e.g. 'settings', 'timer')"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '1.1rem',
              width: '100%',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px 0' }}>
          {filteredCommands.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No results found.
            </div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <div
                key={cmd.id}
                onClick={() => handleExecute(cmd)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  background: index === selectedIndex ? 'var(--glass-hover)' : 'transparent',
                  color: index === selectedIndex ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'background 0.1s ease'
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {cmd.icon}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.95rem' }}>{cmd.name}</span>
                  {cmd.type && (
                    <span style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase' }}>
                      {cmd.type}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div style={{ padding: '8px 24px', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
          <span><kbd style={{ background: 'var(--glass-hover)', padding: '2px 6px', borderRadius: '4px' }}>↑</kbd> <kbd style={{ background: 'var(--glass-hover)', padding: '2px 6px', borderRadius: '4px' }}>↓</kbd> to navigate</span>
          <span><kbd style={{ background: 'var(--glass-hover)', padding: '2px 6px', borderRadius: '4px' }}>Enter</kbd> to select</span>
        </div>
      </GlassPanel>
    </div>
  );
};

