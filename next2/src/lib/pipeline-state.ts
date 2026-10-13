import { getArtifactVersion } from '@/lib/artifact-versions';
import { validatePipelinePlan } from '@/lib/pipeline-plan';
import {
  ARTIFACT_LABELS,
  DEMO_CLUSTERS,
  DEMO_INSIGHTS,
  DEMO_PROCESS_CONTENT,
  DEMO_UML_CONTENT,
  STAGE_OUTPUT,
  PIPELINE_STAGES,
  TASK_LABELS,
  agentCode,
  type Artifact,
  type ArtifactKind,
  type Connection,
  type PipelineEvent,
  type PipelineRun,
  type StageType,
} from '@/data/pipeline';

export type PipelineState = {
  artifacts: Artifact[];
  runs: PipelineRun[];
  connections: Connection[];
  events: PipelineEvent[];
};

export type ArtifactPatch = Partial<
  Pick<Artifact, 'name' | 'status' | 'notes' | 'content' | 'analytics'>
>;
export type RunAction = 'pause' | 'resume' | 'cancel' | 'retry';

const STAGES: readonly StageType[] = [...PIPELINE_STAGES, 'full_pipeline'];
const KINDS: readonly ArtifactKind[] = [
  'insights',
  'clusters',
  'process_map',
  'uml',
  'agent_code',
];
const RUN_STATUSES: readonly PipelineRun['status'][] = [
  'queued',
  'running',
  'paused',
  'completed',
  'failed',
  'cancelled',
];
const STEP_STATUSES: readonly PipelineRun['steps'][number]['status'][] = [
  'waiting',
  'running',
  'completed',
  'failed',
];
const ARTIFACT_STATUSES: readonly Artifact['status'][] = [
  'draft',
  'review',
  'approved',
];
const INPUT_KINDS = ['conversations', 'nuance', 'ivr'] as const;
const CONTENT: Record<Exclude<ArtifactKind, 'agent_code'>, string> = {
  insights: JSON.stringify(DEMO_INSIGHTS),
  clusters: JSON.stringify(DEMO_CLUSTERS),
  process_map: DEMO_PROCESS_CONTENT,
  uml: DEMO_UML_CONTENT,
};
const SAMPLE_RUN_IDS: Record<string, string> = {
  'art-insights': 'JOB-1042',
  'art-clusters': 'JOB-1043',
  'art-uml': 'JOB-1044',
  'art-map': 'JOB-1045',
  'art-code': 'JOB-1046',
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const isFiniteNonnegative = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;
const isOneOf = <T extends string>(
  value: unknown,
  values: readonly T[],
): value is T => typeof value === 'string' && values.includes(value as T);
const isOptionalString = (value: unknown): boolean =>
  value === undefined || typeof value === 'string';
const isOptionalFiniteNonnegative = (value: unknown): boolean =>
  value === undefined || isFiniteNonnegative(value);

function validHistory(
  value: unknown,
): value is NonNullable<Artifact['history']> {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        isObject(entry) &&
        isFiniteNonnegative(entry.version) &&
        (entry.content === undefined || typeof entry.content === 'string') &&
        typeof entry.notes === 'string' &&
        isNonEmptyString(entry.updatedAt) &&
        isNonEmptyString(entry.updatedBy),
    )
  );
}

function validArtifact(value: unknown): value is Artifact {
  if (!isObject(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.workspaceId) &&
    isOneOf(value.kind, KINDS) &&
    isNonEmptyString(value.name) &&
    isOneOf(value.status, ARTIFACT_STATUSES) &&
    isFiniteNonnegative(value.version) &&
    isNonEmptyString(value.createdBy) &&
    isNonEmptyString(value.updatedAt) &&
    typeof value.notes === 'string' &&
    typeof value.sample === 'boolean' &&
    (value.content === undefined || typeof value.content === 'string') &&
    isOptionalString(value.validatedBy) &&
    isOptionalString(value.validatedAt) &&
    isOptionalFiniteNonnegative(value.validatedVersion) &&
    isOptionalString(value.updatedBy) &&
    isOptionalString(value.sourceId) &&
    isOptionalFiniteNonnegative(value.sourceVersion) &&
    isOptionalString(value.runId) &&
    (value.history === undefined || validHistory(value.history))
  );
}

