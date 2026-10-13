'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../components/AppShell';
import { PageHeader, StatusBadge } from '@/components/common';
import { Disclosure } from '@/components/common/Disclosure';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { usePipeline } from '@/context/PipelineContext';
import { getArtifactVersion } from '@/lib/artifact-versions';
import { DesignSourceBadge } from '@/components/design/DesignSourceBadge';
import { DesignLibrary } from '@/components/design/DesignLibrary';
import {
  ARTIFACT_LABELS,
  type Artifact,
  type ArtifactKind,
  type StageType,
} from '@/data/pipeline';
import { DiagramPreview } from '@/components/pipeline/DiagramPreview';
import { MermaidEditor } from '@/components/pipeline/MermaidEditor';
import { MermaidPreview } from '@/components/pipeline/MermaidPreview';
import { ValidationBadge } from '@/components/pipeline/JobOutputPicker';
import {
  addProcessNode,
  connectProcessNodes,
  disconnectProcessNodes,
  parseDiagramSteps,
  parseProcessConnections,
  parseProcessNodes,
  removeProcessNode,
  replaceDiagramSteps,
} from '@/lib/diagram-source';

type DesignKind = Extract<ArtifactKind, 'process_map' | 'uml'>;
const kindLabels: Record<DesignKind, string> = {
  process_map: 'Process map',
  uml: 'UML sequence',
};
const nextStage: Record<DesignKind, Exclude<StageType, 'full_pipeline'>> = {
  process_map: 'generate_uml',
  uml: 'generate_agent',
};

