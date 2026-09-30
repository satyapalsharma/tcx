import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { toast as sonnerToast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { type IconName } from './Icon';

const ToastCtx = createContext<(msg: string, icon?: IconName) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useCallback((msg: string, icon: IconName = 'check') => {
    if (icon === 'check') {
      sonnerToast.success(msg);
    } else if (icon === 'x' || icon === 'warn') {
      sonnerToast.error(msg);
    } else if (icon === 'info') {
      sonnerToast.info(msg);
    } else {
      sonnerToast(msg);
    }
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <Toaster position="bottom-right" richColors />
    </ToastCtx.Provider>
  );
}
