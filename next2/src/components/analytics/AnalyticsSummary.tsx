import { Fragment } from 'react';
import type { ClusterMetric, TranscriptSummary } from '@/lib/job-analytics';
import { Card } from '@/components/ui/card';

type Props = {
  summary: TranscriptSummary;
  clusters: ClusterMetric[];
  intents: number;
  clusterOutputAvailable?: boolean;
  onSelectCluster?: (cluster: ClusterMetric) => void;
};

export function AnalyticsSummary({
  summary,
  clusters,
  intents,
  clusterOutputAvailable = clusters.length > 0,
  onSelectCluster,
}: Props) {
  const counts = ['L1', 'L2', 'L3'].map(
    (level) => clusters.filter((cluster) => cluster.level === level).length,
  );
  const largest = clusters.reduce<ClusterMetric | undefined>(
    (best, item) => (!best || item.volume > best.volume ? item : best),
    undefined,
  );
  const complex = clusters.reduce<ClusterMetric | undefined>(
    (best, item) => (!best || item.complexity > best.complexity ? item : best),
    undefined,
  );
  const topVolumes = clusters
    .filter((cluster) => cluster.level === 'L1')
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);
  const hasClusterData = clusters.length > 0;
  const heatmapLevel = clusters.some((cluster) => cluster.level === 'L3')
    ? 'L3'
    : 'L1';
  const heatmapClusters = clusters.filter(
    (cluster) => cluster.level === heatmapLevel,
  );
  const maxVolume = Math.max(...topVolumes.map((cluster) => cluster.volume), 1);
  const heatmap = Array.from({ length: 4 }, () => Array(4).fill(0) as number[]);
  heatmapClusters.forEach((cluster) => {
    const complexityBand = Math.min(3, Math.floor(cluster.complexity / 25));
    const automationBand = Math.min(
      3,
      Math.floor(cluster.automationPotential / 25),
    );
    heatmap[3 - automationBand][complexityBand] += cluster.volume;
  });
  const maxCellVolume = Math.max(...heatmap.flat(), 1);
  return (
    <section aria-label="Job summary" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: 'Conversations',
            value: summary.conversationCount.toLocaleString(),
            note: 'Unique conversations analyzed',
          },
          {
            label: 'Intents found',
            value: intents.toLocaleString(),
            note: 'Reasons customers get in touch',
          },
          {
            label: 'Cluster groups',
            value: hasClusterData
              ? counts[0].toLocaleString()
              : clusterOutputAvailable
                ? 'No data'
                : 'Not generated',
            note: hasClusterData
              ? `${counts[1]} subgroups · ${counts[2]} detailed groups (L3)`
              : clusterOutputAvailable
                ? 'No comparable groups in this output'
                : 'Clustering has not produced results for this data',
          },
        ].map((tile) => (
          <Card key={tile.label} className="gap-0 p-5">
            <p className="text-sm text-muted">{tile.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {tile.value}
            </p>
            <p className="mt-2 text-xs text-muted">{tile.note}</p>
          </Card>
        ))}
      </div>
      {summary.intentCounts.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="gap-3 p-5">
            <div>
              <h3 className="text-sm font-semibold">Most common intents</h3>
              <p className="mt-1 text-xs text-muted">
                Share of unique conversations in the available intent output.
              </p>
            </div>
            <div className="space-y-3">
              {summary.intentCounts.slice(0, 5).map((intent) => (
                <div key={intent.label}>
                  <div className="flex justify-between gap-3 text-xs">
                    <span className="truncate">{intent.label}</span>
                    <span className="shrink-0 tabular-nums text-muted">
                      {intent.conversations.toLocaleString()}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-2 rounded-full bg-surface-inset"
                    role="img"
                    aria-label={`${intent.label}: ${intent.conversations} conversations`}
                  >
                    <div
                      className="h-full rounded-full bg-accent-strong"
                      style={{
                        width: `${Math.min(100, (intent.conversations / Math.max(summary.conversationCount, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          {hasClusterData ? (
            <Card className="gap-3 p-5">
              <div>
                <h3 className="text-sm font-semibold">
                  Conversation volume by group
                </h3>
                <p className="mt-1 text-xs text-muted">
                  Largest L1 groups · select a row to explore.
                </p>
              </div>
              <div className="space-y-3">
                {topVolumes.map((cluster) => (
                  <button
                    key={cluster.id}
                    type="button"
                    onClick={() => onSelectCluster?.(cluster)}
                    className="block w-full rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex justify-between gap-3 text-xs">
                      <span className="truncate">{cluster.name}</span>
                      <span className="shrink-0 tabular-nums text-muted">
                        {cluster.volume.toLocaleString()} ·{' '}
                        {(cluster.coverage * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-surface-inset">
                      <div
                        className="h-full rounded-full bg-accent-strong"
                        style={{
                          width: `${(cluster.volume / maxVolume) * 100}%`,
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="flex min-h-40 flex-col justify-center gap-2 border-dashed p-5">
              <h3 className="text-sm font-semibold">Group volume chart</h3>
              <p className="text-xs leading-5 text-muted">
                {clusterOutputAvailable
                  ? 'This output does not contain group volume metrics.'
                  : 'This chart will appear when the clustering stage produces its output.'}
              </p>
            </Card>
          )}
        </div>
      )}
      {hasClusterData && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              label: 'Largest cluster',
              cluster: largest,
              note: largest
                ? `${(largest.coverage * 100).toFixed(1)}% of conversations · ${largest.level}`
                : 'No cluster data yet',
            },
            {
              label: 'Most complex cluster',
              cluster: complex,
              note: complex
                ? `Complexity ${Math.round(complex.complexity)} / 100 · ${complex.level}`
                : 'No complexity data yet',
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={!item.cluster || !onSelectCluster}
              onClick={() => item.cluster && onSelectCluster?.(item.cluster)}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-5 py-4 text-left hover:border-accent-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:hover:border-border"
            >
              <span className="min-w-0">
                <span className="block text-xs text-muted">{item.label}</span>
                <span className="mt-1 block font-medium">
                  {item.cluster?.name ?? '—'}
                </span>
                <span className="mt-1 block text-xs text-muted">
                  {item.note}
                </span>
              </span>
              {onSelectCluster && item.cluster && (
                <span aria-hidden="true" className="text-accent-strong">
                  →
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {hasClusterData && (
        <Card className="gap-3 p-5">
          <div>
            <h3 className="text-sm font-semibold">
              Complexity and automation map
            </h3>
            <p className="mt-1 text-xs text-muted">
              Cell labels show conversation volume for {heatmapLevel} groups.
              Darker cells contain more volume; overlapping group assignments
              can contribute more than once.
            </p>
          </div>
          <div className="grid grid-cols-[auto_repeat(4,minmax(0,1fr))] gap-1.5 text-center text-[10px]">
            <span className="self-center text-left text-muted">
              Automation ↑
            </span>
            {[0, 1, 2, 3].map((index) => (
              <span key={`x-${index}`} className="text-muted">
                {index * 25}–{index === 3 ? 100 : index * 25 + 24}
              </span>
            ))}
            {[3, 2, 1, 0].map((automationBand) => (
              <Fragment key={automationBand}>
                <span className="self-center text-left text-muted">
                  {automationBand * 25}–
                  {automationBand === 3 ? 100 : automationBand * 25 + 24}%
                </span>
                {[0, 1, 2, 3].map((column) => {
                  const volume = heatmap[3 - automationBand][column];
                  const opacity = 0.08 + (volume / maxCellVolume) * 0.72;
                  return (
                    <div
                      key={`${automationBand}-${column}`}
                      className="grid min-h-10 place-items-center rounded-md border border-border font-medium tabular-nums"
                      style={{
                        backgroundColor: `color-mix(in srgb, var(--accent-strong) ${Math.round(opacity * 100)}%, var(--surface))`,
                      }}
                      aria-label={`Complexity ${column * 25} to ${column === 3 ? 100 : column * 25 + 24}; automation ${automationBand * 25} to ${automationBand === 3 ? 100 : automationBand * 25 + 24} percent: ${volume} conversations`}
                      title={`${volume.toLocaleString()} conversations`}
                    >
                      {volume.toLocaleString()}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
          <p className="text-right text-[10px] text-muted">Complexity →</p>
        </Card>
      )}
    </section>
  );
}