function validRun(value: unknown): value is PipelineRun {
  if (
    !isObject(value) ||
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.workspaceId) ||
    !isNonEmptyString(value.name) ||
    !isOneOf(value.type, STAGES) ||
    !isOneOf(value.status, RUN_STATUSES) ||
    !isFiniteNonnegative(value.progress) ||
    value.progress > 100 ||
    !isFiniteNonnegative(value.createdAt) ||
    !isFiniteNonnegative(value.updatedAt) ||
    !Array.isArray(value.steps) ||
    value.steps.length === 0
  )
    return false;
  if (
    !value.steps.every(
      (step) =>
        isObject(step) &&
        isNonEmptyString(step.id) &&
        isNonEmptyString(step.label) &&
        isOneOf(step.status, STEP_STATUSES),
    )
  )
    return false;
  if (
    !isOptionalString(value.sourceArtifactId) ||
    !isOptionalFiniteNonnegative(value.sourceVersion) ||
    !isOptionalString(value.fileName) ||
    !isOptionalString(value.sourceConnectionId) ||
    !isOptionalString(value.runtime) ||
    !isOptionalString(value.error) ||
    !isOptionalString(value.retryOf) ||
    (value.executionMode !== undefined &&
      !isOneOf(value.executionMode, ['guided', 'express'])) ||
    (value.waitingFor !== undefined && value.waitingFor !== 'handoff')
  )
    return false;
  if (value.inputKind !== undefined && !isOneOf(value.inputKind, INPUT_KINDS))
    return false;
  if (value.plannedStages !== undefined) {
    const order = PIPELINE_STAGES;
    const planned = value.plannedStages;
    if (
      !Array.isArray(planned) ||
      !planned.length ||
      !planned.every((stage) => isOneOf(stage, order))
    )
      return false;
    if (validatePipelinePlan(value.type, planned)) return false;
  }
  if (
    value.advanced !== undefined &&
    (!isObject(value.advanced) ||
      !Object.values(value.advanced).every(
        (item) => typeof item === 'string' || typeof item === 'boolean',
      ))
  )
    return false;
  return true;
}

function validConnection(value: unknown): value is Connection {
  return (
    isObject(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.orgId) &&
    isNonEmptyString(value.provider) &&
    isNonEmptyString(value.name) &&
    (value.status === 'connected' || value.status === 'attention') &&
    isNonEmptyString(value.lastSync)
  );
}

function validEvent(value: unknown): value is PipelineEvent {
  return (
    isObject(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.orgId) &&
    typeof value.workspaceId === 'string' &&
    isNonEmptyString(value.actor) &&
    isNonEmptyString(value.action) &&
    typeof value.detail === 'string' &&
    isFiniteNonnegative(value.time)
  );
}

