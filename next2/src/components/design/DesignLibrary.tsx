'use client';

import { useMemo, useState } from 'react';
import { Clock3, FileCode2, GitBranch, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ARTIFACT_LABELS,
  TASK_LABELS,
  type Artifact,
  type PipelineRun,
} from '@/data/pipeline';

type Props = {
  artifacts: Artifact[];
  runs: PipelineRun[];
  selectedId?: string | null;
  selectedVersion?: number;
  onSelect: (artifact: Artifact, version: number) => void;
  getVersion: (artifact: Artifact, version: number) => Artifact | undefined;
};

export function DesignLibrary({
  artifacts,
  runs,
  selectedId,
  selectedVersion,
  onSelect,
  getVersion,
}: Props) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | 'process_map' | 'uml'>('all');
  const items = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return artifacts
      .filter((item) => item.kind === 'process_map' || item.kind === 'uml')
      .filter((item) => kind === 'all' || item.kind === kind)
      .filter((item) => {
        if (!normalized) return true;
        const run = runs.find((candidate) => candidate.id === item.runId);
        return [item.name, item.id, run?.name, run?.id]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalized));
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [artifacts, kind, query, runs]);

  return (
    <section
      id="design-library"
      aria-label="Design library"
      className="space-y-4 rounded-2xl border border-border bg-surface p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Design library</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Browse process maps and UML sequences by project output, source job,
            and saved revision.
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <label className="relative min-w-48 flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search designs or jobs"
              aria-label="Search design library"
              className="pl-8 sm:w-56"
            />
          </label>
          <div className="flex rounded-lg border border-border p-1">
            {(
              [
                ['all', 'All'],
                ['process_map', 'Process maps'],
                ['uml', 'UML'],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={kind === value ? 'secondary' : 'ghost'}
                className="h-8 px-2 text-xs"
                aria-pressed={kind === value}
                onClick={() => setKind(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {items.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((artifact) => {
            const run = runs.find(
              (candidate) => candidate.id === artifact.runId,
            );
            const sourceId = artifact.sourceId;
            const sourceHead = artifacts.find(
              (candidate) => candidate.id === sourceId,
            );
            const sourceVersion = artifact.sourceVersion;
            const sourceArtifact = sourceHead
              ? getVersion(sourceHead, sourceVersion ?? sourceHead.version)
              : undefined;
            const selected = selectedId === artifact.id;
            const revisions = [
              artifact.version,
              ...(artifact.history ?? []).map((revision) => revision.version),
            ]
              .filter((version, index, all) => all.indexOf(version) === index)
              .filter((version) => getVersion(artifact, version))
              .sort((a, b) => b - a);
            const viewedVersion = selected
              ? (selectedVersion ?? artifact.version)
              : artifact.version;
            return (
              <article
                key={artifact.id}
                className={`min-w-0 rounded-xl border p-4 transition-colors ${selected ? 'border-accent-strong bg-accent-soft/20' : 'border-border bg-surface hover:bg-surface-hover/40'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <div className="rounded-lg bg-accent-soft p-2 text-accent-strong">
                      <FileCode2 className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold">
                        {artifact.name}
                      </h3>
                      <p className="mt-1 text-xs text-muted">
                        {ARTIFACT_LABELS[artifact.kind]}
                        {artifact.sample ? ' · Example' : ''}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 capitalize">
                    {artifact.status}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2 border-t border-border pt-3 text-xs text-muted">
                  <p className="flex min-w-0 items-center gap-1.5">
                    <GitBranch className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {sourceArtifact
                        ? `${ARTIFACT_LABELS[sourceArtifact.kind]}: ${sourceArtifact.name}${sourceVersion ? ` · v${sourceVersion}` : ''}`
                        : run
                          ? `${TASK_LABELS[run.type]}: ${run.name}`
                          : 'Imported or shared output'}
                    </span>
                  </p>
                  {run && (
                    <p className="truncate pl-5 font-mono text-[10px]">
                      Job {run.id}
                    </p>
                  )}
                  {sourceArtifact && (
                    <p className="truncate pl-5 text-[10px]">
                      Source output · {sourceArtifact.id}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5">
                    <Clock3 className="size-3.5 shrink-0" />
                    Updated {new Date(
                      artifact.updatedAt,
                    ).toLocaleDateString()}{' '}
                    · {artifact.updatedBy ?? artifact.createdBy}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Select
                    value={String(viewedVersion)}
                    onValueChange={(value) => onSelect(artifact, Number(value))}
                  >
                    <SelectTrigger
                      aria-label={`Choose revision for ${artifact.name}`}
                      className="h-9 min-w-0 flex-1 text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {revisions.map((version) => (
                        <SelectItem key={version} value={String(version)}>
                          {version === artifact.version
                            ? `Current · v${version}`
                            : `Saved revision · v${version}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant={selected ? 'secondary' : 'outline'}
                    size="sm"
                    className="h-9 shrink-0"
                    onClick={() => onSelect(artifact, viewedVersion)}
                  >
                    {selected ? 'Open version' : 'Open design'}
                  </Button>
                </div>
                {selected && getVersion(artifact, viewedVersion) && (
                  <p className="mt-2 text-[11px] text-accent-strong">
                    Viewing revision {viewedVersion}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-4 py-9 text-center">
          <p className="text-sm font-medium">No matching designs yet</p>
          <p className="mt-1 text-xs text-muted">
            Start a new design from an analysis output or open a previous job.
          </p>
        </div>
      )}
    </section>
  );
}
