import {
  PIPELINE_STAGES,
  STAGE_OUTPUT,
  type ArtifactKind,
  type PipelineRun,
} from '@/data/pipeline';

/** Presentation helpers shared by job lists, dashboards, and handoff actions. */
export function getCurrentStep(run: PipelineRun) {
  return (
    run.steps.find((step) => step.status === 'running') ??
    run.steps.find((step) => step.status === 'waiting')
  );
}

export function getNextStage(kind: ArtifactKind) {
  const index = PIPELINE_STAGES.findIndex(
    (stage) => STAGE_OUTPUT[stage] === kind,
  );
  return index >= 0 ? PIPELINE_STAGES[index + 1] : undefined;
}

export function getOutputRoute(kind: ArtifactKind) {
  if (kind === 'insights' || kind === 'clusters') return '/analysis';
  return kind === 'agent_code' ? '/develop' : '/design';
}

export function formatDateTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp);
}

export function formatRunElapsed(run: PipelineRun) {
  const end = ['completed', 'failed', 'cancelled'].includes(run.status)
    ? run.updatedAt
    : Date.now();
  const seconds = Math.max(0, Math.floor((end - run.createdAt) / 1000));
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export const RUN_STATUS_LABELS: Record<PipelineRun['status'], string> = {
  queued: 'Queued',
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};
export const RUN_STATUS_CLASSES: Record<PipelineRun['status'], string> = {
  queued: 'border-border text-muted',
  running: 'border-accent-border bg-accent-soft text-accent-strong',
  paused: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
  completed: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
  failed: 'border-destructive/30 bg-destructive/5 text-destructive',
  cancelled: 'border-border text-muted',
};
