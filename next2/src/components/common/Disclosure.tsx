'use client';

import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { cn } from 'cn';

type Props = {
  title: ReactNode;
  children: ReactNode;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  defaultOpen?: boolean;
};

/** A shared presentation wrapper; Radix owns disclosure state and semantics. */
export function Disclosure({
  title,
  children,
  className,
  triggerClassName,
  contentClassName,
  defaultOpen,
}: Props) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className={cn('group/disclosure', className)}
    >
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            'h-auto w-full justify-between gap-3 whitespace-normal px-0 py-2 text-left hover:bg-transparent hover:no-underline',
            triggerClassName,
          )}
        >
          <span className="min-w-0">{title}</span>
          <ChevronDown className="size-3.5 shrink-0 text-muted transition-transform group-data-[state=open]/disclosure:rotate-180" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className={contentClassName}>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
