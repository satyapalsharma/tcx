'use client';
import { getArtifactVersion } from '@/lib/artifact-versions';
import { createPipelinePlan, validatePipelinePlan } from '@/lib/pipeline-plan';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useApp } from './AppContext';
import {
  STAGE_INPUT,
  TASK_LABELS,
  DEMO_INSIGHTS,
  DEMO_CLUSTERS,
  DEMO_PROCESS_CONTENT,
  DEMO_UML_CONTENT,
  agentCode,
  stageSteps,
  type Artifact,
  type ArtifactKind,
  type Connection,
  type PipelineEvent,
  type PipelineRun,
  type StageType,
} from '@/data/pipeline';
import { SAMPLE_PIPELINE_STATE } from '@/data/demo-pipeline-state';
import { useBrowserState } from '@/hooks/use-browser-state';
import {
  advanceDemoPipeline,
  readPipelineState,
  reviseArtifact,
  retryAsNewRun,
  transitionRun,
  type ArtifactPatch,
  type RunAction,
} from '@/lib/pipeline-state';

export type StartRunInput = {
  name?: string;
  type: StageType;
  inputKind?: PipelineRun['inputKind'];
  plannedStages?: PipelineRun['plannedStages'];
  sourceArtifactId?: string;
  sourceVersion?: number;
  executionMode?: PipelineRun['executionMode'];
  fileName?: string;
  sourceConnectionId?: string;
  runtime?: string;
  advanced?: Record<string, string | boolean>;
};
type PipelineContextValue = {
  mode: 'demo';
  organizationRuns: PipelineRun[];
  organizationArtifacts: Artifact[];
  artifacts: Artifact[];
  runs: PipelineRun[];
  events: PipelineEvent[];
  connections: Connection[];
  selectedArtifactId: string | null;
  selectedArtifactVersion: number | null;
  selectArtifact: (id: string, version?: number) => void;
  startRun: (input: StartRunInput) => PipelineRun;
  importArtifact: (input: {
    name: string;
    kind: ArtifactKind;
    fileName: string;
  }) => Artifact;
  updateArtifact: (
    id: string,
    patch: ArtifactPatch,
    baseVersion?: number,
  ) => void;
  approveArtifact: (id: string) => void;
  handoffArtifact: (id: string, nextType: StageType, version?: number) => void;
  continueRun: (id: string, mode: 'guided' | 'express') => void;
  pauseRun: (id: string) => void;
  resumeRun: (id: string) => void;
  cancelRun: (id: string) => void;
  retryRun: (id: string) => PipelineRun | undefined;
  connectProvider: (provider: string, name: string) => void;
  disconnectProvider: (id: string) => void;
  recordEvent: (action: string, detail: string) => void;
};
const EMPTY_PIPELINE_STATE = {
  artifacts: [],
  runs: [],
  connections: [],
  events: [],
};
const Context = createContext<PipelineContextValue | null>(null);
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
const CONTENT: Record<Exclude<ArtifactKind, 'agent_code'>, string> = {
  insights: JSON.stringify(DEMO_INSIGHTS),
  clusters: JSON.stringify(DEMO_CLUSTERS),
  process_map: DEMO_PROCESS_CONTENT,
  uml: DEMO_UML_CONTENT,
};

// Preserve sample output provenance when loading earlier prototype state.
function parseStoredPipeline(value: unknown) {
  const parsed = readPipelineState(value);
  if (!parsed) return null;
  const samples = SAMPLE_PIPELINE_STATE.runs.filter(
    (run) =>
      !parsed.runs.some((existing) => existing.id === run.id) &&
      parsed.artifacts.some(
        (artifact) =>
          artifact.runId === run.id && artifact.workspaceId === run.workspaceId,
      ),
  );
  return readPipelineState({ ...parsed, runs: [...parsed.runs, ...samples] });
}

