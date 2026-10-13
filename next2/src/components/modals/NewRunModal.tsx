'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useApp,
  type ModularTaskType,
  type Workspace,
} from '@/context/AppContext';
import { usePipeline } from '@/context/PipelineContext';
import {
  PIPELINE_STAGES,
  STAGE_INPUT,
  TASK_LABELS,
  type ArtifactKind,
  type PipelineStage,
  type StageType,
} from '@/data/pipeline';
import { useToast } from '@/components/Toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Disclosure } from '@/components/common/Disclosure';
import {
  JobInputSelector,
  type JobInputKind,
  type JobSourceMode,
} from '@/components/pipeline/JobInputSelector';
import { JobPipelinePlan } from '@/components/pipeline/JobPipelinePlan';
import { getClusterOptions } from '@/lib/cluster-options';
import { AGENT_RUNTIMES } from '@/lib/agent-runtime';
import {
  createPipelinePlan,
  requiredStagesFor,
  validatePipelinePlan,
} from '@/lib/pipeline-plan';
import { JobAdvancedOptions } from '@/components/pipeline/JobAdvancedOptions';
import { getArtifactVersion } from '@/lib/artifact-versions';
import { JobTypePicker } from '@/components/pipeline/JobTypePicker';
const RUNTIMES = AGENT_RUNTIMES;
const STAGE_ORDER = PIPELINE_STAGES;
function defaultName(type: StageType) {
  return `${TASK_LABELS[type]} · ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
}
function defaultAdvanced(type: StageType): Record<string, string | boolean> {
  if (type === 'extract_intents' || type === 'full_pipeline')
    return {
      language: 'Auto-detect',
      maskSensitiveData: true,
      redaction: 'Standard masking',
    };
  if (type === 'cluster_intents')
    return { groupDepth: 'All three levels (L1–L2–L3)' };
  if (type === 'design_flow')
    return {
      mapDetail: 'Balanced',
      clusterTarget: 'all',
      clusterName: 'All clusters',
    };
  if (type === 'generate_uml') return { diagramDetail: 'Standard' };
  return { includeToolStubs: true };
}

export function NewRunModal() {
  const { isNewRunOpen, newRunDefaultType, currentWorkspace, newRunSource } =
    useApp();
  if (!isNewRunOpen) return null;
  return (
    <NewJobDialog
      key={`${newRunDefaultType}-${currentWorkspace.id}-${newRunSource?.sourceArtifactId ?? ''}-${newRunSource?.sourceVersion ?? ''}`}
      initialType={newRunDefaultType}
      workspace={currentWorkspace}
    />
  );
}

function NewJobDialog({
  initialType,
  workspace,
}: {
  initialType: ModularTaskType;
  workspace: Workspace;
}) {
  const { closeNewRun, currentOrg, newRunSource } = useApp();
  const { artifacts, connections, selectedArtifactId, startRun } =
    usePipeline();
  const toast = useToast();
  const router = useRouter();
  const [taskType, setTaskType] = useState<StageType>(initialType);
  const [name, setName] = useState('');
  const [sourceMode, setSourceMode] = useState<JobSourceMode>(() =>
    artifacts.some((a) =>
      (initialType === 'design_flow'
        ? ['insights', 'clusters']
        : STAGE_INPUT[initialType]
      ).includes(a.kind),
    )
      ? 'artifact'
      : 'file',
  );
  const [artifactId, setArtifactId] = useState(
    newRunSource?.sourceArtifactId ?? '',
  );
  const [connectionId, setConnectionId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [inputKind, setInputKind] = useState<JobInputKind>('conversations');
  const [endStage, setEndStage] = useState<Exclude<StageType, 'full_pipeline'>>(
    initialType === 'full_pipeline' ? 'generate_agent' : initialType,
  );
  const [expressStages, setExpressStages] = useState<PipelineStage[]>(() =>
    createPipelinePlan(
      initialType,
      initialType === 'full_pipeline' ? 'generate_agent' : initialType,
    ),
  );
  const [runtime, setRuntime] = useState<string>(RUNTIMES[0]);
  const [executionMode, setExecutionMode] = useState<'guided' | 'express'>(
    'guided',
  );
  const [advanced, setAdvanced] = useState<Record<string, string | boolean>>(
    () => defaultAdvanced(initialType),
  );
  const [error, setError] = useState('');
  const compatibleArtifacts = useMemo(
    () =>
      artifacts.filter((artifact) =>
        (taskType === 'design_flow'
          ? ['insights', 'clusters']
          : STAGE_INPUT[taskType]
        ).includes(artifact.kind),
      ),
    [artifacts, taskType],
  );
  const hasConnections =
    taskType === 'extract_intents' || taskType === 'full_pipeline';
  const compatibleSelected = compatibleArtifacts.find(
    (artifact) => artifact.id === selectedArtifactId,
  );
  const chosenHead =
    compatibleArtifacts.find((artifact) => artifact.id === artifactId) ??
    compatibleSelected ??
    compatibleArtifacts[0];
  const chosenArtifact =
    chosenHead &&
    newRunSource?.sourceArtifactId === chosenHead.id &&
    newRunSource.sourceVersion !== undefined
      ? getArtifactVersion(chosenHead, newRunSource.sourceVersion)
      : chosenHead;
  const clusterOptions = useMemo(
    () => (taskType === 'design_flow' ? getClusterOptions(chosenArtifact) : []),
    [taskType, chosenArtifact],
  );
  const chosenConnection = connections.find(
    (connection) =>
      connection.id === connectionId && connection.status === 'connected',
  );
  const hasInput =
    sourceMode === 'file'
      ? Boolean(file)
      : sourceMode === 'artifact'
        ? Boolean(chosenArtifact)
        : Boolean(chosenConnection);
  const startIndex = STAGE_ORDER.indexOf(
    taskType === 'full_pipeline' ? 'extract_intents' : taskType,
  );
  const endIndex = Math.max(startIndex, STAGE_ORDER.indexOf(endStage));
  const sourceKind: ArtifactKind | undefined =
    sourceMode === 'artifact' ? chosenArtifact?.kind : STAGE_INPUT[taskType][0];
  const skipClustering = advanced.skipClustering === true;
  const plannedStages =
    executionMode === 'express'
      ? skipClustering
        ? expressStages.filter((stage) => stage !== 'cluster_intents')
        : expressStages
      : createPipelinePlan(taskType, endStage, skipClustering);
  const expressStageLocks = useMemo(() => {
    const locks: Partial<Record<PipelineStage, string>> = {
      [taskType === 'full_pipeline' ? 'extract_intents' : taskType]:
        'The starting step for this job.',
    };
    for (const selected of expressStages) {
      for (const required of requiredStagesFor(selected, sourceKind)) {
        if (required !== selected && expressStages.includes(required))
          locks[required] = `Required for ${TASK_LABELS[selected]}.`;
      }
    }
    return locks;
  }, [expressStages, sourceKind, taskType]);
  const isRuntimeTask = plannedStages.includes('generate_agent');

  const changeType = (type: StageType) => {
    setTaskType(type);
    setEndStage(type === 'full_pipeline' ? 'generate_agent' : type);
    setExpressStages(
      createPipelinePlan(
        type,
        type === 'full_pipeline' ? 'generate_agent' : type,
      ),
    );
    setAdvanced(defaultAdvanced(type));
    setArtifactId('');
    setConnectionId('');
    setFile(null);
    setError('');
    if (type === 'extract_intents' || type === 'full_pipeline')
      setSourceMode('file');
    else
      setSourceMode(
        artifacts.some((a) =>
          (type === 'design_flow'
            ? ['insights', 'clusters']
            : STAGE_INPUT[type]
          ).includes(a.kind),
        )
          ? 'artifact'
          : 'file',
      );
  };
  const selectSourceMode = (mode: JobSourceMode) => {
    setSourceMode(mode);
    setError('');
  };
  const toggleExpressStage = (stage: PipelineStage, checked: boolean) => {
    if (stage === 'cluster_intents' && checked)
      setAdvanced((current) => ({ ...current, skipClustering: false }));
    setExpressStages((current) => {
      const next = new Set(current);
      if (checked) {
        for (const required of requiredStagesFor(stage, sourceKind))
          next.add(required);
      } else {
        const isRequiredBySelection = current.some(
          (selected) =>
            selected !== stage &&
            requiredStagesFor(selected, sourceKind).includes(stage),
        );
        if (isRequiredBySelection) return current;
        next.delete(stage);
      }
      return STAGE_ORDER.filter((item) => next.has(item));
    });
    setError('');
  };
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      const planError = validatePipelinePlan(
        taskType,
        plannedStages,
        sourceKind,
      );
      if (planError) throw new Error(planError);
      const run = startRun({
        name: name.trim() || defaultName(taskType),
        type: taskType,
        inputKind:
          hasConnections && sourceMode === 'file' ? inputKind : undefined,
        plannedStages,
        executionMode,
        sourceArtifactId:
          sourceMode === 'artifact' ? chosenArtifact?.id : undefined,
        sourceVersion:
          sourceMode === 'artifact' ? chosenArtifact?.version : undefined,
        sourceConnectionId:
          sourceMode === 'connection' ? chosenConnection?.id : undefined,
        fileName: sourceMode === 'file' ? file?.name : undefined,
        runtime: isRuntimeTask ? runtime : undefined,
        advanced:
          taskType === 'design_flow'
            ? {
                ...advanced,
                clusterTarget: clusterOptions.some(
                  (option) => option.value === advanced.clusterTarget,
                )
                  ? String(advanced.clusterTarget)
                  : 'all',
                clusterName:
                  clusterOptions.find(
                    (option) => option.value === advanced.clusterTarget,
                  )?.label ?? 'All clusters',
              }
            : advanced,
      });
      closeNewRun();
      toast(`${run.id} queued in ${workspace.name}`, 'play');
      router.push(`/jobs?jobId=${encodeURIComponent(run.id)}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to create this job. Check the input and try again.',
      );
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && closeNewRun()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {taskType === 'full_pipeline'
              ? 'Start full pipeline'
              : taskType === 'design_flow'
                ? 'Generate process map'
                : taskType === 'generate_uml'
                  ? 'Generate UML diagram'
                  : taskType === 'generate_agent'
                    ? 'Generate agent code'
                    : 'New analysis job'}
          </DialogTitle>
          <DialogDescription>
            Choose an input for{' '}
            <span className="font-medium text-foreground">
              {workspace.name}
            </span>{' '}
            to get started.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <JobTypePicker value={taskType} onValueChange={changeType} />

          <JobInputSelector
            taskType={taskType}
            sourceMode={sourceMode}
            onSourceModeChange={selectSourceMode}
            artifacts={compatibleArtifacts}
            chosenArtifact={chosenArtifact}
            artifactId={artifactId}
            onArtifactChange={setArtifactId}
            connections={connections}
            connectionId={connectionId}
            onConnectionChange={setConnectionId}
            file={file}
            onFileChange={setFile}
            inputKind={inputKind}
            onInputKindChange={(kind) => {
              setInputKind(kind);
              setFile(null);
            }}
          />

          {hasInput && (
            <JobPipelinePlan
              fileName={sourceMode === 'file' ? file?.name : undefined}
              inputLabel={
                sourceMode === 'artifact'
                  ? `${chosenArtifact?.name} · v${chosenArtifact?.version}`
                  : chosenConnection?.name
              }
              taskType={taskType}
              startIndex={startIndex}
              endIndex={
                executionMode === 'express' ? STAGE_ORDER.length - 1 : endIndex
              }
              stageOrder={STAGE_ORDER}
              plannedStages={plannedStages}
              onEndStageChange={setEndStage}
              runtime={isRuntimeTask ? runtime : undefined}
              runtimes={RUNTIMES}
              onRuntimeChange={setRuntime}
              executionMode={executionMode}
              stageLocks={expressStageLocks}
              onStageToggle={toggleExpressStage}
            />
          )}

          <Disclosure
            className="rounded-xl border border-border px-3"
            triggerClassName="cursor-pointer py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
            title={
              <>
                Job details{' '}
                <span className="ml-2 text-xs font-normal text-muted">
                  Optional name
                </span>
              </>
            }
          >
            <div className="space-y-4 border-t border-border py-3">
              <div className="space-y-1.5">
                <Label htmlFor="job-name">
                  Job name{' '}
                  <span className="font-normal text-muted">(optional)</span>
                </Label>
                <Input
                  id="job-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={defaultName(taskType)}
                  maxLength={100}
                />
              </div>
            </div>
          </Disclosure>
          <JobAdvancedOptions
            taskType={taskType}
            advanced={advanced}
            onChange={setAdvanced}
            clusterOptions={clusterOptions}
            canSkipClustering={
              taskType === 'full_pipeline' || taskType === 'extract_intents'
            }
            canUseExpressMode={
              currentOrg.role === 'Owner' || currentOrg.role === 'Admin'
            }
            executionMode={executionMode}
            onExecutionModeChange={setExecutionMode}
          />

          <p className="text-[11px] leading-4 text-muted">
            Preview processing: uploaded file contents are not processed. Jobs
            create clearly labeled sample outputs.
          </p>
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeNewRun}>
              Close
            </Button>
            <Button type="submit" variant="accent" disabled={!hasInput}>
              {taskType === 'full_pipeline' ? 'Start pipeline' : 'Queue job'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
