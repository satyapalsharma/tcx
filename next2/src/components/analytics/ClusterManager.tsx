'use client';

import {
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type FormEvent,
} from 'react';
import {
  ChevronRight,
  MoreHorizontal,
  MoveRight,
  Pencil,
  Save,
} from 'lucide-react';
import type { Artifact, ClusterNode } from '@/data/pipeline';
import { usePipeline } from '@/context/PipelineContext';
import {
  buildClusterMetrics,
  type ClusterMetric,
  type TranscriptRecord,
} from '@/lib/job-analytics';
import { reviseClusters, type ClusterAction } from '@/lib/cluster-operations';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/common';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type ClusterManagerProps = {
  artifact: Artifact;
  records: TranscriptRecord[];
  onViewTranscripts?: (clusterId: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

type Revision = {
  key: string;
  taxonomy: ClusterNode[];
  records: TranscriptRecord[];
  dirty: boolean;
};
type EditDialog =
  | { kind: 'rename'; nodeId: string; level: 'L1' | 'L2'; name: string }
  | { kind: 'merge'; level: 'L1' | 'L2'; sourceId: string; targetId: string }
  | { kind: 'move'; level: 'L2' | 'L3'; nodeId: string; parentId: string }
  | null;

export function ClusterManager({
  artifact,
  records,
  onViewTranscripts,
  onDirtyChange,
}: ClusterManagerProps) {
  const { updateArtifact } = usePipeline();
  const [revision, setRevision] = useState<Revision | null>(null);
  const [edit, setEdit] = useState<EditDialog>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editingEnabled, setEditingEnabled] = useState(false);
  const [expandedL1, setExpandedL1] = useState<Record<string, boolean>>({});
  const [expandedL2, setExpandedL2] = useState<Record<string, boolean>>({});

  const sourceKey = `${artifact.id}:${artifact.version}:${artifact.content ?? ''}`;
  const parsedTaxonomy = useMemo(
    () => parseTaxonomy(artifact.content),
    [artifact.content],
  );
  const activeRevision = revision?.key === sourceKey ? revision : null;
  const taxonomy = activeRevision?.taxonomy ?? parsedTaxonomy.nodes;
  const workingRecords = activeRevision?.records ?? records;
  const isDirty = activeRevision?.dirty ?? false;
  const metrics = useMemo(
    () =>
      new Map(
        buildClusterMetrics(workingRecords).map((metric) => [
          metric.id,
          metric,
        ]),
      ),
    [workingRecords],
  );
  const flatNodes = useMemo(() => flatten(taxonomy), [taxonomy]);
  const l2Nodes = flatNodes.filter((node) => node.level === 'L2');
  const selectedNode = edit
    ? flatNodes.find(
        (node) => node.id === ('nodeId' in edit ? edit.nodeId : edit.sourceId),
      )
    : undefined;
  const mergeTargets =
    edit?.kind === 'merge'
      ? flatNodes.filter(
          (node) => node.level === edit.level && node.id !== edit.sourceId,
        )
      : [];
  const moveTargets =
    edit?.kind === 'move'
      ? flatNodes.filter(
          (node) => node.level === (edit.level === 'L2' ? 'L1' : 'L2'),
        )
      : [];
  const editTarget =
    edit?.kind === 'merge' || edit?.kind === 'move'
      ? flatNodes.find(
          (node) =>
            node.id === (edit.kind === 'merge' ? edit.targetId : edit.parentId),
        )
      : undefined;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const applyAction = (action: ClusterAction, description: string) => {
    try {
      const result = reviseClusters(taxonomy, workingRecords, action);
      setRevision({
        key: sourceKey,
        taxonomy: result.taxonomy,
        records: result.records,
        dirty: true,
      });
      setError('');
      setNotice(description);
      setEdit(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'The taxonomy change could not be applied.',
      );
    }
  };

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!edit) return;
    if (edit.kind === 'rename')
      applyAction(
        { type: 'rename', id: edit.nodeId, name: edit.name },
        `Renamed ${selectedNode?.name ?? 'category'} to ${edit.name.trim()}. Review the updated taxonomy, then save to keep this change.`,
      );
    if (edit.kind === 'merge') {
      const source = flatNodes.find((node) => node.id === edit.sourceId);
      const target = flatNodes.find((node) => node.id === edit.targetId);
      if (!target) {
        setError('Choose a destination category.');
        return;
      }
      applyAction(
        { type: 'merge', sourceId: edit.sourceId, targetId: edit.targetId },
        `Merged ${source?.name ?? 'source'} into ${target.name}. Child categories and transcript assignments are included in the draft.`,
      );
    }
    if (edit.kind === 'move') {
      const target = flatNodes.find((node) => node.id === edit.parentId);
      if (!target) {
        setError('Choose a parent category.');
        return;
      }
      applyAction(
        { type: 'move', id: edit.nodeId, parentId: edit.parentId },
        `Moved ${selectedNode?.name ?? 'category'} under ${target.name}. Review the updated taxonomy, then save to keep this change.`,
      );
    }
  };

  const handleDrop = (event: DragEvent<HTMLElement>, target: ClusterNode) => {
    event.preventDefault();
    const nodeId = draggedId ?? event.dataTransfer.getData('text/plain');
    setDraggedId(null);
    const source = flatNodes.find((node) => node.id === nodeId);
    if (!source || (source.level !== 'L2' && source.level !== 'L3')) return;
    const expectedParent: ClusterNode['level'] =
      source.level === 'L2' ? 'L1' : 'L2';
    if (target.level !== expectedParent) {
      setError(
        `${source.level} categories can only be dropped on an ${expectedParent} category.`,
      );
      return;
    }
    applyAction(
      { type: 'move', id: source.id, parentId: target.id },
      `Moved ${source.name} under ${target.name}. Review the updated taxonomy, then save.`,
    );
  };

  const saveRevision = () => {
    if (!isDirty) return;
    try {
      const analytics = {
        metricSource: 'transcript estimate',
        transcripts: workingRecords,
        clusters: buildClusterMetrics(workingRecords),
      };
      updateArtifact(artifact.id, {
        content: JSON.stringify(taxonomy),
        analytics,
      });
      setRevision({
        key: sourceKey,
        taxonomy,
        records: workingRecords,
        dirty: false,
      });
      setError('');
      setNotice('Taxonomy changes saved to this artifact.');
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'The taxonomy changes could not be saved.',
      );
    }
  };

  if (parsedTaxonomy.error) {
    return (
      <Card role="alert" className="border-danger/30 p-5 text-sm">
        <h3 className="font-semibold text-foreground">Taxonomy unavailable</h3>
        <p className="mt-1 text-muted">{parsedTaxonomy.error}</p>
      </Card>
    );
  }

  return (
    <section
      className="min-w-0 space-y-4"
      aria-label="Cluster taxonomy manager"
    >
      {artifact.sample && (
        <div className="rounded-xl border border-warn/40 bg-warn-soft px-4 py-3 text-sm text-warn-fg">
          <strong className="font-semibold">Sample taxonomy.</strong> This is
          example data. Changes are saved to this browser demo artifact.
        </div>
      )}
      <Card className="min-w-0 gap-0 overflow-hidden p-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <h2 className="text-sm font-semibold">Cluster taxonomy</h2>
            <p className="mt-1 text-xs text-muted">
              Review conversation volume, complexity, and automation potential
              by category.
            </p>
            {isDirty && (
              <p
                className="mt-1 text-xs font-medium text-warn-fg"
                role="status"
              >
                Unsaved taxonomy changes
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!editingEnabled && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingEnabled(true)}
              >
                <Pencil className="size-3.5" />
                Edit clusters
              </Button>
            )}
            {editingEnabled && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!isDirty}
                  onClick={() => {
                    setRevision(null);
                    setError('');
                    setNotice('Draft changes discarded.');
                    setEditingEnabled(false);
                  }}
                >
                  Discard
                </Button>
                {!isDirty && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingEnabled(false)}
                  >
                    Done editing
                  </Button>
                )}
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  disabled={!isDirty}
                  onClick={saveRevision}
                >
                  <Save className="size-3.5" />
                  Save changes
                </Button>
              </>
            )}
          </div>
        </header>

        {(error || notice) && (
          <div
            className={`mx-4 mt-4 rounded-lg border px-3 py-2.5 text-xs leading-5 ${error ? 'border-danger/40 bg-danger-soft text-danger-fg' : 'border-success/30 bg-success-soft text-success-fg'}`}
            role={error ? 'alert' : 'status'}
          >
            <div className="flex items-start justify-between gap-3">
              <span>{error || notice}</span>
              <button
                type="button"
                className="shrink-0 font-medium underline underline-offset-2"
                onClick={() => {
                  setError('');
                  setNotice('');
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {!taxonomy.length ? (
          <div className="p-10 text-center">
            <h3 className="text-sm font-semibold">No taxonomy categories</h3>
            <p className="mt-1 text-xs text-muted">
              This artifact does not contain an editable category tree.
            </p>
          </div>
        ) : (
          <div className="max-w-full space-y-3 overflow-x-auto p-4">
            {taxonomy.map((l1) => {
              const open = expandedL1[l1.id] ?? false;
              return (
                <article
                  key={l1.id}
                  className="min-w-[560px] rounded-xl border border-border bg-surface"
                  onDragOver={(event) =>
                    editingEnabled && event.preventDefault()
                  }
                  onDrop={(event) => {
                    if (!editingEnabled) return;
                    event.stopPropagation();
                    handleDrop(event, l1);
                  }}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-inset/30 px-3 py-3">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() =>
                        setExpandedL1((state) => ({ ...state, [l1.id]: !open }))
                      }
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <ChevronRight
                        className={`size-4 shrink-0 text-muted transition-transform ${open ? 'rotate-90' : ''}`}
                      />
                      <NodeHeading node={l1} metric={metrics.get(l1.id)} />
                    </button>
                    {editingEnabled && (
                      <NodeActions
                        node={l1}
                        siblings={taxonomy.filter((node) => node.id !== l1.id)}
                        onEdit={setEdit}
                      />
                    )}
                  </div>
                  {open && (
                    <>
                      <p className="px-3 pt-2 font-mono text-[10px] text-muted">
                        {l1.id}
                      </p>
                      <div className="space-y-3 p-3 pl-6 sm:pl-9">
                        {(l1.children ?? []).map((l2) => {
                          const childOpen = expandedL2[l2.id] ?? false;
                          return (
                            <section
                              key={l2.id}
                              className="rounded-lg border border-border/80 bg-background"
                              onDragOver={(event) =>
                                editingEnabled && event.preventDefault()
                              }
                              onDrop={(event) => {
                                if (!editingEnabled) return;
                                event.stopPropagation();
                                handleDrop(event, l2);
                              }}
                            >
                              <div className="flex items-center justify-between gap-3 border-b border-border/70 px-3 py-2.5">
                                <button
                                  type="button"
                                  aria-expanded={childOpen}
                                  onClick={() =>
                                    setExpandedL2((state) => ({
                                      ...state,
                                      [l2.id]: !childOpen,
                                    }))
                                  }
                                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                >
                                  <ChevronRight
                                    className={`size-3.5 shrink-0 text-muted transition-transform ${childOpen ? 'rotate-90' : ''}`}
                                  />
                                  <div
                                    draggable={editingEnabled}
                                    onDragStart={(event) =>
                                      editingEnabled &&
                                      beginDrag(event, l2, setDraggedId)
                                    }
                                  >
                                    <NodeHeading
                                      node={l2}
                                      metric={metrics.get(l2.id)}
                                    />
                                  </div>
                                </button>
                                {editingEnabled && (
                                  <NodeActions
                                    node={l2}
                                    siblings={l2Nodes.filter(
                                      (node) => node.id !== l2.id,
                                    )}
                                    onEdit={setEdit}
                                    canMove
                                  />
                                )}
                              </div>
                              {childOpen && (
                                <>
                                  <p className="px-3 pt-2 font-mono text-[10px] text-muted">
                                    {l2.id}
                                  </p>
                                  <div className="space-y-2 p-3 pl-5 sm:pl-7">
                                    {(l2.children ?? []).map((l3) => (
                                      <LeafDetails
                                        key={l3.id}
                                        node={l3}
                                        metric={metrics.get(l3.id)}
                                        records={workingRecords.filter(
                                          (record) => record.l3Id === l3.id,
                                        )}
                                        onMove={() =>
                                          setEdit({
                                            kind: 'move',
                                            level: 'L3',
                                            nodeId: l3.id,
                                            parentId: l2.id,
                                          })
                                        }
                                        onDragStart={(event) =>
                                          beginDrag(event, l3, setDraggedId)
                                        }
                                        editingEnabled={editingEnabled}
                                        onViewTranscripts={
                                          onViewTranscripts && !isDirty
                                            ? onViewTranscripts
                                            : undefined
                                        }
                                        lockedForDraft={Boolean(
                                          onViewTranscripts && isDirty,
                                        )}
                                      />
                                    ))}
                                    {!l2.children?.length && (
                                      <p className="py-2 text-xs text-muted">
                                        No leaf categories.
                                      </p>
                                    )}
                                  </div>
                                </>
                              )}
                            </section>
                          );
                        })}
                        {!l1.children?.length && (
                          <p className="py-2 text-xs text-muted">
                            No subcategories.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </Card>

      <Dialog
        open={Boolean(edit)}
        onOpenChange={(open) => !open && setEdit(null)}
      >
        {edit && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {edit.kind === 'rename'
                  ? 'Rename category'
                  : edit.kind === 'merge'
                    ? 'Merge categories'
                    : 'Move category'}
              </DialogTitle>
              <DialogDescription>
                Review the specific taxonomy change before adding it to the
                draft.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submitEdit} className="space-y-4">
              {edit.kind === 'rename' && (
                <div className="space-y-2">
                  <label htmlFor="cluster-name" className="text-xs font-medium">
                    Category name
                  </label>
                  <Input
                    id="cluster-name"
                    value={edit.name}
                    onChange={(event) =>
                      setEdit({ ...edit, name: event.target.value })
                    }
                    autoFocus
                    required
                    maxLength={100}
                  />
                </div>
              )}
              {edit.kind === 'merge' && (
                <>
                  <div className="space-y-2">
                    <Label
                      htmlFor="merge-target"
                      className="text-xs font-medium"
                    >
                      Merge into
                    </Label>
                    <SelectField
                      id="merge-target"
                      value={edit.targetId}
                      onValueChange={(value) =>
                        setEdit({ ...edit, targetId: value })
                      }
                      options={[
                        { value: '', label: 'Choose destination' },
                        ...mergeTargets.map((node) => ({
                          value: node.id,
                          label: node.name,
                        })),
                      ]}
                      className="h-9 w-full"
                      size="default"
                    />
                  </div>
                  <div className="rounded-lg bg-surface-inset/50 p-3 text-xs leading-5 text-muted">
                    {selectedNode?.name || 'Source category'} and its child
                    categories will be merged into{' '}
                    <strong className="font-semibold text-foreground">
                      {editTarget?.name || 'the destination'}
                    </strong>
                    . Matching transcript assignments will be updated. You can
                    review the draft tree before saving.
                  </div>
                </>
              )}
              {edit.kind === 'move' && (
                <>
                  <div className="space-y-2">
                    <Label
                      htmlFor="move-target"
                      className="text-xs font-medium"
                    >
                      Move under
                    </Label>
                    <SelectField
                      id="move-target"
                      value={edit.parentId}
                      onValueChange={(value) =>
                        setEdit({ ...edit, parentId: value })
                      }
                      options={[
                        { value: '', label: 'Choose parent' },
                        ...moveTargets.map((node) => ({
                          value: node.id,
                          label: node.name,
                        })),
                      ]}
                      className="h-9 w-full"
                      size="default"
                    />
                  </div>
                  <p className="rounded-lg bg-surface-inset/50 p-3 text-xs leading-5 text-muted">
                    {selectedNode?.name || 'This category'} will move under{' '}
                    <strong className="font-semibold text-foreground">
                      {editTarget?.name || 'the selected parent'}
                    </strong>
                    . Transcript taxonomy assignments will follow the new
                    parent.
                  </p>
                </>
              )}
              {error && (
                <p role="alert" className="text-xs text-danger-fg">
                  {error}
                </p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEdit(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  disabled={
                    edit.kind === 'merge'
                      ? !edit.targetId
                      : edit.kind === 'move'
                        ? !edit.parentId
                        : !edit.name.trim()
                  }
                >
                  {edit.kind === 'rename'
                    ? 'Apply rename'
                    : edit.kind === 'merge'
                      ? 'Merge and review'
                      : 'Move and review'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}

function NodeHeading({
  node,
  metric,
}: {
  node: ClusterNode;
  metric?: ClusterMetric;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            {node.level}
          </span>
          <h3 className="truncate text-sm font-semibold text-foreground">
            {node.name}
          </h3>
          <MetricPills metric={metric} volume={node.volume} />
        </div>
      </div>
    </div>
  );
}

function NodeActions({
  node,
  siblings,
  onEdit,
  canMove = false,
}: {
  node: ClusterNode;
  siblings: ClusterNode[];
  onEdit: (edit: EditDialog) => void;
  canMove?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label={`Actions for ${node.name}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() =>
            onEdit({
              kind: 'rename',
              nodeId: node.id,
              level: node.level as 'L1' | 'L2',
              name: node.name,
            })
          }
        >
          Rename
        </DropdownMenuItem>
        {siblings.length > 0 && (
          <DropdownMenuItem
            onSelect={() =>
              onEdit({
                kind: 'merge',
                level: node.level as 'L1' | 'L2',
                sourceId: node.id,
                targetId: siblings[0].id,
              })
            }
          >
            Merge into {siblings[0].name}
          </DropdownMenuItem>
        )}
        {canMove && (
          <DropdownMenuItem
            onSelect={() =>
              onEdit({
                kind: 'move',
                level: 'L2',
                nodeId: node.id,
                parentId: '',
              })
            }
          >
            Move to another group
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LeafDetails({
  node,
  metric,
  records,
  onMove,
  onDragStart,
  editingEnabled,
  onViewTranscripts,
  lockedForDraft,
}: {
  node: ClusterNode;
  metric?: ClusterMetric;
  records: TranscriptRecord[];
  onMove: () => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  editingEnabled: boolean;
  onViewTranscripts?: (clusterId: string) => void;
  lockedForDraft: boolean;
}) {
  return (
    <details className="group rounded-lg border border-border/70 bg-surface">
      <summary
        className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 hover:bg-surface-hover/60"
        draggable={editingEnabled}
        onDragStart={(event) => editingEnabled && onDragStart(event)}
      >
        <ChevronRight
          className="size-3.5 shrink-0 text-muted transition-transform group-open:rotate-90"
          aria-hidden="true"
        />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          L3
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">
          {node.name}
        </span>
        <MetricPills metric={metric} volume={node.volume} />
      </summary>
      <div className="border-t border-border/70 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-[10px] text-muted">
            {node.id} · {records.length} transcript records
          </p>
          {editingEnabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={onMove}
            >
              <MoveRight className="size-3.5" />
              Move
            </Button>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric
            label="Coverage"
            value={metric ? `${(metric.coverage * 100).toFixed(1)}%` : '—'}
          />
          <Metric
            label="Complexity"
            value={metric ? `${metric.complexity.toFixed(0)} / 100` : '—'}
          />
          <Metric
            label="Automation potential"
            value={metric ? `${metric.automationPotential.toFixed(0)}%` : '—'}
          />
          <Metric
            label="Automation score"
            value={metric ? `${metric.automationScore.toFixed(0)} / 100` : '—'}
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <MetadataList
            label="Intents"
            values={records.map((record) => record.intent)}
          />
          <MetadataList
            label="Resolutions"
            values={records.map((record) => record.resolution)}
          />
          <MetadataList
            label="Escalation reasons"
            values={records.map((record) => record.escalationReason)}
          />
          <MetadataList
            label="Hold reasons"
            values={records.map((record) => record.holdReason)}
          />
          <MetadataList
            label="Pain points"
            values={records.flatMap((record) => record.painPoints)}
          />
          <Metric
            label="Average handling"
            value={
              records.length
                ? `${(records.reduce((sum, record) => sum + record.handlingMinutes, 0) / records.length).toFixed(1)} min`
                : '—'
            }
          />
        </div>
        {records.length > 0 && (
          <div className="mt-3">
            <MetadataList
              label="Conversation text"
              values={records.slice(0, 3).map((record) => record.transcript)}
            />
            {records.length > 3 && (
              <p className="mt-1 text-[10px] text-muted">
                Showing 3 of {records.length} records. Use View transcripts for
                the full set.
              </p>
            )}
          </div>
        )}
        {onViewTranscripts && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={!records.length}
            onClick={() => onViewTranscripts(node.id)}
          >
            View transcripts
          </Button>
        )}
        {lockedForDraft && (
          <p className="mt-3 text-xs text-muted">
            Save or discard taxonomy changes before opening filtered
            transcripts.
          </p>
        )}
      </div>
    </details>
  );
}

function MetricPills({
  metric,
  volume,
}: {
  metric?: ClusterMetric;
  volume: number;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-muted">
      <span className="rounded-full bg-surface-inset px-2 py-0.5">
        {metric?.volume ?? volume} conversations
      </span>
      {metric && (
        <>
          <span className="rounded-full bg-surface-inset px-2 py-0.5">
            {(metric.coverage * 100).toFixed(1)}% coverage
          </span>
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent-strong">
            {metric.complexity.toFixed(0)} / 100 complexity
          </span>
          <span className="rounded-full bg-success-soft px-2 py-0.5 text-success-fg">
            {metric.automationScore.toFixed(0)} / 100 score
          </span>
        </>
      )}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-inset/50 px-3 py-2">
      <p className="text-[10px] text-muted">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-foreground">{value}</p>
    </div>
  );
}
function MetadataList({ label, values }: { label: string; values: string[] }) {
  const counts = new Map<string, number>();
  for (const value of values.map((item) => item.trim()).filter(Boolean))
    counts.set(value, (counts.get(value) ?? 0) + 1);
  const items = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
  return (
    <div className="rounded-lg border border-border/70 p-3">
      <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </h4>
      <ul className="mt-1 space-y-1 text-xs leading-5 text-foreground">
        {items.length ? (
          items.map(([value, count]) => (
            <li key={value} className="break-words">
              {value}
              {count > 1 && <span className="ml-1 text-muted">({count})</span>}
            </li>
          ))
        ) : (
          <li>—</li>
        )}
      </ul>
    </div>
  );
}

function beginDrag(
  event: DragEvent<HTMLElement>,
  node: ClusterNode,
  setDraggedId: (id: string | null) => void,
) {
  event.dataTransfer.setData('text/plain', node.id);
  event.dataTransfer.effectAllowed = 'move';
  setDraggedId(node.id);
}

function flatten(nodes: ClusterNode[]): ClusterNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children ?? [])]);
}

function parseTaxonomy(content?: string): {
  nodes: ClusterNode[];
  error: string;
} {
  if (!content) return { nodes: [], error: '' };
  try {
    const parsed: unknown = JSON.parse(content);
    if (!Array.isArray(parsed) || !parsed.every(isClusterNode))
      return {
        nodes: [],
        error:
          'The artifact content is not a valid cluster taxonomy. No edits were made.',
      };
    return { nodes: parsed, error: '' };
  } catch {
    return {
      nodes: [],
      error:
        'The taxonomy content could not be read as JSON. No edits were made.',
    };
  }
}

function isClusterNode(value: unknown): value is ClusterNode {
  if (typeof value !== 'object' || value === null) return false;
  const node = value as Partial<ClusterNode>;
  return (
    typeof node.id === 'string' &&
    typeof node.name === 'string' &&
    (node.level === 'L1' || node.level === 'L2' || node.level === 'L3') &&
    typeof node.volume === 'number' &&
    (node.children === undefined ||
      (Array.isArray(node.children) && node.children.every(isClusterNode)))
  );
}
