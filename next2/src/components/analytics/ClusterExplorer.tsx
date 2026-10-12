'use client';

import { useMemo, useState } from 'react';
import { ChevronRight, Download, SlidersHorizontal } from 'lucide-react';
import { downloadData, exportCsv, type ClusterMetric } from '@/lib/job-analytics';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export type ClusterFilters = { search: string; level: 'all' | 'L1' | 'L2' | 'L3'; minComplexity: string; maxComplexity: string; minAutomation: string };
type Props = {
  clusters: ClusterMetric[];
  allClusters: ClusterMetric[];
  filters: ClusterFilters;
  onFiltersChange: (filters: ClusterFilters) => void;
  selectedClusterId: string | null;
  onSelectCluster: (cluster: ClusterMetric | null) => void;
  onViewTranscripts: (cluster: ClusterMetric) => void;
  jobId: string;
};
const fieldStyle = 'h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
type SortField = 'name' | 'volume' | 'coverage' | 'complexity' | 'automationPotential' | 'automationScore';

export function ClusterExplorer({ clusters, allClusters, filters, onFiltersChange, selectedClusterId, onSelectCluster, onViewTranscripts, jobId }: Props) {
  const [sortField, setSortField] = useState<SortField>('volume');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showPotential, setShowPotential] = useState(false);
  const selected = allClusters.find(cluster => cluster.id === selectedClusterId);
  const hasFilters = Boolean(filters.search || filters.level !== 'all' || filters.minComplexity || filters.maxComplexity || filters.minAutomation);
  const advancedCount = [filters.level !== 'all', filters.minComplexity !== '', filters.maxComplexity !== '', filters.minAutomation !== '', showPotential].filter(Boolean).length;
  // Browse one hierarchy level at a time; explicit comparison filters can span levels.
  const visibleClusters = useMemo(() => clusters.filter(cluster => hasFilters || (selected?.level === 'L3' ? cluster.id === selected.id : selected ? cluster.parentId === selected.id : cluster.level === 'L1')).sort((a, b) => {
    const left = a[sortField]; const right = b[sortField];
    const comparison = typeof left === 'string' && typeof right === 'string' ? left.localeCompare(right) : Number(left) - Number(right);
    return sortDirection === 'asc' ? comparison : -comparison;
  }), [clusters, hasFilters, selected, sortDirection, sortField]);
  const breadcrumb: ClusterMetric[] = [];
  let parent = selected;
  const seen = new Set<string>();
  while (parent && !seen.has(parent.id)) {
    seen.add(parent.id); breadcrumb.unshift(parent);
    parent = allClusters.find(cluster => cluster.id === parent?.parentId);
  }
  const sort = (field: SortField) => {
    if (sortField === field) setSortDirection(direction => direction === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection(field === 'name' ? 'asc' : 'desc'); }
  };
  const sortButton = (field: SortField, label: string) => <button type="button" onClick={() => sort(field)} aria-label={`Sort by ${label}`} className="whitespace-nowrap hover:text-foreground">{label}{sortField === field ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}</button>;
  const patch = (next: Partial<ClusterFilters>) => onFiltersChange({ ...filters, ...next });
  const download = () => downloadData(`job-${jobId}-clusters.csv`, exportCsv(visibleClusters.map(cluster => ({ cluster: cluster.name, level: cluster.level, l1: cluster.l1, l2: cluster.l2, l3: cluster.l3, conversations: cluster.volume, coveragePercent: Number((cluster.coverage * 100).toFixed(2)), complexity: cluster.complexity, automationPotential: cluster.automationPotential, automationScore: cluster.automationScore }))));

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Explore clusters</h2><p className="mt-1 text-xs text-muted">Open a group to see its subgroups and conversations.</p></div><Button variant="outline" size="sm" disabled={!visibleClusters.length} onClick={download}><Download className="size-3.5"/>Export CSV</Button></div>
    <nav aria-label="Cluster hierarchy" className="flex flex-wrap items-center gap-1.5 text-xs"><button type="button" aria-current={!selected ? 'page' : undefined} className={!selected ? 'font-semibold' : 'text-accent-strong hover:underline'} onClick={() => onSelectCluster(null)}>All groups (L1)</button>{breadcrumb.map(item => <span key={item.id} className="flex items-center gap-1.5"><ChevronRight className="size-3 text-muted"/><button type="button" aria-current={item.id === selected?.id ? 'page' : undefined} className={item.id === selected?.id ? 'font-semibold' : 'text-accent-strong hover:underline'} onClick={() => onSelectCluster(item)}>{item.name}</button></span>)}</nav>
    <div className="flex flex-col items-start gap-3 sm:flex-row"><input aria-label="Search clusters" value={filters.search} onChange={event => patch({ search: event.target.value })} placeholder="Search clusters…" className={`${fieldStyle} sm:max-w-sm`}/><details className="w-full rounded-lg border border-border bg-surface sm:flex-1"><summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 px-3 text-xs font-medium"><SlidersHorizontal className="size-3.5"/>More filters & columns{advancedCount > 0 && <span className="rounded bg-accent-soft px-1.5 text-accent-strong">{advancedCount}</span>}</summary><div className="grid gap-3 border-t border-border p-3 sm:grid-cols-2">
      <label className="space-y-1 text-xs text-muted"><span>Compare a level</span><select value={filters.level} onChange={event => patch({ level: event.target.value as ClusterFilters['level'] })} className={fieldStyle}><option value="all">Browse hierarchy</option><option value="L1">L1 · Groups</option><option value="L2">L2 · Subgroups</option><option value="L3">L3 · Detailed groups</option></select></label>
      <label className="space-y-1 text-xs text-muted"><span>Minimum automation potential</span><input type="number" min="0" max="100" value={filters.minAutomation} onChange={event => patch({ minAutomation: event.target.value })} placeholder="Any" className={fieldStyle}/></label>
      <div className="space-y-1 text-xs text-muted"><span>Complexity range</span><div className="flex gap-2"><input type="number" min="0" max="100" aria-label="Minimum complexity" value={filters.minComplexity} onChange={event => patch({ minComplexity: event.target.value })} placeholder="Min" className={`${fieldStyle} min-w-0`}/><input type="number" min="0" max="100" aria-label="Maximum complexity" value={filters.maxComplexity} onChange={event => patch({ maxComplexity: event.target.value })} placeholder="Max" className={`${fieldStyle} min-w-0`}/></div></div>
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={showPotential} onChange={event => setShowPotential(event.target.checked)} className="accent-[var(--accent-strong)]"/>Show automation potential column</label>
      {hasFilters && <Button variant="ghost" size="sm" className="w-fit" onClick={() => onFiltersChange({ search: '', level: 'all', minComplexity: '', maxComplexity: '', minAutomation: '' })}>Clear comparison filters</Button>}
    </div></details></div>
    {visibleClusters.length ? <Card className="gap-0 overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full min-w-[680px] border-collapse text-left text-sm"><thead className="bg-surface-inset/40 text-xs text-muted"><tr><th className="px-4 py-3">{sortButton('name', 'Cluster')}</th><th className="px-4 py-3 text-right">{sortButton('coverage', 'Volume covered')}</th><th className="px-4 py-3 text-right">{sortButton('complexity', 'Complexity')}</th><th className="px-4 py-3 text-right">{sortButton('automationScore', 'Automation score')}</th>{showPotential && <th className="px-4 py-3 text-right">{sortButton('automationPotential', 'Potential')}</th>}<th className="px-4 py-3"><span className="sr-only">Transcripts</span></th></tr></thead><tbody className="divide-y divide-border">{visibleClusters.map(cluster => <tr key={cluster.id} className="hover:bg-surface-inset/30"><td className="max-w-[300px] px-4 py-4"><button type="button" onClick={() => cluster.level === 'L3' ? onViewTranscripts(cluster) : onSelectCluster(cluster)} className="flex max-w-full items-center gap-2 text-left font-medium hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="break-words">{cluster.name}</span>{cluster.level !== 'L3' && <ChevronRight className="size-3.5 shrink-0 text-muted"/>}</button><p className="mt-1 text-xs text-muted">{cluster.level}{hasFilters && ` · ${[cluster.l1, cluster.l2].filter(Boolean).join(' / ')}`}</p></td><td className="px-4 py-4 text-right tabular-nums"><span className="font-medium">{(cluster.coverage * 100).toFixed(1)}%</span><span className="mt-1 block text-xs text-muted">{cluster.volume} conversations</span></td><td className="px-4 py-4 text-right tabular-nums">{Math.round(cluster.complexity)}<span className="text-xs text-muted"> / 100</span></td><td className="px-4 py-4 text-right tabular-nums">{Math.round(cluster.automationScore)}<span className="text-xs text-muted"> / 100</span></td>{showPotential && <td className="px-4 py-4 text-right tabular-nums">{Math.round(cluster.automationPotential)}%</td>}<td className="px-4 py-4 text-right"><Button variant="ghost" size="sm" onClick={() => onViewTranscripts(cluster)}>Transcripts</Button></td></tr>)}</tbody></table></div><p className="border-t border-border px-4 py-3 text-xs text-muted">{visibleClusters.length} groups · Volume is a share of all conversations in this job.</p></Card> : <Card className="border-dashed p-8 text-center"><p className="text-sm font-medium">No clusters match this view</p><p className="mt-1 text-xs text-muted">Clear filters or go back to a parent group.</p></Card>}
    <details className="text-xs text-muted"><summary className="cursor-pointer">What do these scores mean?</summary><p className="mt-2 max-w-3xl leading-5">Complexity estimates how involved a conversation is. Automation score combines coverage, complexity, and automation potential to help prioritize groups. Higher automation scores suggest more promising opportunities. Use the savings estimate in Advanced analysis to add your costs.</p></details>
  </section>;
}