export function PipelineProvider({ children }: { children: ReactNode }) {
  const {
    currentOrg,
    currentWorkspace,
    workspaces,
    openNewRun,
    storageScope,
    accountEmail,
  } = useApp();
  const [state, setState, ready] = useBrowserState(
    `tx-pipeline-v2${storageScope}`,
    storageScope ? EMPTY_PIPELINE_STATE : SAMPLE_PIPELINE_STATE,
    parseStoredPipeline,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  // Demo worker is deliberately isolated from backend polling and domain transitions.
  useEffect(() => {
    if (!ready) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setState((previous) => advanceDemoPipeline(previous, workspaces, now));
    }, 1800);
    return () => window.clearInterval(timer);
  }, [ready, workspaces, setState]);

  const organizationProjectIds = new Set(
    workspaces
      .filter((project) => project.orgId === currentOrg.id)
      .map((project) => project.id),
  );
  const organizationRuns = state.runs.filter((run) =>
    organizationProjectIds.has(run.workspaceId),
  );
  const organizationArtifacts = state.artifacts.filter((artifact) =>
    organizationProjectIds.has(artifact.workspaceId),
  );
  const artifacts = state.artifacts.filter(
    (artifact) => artifact.workspaceId === currentWorkspace.id,
  );
  const runs = state.runs.filter(
    (run) => run.workspaceId === currentWorkspace.id,
  );
  const connections = state.connections.filter(
    (connection) => connection.orgId === currentOrg.id,
  );
  const events = state.events.filter((item) => item.orgId === currentOrg.id);
  const selectedArtifactId = artifacts.some(
    (artifact) => artifact.id === selectedId,
  )
    ? selectedId
    : null;
  const event = (action: string, detail: string): PipelineEvent => ({
    id: uid('event'),
    orgId: currentOrg.id,
    workspaceId: currentWorkspace.id,
    actor: storageScope ? accountEmail : 'Priya Nair',
    action,
    detail,
    time: Date.now(),
  });
  const recordEvent = (action: string, detail: string) => {
    const item = event(action, detail);
    setState((previous) => ({
      ...previous,
      events: [item, ...previous.events].slice(0, 250),
    }));
  };
  const selectArtifact = (id: string, version?: number) => {
    const target = artifacts.find((artifact) => artifact.id === id);
    if (
      !target ||
      (version !== undefined && !getArtifactVersion(target, version))
    )
      return;
    setSelectedId(id);
    setSelectedVersion(version ?? null);
  };
  const startRun = (input: StartRunInput): PipelineRun => {
    if (!currentWorkspace.id)
      throw new Error('Create a project before starting a job.');
    if (
      input.executionMode === 'express' &&
      !['Owner', 'Admin'].includes(currentOrg.role)
    )
      throw new Error('Only organization admins can enable Express mode.');
    if (input.sourceArtifactId) {
      const source = artifacts.find(
        (artifact) => artifact.id === input.sourceArtifactId,
      );
      if (!source || !STAGE_INPUT[input.type].includes(source.kind))
        throw new Error('Choose a compatible input from this project.');
      if (
        input.sourceVersion !== undefined &&
        !getArtifactVersion(source, input.sourceVersion)
      )
        throw new Error(
          'That output version is no longer available. Choose another version.',
        );
    } else if (!input.fileName?.trim() && !input.sourceConnectionId) {
      throw new Error('Choose a file, connected source, or project output.');
    }
    if (
      input.sourceConnectionId &&
      !connections.some(
        (connection) =>
          connection.id === input.sourceConnectionId &&
          connection.status === 'connected',
      )
    )
      throw new Error('Choose a connected source in this organization.');
    if (input.plannedStages) {
      const source = artifacts.find(
        (artifact) => artifact.id === input.sourceArtifactId,
      );
      const problem = validatePipelinePlan(
        input.type,
        input.plannedStages,
        source?.kind,
      );
      if (problem) throw new Error(problem);
    }
    const now = Date.now();
    const name =
      input.name?.trim() ||
      `${TASK_LABELS[input.type]} · ${new Date(now).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
    const plannedStages = input.plannedStages ?? createPipelinePlan(input.type);
    const steps =
      plannedStages &&
      (plannedStages.length > 1 || input.type === 'full_pipeline')
        ? [
            {
              id: 'prepare',
              label: 'Prepare input',
              status: 'waiting' as const,
            },
            ...plannedStages.map((stage) => ({
              id: stage,
              label: TASK_LABELS[stage],
              status: 'waiting' as const,
            })),
          ]
        : stageSteps(input.type);
    const run: PipelineRun = {
      id: uid('JOB').toUpperCase(),
      workspaceId: currentWorkspace.id,
      name,
      type: input.type,
      status: 'queued',
      progress: 0,
      steps,
      inputKind: input.inputKind,
      plannedStages,
      createdAt: now,
      updatedAt: now,
      sourceArtifactId: input.sourceArtifactId,
      executionMode: input.executionMode ?? 'guided',
      sourceVersion:
        input.sourceVersion ??
        artifacts.find((artifact) => artifact.id === input.sourceArtifactId)
          ?.version,
      fileName: input.fileName?.trim(),
      sourceConnectionId: input.sourceConnectionId,
      runtime: input.runtime,
      advanced: input.advanced,
    };
    const item = event('Job queued', `${name} · ${TASK_LABELS[input.type]}`);
    setState((previous) => ({
      ...previous,
      runs: [run, ...previous.runs],
      events: [item, ...previous.events].slice(0, 250),
    }));
    return run;
  };
  const importArtifact: PipelineContextValue['importArtifact'] = ({
    name,
    kind,
    fileName,
  }) => {
    if (!name.trim() || !fileName.trim())
      throw new Error('Choose a file and name for this input.');
    const asset: Artifact = {
      id: uid('import'),
      workspaceId: currentWorkspace.id,
      kind,
      name: name.trim(),
      status: 'draft',
      version: 1,
      createdBy: storageScope ? accountEmail : 'Priya Nair',
      updatedAt: new Date().toISOString(),
      notes: `Imported file: ${fileName}. Demo preview uses the billing-support fixture; file contents are not parsed.`,
      content: kind === 'agent_code' ? agentCode('Google ADK') : CONTENT[kind],
      sample: true,
    };
    const item = event(
      'Input imported',
      `${name} · ${fileName} · demo preview`,
    );
    setState((previous) => ({
      ...previous,
      artifacts: [asset, ...previous.artifacts],
      events: [item, ...previous.events].slice(0, 250),
    }));
    setSelectedId(asset.id);
    setSelectedVersion(null);
    return asset;
  };
  const updateArtifact = (
    id: string,
    patch: ArtifactPatch,
    baseVersion?: number,
  ) => {
    const now = Date.now();
    const item = event('Output updated', id);
    setState((previous) => {
      const target = previous.artifacts.find(
        (artifact) =>
          artifact.id === id && artifact.workspaceId === currentWorkspace.id,
      );
      if (!target) return previous;
      if (patch.name !== undefined && !patch.name.trim()) return previous;
      const revised = reviseArtifact(
        target,
        {
          ...patch,
          ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
        },
        item.actor,
        now,
        baseVersion,
      );
      return {
        ...previous,
        artifacts: previous.artifacts.map((artifact) =>
          artifact.id === id ? revised : artifact,
        ),
        events: [
          {
            ...item,
            action:
              revised.version > target.version
                ? 'New output revision'
                : patch.status === 'approved'
                  ? 'SME validation recorded'
                  : 'Output updated',
            detail: `${revised.name} · v${revised.version}`,
          },
          ...previous.events,
        ].slice(0, 250),
      };
    });
  };
  const approveArtifact = (id: string) =>
    updateArtifact(id, { status: 'approved' });
  const handoffArtifact = (
    id: string,
    nextType: StageType,
    version?: number,
  ) => {
    const target = artifacts.find((artifact) => artifact.id === id);
    if (!target || !STAGE_INPUT[nextType].includes(target.kind)) return;
    setSelectedId(id);
    if (version !== undefined && !getArtifactVersion(target, version)) return;
    openNewRun(nextType, {
      sourceArtifactId: id,
      sourceVersion: version ?? target.version,
    });
  };
  const controlRun = (id: string, action: RunAction) => {
    const now = Date.now();
    const candidate = runs.find((run) => run.id === id);
    if (!candidate || transitionRun(candidate, action, now) === candidate)
      return;
    const retryId = action === 'retry' ? uid('JOB').toUpperCase() : undefined;
    const retry = retryId ? retryAsNewRun(candidate, retryId, now) : undefined;
    const item = event(
      `Job ${action === 'retry' ? 'retried' : action === 'pause' ? 'paused' : action === 'resume' ? 'resumed' : 'cancelled'}`,
      id,
    );
    setState((previous) => {
      const target = previous.runs.find(
        (run) => run.id === id && run.workspaceId === currentWorkspace.id,
      );
      if (!target) return previous;
      const transitioned = transitionRun(target, action, now);
      if (transitioned === target) return previous;
      const nextRuns = retryId
        ? [retryAsNewRun(target, retryId, now), ...previous.runs]
        : previous.runs.map((run) => (run.id === id ? transitioned : run));
      return {
        ...previous,
        runs: nextRuns,
        events: [
          {
            ...item,
            detail: retryId
              ? `${target.name} · ${id} retried as ${retryId}; previous outputs retained`
              : target.name,
          },
          ...previous.events,
        ].slice(0, 250),
      };
    });
    return retry;
  };
  const continueRun: PipelineContextValue['continueRun'] = (id, mode) => {
    if (mode === 'express' && !['Owner', 'Admin'].includes(currentOrg.role))
      return;
    const now = Date.now();
    setState((previous) => ({
      ...previous,
      runs: previous.runs.map((run) =>
        run.id === id &&
        run.workspaceId === currentWorkspace.id &&
        run.status === 'paused'
          ? transitionRun({ ...run, executionMode: mode }, 'resume', now)
          : run,
      ),
    }));
    recordEvent('Pipeline continued', `${id} · ${mode}`);
  };
  const connectProvider = (provider: string, name: string) => {
    if (!provider.trim()) return;
    const connection: Connection = {
      id: uid('connection'),
      orgId: currentOrg.id,
      provider,
      name: name.trim() || provider,
      status: 'connected',
      lastSync: 'Demo · no external sync',
    };
    const item = event('Demo connection added', connection.name);
    setState((previous) => ({
      ...previous,
      connections: [connection, ...previous.connections],
      events: [item, ...previous.events].slice(0, 250),
    }));
  };
  const disconnectProvider = (id: string) => {
    const item = event('Demo connection removed', id);
    setState((previous) => {
      const target = previous.connections.find(
        (connection) =>
          connection.id === id && connection.orgId === currentOrg.id,
      );
      if (!target) return previous;
      return {
        ...previous,
        connections: previous.connections.filter(
          (connection) => connection.id !== id,
        ),
        events: [{ ...item, detail: target.name }, ...previous.events].slice(
          0,
          250,
        ),
      };
    });
  };
  if (!ready)
    return (
      <div
        className="grid min-h-screen place-items-center text-sm text-muted"
        role="status"
      >
        Opening project…
      </div>
    );
  return (
    <Context.Provider
      value={{
        mode: 'demo',
        organizationRuns,
        organizationArtifacts,
        artifacts,
        runs,
        connections,
        events,
        selectedArtifactId,
        selectedArtifactVersion: selectedArtifactId ? selectedVersion : null,
        selectArtifact,
        startRun,
        importArtifact,
        updateArtifact,
        approveArtifact,
        handoffArtifact,
        continueRun,
        pauseRun: (id) => controlRun(id, 'pause'),
        resumeRun: (id) => controlRun(id, 'resume'),
        cancelRun: (id) => controlRun(id, 'cancel'),
        retryRun: (id) => controlRun(id, 'retry'),
        connectProvider,
        disconnectProvider,
        recordEvent,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function usePipeline() {
  const context = useContext(Context);
  if (!context) throw new Error('PipelineProvider is required');
  return context;
}
