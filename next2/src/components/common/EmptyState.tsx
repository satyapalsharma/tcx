import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/Icon';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';

export interface EmptyStateProps {
  icon?: IconName;
  title?: string;
  description?: string;
  action?: ReactNode;
  dataOdId?: string;
  className?: string;
}

/** Product copy and icons composed with the official shadcn Empty primitives. */
export function EmptyState({
  icon = 'filter',
  title = 'No results found',
  description,
  action,
  dataOdId,
  className,
}: EmptyStateProps) {
  return (
    <Empty className={className} data-od-id={dataOdId}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon name={icon} className="size-5 text-muted" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && (
          <EmptyDescription className="text-xs text-muted">
            {description}
          </EmptyDescription>
        )}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}
