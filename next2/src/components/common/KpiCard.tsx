import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from 'cn';

export interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  dataOdId?: string;
  className?: string;
  onClick?: () => void;
}

export function KpiCard({
  label,
  value,
  description,
  badge,
  icon,
  dataOdId,
  className,
  onClick,
}: KpiCardProps) {
  return (
    <Card
      data-od-id={dataOdId}
      onClick={onClick}
      className={cn(
        'p-3 sm:p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col gap-0.5 sm:gap-1 transition-all min-w-0',
        onClick && 'cursor-pointer hover:bg-surface-hover/70',
        className
      )}
    >
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted truncate">
          {label}
        </span>
        {badge ?? icon}
      </div>
      <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
        {value}
      </div>
      {description && (
        <div className="text-[11px] sm:text-xs text-muted truncate sm:whitespace-normal">
          {description}
        </div>
      )}
    </Card>
  );
}
