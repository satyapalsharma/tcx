import type { ClusterMetric, TranscriptSummary } from '@/lib/job-analytics';
import { Card } from '@/components/ui/card';

type Props = { summary: TranscriptSummary; clusters: ClusterMetric[]; intents: number; onSelectCluster?: (cluster: ClusterMetric) => void };

export function AnalyticsSummary({ summary, clusters, intents, onSelectCluster }: Props) {
  const counts = ['L1', 'L2', 'L3'].map(level => clusters.filter(cluster => cluster.level === level).length);
  const largest = clusters.reduce<ClusterMetric | undefined>((best, item) => !best || item.volume > best.volume ? item : best, undefined);
  const complex = clusters.reduce<ClusterMetric | undefined>((best, item) => !best || item.complexity > best.complexity ? item : best, undefined);
  return <section aria-label="Job summary" className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">{[
      { label: 'Conversations', value: summary.conversationCount.toLocaleString(), note: 'Unique conversations analyzed' },
      { label: 'Intents found', value: intents.toLocaleString(), note: 'Reasons customers get in touch' },
      { label: 'Cluster groups', value: counts[0].toLocaleString(), note: `${counts[1]} subgroups · ${counts[2]} detailed groups (L3)` },
    ].map(tile => <Card key={tile.label} className="gap-0 p-5"><p className="text-sm text-muted">{tile.label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{tile.value}</p><p className="mt-2 text-xs text-muted">{tile.note}</p></Card>)}</div>
    <div className="grid gap-3 sm:grid-cols-2">{[
      { label: 'Largest cluster', cluster: largest, note: largest ? `${(largest.coverage * 100).toFixed(1)}% of conversations · ${largest.level}` : 'No cluster data yet' },
      { label: 'Most complex cluster', cluster: complex, note: complex ? `Complexity ${Math.round(complex.complexity)} / 100 · ${complex.level}` : 'No complexity data yet' },
    ].map(item => <button key={item.label} type="button" disabled={!item.cluster || !onSelectCluster} onClick={() => item.cluster && onSelectCluster?.(item.cluster)} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-5 py-4 text-left hover:border-accent-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:hover:border-border"><span className="min-w-0"><span className="block text-xs text-muted">{item.label}</span><span className="mt-1 block font-medium">{item.cluster?.name ?? '—'}</span><span className="mt-1 block text-xs text-muted">{item.note}</span></span>{onSelectCluster && item.cluster && <span aria-hidden="true" className="text-accent-strong">→</span>}</button>)}</div>
  </section>;
}
