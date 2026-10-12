'use client';

import { useId, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/Icon';
import { parseProcessNodes } from '@/lib/diagram-source';

type Props = { content: string; kind: 'process_map' | 'uml'; onEdit?: (label: string) => void };
type Participant = { id: string; name: string };
type Message = { from: string; to: string; text: string; response: boolean };
type Node = { id: string; label: string; decision: boolean };
type Edge = { from: string; to: string };

function CanvasToolbar({ zoom, setZoom }: { zoom: number; setZoom: (value: number) => void }) {
  return <div className="mb-3 flex items-center justify-between gap-3" aria-label="Diagram canvas controls">
    <div><p className="text-xs font-semibold text-foreground">Diagram preview</p><p className="text-[11px] text-muted">Limited Mermaid renderer · scroll or drag to pan</p></div>
    <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Zoom out" title="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom(Math.max(0.5, Math.round((zoom - 0.1) * 10) / 10))}>−</Button>
      <span className="min-w-12 text-center text-xs tabular-nums text-muted">{Math.round(zoom * 100)}%</span>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Zoom in" title="Zoom in" disabled={zoom >= 1.6} onClick={() => setZoom(Math.min(1.6, Math.round((zoom + 0.1) * 10) / 10))}>＋</Button>
      <Button type="button" variant="outline" size="sm" className="ml-1 h-7 px-2 text-[11px]" onClick={() => setZoom(1)}>Reset</Button>
    </div>
  </div>;
}

function CanvasViewport({ width, height, zoom, children }: { width: number; height: number; zoom: number; children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const startPan = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button')) return;
    if (!viewport.current) return;
    drag.current = { x: event.clientX, y: event.clientY, left: viewport.current.scrollLeft, top: viewport.current.scrollTop };
    viewport.current.setPointerCapture(event.pointerId);
    setDragging(true);
  };
  const pan = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !viewport.current) return;
    viewport.current.scrollLeft = drag.current.left - (event.clientX - drag.current.x);
    viewport.current.scrollTop = drag.current.top - (event.clientY - drag.current.y);
  };
  const stopPan = (event: PointerEvent<HTMLDivElement>) => {
    drag.current = null;
    setDragging(false);
    if (viewport.current?.hasPointerCapture(event.pointerId)) viewport.current.releasePointerCapture(event.pointerId);
  };
  return <div ref={viewport} className={`max-h-[640px] overflow-auto rounded-xl bg-surface-inset/50 p-4 ${dragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`} onPointerDown={startPan} onPointerMove={pan} onPointerUp={stopPan} onPointerCancel={stopPan} aria-label="Diagram canvas; scroll or drag to pan">
    <div className="relative" style={{ width: Math.ceil(width * zoom), height: Math.ceil(height * zoom) }}><div className="absolute left-0 top-0 origin-top-left" style={{ width, height, transform: `scale(${zoom})` }}>{children}</div></div>
  </div>;
}

function parseUml(content: string) {
  const participants: Participant[] = [...content.matchAll(/^\s*participant\s+(\w+)(?:\s+as\s+(.+))?\s*$/gm)].map((match) => ({ id: match[1], name: (match[2] ?? match[1]).trim() }));
  const messages: Message[] = [...content.matchAll(/^\s*(\w+)(--?>>?)(\w+):\s*(.+)$/gm)].map((match) => ({ from: match[1], to: match[3], text: match[4], response: match[2].startsWith('--') }));
  return { participants, messages };
}

