'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../components/AppShell';
import { PageHeader, StatusBadge } from '@/components/common';
import { Disclosure } from '@/components/common/Disclosure';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import { usePipeline } from '@/context/PipelineContext';
import { type ArtifactKind } from '@/data/pipeline';
import { AGENT_RUNTIMES, agentFileName } from '@/lib/agent-runtime';
import { Progress } from '@/components/ui/progress';
import {
  JobOutputPicker,
  ValidationBadge,
} from '@/components/pipeline/JobOutputPicker';

const runtimes = AGENT_RUNTIMES;
const designKinds: ArtifactKind[] = ['process_map', 'uml'];

export default function Develop() {
  const { currentWorkspace, openNewRun } = useApp();
  const toast = useToast();
  const {
    artifacts,
    runs,
    selectedArtifactId,
    selectArtifact,
    handoffArtifact,
    approveArtifact,
    retryRun,
  } = usePipeline();
  const inputs = artifacts.filter(
    (item) => item.kind === 'process_map' || item.kind === 'uml',
  );
  const builds = artifacts.filter((item) => item.kind === 'agent_code');
  const [pinnedInputId, setPinnedInputId] = useState<string | null>(null);
  const selectedInput = inputs.find((item) => item.id === selectedArtifactId);
  const input = inputs.find(
    (item) => item.id === (pinnedInputId ?? selectedInput?.id),
  );
  const eligibleBuilds = input
    ? builds.filter(
        (item) =>
          item.sourceId === input.id ||
          (Boolean(input.runId) && item.runId === input.runId),
      )
    : builds;
  const selected =
    eligibleBuilds.find((item) => item.id === selectedArtifactId) ??
    eligibleBuilds[0];
  const activeRuns = runs.filter(
    (run) =>
      (run.type === 'generate_agent' ||
        run.plannedStages?.includes('generate_agent')) &&
      ['queued', 'running', 'paused'].includes(run.status),
  );
  const activePipelineRun = input?.runId
    ? activeRuns.find(
        (run) =>
          run.id === input.runId &&
          (run.type === 'full_pipeline' ||
            run.plannedStages?.includes('generate_agent')),
      )
    : undefined;
  const code = selected?.content ?? '';
  const buildRun = runs.find((run) => run.id === selected?.runId);
  const sourceArtifact = artifacts.find(
    (artifact) => artifact.id === selected?.sourceId,
  );
  const runtime =
    buildRun?.runtime ??
    (selected
      ? (runtimes.find(
          (value) =>
            selected.name.includes(value) || selected.notes.includes(value),
        ) ?? 'Google ADK')
      : 'Google ADK');
  const fileName = agentFileName(runtime);
  const latestBuildRun = [...runs]
    .filter(
      (run) =>
        run.type === 'generate_agent' ||
        run.plannedStages?.includes('generate_agent'),
    )
    .sort((a, b) => b.createdAt - a.createdAt)[0];

  async function copyCode() {
    if (!code) return;
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error('Clipboard access is unavailable.');
      await navigator.clipboard.writeText(code);
      toast('Agent code copied', 'check');
    } catch {
      toast(
        'Could not copy automatically. Select the code and copy it manually.',
        'warn',
      );
    }
  }
  function downloadCode() {
    if (!code) return;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(href);
  }

  return (
    <AppShell crumb="Develop">
      <div
        className="mx-auto w-full max-w-[1280px] space-y-6 p-5 sm:p-8"
        data-od-id="develop-page"
      >
        <PageHeader
          title="Develop"
          description={`Build agent code from a shared process map or UML sequence in Project ${currentWorkspace.name}.`}
          actions={
            <>
              <Button
                asChild={Boolean(activePipelineRun)}
                variant="accent"
                onClick={
                  activePipelineRun
                    ? undefined
                    : () =>
                        input
                          ? handoffArtifact(input.id, 'generate_agent')
                          : openNewRun('generate_agent')
                }
              >
                {activePipelineRun ? (
                  <Link
                    href={`/jobs?jobId=${encodeURIComponent(activePipelineRun.id)}`}
                  >
                    View pipeline progress
                  </Link>
                ) : input ? (
                  'Build from this design'
                ) : (
                  'Generate agent code'
                )}
              </Button>
              <Link
                href={
                  activePipelineRun
                    ? `/jobs?jobId=${encodeURIComponent(activePipelineRun.id)}`
                    : '/jobs'
                }
                className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm hover:bg-surface-inset"
              >
                View runs
              </Link>
            </>
          }
        />

        <section className="space-y-3">
          <JobOutputPicker
            key={currentWorkspace.id}
            kinds={designKinds}
            selectedId={input?.id ?? null}
            title="Choose a design input"
            description="Pick a process map or UML sequence for this build."
            emptyMessage="No shared design inputs yet. You can build directly from a flow definition you already have."
            onSelect={(id) => {
              setPinnedInputId(id);
              selectArtifact(id);
            }}
          />
          {inputs.length ? (
            input ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3">
                <div>
                  <p className="text-sm font-medium">
                    Selected input: {input.name}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {input.kind === 'process_map'
                      ? 'Process map'
                      : 'UML sequence'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted">
                Choose one of the inputs above to configure a build from it.
              </p>
            )
          ) : (
            <Card className="flex flex-col items-start gap-3 p-5">
              <div>
                <h3 className="text-sm font-semibold">
                  Build from your own map
                </h3>
                <p className="mt-1 max-w-xl text-sm text-muted">
                  Choose an uploaded flow definition or tool specification as
                  the input. You do not need an upstream stage.
                </p>
              </div>
              <Button
                variant="accent"
                onClick={() => openNewRun('generate_agent')}
              >
                Generate agent code
              </Button>
            </Card>
          )}
        </section>

        {activeRuns.length > 0 && (
          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Agent build progress</h2>
                <p className="text-xs text-muted">
                  Track current runs from the shared job list.
                </p>
              </div>
              <Link
                href={
                  activePipelineRun
                    ? `/jobs?jobId=${encodeURIComponent(activePipelineRun.id)}`
                    : '/jobs'
                }
                className="text-xs font-medium text-accent-strong"
              >
                Open jobs →
              </Link>
            </div>
            {activeRuns.map((run) => {
              const step =
                run.steps.find((item) => item.status === 'running')?.label ??
                (run.status === 'queued'
                  ? 'Waiting to start'
                  : run.status === 'paused'
                    ? 'Paused'
                    : 'Preparing output');
              return (
                <div
                  key={run.id}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{run.name}</p>
                      <p className="text-xs text-muted">
                        {run.runtime || 'Runtime pending'} · {step}
                      </p>
                    </div>
                    <StatusBadge
                      status={run.status === 'running' ? 'accent' : 'muted'}
                    >
                      {run.status}
                    </StatusBadge>
                  </div>
                  <Progress
                    aria-label={`${run.name} progress`}
                    value={Math.min(100, Math.max(0, run.progress))}
                    className="mt-2 h-1.5 bg-surface-inset [&_[data-slot=progress-indicator]]:bg-accent-strong"
                  />
                  <div className="mt-2 flex flex-wrap gap-1">
                    {run.steps.map((item) => (
                      <Badge key={item.id} variant="outline">
                        {item.label} · {item.status}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        {latestBuildRun?.status === 'failed' && (
          <Card className="flex flex-wrap items-center justify-between gap-3 border-danger/30 p-4">
            <div>
              <h2 className="text-sm font-semibold text-danger-fg">
                Agent build failed
              </h2>
              <p className="mt-1 text-xs text-muted">
                {latestBuildRun.error ||
                  `${latestBuildRun.name} could not produce an output.`}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => retryRun(latestBuildRun.id)}
            >
              Retry build
            </Button>
          </Card>
        )}

        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Generated code</h2>
            <p className="text-xs text-muted">
              Choose a saved agent artifact to inspect, copy, or download. The
              build runtime is selected in the shared run options.
            </p>
          </div>
          {selected ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-border p-3">
                <h3 className="text-sm font-semibold">
                  Agent outputs{input ? ` for ${input.name}` : ''}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {eligibleBuilds.map((build) => (
                    <Button
                      key={build.id}
                      size="sm"
                      variant={
                        selected.id === build.id ? 'secondary' : 'outline'
                      }
                      onClick={() => selectArtifact(build.id)}
                    >
                      {build.name}
                    </Button>
                  ))}
                </div>
              </div>
              <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {fileName}
                    </Badge>
                    <span className="text-xs text-muted">{runtime}</span>
                    {selected.sample && <Badge variant="outline">Sample</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyCode}
                      disabled={!code}
                    >
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={downloadCode}
                      disabled={!code}
                    >
                      Download
                    </Button>
                  </div>
                </div>
                <pre className="max-h-[600px] overflow-auto bg-surface-inset/30 p-4 text-xs leading-relaxed text-foreground">
                  <code>
                    {code || 'This artifact has no code content yet.'}
                  </code>
                </pre>
                <Disclosure
                  className="border-t border-border px-4 py-3"
                  triggerClassName="cursor-pointer text-xs font-medium"
                  title={<>Advanced details and review</>}
                >
                  <p className="mt-2 text-xs text-muted">
                    Source design:{' '}
                    {sourceArtifact?.name ??
                      selected.sourceId ??
                      'not recorded'}{' '}
                    · Build job:{' '}
                    {buildRun?.name ?? buildRun?.id ?? 'not recorded'} ·
                    Runtime: {runtime}
                    {selected.notes && ` · ${selected.notes}`}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <ValidationBadge status={selected.status} />
                    {selected.validatedBy && (
                      <span className="text-xs text-muted">
                        Validated by {selected.validatedBy} · v
                        {selected.validatedVersion ?? selected.version}
                      </span>
                    )}
                    {selected.status !== 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approveArtifact(selected.id)}
                      >
                        Mark validated
                      </Button>
                    )}
                  </div>
                </Disclosure>
              </Card>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <h3 className="font-semibold">
                {input
                  ? 'No agent build for this input yet'
                  : 'No agent code yet'}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {input
                  ? 'Build from this design to create a code artifact linked to the selected input.'
                  : 'Generated code will appear here with its source and build job.'}
              </p>
            </Card>
          )}
        </section>

        <section aria-labelledby="deploy-heading">
          <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <h2 id="deploy-heading" className="text-sm font-semibold">
                Deployment
              </h2>
              <p className="mt-1 text-sm text-muted">
                No deployment is configured. This project can generate and
                export code, but cannot deploy it yet.
              </p>
            </div>
            <Badge variant="outline">Not configured</Badge>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