export default function Design() {
  const { currentWorkspace, openNewRun } = useApp();
  const {
    artifacts,
    runs,
    selectedArtifactId,
    selectedArtifactVersion,
    selectArtifact,
    handoffArtifact,
    updateArtifact,
    approveArtifact,
    retryRun,
  } = usePipeline();
  const designArtifacts = artifacts.filter(
    (item) => item.kind === 'process_map' || item.kind === 'uml',
  );
  const selectedHead = designArtifacts.find(
    (item) => item.id === selectedArtifactId,
  );
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const current = selectedHead
    ? getArtifactVersion(
        selectedHead,
        selectedVersion ?? selectedArtifactVersion ?? selectedHead.version,
      )
    : undefined;
  const [tab, setTab] = useState<DesignKind>(
    current?.kind === 'uml' ? 'uml' : 'process_map',
  );
  const [editing, setEditing] = useState(false);
  const [stepNames, setStepNames] = useState<string[]>([]);
  const [editContent, setEditContent] = useState('');
  const [newStepName, setNewStepName] = useState('');
  const [connectFrom, setConnectFrom] = useState('');
  const [connectTo, setConnectTo] = useState('');
  const [notes, setNotes] = useState('');
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [sourceDraft, setSourceDraft] = useState('');
  const [mermaidArtifact, setMermaidArtifact] = useState<Artifact | null>(null);
  const [mermaidHeadVersion, setMermaidHeadVersion] = useState<number | null>(
    null,
  );
  const [nameDraft, setNameDraft] = useState('');
  const [editTarget, setEditTarget] = useState<{
    id: string;
    version: number;
    headVersion: number;
  } | null>(null);
  const [sourceTarget, setSourceTarget] = useState<{
    id: string;
    version: number;
    headVersion: number;
  } | null>(null);
  const [editError, setEditError] = useState('');
  const [sourceError, setSourceError] = useState('');
  const [mermaidDirty, setMermaidDirty] = useState(false);
  const [confirmMermaidDiscard, setConfirmMermaidDiscard] = useState(false);
  const [continueFromId, setContinueFromId] = useState('');
  const currentForTab = current?.kind === tab ? current : undefined;

  const related = useMemo(
    () =>
      artifacts.filter(
        (item) => item.kind === 'clusters' || item.kind === 'insights',
      ),
    [artifacts],
  );
  const sourceRun = runs.find((run) => run.id === current?.runId);
  const stageType: StageType =
    tab === 'process_map' ? 'design_flow' : 'generate_uml';
  const stageRun = [...runs]
    .filter(
      (run) => run.type === stageType || run.plannedStages?.includes(stageType),
    )
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  const runIsActive =
    stageRun && ['queued', 'running', 'paused'].includes(stageRun.status);
  const selectedPipelineActive = Boolean(
    current &&
    sourceRun &&
    ['queued', 'running', 'paused'].includes(sourceRun.status) &&
    (sourceRun.type === 'full_pipeline' ||
      sourceRun.plannedStages?.includes(nextStage[current.kind as DesignKind])),
  );
  const draftNodes =
    currentForTab?.kind === 'process_map' ? parseProcessNodes(editContent) : [];
  const draftConnections =
    currentForTab?.kind === 'process_map'
      ? parseProcessConnections(editContent)
      : [];
  const startEdit = (artifact: Artifact, label?: string) => {
    const content = artifact.content ?? '';
    setEditContent(content);
    setStepNames(parseDiagramSteps(content));
    const nodes =
      artifact.kind === 'process_map' ? parseProcessNodes(content) : [];
    setConnectFrom(nodes[0]?.id ?? '');
    setConnectTo(nodes[1]?.id ?? nodes[0]?.id ?? '');
    setEditingLabel(label ?? null);
    setNotes(artifact.notes ?? '');
    setNameDraft(artifact.name);
    const head = designArtifacts.find((item) => item.id === artifact.id);
    setEditTarget({
      id: artifact.id,
      version: artifact.version,
      headVersion: head?.version ?? artifact.version,
    });
    setEditError('');
    setEditing(true);
  };
  const updateProcessDraft = (content: string) => {
    setEditContent(content);
    setStepNames(parseDiagramSteps(content));
    const nodes = parseProcessNodes(content);
    setConnectFrom((value) =>
      nodes.some((node) => node.id === value) ? value : (nodes[0]?.id ?? ''),
    );
    setConnectTo((value) =>
      nodes.some((node) => node.id === value)
        ? value
        : (nodes[1]?.id ?? nodes[0]?.id ?? ''),
    );
  };
  const saveEdit = () => {
    const target =
      editTarget &&
      designArtifacts.find((artifact) => artifact.id === editTarget.id);
    if (!target || !editTarget) return;
    if (target.version !== editTarget.headVersion) {
      setEditError(
        'This output has a newer revision. Close the editor and reopen it before saving.',
      );
      return;
    }
    updateArtifact(
      target.id,
      {
        name: nameDraft.trim() || target.name,
        content: replaceDiagramSteps(
          editContent || target.content || '',
          stepNames,
        ),
        notes,
      },
      editTarget.version,
    );
    selectArtifact(target.id);
    setSelectedVersion(null);
    setEditing(false);
    setEditTarget(null);
    setEditError('');
  };
  const saveSource = () => {
    const target =
      sourceTarget &&
      designArtifacts.find((artifact) => artifact.id === sourceTarget.id);
    if (!target || !sourceTarget) return;
    if (target.version !== sourceTarget.headVersion) {
      setSourceError(
        'This output has a newer revision. Close the editor and reopen it before saving.',
      );
      return;
    }
    updateArtifact(target.id, { content: sourceDraft }, sourceTarget.version);
    selectArtifact(target.id);
    setSelectedVersion(null);
    setSourceOpen(false);
    setSourceTarget(null);
    setSourceError('');
  };
  const requestMermaidClose = () => {
    if (mermaidDirty) {
      setConfirmMermaidDiscard(true);
      return;
    }
    setMermaidArtifact(null);
    setMermaidHeadVersion(null);
  };
  const handleMermaidDirtyChange = useCallback(
    (dirty: boolean) => setMermaidDirty(dirty),
    [setMermaidDirty],
  );

  return (
    <AppShell crumb="Design">
      <div
        className="mx-auto w-full max-w-[1280px] space-y-6 p-5 sm:p-8"
        data-od-id="design-page"
      >
        <PageHeader
          title="Design workspace"
          description={`Create and refine process maps and UML sequences for Project ${currentWorkspace.name}.`}
          actions={
            <div className="flex flex-wrap justify-end gap-2">
              {selectedPipelineActive && sourceRun ? (
                <Button asChild variant="outline">
                  <a href={`/jobs?jobId=${encodeURIComponent(sourceRun.id)}`}>
                    View pipeline progress
                  </a>
                </Button>
              ) : current ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    handoffArtifact(
                      current.id,
                      nextStage[current.kind as DesignKind],
                      current.version,
                    )
                  }
                >
                  {current.kind === 'process_map'
                    ? 'Continue to UML'
                    : 'Continue to Develop'}
                </Button>
              ) : null}
              <Button
                variant="accent"
                onClick={() => openNewRun('design_flow')}
              >
                New design
              </Button>
            </div>
          }
        />

        <section
          className="grid gap-4 lg:grid-cols-2"
          aria-label="Start a design"
        >
          <Card className="flex flex-col justify-between gap-4 border-accent-border/50 bg-accent-soft/20 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-strong">
                Start fresh
              </p>
              <h2 className="mt-2 text-lg font-semibold">New design</h2>
              <p className="mt-1 max-w-xl text-sm text-muted">
                Upload a source file or start a new process mapping job.
              </p>
            </div>
            <Button
              variant="accent"
              className="w-fit"
              onClick={() => openNewRun('design_flow')}
            >
              Create a new design
            </Button>
          </Card>

          <Card className="space-y-4 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Continue work
              </p>
              <h2 className="mt-2 text-lg font-semibold">
                Continue from analysis or previous work
              </h2>
              <p className="mt-1 text-sm text-muted">
                Start from conversation insights or clusters, or reopen a saved
                design from the library.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {related.length > 0 ? (
                <>
                  <Select
                    value={continueFromId || undefined}
                    onValueChange={setContinueFromId}
                  >
                    <SelectTrigger
                      aria-label="Analysis output to continue from"
                      className="min-w-56 flex-1"
                    >
                      <SelectValue placeholder="Choose an analysis output" />
                    </SelectTrigger>
                    <SelectContent>
                      {related.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} · v{item.version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    disabled={!continueFromId}
                    onClick={() => {
                      const source = related.find(
                        (item) => item.id === continueFromId,
                      );
                      if (source)
                        openNewRun('design_flow', {
                          sourceArtifactId: source.id,
                          sourceVersion: source.version,
                        });
                    }}
                  >
                    Continue from analysis
                  </Button>
                </>
              ) : (
                <p className="rounded-md bg-surface-inset/40 px-3 py-2 text-xs text-muted">
                  No analysis outputs yet. Run Analysis first, or open saved
                  work in the library.
                </p>
              )}
              <Button
                variant="ghost"
                onClick={() =>
                  document
                    .getElementById('design-library')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              >
                Browse previous work
              </Button>
            </div>
          </Card>
        </section>

        {related.length > 0 && (
          <Disclosure
            className="rounded-xl border border-border bg-surface px-4"
            triggerClassName="cursor-pointer py-3 text-sm font-medium"
            title={<>Analysis source details ({related.length})</>}
          >
            <div className="grid gap-3 border-t border-border py-3 sm:grid-cols-2 lg:grid-cols-3">
              {related.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-surface p-3"
                >
                  <div className="flex justify-between gap-2">
                    <span className="text-sm font-semibold">{item.name}</span>
                    <StatusBadge
                      status={
                        item.status === 'approved'
                          ? 'success'
                          : item.status === 'review'
                            ? 'warn'
                            : 'muted'
                      }
                    >
                      {item.status}
                    </StatusBadge>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {ARTIFACT_LABELS[item.kind]}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() =>
                      openNewRun('design_flow', {
                        sourceArtifactId: item.id,
                        sourceVersion: item.version,
                      })
                    }
                  >
                    Start from this analysis
                  </Button>
                </div>
              ))}
            </div>
          </Disclosure>
        )}

        {runIsActive && stageRun && (
          <Card className="space-y-3 border-accent-border/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">
                  {stageRun.status === 'paused'
                    ? stageRun.waitingFor === 'handoff'
                      ? 'Pipeline ready to continue'
                      : 'Pipeline paused'
                    : 'Pipeline in progress'}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  {stageRun.name} · {Math.round(stageRun.progress)}%
                </p>
              </div>
              <Link
                href={`/jobs?jobId=${encodeURIComponent(stageRun.id)}`}
                className="text-xs font-medium text-accent-strong hover:underline"
              >
                Open job details
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {stageRun.steps.map((step) => (
                <Badge key={step.id} variant="outline" className="capitalize">
                  {step.label} · {step.status}
                </Badge>
              ))}
            </div>
          </Card>
        )}
        {stageRun?.status === 'failed' && (
          <Card className="flex flex-wrap items-center justify-between gap-3 border-danger/30 p-4">
            <div>
              <h2 className="text-sm font-semibold text-danger-fg">
                Design run failed
              </h2>
              <p className="mt-1 text-xs text-muted">
                {stageRun.error ||
                  `${stageRun.name} could not produce an output.`}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => retryRun(stageRun.id)}
            >
              Retry run
            </Button>
          </Card>
        )}

        <DesignLibrary
          key={currentWorkspace.id}
          artifacts={artifacts}
          runs={runs}
          selectedId={selectedHead?.id ?? null}
          selectedVersion={current?.version}
          getVersion={getArtifactVersion}
          onSelect={(artifact, version) => {
            selectArtifact(artifact.id);
            setSelectedVersion(version);
            setTab(artifact.kind as DesignKind);
            document
              .getElementById('active-design')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />

        <div id="active-design" className="scroll-mt-20 space-y-4">
          {(tab === 'uml' ||
            (currentForTab &&
              currentForTab.version === selectedHead?.version &&
              currentForTab.status !== 'approved')) && (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    More options
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {tab === 'uml' && (
                    <DropdownMenuItem
                      onSelect={() => openNewRun('generate_uml')}
                    >
                      New UML sequence
                    </DropdownMenuItem>
                  )}
                  {currentForTab &&
                    currentForTab.version === selectedHead?.version &&
                    currentForTab.status !== 'approved' && (
                      <DropdownMenuItem
                        onSelect={() => approveArtifact(currentForTab.id)}
                      >
                        Mark validated
                      </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as DesignKind)}
          >
            {(['process_map', 'uml'] as const).map((kind) => (
              <TabsContent value={kind} key={kind} className="space-y-4">
                {currentForTab && currentForTab.kind === kind ? (
                  <>
                    <Card className="overflow-hidden">
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-semibold">
                              {currentForTab.name}
                            </h2>
                            <StatusBadge
                              status={
                                currentForTab.status === 'approved'
                                  ? 'success'
                                  : currentForTab.status === 'review'
                                    ? 'warn'
                                    : 'muted'
                              }
                            >
                              {currentForTab.status}
                            </StatusBadge>
                            {currentForTab.sample && (
                              <Badge variant="outline">Sample</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            kind === 'process_map'
                              ? (setMermaidArtifact(currentForTab),
                                setMermaidHeadVersion(
                                  selectedHead?.version ??
                                    currentForTab.version,
                                ))
                              : startEdit(currentForTab)
                          }
                        >
                          Edit{' '}
                          {kind === 'process_map' ? 'process map' : 'sequence'}
                        </Button>
                      </div>
                      <DesignSourceBadge
                        artifact={currentForTab}
                        artifacts={artifacts}
                        runs={runs}
                      />
                      <div className="p-3 sm:p-5">
                        {kind === 'process_map' ? (
                          <MermaidPreview
                            key={currentForTab.id}
                            content={currentForTab.content ?? ''}
                            label={currentForTab.name}
                          />
                        ) : (
                          <DiagramPreview
                            key={currentForTab.id}
                            content={currentForTab.content ?? ''}
                            kind={kind}
                            onEdit={(label) => startEdit(currentForTab, label)}
                          />
                        )}
                      </div>
                      {currentForTab.sample && (
                        <p className="border-t border-border px-4 py-2 text-xs text-muted">
                          Sample content for exploring the designer.
                        </p>
                      )}
                    </Card>
                    <Disclosure
                      className="rounded-xl border border-border bg-surface p-4"
                      triggerClassName="cursor-pointer text-sm font-medium"
                      title={<>Advanced details and editing</>}
                    >
                      <p className="mt-2 text-xs text-muted">
                        Version {currentForTab.version} · Updated by{' '}
                        {currentForTab.updatedBy ?? currentForTab.createdBy}
                        {sourceRun && (
                          <>
                            {' '}
                            · {sourceRun.name} · {sourceRun.id}
                          </>
                        )}
                        {currentForTab.validatedBy && (
                          <>
                            {' '}
                            · Validated by {currentForTab.validatedBy} at v
                            {currentForTab.validatedVersion ??
                              currentForTab.version}
                          </>
                        )}
                      </p>
                      <ValidationBadge status={currentForTab.status} />
                      {currentForTab.version !== selectedHead?.version && (
                        <p className="mt-2 rounded-md bg-accent-soft/30 px-3 py-2 text-xs text-accent-strong">
                          Viewing revision {currentForTab.version}. Editing or
                          continuing from it creates a new job or revision while
                          keeping this saved version intact.
                        </p>
                      )}
                      {(() => {
                        const sourceId = currentForTab.sourceId;
                        const sourceHead = sourceId
                          ? artifacts.find((item) => item.id === sourceId)
                          : undefined;
                        const sourceVersion = currentForTab.sourceVersion;
                        const sourceArtifact = sourceHead
                          ? getArtifactVersion(
                              sourceHead,
                              sourceVersion ?? sourceHead.version,
                            )
                          : undefined;
                        return (
                          <div className="mt-3 rounded-lg border border-accent-border/50 bg-accent-soft/15 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-strong">
                              Source
                            </p>
                            <p className="mt-1 text-sm font-medium">
                              {sourceArtifact
                                ? `${ARTIFACT_LABELS[sourceArtifact.kind]} · ${sourceArtifact.name}`
                                : sourceRun
                                  ? `${sourceRun.name} · ${sourceRun.id}`
                                  : 'Imported or shared design'}
                            </p>
                            {sourceArtifact && (
                              <p className="mt-1 text-xs text-muted">
                                {sourceArtifact.id} · revision{' '}
                                {sourceVersion ?? sourceArtifact.version}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                      {kind === 'uml' && (
                        <>
                          <p className="mt-2 text-xs text-muted">
                            The source editor supports a limited Mermaid subset;
                            other syntax remains visible as source preview.
                            Source changes create a new revision.
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3"
                            onClick={() => {
                              setSourceDraft(currentForTab.content ?? '');
                              setSourceTarget({
                                id: currentForTab.id,
                                version: currentForTab.version,
                                headVersion:
                                  selectedHead?.version ??
                                  currentForTab.version,
                              });
                              setSourceError('');
                              setSourceOpen(true);
                            }}
                          >
                            Edit sequence source
                          </Button>
                        </>
                      )}
                    </Disclosure>
                  </>
                ) : (
                  <Card className="p-10 text-center">
                    <h2 className="font-semibold">
                      {designArtifacts.some((item) => item.kind === kind)
                        ? `Choose a saved ${kindLabels[kind].toLowerCase()}`
                        : `No ${kindLabels[kind].toLowerCase()} output yet`}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {designArtifacts.some((item) => item.kind === kind)
                        ? 'Open a design from the library above to view, edit, or continue with a saved version.'
                        : stageRun?.status === 'failed'
                          ? 'Review the failed run above and retry, or start another run.'
                          : current?.kind === 'process_map' && kind === 'uml'
                            ? 'Continue from the selected process map, or choose another source from the library.'
                            : 'Start from an analysis output or create a new design job.'}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        if (
                          designArtifacts.some((item) => item.kind === kind)
                        ) {
                          document
                            .getElementById('design-library')
                            ?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start',
                            });
                          return;
                        }
                        if (kind === 'uml' && current?.kind === 'process_map')
                          handoffArtifact(
                            current.id,
                            'generate_uml',
                            current.version,
                          );
                        else
                          openNewRun(
                            kind === 'uml' ? 'generate_uml' : 'design_flow',
                          );
                      }}
                    >
                      {designArtifacts.some((item) => item.kind === kind)
                        ? 'Browse saved designs'
                        : kind === 'uml' && current?.kind === 'process_map'
                          ? 'Continue from selected map'
                          : kind === 'uml'
                            ? 'New UML sequence'
                            : 'New process map'}
                    </Button>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <Dialog
          open={Boolean(mermaidArtifact)}
          onOpenChange={(open) => {
            if (!open) requestMermaidClose();
          }}
        >
          <DialogContent className="flex max-h-[92vh] w-[calc(100vw-2rem)] sm:max-w-6xl flex-col overflow-y-auto">
            <div>
              <DialogTitle className="text-lg">Edit process map</DialogTitle>
              <DialogDescription>
                Edit Mermaid source or process nodes and links, review the live
                preview, and save a new shared revision.
              </DialogDescription>
            </div>
            {mermaidArtifact && (
              <MermaidEditor
                key={mermaidArtifact.id}
                artifact={mermaidArtifact}
                onSave={(patch) => {
                  const latest = artifacts.find(
                    (artifact) => artifact.id === mermaidArtifact.id,
                  );
                  if (!latest || latest.version !== mermaidHeadVersion)
                    throw new Error(
                      'This process map has a newer revision. Close the editor and reopen it before saving.',
                    );
                  updateArtifact(
                    mermaidArtifact.id,
                    patch,
                    mermaidArtifact.version,
                  );
                  selectArtifact(mermaidArtifact.id);
                  setSelectedVersion(null);
                  setMermaidArtifact(null);
                  setMermaidHeadVersion(null);
                  setMermaidDirty(false);
                }}
                onClose={requestMermaidClose}
                onDirtyChange={handleMermaidDirtyChange}
              />
            )}
          </DialogContent>
        </Dialog>
        <AlertDialog
          open={confirmMermaidDiscard}
          onOpenChange={setConfirmMermaidDiscard}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
              <AlertDialogDescription>
                Your process map edits have not been saved. You can continue
                editing or discard this draft.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep editing</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  setConfirmMermaidDiscard(false);
                  setMermaidArtifact(null);
                  setMermaidHeadVersion(null);
                  setMermaidDirty(false);
                }}
              >
                Discard changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog
          open={editing && Boolean(editTarget)}
          onOpenChange={(open) => {
            if (!open) {
              setEditing(false);
              setEditTarget(null);
              setEditError('');
            }
          }}
        >
          <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
            <div>
              <DialogTitle className="text-lg">
                Edit{' '}
                {editTarget
                  ? kindLabels[
                      (designArtifacts.find(
                        (artifact) => artifact.id === editTarget.id,
                      )?.kind ?? 'process_map') as DesignKind
                    ].toLowerCase()
                  : 'design'}
              </DialogTitle>
              <DialogDescription>
                {editingLabel ? `Editing “${editingLabel}” · ` : ''}Save creates
                a new shared revision; teammates can review it.
              </DialogDescription>
            </div>
            {editTarget &&
              (() => {
                const head = designArtifacts.find(
                  (artifact) => artifact.id === editTarget.id,
                );
                const target = head
                  ? getArtifactVersion(head, editTarget.version)
                  : undefined;
                return target ? (
                  <>
                    <label className="block space-y-1 text-sm">
                      Name
                      <Input
                        value={nameDraft}
                        onChange={(event) => setNameDraft(event.target.value)}
                      />
                    </label>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {target.kind === 'process_map'
                          ? 'Process steps'
                          : 'Participants and messages'}
                      </p>
                      {stepNames.map((step, index) => (
                        <div
                          key={`${target.id}-${index}`}
                          className="flex gap-2"
                        >
                          <Input
                            aria-label={`${target.kind === 'process_map' ? 'Step' : 'Participant or message'} ${index + 1} name`}
                            autoFocus={Boolean(
                              editingLabel &&
                              (step === editingLabel ||
                                step.endsWith(editingLabel)),
                            )}
                            value={step}
                            onChange={(event) =>
                              setStepNames((prev) =>
                                prev.map((value, i) =>
                                  i === index ? event.target.value : value,
                                ),
                              )
                            }
                          />
                          {target.kind === 'process_map' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              aria-label={`Remove ${step}`}
                              onClick={() =>
                                updateProcessDraft(
                                  removeProcessNode(
                                    replaceDiagramSteps(editContent, stepNames),
                                    draftNodes[index]?.id ?? '',
                                  ),
                                )
                              }
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    {target.kind === 'process_map' && (
                      <div className="space-y-3 rounded-lg border border-border bg-surface-inset/30 p-3">
                        <div>
                          <p className="text-sm font-medium">
                            Add a process step
                          </p>
                          <div className="mt-2 flex gap-2">
                            <Input
                              value={newStepName}
                              onChange={(event) =>
                                setNewStepName(event.target.value)
                              }
                              placeholder="Step name"
                              aria-label="New process step name"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                if (!newStepName.trim()) return;
                                updateProcessDraft(
                                  addProcessNode(
                                    replaceDiagramSteps(editContent, stepNames),
                                    newStepName,
                                  ).content,
                                );
                                setNewStepName('');
                              }}
                            >
                              Add step
                            </Button>
                          </div>
                        </div>
                        <Disclosure
                          triggerClassName="cursor-pointer text-sm font-medium"
                          title={<>Connections · add or remove links</>}
                        >
                          <div className="space-y-3 pt-3">
                            <div>
                              <p className="text-sm font-medium">
                                Connect steps
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Select
                                  value={connectFrom || undefined}
                                  onValueChange={setConnectFrom}
                                >
                                  <SelectTrigger
                                    aria-label="Connection source step"
                                    className="h-9 min-w-0 flex-1 text-xs"
                                  >
                                    <SelectValue placeholder="From step" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {draftNodes.map((node) => (
                                      <SelectItem key={node.id} value={node.id}>
                                        {node.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <span aria-hidden="true" className="text-muted">
                                  →
                                </span>
                                <Select
                                  value={connectTo || undefined}
                                  onValueChange={setConnectTo}
                                >
                                  <SelectTrigger
                                    aria-label="Connection target step"
                                    className="h-9 min-w-0 flex-1 text-xs"
                                  >
                                    <SelectValue placeholder="To step" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {draftNodes.map((node) => (
                                      <SelectItem key={node.id} value={node.id}>
                                        {node.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updateProcessDraft(
                                      connectProcessNodes(
                                        replaceDiagramSteps(
                                          editContent,
                                          stepNames,
                                        ),
                                        connectFrom,
                                        connectTo,
                                      ),
                                    )
                                  }
                                  disabled={
                                    !connectFrom ||
                                    !connectTo ||
                                    connectFrom === connectTo
                                  }
                                >
                                  Connect
                                </Button>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                Current connections
                              </p>
                              {draftConnections.length ? (
                                <ul className="mt-2 space-y-1">
                                  {draftConnections.map((edge, index) => (
                                    <li
                                      key={`${edge.from}-${edge.to}-${index}`}
                                      className="flex items-center justify-between gap-2 rounded bg-surface px-2 py-1.5 text-xs"
                                    >
                                      <span>
                                        {draftNodes.find(
                                          (node) => node.id === edge.from,
                                        )?.label ?? edge.from}{' '}
                                        →{' '}
                                        {draftNodes.find(
                                          (node) => node.id === edge.to,
                                        )?.label ?? edge.to}
                                      </span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() =>
                                          updateProcessDraft(
                                            disconnectProcessNodes(
                                              replaceDiagramSteps(
                                                editContent,
                                                stepNames,
                                              ),
                                              edge.from,
                                              edge.to,
                                            ),
                                          )
                                        }
                                      >
                                        Remove link
                                      </Button>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="mt-1 text-xs text-muted">
                                  No connections yet.
                                </p>
                              )}
                            </div>
                          </div>
                        </Disclosure>
                      </div>
                    )}
                    <label className="block space-y-1 text-sm">
                      Review notes
                      <Textarea
                        rows={3}
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Context for the next teammate"
                      />
                    </label>
                    {editError && (
                      <p role="alert" className="text-sm text-destructive">
                        {editError}
                      </p>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditing(false);
                          setEditTarget(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button variant="accent" onClick={saveEdit}>
                        Save revision
                      </Button>
                    </div>
                  </>
                ) : null;
              })()}
          </DialogContent>
        </Dialog>

        <Dialog
          open={sourceOpen && Boolean(sourceTarget)}
          onOpenChange={(open) => {
            if (!open) {
              setSourceOpen(false);
              setSourceTarget(null);
              setSourceError('');
            }
          }}
        >
          <DialogContent className="max-w-3xl">
            <DialogTitle>Edit source</DialogTitle>
            <DialogDescription>
              Advanced source editor · saving creates a new shared revision.
            </DialogDescription>
            <Textarea
              rows={18}
              className="font-mono text-xs"
              value={sourceDraft}
              onChange={(event) => setSourceDraft(event.target.value)}
            />
            {sourceError && (
              <p role="alert" className="text-sm text-destructive">
                {sourceError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSourceOpen(false);
                  setSourceTarget(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="accent" onClick={saveSource}>
                Save source
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
