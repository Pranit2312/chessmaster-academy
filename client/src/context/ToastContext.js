import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      <div style={{
        position: 'fixed',
        top: 80,
        right: 20,
        zIndex: 'var(--z-toast, 600)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            style={{
              pointerEvents: 'auto',
              padding: '12px 20px',
              borderRadius: 'var(--radius-md, 8px)',
              background: t.type === 'success' ? 'var(--success-bg, #052e16)' :
                         t.type === 'error' ? 'var(--error-bg, #450a0a)' :
                         t.type === 'warning' ? 'var(--warning-bg, #451a03)' :
                         'var(--info-bg, #172554)',
              color: t.type === 'success' ? 'var(--success, #22c55e)' :
                     t.type === 'error' ? 'var(--error, #ef4444)' :
                     t.type === 'warning' ? 'var(--warning, #f59e0b)' :
                     'var(--info, #3b82f6)',
              border: `1px solid ${t.type === 'success' ? 'var(--success, #22c55e)' :
                                  t.type === 'error' ? 'var(--error, #ef4444)' :
                                  t.type === 'warning' ? 'var(--warning, #f59e0b)' :
                                  'var(--info, #3b82f6)'}`,
              fontSize: 'var(--text-sm, 0.875rem)',
              fontWeight: 500,
              minWidth: 280,
              maxWidth: 420,
              boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.4))',
              cursor: 'pointer',
              animation: 'toastSlideIn 0.3s ease',
              backdropFilter: 'blur(12px)',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
