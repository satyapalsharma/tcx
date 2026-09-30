import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Dialog as ShadcnDialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet as ShadcnSheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from 'cn';

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

  const open = useCallback((id: string) => {
    setActive(id);
  }, []);

  const close = useCallback(() => {
    setActive(null);
  }, []);

  return (
    <Ctx.Provider value={{ open, close, active }}>
      {children}
    </Ctx.Provider>
  );
}

export function Dialog({ id, children, className = '', dataOdId }: { id: string; children: ReactNode; className?: string; dataOdId?: string }) {
  const { active, close } = useOverlay();
  const isOpen = active === id;
  return (
    <ShadcnDialog open={isOpen} onOpenChange={(v) => !v && close()}>
      <DialogContent
        id={id}
        data-od-id={dataOdId}
        showCloseButton={false}
        className={cn('w-[92%] sm:max-w-[540px] p-0 bg-surface border-border rounded-xl shadow-2xl overflow-hidden gap-0', className)}
      >
        <DialogTitle className="sr-only">Dialog</DialogTitle>
        {children}
      </DialogContent>
    </ShadcnDialog>
  );
}

export function Drawer({ id, children, dataOdId }: { id: string; children: ReactNode; dataOdId?: string }) {
  const { active, close } = useOverlay();
  const isOpen = active === id;
  return (
    <ShadcnSheet open={isOpen} onOpenChange={(v) => !v && close()}>
      <SheetContent
        id={id}
        data-od-id={dataOdId}
        side="right"
        showCloseButton={false}
        className="w-[90%] sm:max-w-[520px] p-0 flex flex-col gap-0 overflow-hidden bg-surface border-l border-border shadow-2xl"
      >
        <SheetTitle className="sr-only">Details Drawer</SheetTitle>
        {children}
      </SheetContent>
    </ShadcnSheet>
  );
}

export function OpenButton({
  target,
  className,
  children,
  ...rest
}: React.ComponentProps<typeof Button> & { target: string }) {
  const { open } = useOverlay();
  return (
    <Button
      type="button"
      className={className}
      data-open={target}
      onClick={() => open(target)}
      {...rest}
    >
      {children}
    </Button>
  );
}

export function CloseButton({
  className,
  children,
  ...rest
}: React.ComponentProps<typeof Button>) {
  const { close } = useOverlay();
  return (
    <Button
      type="button"
      variant="ghost"
      className={className}
      data-close
      onClick={close}
      {...rest}
    >
      {children}
    </Button>
  );
}
