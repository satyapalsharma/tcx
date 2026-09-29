import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type ToastItem = { id: number; msg: string; icon: IconName };

const ToastCtx = createContext<(msg: string, icon?: IconName) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((msg: string, icon: IconName = 'check') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, msg, icon }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 2600);
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none" role="status" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2.5 px-3.5 py-2.5 bg-foreground text-surface text-xs sm:text-sm font-medium rounded-lg shadow-xl pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <Icon name={t.icon} className="w-4 h-4 shrink-0 text-surface" />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
