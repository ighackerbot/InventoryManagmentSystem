import { createContext, useContext, useState } from 'react';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

const ToastContext = createContext(null);

const toastStyles = {
  success: {
    icon: CheckCircle2,
    card: 'border-emerald-500/20 bg-emerald-50 text-emerald-900',
    iconWrap: 'bg-emerald-500 text-white',
  },
  error: {
    icon: CircleAlert,
    card: 'border-rose-500/20 bg-rose-50 text-rose-900',
    iconWrap: 'bg-rose-500 text-white',
  },
  info: {
    icon: Info,
    card: 'border-brand-500/20 bg-brand-50 text-brand-900',
    iconWrap: 'bg-brand-500 text-white',
  },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const pushToast = (toast) => {
    const id = crypto.randomUUID();
    const entry = { id, type: 'info', title: '', duration: 3500, ...toast };
    setToasts((current) => [...current, entry]);

    window.setTimeout(() => {
      removeToast(id);
    }, entry.duration);
  };

  const value = {
    toast: pushToast,
    success: (message, title = 'Success') => pushToast({ type: 'success', title, message }),
    error: (message, title = 'Something went wrong') => pushToast({ type: 'error', title, message }),
    info: (message, title = 'Info') => pushToast({ type: 'info', title, message }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((toast) => {
          const style = toastStyles[toast.type] || toastStyles.info;
          const Icon = style.icon;

          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-3xl border px-4 py-4 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.55)] backdrop-blur-xl transition-all',
                style.card
              )}
            >
              <div className={cn('mt-0.5 rounded-2xl p-2', style.iconWrap)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-sm font-semibold text-current">{toast.title}</p>
                <p className="mb-0 text-sm text-current/80">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded-full p-1 text-current/65 transition hover:bg-white/50 hover:text-current"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return context;
};
