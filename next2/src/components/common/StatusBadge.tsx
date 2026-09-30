import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from 'cn';

export type StatusVariant =
  | 'ok'
  | 'success'
  | 'warn'
  | 'warning'
  | 'danger'
  | 'destructive'
  | 'accent'
  | 'muted'
  | 'neutral';

export interface StatusBadgeProps extends React.ComponentProps<typeof Badge> {
  status?: StatusVariant;
  pulse?: boolean;
  dot?: boolean;
  children: React.ReactNode;
}

export function StatusBadge({
  status = 'neutral',
  pulse = false,
  dot = true,
  children,
  className,
  ...props
}: StatusBadgeProps) {
  const isOk = status === 'ok' || status === 'success';
  const isWarn = status === 'warn' || status === 'warning';
  const isDanger = status === 'danger' || status === 'destructive';
  const isAccent = status === 'accent';

  const containerClasses = cn(
    'inline-flex items-center gap-1.5 h-5.5 px-2 text-xs font-medium rounded-full whitespace-nowrap border-0 transition-colors',
    isOk && 'bg-success-soft text-success-fg',
    isWarn && 'bg-warn-soft text-warn-fg',
    isDanger && 'bg-danger-soft text-danger-fg',
    isAccent && 'bg-accent-soft text-accent-strong',
    !isOk && !isWarn && !isDanger && !isAccent && 'bg-surface-inset text-foreground border border-border',
    className
  );

  const dotClasses = cn(
    'w-1.5 h-1.5 rounded-full shrink-0',
    isOk && 'bg-success',
    isWarn && 'bg-warn',
    isDanger && 'bg-danger',
    isAccent && 'bg-accent',
    !isOk && !isWarn && !isDanger && !isAccent && 'bg-muted',
    pulse && 'animate-pulse'
  );

  return (
    <Badge className={containerClasses} {...props}>
      {dot && <span className={dotClasses} aria-hidden="true" />}
      {children}
    </Badge>
  );
}