/** Parse and validate persisted state before it reaches React state. */
export function readPipelineState(value: unknown): PipelineState | null {
  if (
    !isObject(value) ||
    !Array.isArray(value.artifacts) ||
    !value.artifacts.every(validArtifact) ||
    !Array.isArray(value.runs) ||
    !value.runs.every(validRun) ||
    !Array.isArray(value.connections) ||
    !value.connections.every(validConnection) ||
    !Array.isArray(value.events) ||
    !value.events.every(validEvent)
  )
    return null;

  const artifacts = (value.artifacts as Artifact[]).map((artifact) =>
    SAMPLE_RUN_IDS[artifact.id] && !artifact.runId
      ? { ...artifact, runId: SAMPLE_RUN_IDS[artifact.id] }
      : artifact,
  );
  const runs = value.runs as PipelineRun[];
  const connections = value.connections as Connection[];
  const events = value.events as PipelineEvent[];
  if (
    !uniqueIds(artifacts) ||
    !uniqueIds(runs) ||
    !uniqueIds(connections) ||
    !uniqueIds(events)
  )
    return null;

  const workspaceOrgs = new Map<string, string>();
  // Events are the persisted bridge between workspace IDs and organization IDs.
  for (const event of events) {
    if (!event.workspaceId) continue; // Organization events may precede any project.
    const knownOrg = workspaceOrgs.get(event.workspaceId);
    if (knownOrg && knownOrg !== event.orgId) return null;
    workspaceOrgs.set(event.workspaceId, event.orgId);
  }
  const artifactById = new Map(
    artifacts.map((artifact) => [artifact.id, artifact]),
  );
  const runById = new Map(runs.map((run) => [run.id, run]));
  const connectionById = new Map(
    connections.map((connection) => [connection.id, connection]),
  );
  for (const artifact of artifacts) {
    if (artifact.sourceId) {
      const source = artifactById.get(artifact.sourceId);
      if (source && source.workspaceId !== artifact.workspaceId) return null;
    }
    if (artifact.runId) {
      const run = runById.get(artifact.runId);
      if (run && run.workspaceId !== artifact.workspaceId) return null;
    }
  }
  for (const run of runs) {
    if (run.retryOf) {
      const sourceRun = runById.get(run.retryOf);
      if (sourceRun && sourceRun.workspaceId !== run.workspaceId) return null;
    }
    if (run.sourceArtifactId) {
      const source = artifactById.get(run.sourceArtifactId);
      if (source && source.workspaceId !== run.workspaceId) return null;
    }
    if (run.sourceConnectionId) {
      const connection = connectionById.get(run.sourceConnectionId);
      const orgId = workspaceOrgs.get(run.workspaceId);
      if (connection && orgId && connection.orgId !== orgId) return null;
    }
  }
  for (const event of events) {
    const orgId = workspaceOrgs.get(event.workspaceId);
    if (orgId && orgId !== event.orgId) return null;
  }

  return {
    artifacts,
    runs,
    connections,
    events,
  };
}

function uniqueIds<T extends { id: string }>(items: T[]): boolean {
  return new Set(items.map((item) => item.id)).size === items.length;
}

function outputFor(
  run: PipelineRun,
  kind: ArtifactKind,
  sourceId: string | undefined,
  now: number,
  sourceVersion?: number,
): Artifact {
  return {
    id: `${run.id}-${kind}`,
    workspaceId: run.workspaceId,
    kind,
    name: `${ARTIFACT_LABELS[kind]} · ${run.name}`,
    status: 'draft',
    version: 1,
    createdBy: 'Demo worker',
    updatedAt: new Date(now).toISOString(),
    sourceId,
    sourceVersion,
    runId: run.id,
    notes:
      'Demo output using the billing-support example. Uploaded file contents have not been analyzed.',
    content:
      kind === 'agent_code'
        ? agentCode(run.runtime ?? 'Google ADK')
        : CONTENT[kind],
    sample: true,
  };
}