function parseFlow(content: string) {
  const nodes = new Map<string, Node>(parseProcessNodes(content).map((node) => [node.id, node]));
  const edges: Edge[] = [];
  const declaration = (id: string, box?: string, decision?: string) => { if (!nodes.has(id) || box || decision) nodes.set(id, { id, label: box ?? decision ?? id, decision: Boolean(decision) }); };
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)(?:\[([^\]]+)\]|\{([^}]+)\})?\s*-->(?:\|[^|]*\|)?\s*([\w.-]+)(?:\[([^\]]+)\]|\{([^}]+)\})?\s*$/);
    if (!match) continue;
    const [, from, fromLabel, fromDecision, to, toLabel, toDecision] = match;
    declaration(from, fromLabel, fromDecision);
    declaration(to, toLabel, toDecision);
    edges.push({ from, to });
  }
  return { nodes, edges };
}

function makeLevels(nodes: Map<string, Node>, edges: Edge[]) {
  const depths = new Map<string, number>();
  for (const id of nodes.keys()) depths.set(id, 0);
  for (let iteration = 0; iteration < nodes.size; iteration++) {
    let changed = false;
    for (const edge of edges) {
      const from = depths.get(edge.from) ?? 0;
      const to = depths.get(edge.to) ?? 0;
      if (to <= from && from < nodes.size - 1) { depths.set(edge.to, from + 1); changed = true; }
    }
    if (!changed) break;
  }
  const levels: string[][] = [];
  for (const id of nodes.keys()) (levels[depths.get(id) ?? 0] ??= []).push(id);
  return levels;
}

