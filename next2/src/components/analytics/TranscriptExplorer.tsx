'use client';

import { useMemo, useState } from 'react';
import { Download, FileJson, FileText, Search, SlidersHorizontal, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { exportCsv, downloadData, type TranscriptRecord } from '@/lib/job-analytics';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type ColumnKey = 'id' | 'conversationId' | 'intent' | 'l1' | 'l2' | 'l3' | 'resolution' | 'escalationReason' | 'holdReason' | 'painPoints' | 'handlingMinutes' | 'complexity' | 'automationPotential';
type SortKey = ColumnKey;
type SortDirection = 'asc' | 'desc';
type Column = { key: ColumnKey; label: string; value: (record: TranscriptRecord) => string | number };

const PAGE_SIZE = 20;
const COLUMNS: Column[] = [
  { key: 'id', label: 'Record ID', value: (r) => r.id },
  { key: 'conversationId', label: 'Conversation ID', value: (r) => r.conversationId },
  { key: 'intent', label: 'Intent', value: (r) => r.intent },
  { key: 'l1', label: 'L1', value: (r) => r.l1 },
  { key: 'l2', label: 'L2', value: (r) => r.l2 },
  { key: 'l3', label: 'L3', value: (r) => r.l3 },
  { key: 'resolution', label: 'Resolution', value: (r) => r.resolution },
  { key: 'escalationReason', label: 'Escalation reason', value: (r) => r.escalationReason },
  { key: 'holdReason', label: 'Hold reason', value: (r) => r.holdReason },
  { key: 'painPoints', label: 'Pain points', value: (r) => r.painPoints.join('; ') },
  { key: 'handlingMinutes', label: 'Handling (min)', value: (r) => r.handlingMinutes },
  { key: 'complexity', label: 'Complexity', value: (r) => r.complexity },
  { key: 'automationPotential', label: 'Automation potential', value: (r) => r.automationPotential },
];
const DEFAULT_COLUMNS = new Set<ColumnKey>(['conversationId', 'intent', 'l1', 'l2', 'resolution']);

export type TranscriptExplorerProps = { records: TranscriptRecord[]; sample?: boolean };

export function TranscriptExplorer({ records, sample = false }: TranscriptExplorerProps) {
  const [query, setQuery] = useState('');
  const [l1Filter, setL1Filter] = useState('');
  const [l2Filter, setL2Filter] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'conversationId', direction: 'asc' });
  const [pageState, setPageState] = useState<{ filterKey: string; page: number }>({ filterKey: '', page: 0 });
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(() => new Set(DEFAULT_COLUMNS));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [selectedRecord, setSelectedRecord] = useState<TranscriptRecord | null>(null);

  const l1Options = useMemo(() => unique(records.map((record) => record.l1)), [records]);
  const l2Options = useMemo(() => unique(records.filter((record) => !l1Filter || record.l1 === l1Filter).map((record) => record.l2)), [records, l1Filter]);
  const filterKey = `${query.trim().toLowerCase()}\u0000${l1Filter}\u0000${l2Filter}\u0000${records.map((record) => record.id).join('|')}`;
  const filteredRecords = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matching = records.filter((record) => {
      if (l1Filter && record.l1 !== l1Filter) return false;
      if (l2Filter && record.l2 !== l2Filter) return false;
      if (!normalized) return true;
      return [record.id, record.conversationId, record.intent, record.l1, record.l2, record.l3, record.resolution, record.escalationReason, record.holdReason, record.painPoints.join(' '), record.transcript]
        .join(' ').toLowerCase().includes(normalized);
    });
    const column = COLUMNS.find((item) => item.key === sort.key);
    return matching.slice().sort((a, b) => {
      const left = sort.key === 'id' ? a.id : column?.value(a) ?? '';
      const right = sort.key === 'id' ? b.id : column?.value(b) ?? '';
      const comparison = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [records, query, l1Filter, l2Filter, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const page = pageState.filterKey === filterKey ? Math.min(pageState.page, pageCount - 1) : 0;
  const pageRecords = filteredRecords.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const visibleSelectedIds = pageRecords.filter((record) => selectedIds.has(record.id)).map((record) => record.id);
  const allPageSelected = pageRecords.length > 0 && visibleSelectedIds.length === pageRecords.length;
  const selectedRecords = records.filter((record) => selectedIds.has(record.id));
  const selectedColumns = COLUMNS.filter((column) => visibleColumns.has(column.key));

  const changeQuery = (value: string) => { setQuery(value); setPageState({ filterKey: '', page: 0 }); };
  const changeL1 = (value: string) => { setL1Filter(value); setL2Filter(''); setPageState({ filterKey: '', page: 0 }); };
  const changeL2 = (value: string) => { setL2Filter(value); setPageState({ filterKey: '', page: 0 }); };

  const toggleSort = (key: SortKey) => setSort((current) => current.key === key
    ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
    : { key, direction: 'asc' });

  const clearFilters = () => {
    setQuery(''); setL1Filter(''); setL2Filter(''); setPageState({ filterKey: '', page: 0 });
  };

  const toggleRecord = (recordId: string, checked: boolean) => setSelectedIds((current) => {
    const next = new Set(current);
    if (checked) next.add(recordId); else next.delete(recordId);
    return next;
  });

  const togglePageSelection = () => setSelectedIds((current) => {
    const next = new Set(current);
    if (allPageSelected) pageRecords.forEach((record) => next.delete(record.id));
    else pageRecords.forEach((record) => next.add(record.id));
    return next;
  });

  const toggleColumn = (key: ColumnKey) => setVisibleColumns((current) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const downloadTranscript = (record: TranscriptRecord, format: 'json' | 'csv' | 'txt') => {
    const base = safeFilename(record.conversationId || record.id);
    if (format === 'json') downloadData(`${base}.json`, JSON.stringify(record, null, 2), 'application/json;charset=utf-8');
    else if (format === 'csv') downloadData(`${base}.csv`, exportCsv([record as unknown as Record<string, unknown>]), 'text/csv;charset=utf-8');
    else downloadData(`${base}.txt`, transcriptText(record), 'text/plain;charset=utf-8');
  };

  const downloadRecords = (items: TranscriptRecord[], format: 'json' | 'csv') => {
    const suffix = format === 'json' ? 'json' : 'csv';
    const text = format === 'json' ? JSON.stringify(items, null, 2) : exportCsv(items as unknown as Record<string, unknown>[]);
    downloadData(`transcripts-${items.length}.${suffix}`, text, format === 'json' ? 'application/json;charset=utf-8' : 'text/csv;charset=utf-8');
  };

  const activeFilters = Boolean(query.trim() || l1Filter || l2Filter);
  const activeFilterCount = [query.trim(), l1Filter, l2Filter].filter(Boolean).length;

  return (
    <div className="min-w-0 space-y-4">
      <Card className="min-w-0 gap-0 overflow-hidden p-0">
        <div className="flex flex-col gap-4 border-b border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Transcripts</h2>
              <p className="mt-1 text-xs text-muted">Search conversations, filter the taxonomy and inspect the full record.</p>
              {sample && <p className="mt-1 text-[11px] text-warn-fg">Synthetic sample data; contains no customer conversation data.</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <details className="relative">
                <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-input px-3 text-xs font-medium text-foreground hover:bg-surface-hover"><Download className="size-3.5" />Download</summary>
                <div className="absolute right-0 z-20 mt-1 w-56 rounded-xl border border-border bg-popover p-1.5 shadow-lg">
                  <button type="button" disabled={!filteredRecords.length} onClick={() => downloadRecords(filteredRecords, 'csv')} className="block w-full rounded-md px-2.5 py-2 text-left text-xs hover:bg-surface-hover disabled:opacity-50">Filtered records as CSV</button>
                  <button type="button" disabled={!filteredRecords.length} onClick={() => downloadRecords(filteredRecords, 'json')} className="block w-full rounded-md px-2.5 py-2 text-left text-xs hover:bg-surface-hover disabled:opacity-50">Filtered records as JSON</button>
                  {selectedRecords.length > 0 && <><div className="my-1 border-t border-border"/><p className="px-2.5 py-1 text-[10px] uppercase tracking-wide text-muted">{selectedRecords.length} selected</p><button type="button" onClick={() => downloadRecords(selectedRecords, 'csv')} className="block w-full rounded-md px-2.5 py-2 text-left text-xs hover:bg-surface-hover">Selected records as CSV</button><button type="button" onClick={() => downloadRecords(selectedRecords, 'json')} className="block w-full rounded-md px-2.5 py-2 text-left text-xs hover:bg-surface-hover">Selected records as JSON</button></>}
                </div>
              </details>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <Input value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="Search transcript, intent, resolution…" aria-label="Search transcripts" className="h-9 pl-9 text-sm" />
            </div>
            <details className="relative">
              <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-input px-3 text-xs font-medium text-foreground hover:bg-surface-hover"><SlidersHorizontal className="size-3.5" />Filters &amp; columns{activeFilterCount > 0 && <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] text-accent-strong">{activeFilterCount} active</span>}</summary>
              <div className="absolute right-0 z-20 mt-1 grid w-[min(22rem,calc(100vw-3rem))] gap-4 rounded-xl border border-border bg-popover p-3 shadow-lg sm:grid-cols-2">
                <div className="space-y-2"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Taxonomy filters</p>
                  <label className="flex items-center justify-between gap-2 text-xs text-muted"><span>L1</span><select value={l1Filter} onChange={(event) => changeL1(event.target.value)} className="h-8 max-w-[180px] rounded-lg border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">All categories</option>{l1Options.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                  <label className="flex items-center justify-between gap-2 text-xs text-muted"><span>L2</span><select value={l2Filter} onChange={(event) => changeL2(event.target.value)} disabled={!l2Options.length} className="h-8 max-w-[180px] rounded-lg border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"><option value="">All subcategories</option>{l2Options.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                </div>
                <div className="max-h-56 space-y-1 overflow-y-auto"><p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">Columns</p>{COLUMNS.map((column) => <label key={column.key} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-xs hover:bg-surface-hover"><Checkbox checked={visibleColumns.has(column.key)} onCheckedChange={() => toggleColumn(column.key)} /><span>{column.label}</span></label>)}</div>
              </div>
            </details>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span><strong className="font-semibold text-foreground">{filteredRecords.length}</strong> of {records.length} records</span>
            {activeFilters && <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={clearFilters}>Clear filters</Button>}
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
            <Search className="size-5 text-muted" aria-hidden="true" />
            <h3 className="text-sm font-semibold">{records.length ? 'No transcripts match these filters' : 'No transcript records available'}</h3>
            <p className="max-w-md text-xs leading-5 text-muted">{records.length ? 'Try a broader search or clear the active filters.' : 'Transcript details appear here when they are included in this job’s analytics output.'}</p>
            {records.length > 0 && <Button type="button" variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>}
          </div>
        ) : (
          <>
          <div className="max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-max border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 bg-surface-inset/70 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="sticky left-0 z-20 bg-surface-inset/90 px-3 py-3"><Checkbox aria-label="Select all transcripts on this page" checked={allPageSelected ? true : visibleSelectedIds.length ? 'indeterminate' : false} onCheckedChange={togglePageSelection} /></th>
                    {selectedColumns.map((column) => <th key={column.key} aria-sort={sort.key === column.key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'} className="max-w-[240px] px-3 py-3"><SortButton label={column.label} column={column.key} sort={sort} onSort={toggleSort} /></th>)}
                    <th className="sticky right-0 bg-surface-inset/90 px-3 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {pageRecords.map((record) => <tr key={record.id} className="align-top hover:bg-surface-hover/50">
                    <td className="sticky left-0 bg-surface px-3 py-3"><Checkbox aria-label={`Select ${record.conversationId}`} checked={selectedIds.has(record.id)} onCheckedChange={(checked) => toggleRecord(record.id, checked === true)} /></td>
                    {selectedColumns.map((column) => <td key={column.key} className="max-w-[240px] whitespace-normal px-3 py-3 text-foreground">{formatCell(column.value(record), column.key)}</td>)}
                    <td className="sticky right-0 bg-surface px-3 py-3 text-right"><Button type="button" variant="outline" size="sm" onClick={() => setSelectedRecord(record)}>View</Button></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-3.5">
              <p className="text-xs text-muted">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredRecords.length)} of {filteredRecords.length}</p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" disabled={page === 0} onClick={() => setPageState({ filterKey, page: Math.max(0, page - 1) })}>Previous</Button>
                <span className="min-w-16 text-center text-xs text-muted">Page {page + 1} of {pageCount}</span>
                <Button type="button" variant="outline" size="sm" disabled={page >= pageCount - 1} onClick={() => setPageState({ filterKey, page: Math.min(pageCount - 1, page + 1) })}>Next</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Dialog open={Boolean(selectedRecord)} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        {selectedRecord && <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Conversation {selectedRecord.conversationId}</DialogTitle>
            <DialogDescription>Complete transcript record and classification details.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Detail label="Record ID" value={selectedRecord.id} />
            <Detail label="Intent" value={selectedRecord.intent} />
            <Detail label="L1 category" value={selectedRecord.l1} />
            <Detail label="L2 category" value={selectedRecord.l2} />
            <Detail label="L3 category" value={selectedRecord.l3} />
            <Detail label="Resolution" value={selectedRecord.resolution} />
            <Detail label="Escalation reason" value={selectedRecord.escalationReason} />
            <Detail label="Hold reason" value={selectedRecord.holdReason} />
            <Detail label="Pain points" value={selectedRecord.painPoints.join('; ')} />
            <Detail label="Handling time" value={`${selectedRecord.handlingMinutes} min`} />
            <Detail label="Complexity" value={`${selectedRecord.complexity}%`} />
            <Detail label="Automation potential" value={`${selectedRecord.automationPotential}%`} />
          </div>
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Transcript</h3>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-surface-inset/50 p-4 font-sans text-sm leading-6 text-foreground">{selectedRecord.transcript || 'No transcript text provided.'}</pre>
          </section>
          <DialogFooter className="flex-wrap sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => downloadTranscript(selectedRecord, 'json')}><FileJson className="size-3.5" />JSON</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => downloadTranscript(selectedRecord, 'csv')}><Download className="size-3.5" />CSV</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => downloadTranscript(selectedRecord, 'txt')}><FileText className="size-3.5" />TXT</Button>
            </div>
            <Button type="button" variant="outline" onClick={() => setSelectedRecord(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>}
      </Dialog>
    </div>
  );
}

function SortButton({ label, column, sort, onSort }: { label: string; column: SortKey; sort: { key: SortKey; direction: SortDirection }; onSort: (key: SortKey) => void }) {
  const active = sort.key === column;
  const Icon = active ? sort.direction === 'asc' ? ArrowUp : ArrowDown : ArrowUpDown;
  return <button type="button" onClick={() => onSort(column)} aria-label={`Sort by ${label}${active ? `, ${sort.direction === 'asc' ? 'ascending' : 'descending'}` : ''}`} className="inline-flex items-center gap-1.5 text-left hover:text-foreground">{label}<Icon className="size-3" aria-hidden="true" /></button>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-lg border border-border p-3"><dt className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">{value || '—'}</dd></div>;
}

function formatCell(value: string | number, key: ColumnKey): string {
  if (typeof value === 'number') return key === 'handlingMinutes' ? `${value} min` : `${value}%`;
  return value || '—';
}

function unique(values: string[]): string[] { return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b)); }
function safeFilename(name: string): string { return name.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'transcript'; }
function transcriptText(record: TranscriptRecord): string {
  return [
    `Conversation ID: ${record.conversationId}`, `Record ID: ${record.id}`, `Intent: ${record.intent}`,
    `L1: ${record.l1}`, `L2: ${record.l2}`, `L3: ${record.l3}`, `Resolution: ${record.resolution}`,
    `Escalation reason: ${record.escalationReason || '—'}`, `Hold reason: ${record.holdReason || '—'}`,
    `Pain points: ${record.painPoints.join('; ') || '—'}`, `Handling time: ${record.handlingMinutes} min`,
    `Complexity: ${record.complexity}`, `Automation potential: ${record.automationPotential}`, '', 'Transcript:', record.transcript,
  ].join('\n');
}
