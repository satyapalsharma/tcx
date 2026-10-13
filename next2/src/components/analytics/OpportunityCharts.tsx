'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { SelectField } from '@/components/common';
import type { ClusterMetric } from '@/lib/job-analytics';

export function OpportunityCharts({
  clusters,
  onSelect,
}: {
  clusters: ClusterMetric[];
  onSelect: (cluster: ClusterMetric) => void;
}) {
  const [level, setLevel] = useState<ClusterMetric['level']>('L1');
  const rows = clusters
    .filter((cluster) => cluster.level === level)
    .sort((a, b) => b.volume - a.volume);
  return (
    <section aria-label="Cluster opportunity charts" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Where to focus automation</h3>
        <div className="flex items-center gap-2 text-xs text-muted">
          <label htmlFor="opportunity-chart-level">Chart level</label>
          <SelectField
            id="opportunity-chart-level"
            aria-label="Chart cluster level"
            value={level}
            onValueChange={(value) => setLevel(value as ClusterMetric['level'])}
            options={['L1', 'L2', 'L3']}
            className="h-8"
          />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-2 p-4">
          <h4 className="text-sm font-medium">Conversation coverage</h4>
          <p className="text-xs text-muted">
            Percent of all unique conversations · top {Math.min(8, rows.length)}{' '}
            {level} clusters
          </p>
          <div className="mt-2 space-y-3">
            {rows.slice(0, 8).map((cluster) => (
              <button
                type="button"
                key={cluster.id}
                onClick={() => onSelect(cluster)}
                className="block w-full rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex justify-between gap-3 text-xs">
                  <span className="truncate">{cluster.name}</span>
                  <span className="shrink-0 tabular-nums">
                    {(cluster.coverage * 100).toFixed(1)}% · {cluster.volume}
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 rounded-full bg-surface-inset">
                  <div
                    className="h-full rounded-full bg-accent-strong"
                    style={{
                      width: `${Math.max(0, Math.min(100, cluster.coverage * 100))}%`,
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
          {!rows.length && (
            <p className="py-8 text-center text-xs text-muted">
              No clusters at this level.
            </p>
          )}
        </Card>
        <Card className="gap-2 p-4">
          <h4 className="text-sm font-medium">
            Complexity and automation potential
          </h4>
          <p className="text-xs text-muted">
            Larger bubbles cover more conversations. Select one to drill down.
          </p>
          <svg
            viewBox="0 0 460 280"
            className="mt-2 w-full"
            role="group"
            aria-label={`${level} automation opportunity plot`}
          >
            {[0, 25, 50, 75, 100].map((tick) => (
              <g key={tick}>
                <line
                  x1="45"
                  y1={235 - tick * 1.9}
                  x2="430"
                  y2={235 - tick * 1.9}
                  stroke="var(--border)"
                />
                <text
                  x="36"
                  y={239 - tick * 1.9}
                  fontSize="10"
                  textAnchor="end"
                  fill="var(--muted)"
                >
                  {tick}%
                </text>
                <text
                  x={45 + tick * 3.7}
                  y="251"
                  fontSize="10"
                  textAnchor="middle"
                  fill="var(--muted)"
                >
                  {tick}
                </text>
              </g>
            ))}
            <text
              x="236"
              y="272"
              textAnchor="middle"
              fontSize="11"
              fill="var(--muted)"
            >
              Complexity →
            </text>
            <text
              x="8"
              y="140"
              transform="rotate(-90 8 140)"
              textAnchor="middle"
              fontSize="11"
              fill="var(--muted)"
            >
              Automation potential →
            </text>
            {rows.map((cluster) => (
              <circle
                key={cluster.id}
                cx={45 + cluster.complexity * 3.7}
                cy={235 - cluster.automationPotential * 1.9}
                r={6 + Math.sqrt(cluster.coverage) * 15}
                fill="var(--accent-strong)"
                fillOpacity="0.65"
                stroke="var(--surface)"
                strokeWidth="2"
                role="button"
                tabIndex={0}
                className="cursor-pointer focus:outline-none focus:stroke-[var(--fg)]"
                aria-label={`${cluster.name}: ${cluster.volume} conversations, complexity ${Math.round(cluster.complexity)}, automation potential ${Math.round(cluster.automationPotential)} percent`}
                onClick={() => onSelect(cluster)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(cluster);
                  }
                }}
              >
                <title>
                  {cluster.name} · {cluster.volume} conversations · complexity{' '}
                  {Math.round(cluster.complexity)} · automation{' '}
                  {Math.round(cluster.automationPotential)}%
                </title>
              </circle>
            ))}
          </svg>
        </Card>
      </div>
    </section>
  );
}
