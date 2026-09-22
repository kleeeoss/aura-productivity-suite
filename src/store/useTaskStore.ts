import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useActivityStore } from './useActivityStore';

export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  projectId: string | null;
  category: string;
  dueDate: string | null; // ISO string
  estimatedDuration: number | null; // in minutes
  tags: string[];
  notes: string;
  subtasks: Subtask[];
  createdAt: string;
  completedAt?: string; // ISO string when finished
  timeSpentMinutes?: number; // Total focus minutes logged
  colorLabel?: string; // Optional hex color code
}

export interface Project {
  id: string;
  name: string;
  color: string;
}

interface TaskState {
  tasks: Task[];
  projects: Project[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, status: TaskStatus) => void;
  addTimeSpent: (id: string, minutes: number) => void;
  
  addProject: (name: string, color: string) => void;
  deleteProject: (id: string) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      projects: [],
      addTask: (task) => {
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              ...task,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        useActivityStore.getState().logActivity('task', `Created task: ${task.title}`);
      },
      updateTask: (id, updates) =>
        set((state) => {
          const task = state.tasks.find((t) => t.id === id);
          const isMarkingDone = updates.status === 'done' && task?.status !== 'done';
          const isUnmarkingDone = updates.status && updates.status !== 'done' && task?.status === 'done';

          if (task && isMarkingDone) {
            useActivityStore.getState().logActivity('task', `Completed task: ${task.title}`);
          }

          const completionUpdates = isMarkingDone
            ? { completedAt: updates.completedAt || new Date().toISOString() }
            : isUnmarkingDone
            ? { completedAt: undefined }
            : {};

          return {
            tasks: state.tasks.map((t) =>
              t.id === id ? { ...t, ...updates, ...completionUpdates } : t
            ),
          };
        }),
      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),
      moveTask: (id, status) =>
        set((state) => {
          const task = state.tasks.find((t) => t.id === id);
          const isMarkingDone = status === 'done' && task?.status !== 'done';
          const isUnmarkingDone = status !== 'done' && task?.status === 'done';

          if (task && isMarkingDone) {
            useActivityStore.getState().logActivity('task', `Completed task: ${task.title}`);
          }

          return {
            tasks: state.tasks.map((t) =>
              t.id === id
                ? {
                    ...t,
                    status,
                    completedAt: isMarkingDone
                      ? new Date().toISOString()
                      : isUnmarkingDone
                      ? undefined
                      : t.completedAt,
                  }
                : t
            ),
          };
        }),
      addTimeSpent: (id, minutes) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, timeSpentMinutes: (t.timeSpentMinutes || 0) + minutes }
              : t
          ),
        })),
      addProject: (name, color) => 
        set((state) => ({
          projects: [...state.projects, { id: crypto.randomUUID(), name, color }]
        })),
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter(p => p.id !== id),
          tasks: state.tasks.map(t => t.projectId === id ? { ...t, projectId: null } : t)
        }))
    }),
    {
      name: 'task-storage',
    }
  )
);
