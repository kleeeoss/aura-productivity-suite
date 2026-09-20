import React, { useState } from 'react';
import { GlassPanel } from '../components/GlassPanel';
import { useTaskStore, type Task, type TaskStatus } from '../store/useTaskStore';
import { Plus, Trash2, CheckCircle, Circle, Clock, Tag as TagIcon, ListTodo } from 'lucide-react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskDetailsPanel from '../components/TaskDetailsPanel';
import { useToast } from '../contexts/ToastContext';

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' }
];

const SortableTask = React.memo(({ task, onClick }: { task: Task, onClick: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const { deleteTask } = useTaskStore();
  const { toast } = useToast();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
    cursor: 'grab'
  };

  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div 
      ref={setNodeRef} 
      style={{ ...style, display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
      {...attributes} 
      {...listeners}
      onClick={onClick}
    >
      {task.colorLabel && (
        <div style={{ width: '32px', height: '4px', borderRadius: '2px', background: task.colorLabel, marginBottom: '4px' }} />
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {task.status === 'done' ? <CheckCircle color="var(--success)" size={16} /> : <Circle color="var(--text-secondary)" size={16} />}
          <span style={{ fontWeight: '500', textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
            {task.title}
          </span>
        </div>
        <button 
          className="glass-button" 
          style={{ padding: '4px', color: 'var(--danger)', border: 'none', background: 'transparent' }} 
          onClick={(e) => { 
            e.stopPropagation(); 
            deleteTask(task.id); 
            toast('Task deleted', 'info');
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {(task.tags?.length > 0 || totalSubtasks > 0 || task.estimatedDuration || task.dueDate) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {task.dueDate && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: new Date(task.dueDate) < new Date() ? 'var(--danger)' : 'inherit' }}>
              <Clock size={12} /> {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
          {task.estimatedDuration && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {task.estimatedDuration}m</span>
          )}
          {totalSubtasks > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ListTodo size={12} /> {completedSubtasks}/{totalSubtasks}</span>
          )}
          {task.tags?.map(tag => (
            <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--glass-hover)', padding: '2px 6px', borderRadius: '4px' }}>
              <TagIcon size={10} /> {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

const Tasks = () => {
  const { tasks, addTask, moveTask } = useTaskStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDetailsId, setActiveDetailsId] = useState<string | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask({
      title: newTaskTitle,
      description: '',
      status: 'todo',
      priority: 'medium',
      projectId: null,
      category: 'General',
      dueDate: null,
      estimatedDuration: null,
      tags: [],
      notes: '',
      subtasks: []
    });
    setNewTaskTitle('');
    toast('Task created successfully', 'success');
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find if we dropped over a column directly or over a task in a column
    const overIsColumn = COLUMNS.some(c => c.id === overId);
    let targetStatus = overIsColumn ? overId as TaskStatus : tasks.find(t => t.id === overId)?.status;

    if (targetStatus && activeId !== overId) {
       moveTask(activeId as string, targetStatus);
    }
  };

  const activeTask = tasks.find(t => t.id === activeId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <header>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Project Board</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your tasks, projects, and deadlines seamlessly.</p>
      </header>
      
      <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '12px' }}>
        <input 
          type="text" 
          className="glass-input" 
          placeholder="What needs to be done?" 
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
        />
        <button type="submit" className="glass-button primary"><Plus size={20} /> Add Task</button>
      </form>

      <div style={{ display: 'flex', gap: '24px', flex: 1, overflowX: 'auto', paddingBottom: '12px' }}>
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {COLUMNS.map(column => {
            const columnTasks = tasks.filter(t => t.status === column.id);
            return (
              <GlassPanel 
                key={column.id} 
                style={{ flex: '1', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                  <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>{column.label}</h3>
                  <span style={{ background: 'var(--glass-hover)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{columnTasks.length}</span>
                </div>
                
                <SortableContext items={columnTasks.map(t => t.id)}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: '200px' }}>
                    {columnTasks.map(task => (
                      <SortableTask key={task.id} task={task} onClick={() => setActiveDetailsId(task.id)} />
                    ))}
                    {columnTasks.length === 0 && (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--glass-border)', borderRadius: '8px' }}>
                        Drop tasks here
                      </div>
                    )}
                  </div>
                </SortableContext>
              </GlassPanel>
            );
          })}
          
          <DragOverlay>
            {activeTask ? (
              <div style={{ padding: '12px', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)', opacity: 0.9 }}>
                <div style={{ fontWeight: '500' }}>{activeTask.title}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <TaskDetailsPanel 
        taskId={activeDetailsId} 
        onClose={() => setActiveDetailsId(null)} 
      />
    </div>
  );
};

export default Tasks;
