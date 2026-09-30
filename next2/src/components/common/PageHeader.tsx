import React from 'react';
import { cn } from 'cn';

export interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  badges?: React.ReactNode;
  dataOdId?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  badges,
  dataOdId,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6',
        className
      )}
    >
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1
            className="text-xl sm:text-2xl font-bold tracking-tight text-foreground"
            data-od-id={dataOdId ?? 'page-title'}
          >
            {title}
          </h1>
          {badges}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-[660px]">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
