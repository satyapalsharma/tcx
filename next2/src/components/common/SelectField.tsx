'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from 'cn';

export type SelectOption = string | { value: string; label: string };

// Radix Select forbids empty-string item values; filters use '' for "All".
const EMPTY = '__all__';
const toInner = (v: string) => (v === '' ? EMPTY : v);
const toOuter = (v: string) => (v === EMPTY ? '' : v);

/**
 * Thin composition over shadcn Select for the common "value + options" case.
 * Accepts '' as a value (mapped internally) so filter "All …" options keep working.
 */
export function SelectField({
  value,
  onValueChange,
  options,
  placeholder,
  id,
  className,
  size = 'sm',
  disabled,
  'aria-label': ariaLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  className?: string;
  size?: 'sm' | 'default';
  disabled?: boolean;
  'aria-label'?: string;
}) {
  const items = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <Select value={toInner(value)} onValueChange={(v) => onValueChange(toOuter(v))} disabled={disabled}>
      <SelectTrigger id={id} size={size} aria-label={ariaLabel} className={cn('text-xs cursor-pointer', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((o) => (
          <SelectItem key={o.value || EMPTY} value={toInner(o.value)} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
