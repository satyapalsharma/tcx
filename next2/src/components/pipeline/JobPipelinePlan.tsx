'use client';

import { PIPELINE_STAGES, TASK_LABELS, type StageType } from '@/data/pipeline';
import { SelectField } from '@/components/common';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

type Stage = (typeof PIPELINE_STAGES)[number];
type Props = {
  fileName?: string;
  inputLabel?: string;
  taskType: StageType;
  startIndex: number;
  endIndex: number;
  stageOrder: readonly Stage[];
  plannedStages: readonly Stage[];
  onEndStageChange: (stage: Stage) => void;
  runtime?: string;
  runtimes: readonly string[];
  onRuntimeChange: (runtime: string) => void;
  executionMode?: 'guided' | 'express';
  stageLocks?: Partial<Record<Stage, string>>;
  onStageToggle?: (stage: Stage, checked: boolean) => void;
};

export function JobPipelinePlan({
  fileName,
  inputLabel,
  taskType,
  startIndex,
  endIndex,
  stageOrder,
  plannedStages,
  onEndStageChange,
  runtime,
  runtimes,
  onRuntimeChange,
  executionMode = 'guided',
  stageLocks = {},
  onStageToggle,
}: Props) {
  const included = stageOrder.filter((stage) => plannedStages.includes(stage));
  const skipped = stageOrder.filter(
    (stage) =>
      !plannedStages.includes(stage) &&
      stageOrder.indexOf(stage) >= startIndex &&
      stageOrder.indexOf(stage) <= endIndex,
  );
  const upcoming = stageOrder.filter(
    (stage) => stageOrder.indexOf(stage) > endIndex,
  );

  return (
    <section
      aria-labelledby="pipeline-preview-title"
      className="space-y-3 rounded-xl border border-accent-strong/30 bg-accent-soft/20 p-4"
    >
      <div>
        <h2 id="pipeline-preview-title" className="text-sm font-semibold">
          After this input
        </h2>
        <p className="mt-1 truncate text-xs text-muted">
          {fileName ?? inputLabel}
        </p>
      </div>
      {executionMode === 'guided' && startIndex < stageOrder.length - 1 && (
        <div className="space-y-2">
          <Label htmlFor="job-end-stage">Run through</Label>
          <SelectField
            id="job-end-stage"
            value={stageOrder[endIndex]}
            onValueChange={(value) => onEndStageChange(value as Stage)}
            options={stageOrder.slice(startIndex).map((stage) => ({
              value: stage,
              label:
                stage === taskType
                  ? `${TASK_LABELS[stage]} only`
                  : `Continue through ${TASK_LABELS[stage]}`,
            }))}
            className="h-10 w-full"
          />
        </div>
      )}
      {executionMode === 'express' && onStageToggle && (
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-foreground">
            Stages to run
          </legend>
          <div className="space-y-1.5">
            {stageOrder.slice(startIndex).map((stage) => {
              const selected = plannedStages.includes(stage);
              const dependency = stageLocks[stage];
              const locked = Boolean(dependency) && selected;
              const id = `express-stage-${stage}`;
              return (
                <div
                  key={stage}
                  className="flex items-start gap-2.5 rounded-lg border border-border bg-surface px-3 py-2"
                >
                  <Checkbox
                    id={id}
                    checked={selected}
                    disabled={locked}
                    onCheckedChange={(checked) =>
                      onStageToggle(stage, checked === true)
                    }
                    className="mt-0.5"
                  />
                  <div className="min-w-0">
                    <Label htmlFor={id} className="text-xs font-medium">
                      {TASK_LABELS[stage]}
                    </Label>
                    {dependency && (
                      <p className="mt-0.5 text-[11px] leading-4 text-muted">
                        {dependency}
                      </p>
                    )}
                  </div>
                  <span className="ml-auto text-[10px] font-medium uppercase tracking-wide text-muted">
                    {selected ? 'Included' : 'Skipped'}
                  </span>
                </div>
              );
            })}
          </div>
        </fieldset>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground">
            Included
          </p>
          <ol className="mt-1 space-y-1 text-xs text-foreground">
            {included.map((stage, index) => (
              <li key={stage}>
                {index + 1}. {TASK_LABELS[stage]}
              </li>
            ))}
          </ol>
        </div>
        {upcoming.length > 0 && executionMode === 'guided' && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Upcoming
            </p>
            <ol className="mt-1 space-y-1 text-xs text-muted">
              {upcoming.map((stage, index) => (
                <li key={stage}>
                  {included.length + skipped.length + index + 1}.{' '}
                  {TASK_LABELS[stage]}
                </li>
              ))}
            </ol>
          </div>
        )}
        {skipped.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Skipped
            </p>
            <ol className="mt-1 space-y-1 text-xs text-muted">
              {skipped.map((stage) => (
                <li key={stage}>{TASK_LABELS[stage]}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
      {runtime && (
        <div className="space-y-1.5">
          <Label htmlFor="job-runtime">Target runtime</Label>
          <SelectField
            id="job-runtime"
            value={runtime}
            onValueChange={onRuntimeChange}
            options={runtimes}
            className="h-10 w-full"
          />
        </div>
      )}
    </section>
  );
}
