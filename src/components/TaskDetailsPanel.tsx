import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Tag as TagIcon, AlignLeft, CheckSquare, Plus, Trash2, Palette } from 'lucide-react';
import { useTaskStore, type Task } from '../store/useTaskStore';

interface TaskDetailsPanelProps {
  taskId: string | null;
  onClose: () => void;
}

const TaskDetailsPanel: React.FC<TaskDetailsPanelProps> = ({ taskId, onClose }) => {
  const { tasks, updateTask } = useTaskStore();
  const [newSubtask, setNewSubtask] = useState('');
  
  const task = tasks.find(t => t.id === taskId);

  if (!taskId || !task) return null;

  const handleUpdate = (updates: Partial<Task>) => {
    updateTask(task.id, updates);
  };

  const addSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    const subtasks = [...(task.subtasks || []), { id: crypto.randomUUID(), title: newSubtask, completed: false }];
    handleUpdate({ subtasks });
    setNewSubtask('');
  };

  const toggleSubtask = (id: string) => {
    const subtasks = (task.subtasks || []).map(s => s.id === id ? { ...s, completed: !s.completed } : s);
    handleUpdate({ subtasks });
  };

  const deleteSubtask = (id: string) => {
    const subtasks = (task.subtasks || []).filter(s => s.id !== id);
    handleUpdate({ subtasks });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '400px',
          background: 'var(--bg-primary)',
          borderLeft: '1px solid var(--glass-border)',
          zIndex: 100,
          boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}
      >
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <input 
              value={task.title}
              onChange={(e) => handleUpdate({ title: e.target.value })}
              style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%' }}
            />
            <button className="glass-button" onClick={onClose} style={{ padding: '8px', border: 'none', background: 'transparent' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Properties Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', alignItems: 'center' }}>
              
              <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} /> Due Date</div>
              <input 
                type="date"
                className="glass-input"
                style={{ padding: '4px 8px' }}
                value={task.dueDate || ''}
                onChange={(e) => handleUpdate({ dueDate: e.target.value || null })}
              />

              <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} /> Duration (m)</div>
              <input 
                type="number"
                className="glass-input"
                style={{ padding: '4px 8px' }}
                value={task.estimatedDuration || ''}
                placeholder="e.g. 30"
                onChange={(e) => handleUpdate({ estimatedDuration: parseInt(e.target.value) || null })}
              />

              <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}><TagIcon size={16} /> Priority</div>
              <select 
                className="glass-input" 
                style={{ padding: '4px 8px' }}
                value={task.priority}
                onChange={(e) => handleUpdate({ priority: e.target.value as any })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              
              <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}><Palette size={16} /> Color</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#10b981', '#14b8a6', 'transparent'].map(color => (
                  <button 
                    key={color} 
                    onClick={() => handleUpdate({ colorLabel: color === 'transparent' ? undefined : color })}
                    style={{ 
                      width: '24px', height: '24px', borderRadius: '12px', background: color, border: color === 'transparent' ? '1px dashed var(--glass-border)' : 'none', cursor: 'pointer',
                      boxShadow: task.colorLabel === color || (color === 'transparent' && !task.colorLabel) ? `0 0 0 2px var(--bg-primary), 0 0 0 4px var(--text-secondary)` : 'none'
                    }} 
                    title={color === 'transparent' ? 'None' : color}
                  />
                ))}
              </div>
              
            </div>

            {/* Description */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><AlignLeft size={16} /> Description</div>
              <textarea 
                className="glass-input"
                style={{ minHeight: '100px', resize: 'vertical' }}
                placeholder="Add more details..."
                value={task.notes || ''}
                onChange={(e) => handleUpdate({ notes: e.target.value })}
              />
            </div>

            {/* Subtasks */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><CheckSquare size={16} /> Subtasks</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {(task.subtasks || []).map(subtask => (
                  <div key={subtask.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--glass-bg)', padding: '8px 12px', borderRadius: '8px' }}>
                    <input 
                      type="checkbox" 
                      checked={subtask.completed} 
                      onChange={() => toggleSubtask(subtask.id)} 
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ flex: 1, textDecoration: subtask.completed ? 'line-through' : 'none', color: subtask.completed ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                      {subtask.title}
                    </span>
                    <button className="glass-button" onClick={() => deleteSubtask(subtask.id)} style={{ padding: '4px', border: 'none', background: 'transparent', color: 'var(--danger)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={addSubtask} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="Add a subtask..." 
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  style={{ padding: '8px 12px' }}
                />
                <button type="submit" className="glass-button"><Plus size={16} /></button>
              </form>
            </div>

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TaskDetailsPanel;
