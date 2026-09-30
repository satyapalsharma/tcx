import React from 'react';
import { Icon } from '@/components/Icon';
import { cn } from 'cn';

export interface EmptyStateProps {
  icon?: Parameters<typeof Icon>[0]['name'];
  title?: string;
  description?: string;
  action?: React.ReactNode;
  dataOdId?: string;
  className?: string;
}

export function EmptyState({
  icon = 'filter',
  title = 'No results found',
  description,
  action,
  dataOdId,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'p-12 text-center text-muted text-xs sm:text-sm flex flex-col items-center justify-center gap-2',
        className
      )}
      data-od-id={dataOdId}
    >
      <Icon name={icon} className="w-6 h-6 text-muted mb-1 opacity-70" />
      <span className="font-medium text-foreground">{title}</span>
      {description && <span className="text-xs text-muted max-w-sm">{description}</span>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
