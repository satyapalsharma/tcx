'use client';

import {
  Activity,
  Bot,
  GitBranch,
  Layers3,
  Network,
  Workflow,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TASK_LABELS, type StageType } from '@/data/pipeline';

const OPTIONS: {
  value: StageType;
  purpose: string;
  icon: typeof Activity;
}[] = [
  {
    value: 'full_pipeline',
    purpose: 'Go from conversation data to a deployable agent scaffold.',
    icon: Workflow,
  },
  {
    value: 'extract_intents',
    purpose: 'Find customer intents, resolutions, escalations, and friction.',
    icon: Activity,
  },
  {
    value: 'cluster_intents',
    purpose: 'Organize intent insights into an L1–L3 taxonomy.',
    icon: Layers3,
  },
  {
    value: 'design_flow',
    purpose: 'Turn conversation insights or clusters into a process map.',
    icon: GitBranch,
  },
  {
    value: 'generate_uml',
    purpose: 'Translate a process map into a UML sequence diagram.',
    icon: Network,
  },
  {
    value: 'generate_agent',
    purpose: 'Create an agent scaffold from a process map or UML diagram.',
    icon: Bot,
  },
];

type Props = {
  value: StageType;
  onValueChange: (value: StageType) => void;
};

export function JobTypePicker({ value, onValueChange }: Props) {
  return (
    <fieldset className="space-y-2.5">
      <legend className="text-sm font-medium">Choose a job type</legend>
      <RadioGroup
        value={value}
        onValueChange={(next) => onValueChange(next as StageType)}
        aria-label="Job type"
        className="grid gap-2 sm:grid-cols-2"
      >
        {OPTIONS.map(({ value: option, purpose, icon: Icon }) => {
          const recommended = option === 'full_pipeline';
          const selected = value === option;
          const id = `job-type-${option}`;
          return (
            <Label
              key={option}
              htmlFor={id}
              className={`flex min-h-[88px] cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors hover:border-accent-strong/40 hover:bg-accent-soft/30 ${
                recommended ? 'sm:col-span-2 sm:min-h-[92px] sm:p-4' : ''
              } ${
                selected
                  ? 'border-accent-strong bg-accent-soft/50 ring-1 ring-accent-strong/30'
                  : 'border-border bg-surface'
              }`}
            >
              <RadioGroupItem
                id={id}
                value={option}
                className="mt-1"
                aria-label={TASK_LABELS[option]}
              />
              <span
                className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${
                  recommended
                    ? 'bg-accent-strong text-white'
                    : 'bg-surface-inset text-muted'
                }`}
              >
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                  {TASK_LABELS[option]}
                  {recommended && (
                    <Badge className="h-5 px-1.5 text-[10px]">
                      Recommended
                    </Badge>
                  )}
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted">
                  {purpose}
                </span>
              </span>
            </Label>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}
