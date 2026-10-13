'use client';

import { Disclosure } from '@/components/common/Disclosure';
import { useEffect, useState } from 'react';
import { Check, FileCode2, Save } from 'lucide-react';
import type { Artifact } from '@/data/pipeline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MermaidPreview, type MermaidRenderState } from './MermaidPreview';
import { downloadData } from '@/lib/job-analytics';
import { normalizeLegacyDemoProcessMap } from '@/lib/mermaid-source';
import {
  addProcessNode,
  connectProcessNodes,
  disconnectProcessNodes,
  parseProcessConnections,
  parseProcessNodes,
  removeProcessNode,
  replaceDiagramSteps,
} from '@/lib/diagram-source';

type Props = {
  artifact: Artifact;
  onSave: (patch: { name: string; content: string; notes: string }) => void;
  onClose: () => void;
  onDirtyChange: (dirty: boolean) => void;
};

function visualEditingBlockReason(source: string) {
  const lines = source.split('\n').map((line) => line.trim());
  const flowEdge =
    /^[\w.-]+(?:\[[^\]]+\]|\{[^}]+\})?\s*-->(?:\|[^|]*\|)?\s*[\w.-]+(?:\[[^\]]+\]|\{[^}]+\})?$/;
  const node = /^[\w.-]+(?:\[[^\]]+\]|\{[^}]+\})?$/;
  const allowedDirective = /^(?:flowchart|graph)\s+(?:TB|TD|BT|RL|LR)\b/i;
  const safeMetadata = /^(?:direction|style|classDef|class|linkStyle|click)\b/i;
  return lines.find((line) => {
    if (!line || line.startsWith('%%') || allowedDirective.test(line))
      return false;
    if (safeMetadata.test(line)) return false;
    if (/^(?:subgraph|end)\b/i.test(line)) return true;
    if (line.includes('-->')) return !flowEdge.test(line);
    if (/[-=~.]+(?:>|o|x)/.test(line)) return true;
    if (/[()[\]{}@]/.test(line)) return !node.test(line);
    return !node.test(line);
  });
}

