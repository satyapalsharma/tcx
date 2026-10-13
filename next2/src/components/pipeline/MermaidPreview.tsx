'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { renderMermaid, mermaidError } from '@/lib/mermaid-renderer';
import { downloadData } from '@/lib/job-analytics';

export type MermaidRenderState = {
  source: string;
  valid: boolean;
  svg: string;
  error: string;
};
type Props = {
  content: string;
  label?: string;
  onRendered?: (result: MermaidRenderState) => void;
};

export function MermaidPreview({
  content,
  label = 'Process map',
  onRendered,
}: Props) {
  const [result, setResult] = useState<MermaidRenderState | null>(null);
  const [zoom, setZoom] = useState(1);
  const [viewportSize, setViewportSize] = useState({ width: 600, height: 360 });
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const pending = result?.source !== content;
  const current = pending ? null : result;
  const viewBox = current?.svg
    .match(/viewBox="([^"<>]+)"/)?.[1]
    .trim()
    .split(/\s+/)
    .map(Number);
  const diagramWidth =
    viewBox?.length === 4 && Number.isFinite(viewBox[2]) && viewBox[2] > 0
      ? viewBox[2]
      : 600;
  const diagramHeight =
    viewBox?.length === 4 && Number.isFinite(viewBox[3]) && viewBox[3] > 0
      ? viewBox[3]
      : 360;
  const fit = Math.min(
    Math.max(1, viewportSize.width - 32) / diagramWidth,
    Math.max(1, viewportSize.height - 32) / diagramHeight,
    1,
  );
  useEffect(() => {
    if (!viewport.current) return;
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box) setViewportSize({ width: box.width, height: box.height });
    });
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      let next: MermaidRenderState;
      try {
        next = {
          source: content,
          valid: true,
          svg: await renderMermaid(content),
          error: '',
        };
      } catch (error) {
        next = {
          source: content,
          valid: false,
          svg: '',
          error: mermaidError(error),
        };
      }
      if (!cancelled) {
        setResult(next);
        onRendered?.(next);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [content, onRendered]);

  return (
    <section
      aria-label={`${label} preview`}
      className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="text-xs font-medium">Live preview</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Zoom out diagram"
            disabled={zoom <= 0.4}
            onClick={() => setZoom((value) => Math.max(0.4, value - 0.2))}
          >
            <Minus className="size-3.5" />
          </Button>
          <span className="min-w-10 text-center text-xs tabular-nums text-muted">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Zoom in diagram"
            disabled={zoom >= 3}
            onClick={() => setZoom((value) => Math.min(3, value + 0.2))}
          >
            <Plus className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Reset diagram view"
            onClick={() => {
              setZoom(1);
              viewport.current?.scrollTo({ top: 0, left: 0 });
            }}
          >
            <RotateCcw className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Download diagram as SVG"
            disabled={!current?.valid}
            onClick={() =>
              current &&
              downloadData(
                `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`,
                current.svg,
                'image/svg+xml',
              )
            }
          >
            <Download className="size-3.5" />
          </Button>
        </div>
      </div>
      <div
        ref={viewport}
        className="relative h-[min(54vh,420px)] min-h-64 overflow-auto overscroll-contain bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-[length:18px_18px] p-4"
        onPointerDown={(event) => {
          if (event.button !== 0 || !current?.valid || !viewport.current)
            return;
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            left: viewport.current.scrollLeft,
            top: viewport.current.scrollTop,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current || !viewport.current) return;
          viewport.current.scrollLeft =
            drag.current.left - (event.clientX - drag.current.x);
          viewport.current.scrollTop =
            drag.current.top - (event.clientY - drag.current.y);
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        {pending ? (
          <p role="status" className="py-20 text-center text-sm text-muted">
            Rendering diagram…
          </p>
        ) : current?.valid ? (
          <div
            role="img"
            aria-label={label}
            className="mx-auto cursor-grab select-none [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-none!"
            style={{ width: diagramWidth * fit * zoom }}
            dangerouslySetInnerHTML={{ __html: current.svg }}
          />
        ) : (
          <div className="rounded-lg border border-destructive/25 bg-surface p-4">
            <p className="text-sm font-medium text-destructive">
              {content.trim() ? 'Check your Mermaid syntax' : 'No diagram yet'}
            </p>
            <pre
              role="alert"
              className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-xs leading-5 text-muted"
            >
              {current?.error}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
