import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

type OverlayCtx = {
  open: (id: string) => void;
  close: () => void;
  active: string | null;
};

const Ctx = createContext<OverlayCtx>({ open: () => {}, close: () => {}, active: null });

export function useOverlay() {
  return useContext(Ctx);
}

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<string | null>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const open = useCallback((id: string) => {
    lastFocus.current = document.activeElement as HTMLElement;
    setActive(id);
  }, []);

  const close = useCallback(() => {
    setActive(null);
    if (lastFocus.current?.focus) {
      try { lastFocus.current.focus({ preventScroll: true }); } catch { /* noop */ }
    }
    lastFocus.current = null;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && active) close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, close]);

  useEffect(() => {
    if (!active) return;
    const el = document.getElementById(active);
    const focusables = el?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusables?.[0]?.focus({ preventScroll: true });
  }, [active]);

  return (
    <Ctx.Provider value={{ open, close, active }}>
      {children}
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-200 ${
          active ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        data-overlay
        onClick={(e) => { if ((e.target as HTMLElement).matches('[data-overlay]')) close(); }}
        aria-hidden={!active}
      />
    </Ctx.Provider>
  );
}

export function Dialog({ id, children, className = '', dataOdId }: { id: string; children: ReactNode; className?: string; dataOdId?: string }) {
  const { active, close } = useOverlay();
  const open = active === id;
  return (
    <div
      id={id}
      className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[92%] max-w-[540px] bg-surface border border-border rounded-xl shadow-2xl transition-all duration-200 overflow-hidden ${
        open ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'
      } ${className}`.trim()}
      role="dialog"
      aria-modal="true"
      data-od-id={dataOdId}
    >
      {children}
      <button type="button" className="sr-only" data-close onClick={close} aria-label="Close" />
    </div>
  );
}

export function Drawer({ id, children, dataOdId }: { id: string; children: ReactNode; dataOdId?: string }) {
  const { active } = useOverlay();
  const open = active === id;
  return (
    <div
      id={id}
      className={`fixed top-0 right-0 h-full w-[90%] max-w-[520px] bg-surface border-l border-border shadow-2xl z-50 flex flex-col transition-transform duration-200 ease-out overflow-hidden ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Job details"
      data-od-id={dataOdId}
    >
      {children}
    </div>
  );
}

export function OpenButton({ target, className, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { target: string }) {
  const { open } = useOverlay();
  return (
    <button type="button" className={className} data-open={target} onClick={() => open(target)} {...rest}>
      {children}
    </button>
  );
}

export function CloseButton({ className, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { close } = useOverlay();
  return (
    <button type="button" className={className} data-close onClick={close} {...rest}>
      {children}
    </button>
  );
}