/** Advance the demo queue by one worker tick. All generated values derive from inputs. */
export function advanceDemoPipeline(
  state: PipelineState,
  projects: { id: string; orgId: string }[],
  now: number,
): PipelineState {
  if (
    !state.runs.some(
      (run) => run.status === 'queued' || run.status === 'running',
    )
  )
    return state;
  const projectById = new Map(projects.map((project) => [project.id, project]));
  let artifacts = [...state.artifacts];
  const events = [...state.events];
  const activeWorkspaces = new Set(
    state.runs
      .filter((run) => run.status === 'running')
      .map((run) => run.workspaceId),
  );
  const claimed = new Set<string>();
  const runs = state.runs.map((run) => {
    if (run.status === 'queued') {
      if (activeWorkspaces.has(run.workspaceId) || claimed.has(run.workspaceId))
        return run;
      claimed.add(run.workspaceId);
      return {
        ...run,
        status: 'running' as const,
        updatedAt: now,
        steps: run.steps.map((step, index) => ({
          ...step,
          status:
            run.progress >= ((index + 1) * 100) / run.steps.length
              ? ('completed' as const)
              : run.progress >= (index * 100) / run.steps.length
                ? ('running' as const)
                : ('waiting' as const),
        })),
      };
    }
    if (run.status !== 'running') return run;
    const nextProgress = Math.min(100, run.progress + 4);
    // Stop exactly at an output boundary so normal-mode users can use partial results.
    const nextBoundary = run.steps.findIndex(
      (step, index) =>
        step.status !== 'completed' &&
        PIPELINE_STAGES.includes(step.id as (typeof PIPELINE_STAGES)[number]) &&
        nextProgress >= ((index + 1) * 100) / run.steps.length,
    );
    const handoff =
      run.executionMode === 'guided' &&
      nextBoundary >= 0 &&
      nextBoundary < run.steps.length - 1;
    const progress = handoff
      ? ((nextBoundary + 1) * 100) / run.steps.length
      : nextProgress;
    const steps = run.steps.map((step, index) => ({
      ...step,
      status:
        handoff && index > nextBoundary
          ? ('waiting' as const)
          : progress >= ((index + 1) * 100) / run.steps.length
            ? ('completed' as const)
            : progress >= (index * 100) / run.steps.length
              ? ('running' as const)
              : ('waiting' as const),
    }));
    const kinds: ArtifactKind[] =
      run.plannedStages?.map((stage) => STAGE_OUTPUT[stage]) ??
      (run.type === 'full_pipeline'
        ? ['insights', 'clusters', 'process_map', 'uml', 'agent_code']
        : []);
    if (kinds.length > 1 || run.type === 'full_pipeline') {
      kinds.forEach((kind, index) => {
        if (
          steps[index + 1]?.status === 'completed' &&
          !artifacts.some(
            (artifact) => artifact.runId === run.id && artifact.kind === kind,
          )
        ) {
          const prior = artifacts
            .filter((artifact) => artifact.runId === run.id)
            .at(-1);
          artifacts.push(
            outputFor(
              run,
              kind,
              prior?.id ?? run.sourceArtifactId,
              now,
              prior?.version ?? run.sourceVersion,
            ),
          );
        }
      });
    } else if (
      progress === 100 &&
      !artifacts.some((artifact) => artifact.runId === run.id)
    ) {
      const stage = run.type as Exclude<StageType, 'full_pipeline'>;
      artifacts.push(
        outputFor(
          run,
          STAGE_OUTPUT[stage],
          run.sourceArtifactId,
          now,
          run.sourceVersion,
        ),
      );
    }
    if (progress === 100) {
      const orgId = projectById.get(run.workspaceId)?.orgId;
      if (orgId)
        events.unshift({
          id: `${run.id}-completed-${now}`,
          orgId,
          workspaceId: run.workspaceId,
          actor: 'Demo worker',
          action: 'Job completed',
          detail: `${run.name} · ${TASK_LABELS[run.type]}`,
          time: now,
        });
    }
    return {
      ...run,
      progress,
      steps,
      status:
        progress === 100
          ? ('completed' as const)
          : handoff
            ? ('paused' as const)
            : ('running' as const),
      waitingFor: handoff ? ('handoff' as const) : undefined,
      updatedAt: now,
    };
  });
  artifacts = artifacts.filter((artifact) =>
    projectById.has(artifact.workspaceId),
  );
  return { ...state, runs, artifacts, events: events.slice(0, 250) };
}