export function MermaidEditor({
  artifact,
  onSave,
  onClose,
  onDirtyChange,
}: Props) {
  const [source, setSource] = useState(() =>
    normalizeLegacyDemoProcessMap(artifact.content ?? ''),
  );
  const [name, setName] = useState(artifact.name);
  const [notes, setNotes] = useState(artifact.notes);
  const [rendered, setRendered] = useState<MermaidRenderState | null>(null);
  const [saveError, setSaveError] = useState('');
  const [editorMode, setEditorMode] = useState<'source' | 'visual'>(() =>
    visualEditingBlockReason(
      normalizeLegacyDemoProcessMap(artifact.content ?? ''),
    )
      ? 'source'
      : 'visual',
  );
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [edgeFrom, setEdgeFrom] = useState('');
  const [edgeTo, setEdgeTo] = useState('');
  const valid = rendered?.source === source && rendered.valid;
  const dirty =
    source !== normalizeLegacyDemoProcessMap(artifact.content ?? '') ||
    name !== artifact.name ||
    notes !== artifact.notes;
  const edges = parseProcessConnections(source);
  const declaredNodes = parseProcessNodes(source);
  const nodesById = new Map(declaredNodes.map((node) => [node.id, node]));
  for (const edge of edges) {
    if (!nodesById.has(edge.from))
      nodesById.set(edge.from, {
        id: edge.from,
        label: edge.from,
        decision: false,
      });
    if (!nodesById.has(edge.to))
      nodesById.set(edge.to, { id: edge.to, label: edge.to, decision: false });
  }
  const nodes = [...nodesById.values()];
  const visualBlockReason = visualEditingBlockReason(source);
  const setVisualSource = (next: string) => {
    setSource(next);
    setSaveError('');
  };
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  const save = () => {
    if (!valid || !name.trim() || !dirty) return;
    try {
      onSave({ name: name.trim(), content: source, notes });
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Unable to save this revision. Please try again.',
      );
    }
  };

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          {artifact.name} · Revision {artifact.version}
          {dirty && (
            <span className="ml-2 font-medium text-accent-strong">
              Unsaved changes
            </span>
          )}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            downloadData(
              `${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.mmd`,
              source,
              'text/plain',
            )
          }
        >
          <FileCode2 className="size-3.5" />
          Download source
        </Button>
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
            <div className="flex gap-1 rounded-md bg-surface-inset/40 p-1">
              <Button
                type="button"
                size="sm"
                variant={editorMode === 'source' ? 'secondary' : 'ghost'}
                className="h-7 px-2 text-[11px]"
                aria-pressed={editorMode === 'source'}
                onClick={() => setEditorMode('source')}
              >
                Mermaid source
              </Button>
              <Button
                type="button"
                size="sm"
                variant={editorMode === 'visual' ? 'secondary' : 'ghost'}
                className="h-7 px-2 text-[11px]"
                aria-pressed={editorMode === 'visual'}
                onClick={() => setEditorMode('visual')}
              >
                Visual nodes and links
              </Button>
            </div>
            <span
              role="status"
              className="flex items-center gap-1 text-[11px] text-muted"
            >
              {valid ? (
                <>
                  <Check className="size-3 text-emerald-600" /> Syntax valid
                </>
              ) : rendered?.source !== source ? (
                'Checking…'
              ) : (
                'Needs a correction'
              )}
            </span>
          </div>
          {editorMode === 'source' ? (
            <Textarea
              id="mermaid-process-source"
              aria-label="Mermaid process map source"
              value={source}
              onChange={(event) => setVisualSource(event.target.value)}
              spellCheck={false}
              rows={20}
              className="min-h-72 max-h-[54vh] resize-y rounded-none border-0 bg-surface-inset/20 font-mono text-xs leading-6 shadow-none focus-visible:ring-inset"
            />
          ) : visualBlockReason ? (
            <div className="min-h-72 p-4">
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-5 text-foreground">
                Visual editing is read-only for this map because it includes
                Mermaid syntax this editor does not support. The source and
                preview remain available, and no content will be removed.
              </p>
              <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-surface-inset/30 p-3 font-mono text-xs leading-5 text-muted">
                {source}
              </pre>
            </div>
          ) : (
            <div className="max-h-[54vh] min-h-72 space-y-4 overflow-y-auto p-3">
              <div className="space-y-2">
                <p className="text-xs font-medium">Process steps</p>
                {nodes.map((node, index) => (
                  <div key={node.id} className="flex items-center gap-2">
                    <Input
                      aria-label={`Process step ${index + 1}`}
                      value={node.label}
                      onChange={(event) => {
                        const label = event.target.value
                          .replace(/[\r\n\[\]{}]/g, ' ')
                          .trim();
                        const declaredIndex = declaredNodes.findIndex(
                          (item) => item.id === node.id,
                        );
                        if (declaredIndex < 0) {
                          setVisualSource(
                            `${source.replace(/\s*$/, '')}\n  ${node.id}[${label || node.id}]`,
                          );
                          return;
                        }
                        const labels = declaredNodes.map((item) => item.label);
                        labels[declaredIndex] = label;
                        setVisualSource(replaceDiagramSteps(source, labels));
                      }}
                      className="h-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove ${node.label}`}
                      onClick={() =>
                        setVisualSource(removeProcessNode(source, node.id))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newNodeLabel}
                    onChange={(event) => setNewNodeLabel(event.target.value)}
                    placeholder="Add a process step"
                    aria-label="New process step"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!newNodeLabel.trim()) return;
                      setVisualSource(
                        addProcessNode(source, newNodeLabel).content,
                      );
                      setNewNodeLabel('');
                    }}
                  >
                    Add step
                  </Button>
                </div>
              </div>
              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-xs font-medium">Connections</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={edgeFrom || undefined}
                    onValueChange={setEdgeFrom}
                  >
                    <SelectTrigger
                      aria-label="Connection source"
                      className="min-w-0 flex-1"
                    >
                      <SelectValue placeholder="From step" />
                    </SelectTrigger>
                    <SelectContent>
                      {nodes.map((node) => (
                        <SelectItem key={node.id} value={node.id}>
                          {node.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span aria-hidden="true" className="text-muted">
                    →
                  </span>
                  <Select value={edgeTo || undefined} onValueChange={setEdgeTo}>
                    <SelectTrigger
                      aria-label="Connection destination"
                      className="min-w-0 flex-1"
                    >
                      <SelectValue placeholder="To step" />
                    </SelectTrigger>
                    <SelectContent>
                      {nodes.map((node) => (
                        <SelectItem key={node.id} value={node.id}>
                          {node.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!edgeFrom || !edgeTo || edgeFrom === edgeTo}
                    onClick={() => {
                      const contentWithNodes = [edgeFrom, edgeTo].reduce(
                        (content, id) =>
                          parseProcessNodes(content).some(
                            (node) => node.id === id,
                          )
                            ? content
                            : `${content.replace(/\s*$/, '')}\n  ${id}[${id}]`,
                        source,
                      );
                      setVisualSource(
                        connectProcessNodes(contentWithNodes, edgeFrom, edgeTo),
                      );
                    }}
                  >
                    Connect
                  </Button>
                </div>
                {edges.length ? (
                  <ul className="space-y-1">
                    {edges.map((edge, index) => (
                      <li
                        key={`${edge.from}-${edge.to}-${index}`}
                        className="flex items-center justify-between gap-2 rounded-md bg-surface-inset/30 px-2 py-1.5 text-xs"
                      >
                        <span>
                          {nodes.find((node) => node.id === edge.from)?.label ??
                            edge.from}{' '}
                          →{' '}
                          {nodes.find((node) => node.id === edge.to)?.label ??
                            edge.to}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setVisualSource(
                              disconnectProcessNodes(
                                source,
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
                  <p className="text-xs text-muted">No connections yet.</p>
                )}
              </div>
            </div>
          )}
        </section>
        <MermaidPreview
          content={source}
          label={name || 'Process map'}
          onRendered={setRendered}
        />
      </div>
      <Disclosure
        className="rounded-lg border border-border px-3 py-2 text-xs text-muted"
        triggerClassName="cursor-pointer"
        title={<>Name, notes & syntax help</>}
      >
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span>Process map name</span>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={150}
            />
          </label>
          <label className="space-y-1">
            <span>Review notes (optional)</span>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
            />
          </label>
        </div>
        <p className="mt-3 leading-5">
          Use <code>flowchart TD</code> for a top-to-bottom map or{' '}
          <code>flowchart LR</code> for left-to-right. Write{' '}
          <code>A[Step] --&gt; B&#123;Decision?&#125;</code> to connect steps.
          The preview updates as you type. Drag the preview to pan.
        </p>
      </Disclosure>
      {saveError && (
        <p role="alert" className="text-sm text-destructive">
          {saveError}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="max-w-lg text-xs text-muted">
          Save creates a new revision. Optional validation resets when the
          diagram changes.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="accent"
            onClick={save}
            disabled={!valid || !name.trim() || !dirty}
          >
            <Save className="size-3.5" />
            Save revision
          </Button>
        </div>
      </div>
    </div>
  );
}