export function DiagramPreview({ content, kind, onEdit }: Props) {
  const marker = useId().replaceAll(':', '');
  const [zoom, setZoom] = useState(1);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  if (kind === 'uml') {
    const { participants, messages } = parseUml(content);
    if (!participants.length || !messages.length || messages.some((message) => !participants.some((person) => person.id === message.from) || !participants.some((person) => person.id === message.to))) return <Unsupported content={content} kind={kind} />;
    const width = Math.max(620, participants.length * 160);
    const height = 80 + messages.length * 76;
    return <><CanvasToolbar zoom={zoom} setZoom={setZoom} /><CanvasViewport width={width} height={height} zoom={zoom}><div className="relative" style={{ width, height }}>
      <svg aria-hidden="true" width={width} height={height} className="absolute inset-0"><defs><marker id={marker} markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" fill="none" stroke="currentColor" /></marker></defs>
        {participants.map((person, index) => <line key={person.id} x1={(index + 0.5) * width / participants.length} x2={(index + 0.5) * width / participants.length} y1={54} y2={height} stroke="var(--border-strong)" strokeDasharray="4 5" />)}
        {messages.map((message, index) => { const a = (participants.findIndex((person) => person.id === message.from) + 0.5) * width / participants.length; const b = (participants.findIndex((person) => person.id === message.to) + 0.5) * width / participants.length; return <line key={index} x1={a} x2={b} y1={98 + index * 76} y2={98 + index * 76} stroke={message.response ? 'var(--muted)' : 'var(--accent-strong)'} strokeWidth="1.5" strokeDasharray={message.response ? '4 3' : undefined} markerEnd={`url(#${marker})`} />; })}
      </svg>
      <div className="relative grid gap-3" style={{ gridTemplateColumns: `repeat(${participants.length},1fr)` }}>{participants.map((person) => <button key={person.id} type="button" disabled={!onEdit} onClick={() => { const label = `Participant: ${person.name}`; setSelectedLabel(label); onEdit?.(person.name); }} className={`rounded-lg border bg-surface px-3 py-3 text-center text-xs font-semibold text-foreground ${selectedLabel === `Participant: ${person.name}` ? 'border-accent-strong ring-2 ring-accent-soft' : 'border-border'}`}>{person.name.replaceAll('_', ' ')}</button>)}</div>
      {messages.map((message, index) => { const a = (participants.findIndex((person) => person.id === message.from) + 0.5) * width / participants.length; const b = (participants.findIndex((person) => person.id === message.to) + 0.5) * width / participants.length; const left = Math.min(a, b) + 5; return <div key={index} className="absolute text-center" style={{ top: 65 + index * 76, left, width: Math.max(100, Math.abs(b - a) - 10) }}>
        {onEdit ? <button type="button" onClick={() => { setSelectedLabel(message.text); onEdit(message.text); }} className={`rounded bg-surface px-2 py-1 text-[11px] text-foreground hover:text-accent-strong ${selectedLabel === message.text ? 'border border-accent-strong' : 'border border-transparent hover:border-accent-border'}`} aria-label={`Edit message: ${message.text}`}>{message.text}</button> : <span className="bg-surface px-2 text-[11px] text-foreground">{message.text}</span>}
      </div>; })}
    </div></CanvasViewport>{onEdit && <p className="mt-2 flex items-center gap-1.5 text-xs text-muted"><Icon name="edit" className="size-3.5" />Select a participant or message to edit its wording.</p>}</>;
  }

  const { nodes, edges } = parseFlow(content);
  if (!nodes.size) return <Unsupported content={content} kind={kind} />;
  const levels = makeLevels(nodes, edges);
  const columns = Math.max(1, ...levels.filter(Boolean).map((level) => level.length));
  const width = Math.max(620, columns * 280 + 40);
  const height = levels.length * 110 + 20;
  const positions = new Map<string, { x: number; y: number }>();
  levels.forEach((ids, depth) => ids.forEach((id, index) => positions.set(id, { x: width / 2 + (index - (ids.length - 1) / 2) * 280, y: 20 + depth * 110 })));
  return <><CanvasToolbar zoom={zoom} setZoom={setZoom} /><CanvasViewport width={width} height={height} zoom={zoom}><div className="relative" style={{ width, height }}>
    <svg width={width} height={height} className="absolute inset-0 text-accent-strong" aria-hidden="true"><defs><marker id={marker} markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" fill="none" stroke="currentColor" /></marker></defs>{edges.map((edge, index) => { const a = positions.get(edge.from)!; const b = positions.get(edge.to)!; return <path key={index} d={`M${a.x} ${a.y + 66} C${a.x} ${a.y + 90},${b.x} ${b.y - 24},${b.x} ${b.y - 4}`} fill="none" stroke="var(--border-strong)" strokeWidth="1.7" markerEnd={`url(#${marker})`} />; })}</svg>
    {[...nodes.values()].map((node) => { const point = positions.get(node.id)!; const classes = `absolute w-[248px] min-h-[66px] rounded-xl border bg-surface px-4 py-3 text-center shadow-xs ${selectedLabel === node.label ? 'border-accent-strong ring-2 ring-accent-soft' : node.decision ? 'border-accent-border bg-accent-soft' : 'border-border'}`; const label = <><span className="mb-1 block text-[10px] uppercase tracking-wider text-muted">{node.decision ? 'Decision' : 'Step'}</span><span className="block text-xs font-medium text-foreground">{node.label}</span></>; return onEdit ? <button key={node.id} type="button" className={`${classes} hover:border-accent-strong focus-visible:ring-2 focus-visible:ring-ring`} style={{ left: point.x - 124, top: point.y }} onClick={() => { setSelectedLabel(node.label); onEdit(node.label); }} aria-label={`Edit step: ${node.label}`}>{label}</button> : <div key={node.id} className={classes} style={{ left: point.x - 124, top: point.y }}>{label}</div>; })}
  </div></CanvasViewport>{onEdit && <p className="mt-2 flex items-center gap-1.5 text-xs text-muted"><Icon name="edit" className="size-3.5" />Select a step to edit its wording.</p>}</>;
}

function Unsupported({ content, kind }: { content: string; kind: Props['kind'] }) {
  return <div className="rounded-xl border border-border bg-surface-inset p-5"><p className="text-sm font-medium">Source preview</p><p className="mt-1 text-xs text-muted">This {kind === 'uml' ? 'UML' : 'flowchart'} uses syntax outside the visual editor’s supported subset. You can still review and edit its source in Advanced.</p><pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap text-xs text-foreground">{content}</pre></div>;
}
