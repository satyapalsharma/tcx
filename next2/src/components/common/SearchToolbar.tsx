import React from 'react';
import { Icon } from '@/components/Icon';
import { cn } from 'cn';

export interface SearchToolbarProps {
  query: string;
  onQueryChange: (q: string) => void;
  placeholder?: string;
  count?: number;
  totalCount?: number;
  countLabel?: string;
  children?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  dataOdId?: string;
}

export function SearchToolbar({
  query,
  onQueryChange,
  placeholder = 'Search...',
  count,
  totalCount,
  countLabel = 'shown',
  children,
  className,
  inputClassName,
  dataOdId,
}: SearchToolbarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2.5', className)} data-od-id={dataOdId}>
      <div className="relative">
        <Icon
          name="search"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none"
        />
        <input
          className={cn(
            'h-8 pl-8 pr-3 w-full sm:w-[210px] bg-surface-inset border border-border rounded-md text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors',
            inputClassName
          )}
          placeholder={placeholder}
          aria-label={placeholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      {children}

      {count !== undefined && (
        <span className="text-xs text-muted whitespace-nowrap pl-1">
          <span className="font-semibold text-foreground">{count}</span>
          {totalCount !== undefined ? ` of ${totalCount}` : ` ${countLabel}`}
        </span>
      )}
    </div>
  );
}
