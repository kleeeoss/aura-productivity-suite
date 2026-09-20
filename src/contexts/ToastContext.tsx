import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onUndo?: () => void;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number, onUndo?: () => void) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 3000, onUndo?: () => void) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type, duration, onUndo }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <div 
        style={{ 
          position: 'fixed', 
          bottom: '24px', 
          right: '24px', 
          zIndex: 9999, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          pointerEvents: 'none'
        }}
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                pointerEvents: 'auto',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                minWidth: '300px',
                maxWidth: '400px'
              }}
            >
              {t.type === 'success' && <CheckCircle size={20} color="var(--success)" />}
              {t.type === 'info' && <Info size={20} color="var(--accent-primary)" />}
              {t.type === 'warning' && <AlertTriangle size={20} color="var(--warning)" />}
              {t.type === 'error' && <AlertTriangle size={20} color="var(--danger)" />}
              
              <span style={{ flex: 1, fontWeight: '500', fontSize: '0.95rem' }}>{t.message}</span>
              
              {t.onUndo && (
                <button 
                  onClick={() => { t.onUndo!(); removeToast(t.id); }}
                  style={{
                    background: 'var(--glass-hover)',
                    border: 'none',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 'bold'
                  }}
                >
                  Undo
                </button>
              )}
              
              <button 
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
