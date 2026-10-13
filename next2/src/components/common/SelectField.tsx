'use client';

import type { ComponentProps } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from 'cn';

export type SelectOption =
  string | { value: string; label: string; disabled?: boolean };
type Props = Omit<
  ComponentProps<typeof SelectTrigger>,
  'children' | 'onChange'
> & {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  name?: string;
  required?: boolean;
};

/** Shadcn Select composition. Empty filter values work without breaking placeholders. */
export function SelectField({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  size = 'sm',
  disabled,
  name,
  required,
  ...triggerProps
}: Props) {
  const items = options.map((option) =>
    typeof option === 'string' ? { value: option, label: option } : option,
  );
  const hasEmptyOption = items.some((option) => option.value === '');
  // Generate a sentinel outside the caller's value domain (including literal '__all__').
  const values = new Set(items.map((option) => option.value));
  let emptyValue = '__select_empty__';
  while (values.has(emptyValue)) emptyValue += '_';
  const innerValue = value === '' && hasEmptyOption ? emptyValue : value;

  return (
    <Select
      name={name}
      required={required}
      value={innerValue}
      disabled={disabled}
      onValueChange={(next) =>
        onValueChange(hasEmptyOption && next === emptyValue ? '' : next)
      }
    >
      <SelectTrigger
        {...triggerProps}
        size={size}
        disabled={disabled}
        className={cn('cursor-pointer text-xs', className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((option) => (
          <SelectItem
            key={option.value === '' ? emptyValue : option.value}
            value={option.value === '' ? emptyValue : option.value}
            disabled={option.disabled}
            className="text-xs"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
