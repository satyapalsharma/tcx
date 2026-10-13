'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Download, SlidersHorizontal } from 'lucide-react';
import {
  downloadData,
  exportCsv,
  type ClusterMetric,
} from '@/lib/job-analytics';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/common';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export type ClusterFilters = {
  search: string;
  level: 'all' | 'L1' | 'L2' | 'L3';
  minComplexity: string;
  maxComplexity: string;
  minAutomation: string;
};
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
type SortField =
  | 'name'
  | 'volume'
  | 'coverage'
  | 'complexity'
  | 'automationPotential'
  | 'automationScore';
type ColumnKey =
  'level' | 'path' | 'volume' | 'complexity' | 'score' | 'potential';
const DEFAULT_COLUMNS: Record<ColumnKey, boolean> = {
  level: true,
  path: false,
  volume: true,
  complexity: true,
  score: true,
  potential: false,
};

export function ClusterExplorer({
  clusters,
  allClusters,
  filters,
  onFiltersChange,
  selectedClusterId,
  onSelectCluster,
  onViewTranscripts,
  jobId,
}: Props) {
  const [sortField, setSortField] = useState<SortField>('volume');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [draftFilters, setDraftFilters] = useState(filters);
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [draftColumns, setDraftColumns] = useState(DEFAULT_COLUMNS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const selected = allClusters.find(
    (cluster) => cluster.id === selectedClusterId,
  );
  useEffect(() => {
    if (selectedClusterId && !selected) onSelectCluster(null);
  }, [selectedClusterId, selected, onSelectCluster]);
  const hasFilters = Boolean(
    filters.search ||
    filters.level !== 'all' ||
    filters.minComplexity ||
    filters.maxComplexity ||
    filters.minAutomation,
  );
  const advancedCount = [
    filters.level !== 'all',
    filters.minComplexity !== '',
    filters.maxComplexity !== '',
    filters.minAutomation !== '',
    columns.potential !== DEFAULT_COLUMNS.potential,
    columns.path !== DEFAULT_COLUMNS.path,
  ].filter(Boolean).length;
  // Browse one hierarchy level at a time; explicit comparison filters can span levels.
  const visibleClusters = useMemo(
    () =>
      clusters
        .filter(
          (cluster) =>
            hasFilters ||
            (selected?.level === 'L3'
              ? cluster.id === selected.id
              : selected
                ? cluster.parentId === selected.id
                : cluster.level === 'L1'),
        )
        .sort((a, b) => {
          const left = a[sortField];
          const right = b[sortField];
          const comparison =
            typeof left === 'string' && typeof right === 'string'
              ? left.localeCompare(right)
              : Number(left) - Number(right);
          return sortDirection === 'asc' ? comparison : -comparison;
        }),
    [clusters, hasFilters, selected, sortDirection, sortField],
  );
  const breadcrumb: ClusterMetric[] = [];
  let parent = selected;
  const seen = new Set<string>();
  while (parent && !seen.has(parent.id)) {
    seen.add(parent.id);
    breadcrumb.unshift(parent);
    parent = allClusters.find((cluster) => cluster.id === parent?.parentId);
  }
  const sort = (field: SortField) => {
    if (sortField === field)
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  };
  const sortButton = (field: SortField, label: string) => (
    <button
      type="button"
      onClick={() => sort(field)}
      aria-label={`Sort by ${label}`}
      className="whitespace-nowrap hover:text-foreground"
    >
      {label}
      {sortField === field ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
    </button>
  );
  const patch = (next: Partial<ClusterFilters>) =>
    setDraftFilters((current) => ({ ...current, ...next }));
  const resetSettings = () => {
    setDraftFilters({
      search: filters.search,
      level: 'all',
      minComplexity: '',
      maxComplexity: '',
      minAutomation: '',
    });
    setDraftColumns(DEFAULT_COLUMNS);
  };
  const applySettings = () => {
    onFiltersChange(draftFilters);
    setColumns(draftColumns);
    setSettingsOpen(false);
  };
  const toggleDraftColumn = (key: ColumnKey, checked: boolean) =>
    setDraftColumns((current) => ({ ...current, [key]: checked }));
  const download = () =>
    downloadData(
      `job-${jobId}-clusters.csv`,
      exportCsv(
        visibleClusters.map((cluster) => ({
          cluster: cluster.name,
          level: cluster.level,
          l1: cluster.l1,
          l2: cluster.l2,
          l3: cluster.l3,
          conversations: cluster.volume,
          coveragePercent: Number((cluster.coverage * 100).toFixed(2)),
          complexity: cluster.complexity,
          automationPotential: cluster.automationPotential,
          automationScore: cluster.automationScore,
        })),
      ),
    );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Explore clusters</h2>
          <p className="mt-1 text-xs text-muted">
            Open a group to see its subgroups and conversations.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!visibleClusters.length}
          onClick={download}
        >
          <Download className="size-3.5" />
          Export CSV
        </Button>
      </div>
      <nav
        aria-label="Cluster hierarchy"
        className="flex flex-wrap items-center gap-1.5 text-xs"
      >
        <button
          type="button"
          aria-current={!selected ? 'page' : undefined}
          className={
            !selected ? 'font-semibold' : 'text-accent-strong hover:underline'
          }
          onClick={() => onSelectCluster(null)}
        >
          All groups (L1)
        </button>
        {breadcrumb.map((item) => (
          <span key={item.id} className="flex items-center gap-1.5">
            <ChevronRight className="size-3 text-muted" />
            <button
              type="button"
              aria-current={item.id === selected?.id ? 'page' : undefined}
              className={
                item.id === selected?.id
                  ? 'font-semibold'
                  : 'text-accent-strong hover:underline'
              }
              onClick={() => onSelectCluster(item)}
            >
              {item.name}
            </button>
          </span>
        ))}
      </nav>
      <div className="flex flex-col items-start gap-3 sm:flex-row">
        <Input
          aria-label="Search clusters"
          value={filters.search}
          onChange={(event) => {
            const search = event.target.value;
            setDraftFilters((current) => ({ ...current, search }));
            onFiltersChange({ ...filters, search });
          }}
          placeholder="Search clusters…"
          className="h-9 sm:max-w-sm"
        />
        <Popover
          open={settingsOpen}
          onOpenChange={(open) => {
            setSettingsOpen(open);
            if (open) {
              setDraftFilters(filters);
              setDraftColumns(columns);
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 shrink-0">
              <SlidersHorizontal className="size-3.5" />
              Filters & columns
              {advancedCount > 0 && (
                <span className="rounded bg-accent-soft px-1.5 text-accent-strong">
                  {advancedCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            aria-label="Cluster table settings"
            align="start"
            className="w-[min(92vw,520px)] p-0"
          >
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Table settings</p>
              <p className="mt-1 text-xs text-muted">
                Choose comparison filters and visible columns.
              </p>
            </div>
            <Accordion
              type="multiple"
              defaultValue={['filters', 'columns']}
              className="px-4"
            >
              <AccordionItem value="filters">
                <AccordionTrigger className="py-3 text-xs font-semibold hover:no-underline">
                  Filters
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted">
                        Compare level
                      </Label>
                      <SelectField
                        aria-label="Compare a level"
                        value={draftFilters.level}
                        onValueChange={(value) =>
                          patch({ level: value as ClusterFilters['level'] })
                        }
                        options={[
                          { value: 'all', label: 'Browse hierarchy' },
                          { value: 'L1', label: 'L1 · Groups' },
                          { value: 'L2', label: 'L2 · Subgroups' },
                          { value: 'L3', label: 'L3 · Detailed groups' },
                        ]}
                        className="h-9 w-full"
                        size="default"
                      />
                    </div>
                    <label className="space-y-1 text-xs text-muted">
                      <span>Minimum automation potential</span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={draftFilters.minAutomation}
                        onChange={(event) =>
                          patch({ minAutomation: event.target.value })
                        }
                        placeholder="Any"
                        className="h-9"
                      />
                    </label>
                    <div className="space-y-1 text-xs text-muted">
                      <span>Complexity range</span>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          aria-label="Minimum complexity"
                          value={draftFilters.minComplexity}
                          onChange={(event) =>
                            patch({ minComplexity: event.target.value })
                          }
                          placeholder="Min"
                          className="h-9 min-w-0"
                        />
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          aria-label="Maximum complexity"
                          value={draftFilters.maxComplexity}
                          onChange={(event) =>
                            patch({ maxComplexity: event.target.value })
                          }
                          placeholder="Max"
                          className="h-9 min-w-0"
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="columns">
                <AccordionTrigger className="py-3 text-xs font-semibold hover:no-underline">
                  Columns
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        ['level', 'Cluster level'],
                        ['path', 'Parent path'],
                        ['volume', 'Conversation volume'],
                        ['complexity', 'Complexity'],
                        ['score', 'Automation score'],
                        ['potential', 'Automation potential'],
                      ] as [ColumnKey, string][]
                    ).map(([key, label]) => (
                      <Label
                        key={key}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Checkbox
                          checked={draftColumns[key]}
                          onCheckedChange={(checked) =>
                            toggleDraftColumn(key, checked === true)
                          }
                        />
                        {label}
                      </Label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <Button variant="ghost" size="sm" onClick={resetSettings}>
                Reset
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDraftFilters(filters);
                    setDraftColumns(columns);
                    setSettingsOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="accent" size="sm" onClick={applySettings}>
                  Apply filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {visibleClusters.length ? (
        <Card className="gap-0 overflow-hidden p-0">
          <Table className="min-w-[680px] border-collapse text-left text-sm">
            <TableHeader className="bg-surface-inset/40 text-xs text-muted">
              <TableRow>
                <TableHead scope="col" className="px-4 py-3">
                  {sortButton('name', 'Cluster')}
                </TableHead>
                {columns.volume && (
                  <TableHead scope="col" className="px-4 py-3 text-right">
                    {sortButton('coverage', 'Volume covered')}
                  </TableHead>
                )}
                {columns.complexity && (
                  <TableHead scope="col" className="px-4 py-3 text-right">
                    {sortButton('complexity', 'Complexity')}
                  </TableHead>
                )}
                {columns.score && (
                  <TableHead scope="col" className="px-4 py-3 text-right">
                    {sortButton('automationScore', 'Automation score')}
                  </TableHead>
                )}
                {columns.potential && (
                  <TableHead scope="col" className="px-4 py-3 text-right">
                    {sortButton('automationPotential', 'Potential')}
                  </TableHead>
                )}
                <TableHead scope="col" className="px-4 py-3">
                  <span className="sr-only">Transcripts</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {visibleClusters.map((cluster) => (
                <TableRow
                  key={cluster.id}
                  className="hover:bg-surface-inset/30"
                >
                  <TableCell className="max-w-[300px] px-4 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        cluster.level === 'L3'
                          ? onViewTranscripts(cluster)
                          : onSelectCluster(cluster)
                      }
                      className="flex max-w-full items-center gap-2 text-left font-medium hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="break-words">{cluster.name}</span>
                      {cluster.level !== 'L3' && (
                        <ChevronRight className="size-3.5 shrink-0 text-muted" />
                      )}
                    </button>
                    {(columns.level || columns.path) && (
                      <p className="mt-1 text-xs text-muted">
                        {columns.level ? cluster.level : ''}
                        {columns.path &&
                          ` · ${[cluster.l1, cluster.l2].filter(Boolean).join(' / ')}`}
                      </p>
                    )}
                  </TableCell>
                  {columns.volume && (
                    <TableCell className="px-4 py-4 text-right tabular-nums">
                      <span className="font-medium">
                        {(cluster.coverage * 100).toFixed(1)}%
                      </span>
                      <span className="mt-1 block text-xs text-muted">
                        {cluster.volume} conversations
                      </span>
                    </TableCell>
                  )}
                  {columns.complexity && (
                    <TableCell className="px-4 py-4 text-right tabular-nums">
                      {Math.round(cluster.complexity)}
                      <span className="text-xs text-muted"> / 100</span>
                    </TableCell>
                  )}
                  {columns.score && (
                    <TableCell className="px-4 py-4 text-right tabular-nums">
                      {Math.round(cluster.automationScore)}
                      <span className="text-xs text-muted"> / 100</span>
                    </TableCell>
                  )}
                  {columns.potential && (
                    <TableCell className="px-4 py-4 text-right tabular-nums">
                      {Math.round(cluster.automationPotential)}%
                    </TableCell>
                  )}
                  <TableCell className="px-4 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewTranscripts(cluster)}
                    >
                      Transcripts
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="border-t border-border px-4 py-3 text-xs text-muted">
            {visibleClusters.length} groups · Volume is a share of all
            conversations in this job.
          </p>
        </Card>
      ) : (
        <Card className="border-dashed p-8 text-center">
          <p className="text-sm font-medium">No clusters match this view</p>
          <p className="mt-1 text-xs text-muted">
            Clear filters or go back to a parent group.
          </p>
        </Card>
      )}
      <Accordion type="single" collapsible className="text-xs text-muted">
        <AccordionItem value="score-help" className="border-0">
          <AccordionTrigger className="w-fit py-1 text-xs text-muted hover:no-underline">
            What do these scores mean?
          </AccordionTrigger>
          <AccordionContent className="max-w-3xl leading-5">
            Complexity estimates how involved a conversation is. Automation
            score combines coverage, complexity, and automation potential to
            help prioritize groups. Higher automation scores suggest more
            promising opportunities. Use the savings estimate in Advanced
            analysis to add your costs.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
