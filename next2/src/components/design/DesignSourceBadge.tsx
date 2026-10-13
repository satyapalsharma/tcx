import { GitBranch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Artifact, PipelineRun } from '@/data/pipeline';
import { getArtifactVersion } from '@/lib/artifact-versions';
import { getClusterOptions } from '@/lib/cluster-options';

/** Keep source identity beside the diagram, including when viewing an old revision. */
export function DesignSourceBadge({
  artifact,
  artifacts,
  runs,
}: {
  artifact: Artifact;
  artifacts: Artifact[];
  runs: PipelineRun[];
}) {
  let map = artifact;
  if (artifact.kind === 'uml' && artifact.sourceId) {
    const head = artifacts.find((item) => item.id === artifact.sourceId);
    const source =
      head && getArtifactVersion(head, artifact.sourceVersion ?? head.version);
    if (source?.kind === 'process_map') map = source;
  }
  const head = artifacts.find((item) => item.id === map.sourceId);
  const source =
    head && getArtifactVersion(head, map.sourceVersion ?? head.version);
  const run = runs.find((item) => item.id === map.runId);
  const target = run?.advanced?.clusterTarget;
  const cluster =
    source?.kind === 'clusters' && typeof target === 'string'
      ? getClusterOptions(source).find((item) => item.value === target)
      : undefined;
  const scope =
    source?.kind === 'insights'
      ? 'All intents · clustering skipped'
      : (cluster?.label ??
        (target === 'all' || run?.type === 'full_pipeline'
          ? 'All clusters'
          : typeof run?.advanced?.clusterName === 'string'
            ? run.advanced.clusterName
            : source?.kind === 'clusters'
              ? 'Cluster scope not recorded'
              : 'Imported design'));
  return (
    <div className="flex flex-wrap items-start gap-3 border-b border-accent-border bg-accent-soft/40 px-4 py-3">
      <GitBranch
        className="mt-0.5 size-4 shrink-0 text-accent-strong"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-accent-strong">
          {source?.kind === 'insights'
            ? 'Direct from conversation insights'
            : 'Source cluster / scope'}
        </p>
        <p className="mt-1 text-sm font-semibold">{scope}</p>
        <p className="mt-1 text-xs text-muted">
          {source
            ? `${source.name} · source v${source.version}`
            : map.sourceId
              ? 'Source revision unavailable'
              : 'No analysis source linked'}
          {run ? ` · Job ${run.id}` : ''}
        </p>
      </div>
      <Badge variant="outline" className="shrink-0 bg-surface">
        Viewing v{artifact.version}
      </Badge>
    </div>
  );
}
