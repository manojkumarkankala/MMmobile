import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; type: ToastType; message: string; }

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 shadow-card rounded-xl px-4 py-3 animate-slide-up"
          >
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-success-500 shrink-0 mt-0.5" />}
            {t.type === 'error' && <XCircle className="w-5 h-5 text-error-500 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />}
            <p className="text-sm text-ink-800 dark:text-ink-100 flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-ink-400 hover:text-ink-700 dark:hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
