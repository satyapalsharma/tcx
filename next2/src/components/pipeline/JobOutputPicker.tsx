'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { usePipeline } from '@/context/PipelineContext';
import {
  ARTIFACT_LABELS,
  TASK_LABELS,
  type Artifact,
  type ArtifactKind,
} from '@/data/pipeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/common/SelectField';

type ValidationBadgeProps = { status: Artifact['status'] };
export function ValidationBadge({ status }: ValidationBadgeProps) {
  const validated = status === 'approved';
  return (
    <Badge
      variant="outline"
      className={
        validated
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
          : 'border-border text-muted'
      }
    >
      {validated ? 'Validated' : 'Not validated'}
    </Badge>
  );
}

type JobOutputPickerProps = {
  kinds?: ArtifactKind[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  title?: string;
  description?: string;
  emptyMessage?: string;
};

export function JobOutputPicker({
  kinds,
  selectedId,
  onSelect,
  title = 'Project outputs',
  description = 'Choose a result your team can reuse. Drafts are available without approval.',
  emptyMessage = 'No matching outputs in this project yet.',
}: JobOutputPickerProps) {
  const { currentWorkspace } = useApp();
  const { artifacts, runs, selectedArtifactId, selectArtifact } = usePipeline();
  const [jobFilter, setJobFilter] = useState('all');
  const [chooserOpen, setChooserOpen] = useState<boolean | null>(null);
  const effectiveSelectedId =
    selectedId === undefined ? selectedArtifactId : selectedId;
  const filteredArtifacts = useMemo(
    () =>
      artifacts
        .filter((artifact) => artifact.workspaceId === currentWorkspace.id)
        .filter((artifact) => !kinds?.length || kinds.includes(artifact.kind))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [artifacts, currentWorkspace.id, kinds],
  );
  const availableRuns = useMemo(
    () =>
      runs
        .filter(
          (run) =>
            run.workspaceId === currentWorkspace.id &&
            filteredArtifacts.some((artifact) => artifact.runId === run.id),
        )
        .sort((a, b) => b.createdAt - a.createdAt),
    [filteredArtifacts, runs, currentWorkspace.id],
  );
  const hasImportedOutputs = filteredArtifacts.some(
    (artifact) => !artifact.runId,
  );
  const getArtifactsForFilter = (filter: string) =>
    filteredArtifacts.filter((artifact) => {
      if (filter === 'all') return true;
      if (filter === 'imported') return !artifact.runId;
      return artifact.runId === filter;
    });
  const displayedArtifacts = getArtifactsForFilter(jobFilter);
  const changeJobFilter = (filter: string) => setJobFilter(filter);
  const getRun = (artifact: Artifact) =>
    artifact.runId ? runs.find((run) => run.id === artifact.runId) : undefined;
  const chosenArtifact = filteredArtifacts.find(
    (artifact) => artifact.id === effectiveSelectedId,
  );
  const chosenRun = chosenArtifact ? getRun(chosenArtifact) : undefined;
  const showChoices =
    chooserOpen ?? (!chosenArtifact && filteredArtifacts.length > 0);

  return (
    <section className="space-y-2" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-xs font-medium text-muted">{title}</h2>
          {chosenArtifact ? (
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className="max-w-full truncate font-medium text-foreground">
                {chosenArtifact.name}
              </span>
              <span className="text-muted">
                {ARTIFACT_LABELS[chosenArtifact.kind]}
              </span>
              <span className="text-muted">
                {chosenRun?.name ?? 'Imported / shared'}
              </span>
              <ValidationBadge status={chosenArtifact.status} />
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted">
              Choose an output to continue. No output is selected.
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={showChoices}
          onClick={() => setChooserOpen(!showChoices)}
          className="shrink-0 text-xs text-accent-strong"
        >
          {showChoices ? 'Close output choices' : 'Change output'}
        </Button>
      </div>
      {showChoices && (
        <div className="space-y-2 rounded-xl border border-border bg-surface-inset/20 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs leading-5 text-muted">{description}</p>
            <SelectField
              aria-label="Filter outputs by job"
              value={jobFilter}
              onValueChange={changeJobFilter}
              className="h-8 w-full sm:w-64"
              options={[
                {
                  value: 'all',
                  label: `All outputs (${filteredArtifacts.length})`,
                },
                ...(hasImportedOutputs
                  ? [
                      {
                        value: 'imported',
                        label: `Imported / shared (${filteredArtifacts.filter((artifact) => !artifact.runId).length})`,
                      },
                    ]
                  : []),
                ...availableRuns.map((run) => ({
                  value: run.id,
                  label: `${run.name} · ${filteredArtifacts.filter((artifact) => artifact.runId === run.id).length}`,
                })),
              ]}
            />
          </div>
          {displayedArtifacts.length ? (
            <div className="grid min-w-0 gap-2 sm:grid-cols-2">
              {displayedArtifacts.map((artifact) => {
                const run = getRun(artifact);
                const selected = effectiveSelectedId === artifact.id;
                return (
                  <button
                    key={artifact.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      selectArtifact(artifact.id);
                      onSelect(artifact.id);
                      setChooserOpen(false);
                    }}
                    className={`min-w-0 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong ${selected ? 'border-accent-strong bg-accent-soft/40' : 'border-border hover:bg-surface-hover/40'}`}
                  >
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-xs font-medium text-foreground">
                        {artifact.name}
                      </span>
                      <ValidationBadge status={artifact.status} />
                    </div>
                    <p className="mt-1 truncate text-[11px] text-muted">
                      {ARTIFACT_LABELS[artifact.kind]} · v{artifact.version} ·{' '}
                      {artifact.createdBy}
                      {run
                        ? ` · ${TASK_LABELS[run.type]} · ${run.name} (${run.id})`
                        : ' · Imported / shared'}
                      {artifact.sample ? ' · Demo example' : ''}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center">
              <p className="text-xs font-medium text-foreground">
                {emptyMessage}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                {jobFilter === 'all'
                  ? 'When a job creates an output, it will appear here for teammates.'
                  : 'Try All outputs to see other jobs and imported inputs.'}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