/** Create a new immutable artifact revision when user-editable output changes. */
export function reviseArtifact(
  artifact: Artifact,
  patch: ArtifactPatch,
  actor: string,
  now: number,
  baseVersion?: number,
): Artifact {
  const base =
    baseVersion !== undefined
      ? getArtifactVersion(artifact, baseVersion)
      : artifact;
  if (!base) return artifact;
  const effectivePatch =
    base.version !== artifact.version
      ? {
          name: base.name,
          content: base.content,
          analytics: base.analytics,
          notes: base.notes,
          ...patch,
        }
      : patch;
  patch = effectivePatch;
  const contentChanged =
    patch.content !== undefined && patch.content !== artifact.content;
  const analyticsChanged =
    patch.analytics !== undefined &&
    JSON.stringify(patch.analytics) !== JSON.stringify(artifact.analytics);
  const nameChanged = patch.name !== undefined && patch.name !== artifact.name;
  const notesChanged =
    patch.notes !== undefined && patch.notes !== artifact.notes;
  const revised =
    contentChanged ||
    analyticsChanged ||
    nameChanged ||
    notesChanged ||
    base.version !== artifact.version;
  const updatedAt = new Date(now).toISOString();
  if (revised) {
    const history = [
      ...(artifact.history ?? []),
      {
        version: artifact.version,
        name: artifact.name,
        sourceId: artifact.sourceId,
        sourceVersion: artifact.sourceVersion,
        baseVersion: artifact.baseVersion,
        status: artifact.status,
        content: artifact.content,
        analytics: artifact.analytics,
        notes: artifact.notes,
        updatedAt: artifact.updatedAt,
        updatedBy: artifact.updatedBy ?? artifact.createdBy,
      },
    ];
    return {
      ...artifact,
      ...patch,
      status: 'draft',
      sourceId: base.sourceId,
      sourceVersion: base.sourceVersion,
      baseVersion: base.version,
      version: artifact.version + 1,
      validatedBy: undefined,
      validatedAt: undefined,
      validatedVersion: undefined,
      updatedBy: actor,
      updatedAt,
      history,
    };
  }
  if (patch.status === 'approved') {
    return {
      ...artifact,
      ...patch,
      validatedBy: actor,
      validatedAt: updatedAt,
      validatedVersion: artifact.version,
      updatedBy: actor,
      updatedAt,
    };
  }
  if (patch.status !== undefined) {
    return {
      ...artifact,
      ...patch,
      validatedBy: undefined,
      validatedAt: undefined,
      validatedVersion: undefined,
      updatedBy: actor,
      updatedAt,
    };
  }
  return { ...artifact, ...patch, updatedBy: actor, updatedAt };
}

/** Create a separate execution attempt while preserving the original run and its outputs. */
export function retryAsNewRun(
  run: PipelineRun,
  newId: string,
  now: number,
): PipelineRun {
  return {
    ...run,
    id: newId,
    retryOf: run.retryOf ?? run.id,
    status: 'queued',
    progress: 0,
    waitingFor: undefined,
    steps: run.steps.map((step) => ({ ...step, status: 'waiting' })),
    error: undefined,
    createdAt: now,
    updatedAt: now,
  };
}

/** Return the updated run when the requested transition is legal; otherwise keep identity. */
export function transitionRun(
  run: PipelineRun,
  action: RunAction,
  now: number,
): PipelineRun {
  const legal =
    action === 'pause'
      ? run.status === 'queued' || run.status === 'running'
      : action === 'resume'
        ? run.status === 'paused'
        : action === 'cancel'
          ? run.status === 'queued' ||
            run.status === 'running' ||
            run.status === 'paused'
          : run.status === 'failed' || run.status === 'cancelled';
  if (!legal) return run;
  const retry = action === 'retry';
  return {
    ...run,
    status:
      action === 'pause'
        ? 'paused'
        : action === 'cancel'
          ? 'cancelled'
          : 'queued',
    waitingFor: undefined,
    progress: retry ? 0 : run.progress,
    steps: retry
      ? run.steps.map((step) => ({ ...step, status: 'waiting' }))
      : run.steps,
    error: undefined,
    updatedAt: now,
  };
}
