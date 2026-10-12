'use client';

import { useMemo, useState } from 'react';
import type { PivotField, PivotMetric, TranscriptRecord } from '@/lib/job-analytics';
import { exportCsv, pivotTranscripts, downloadData } from '@/lib/job-analytics';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const FIELDS: { value: PivotField; label: string }[] = [
  { value: 'l1', label: 'L1 group' }, { value: 'l2', label: 'L2 group' }, { value: 'l3', label: 'L3 group' },
  { value: 'intent', label: 'Intent' }, { value: 'resolution', label: 'Resolution' }, { value: 'escalationReason', label: 'Escalation reason' }, { value: 'holdReason', label: 'Hold reason' },
];
const METRICS: { value: PivotMetric; label: string }[] = [
  { value: 'volume', label: 'Conversation volume' }, { value: 'avgComplexity', label: 'Average complexity' }, { value: 'avgAutomationPotential', label: 'Average automation potential' },
];
export function PivotBuilder({ records, sample, jobId }: { records: TranscriptRecord[]; sample: boolean; jobId: string }) {
  const [rowField, setRowField] = useState<PivotField>('l1');
  const [columnField, setColumnField] = useState<PivotField>('intent');
  const [metric, setMetric] = useState<PivotMetric>('volume');
  const pivot = useMemo(() => pivotTranscripts(records, rowField, columnField, metric), [records, rowField, columnField, metric]);
  const handleExport = () => {
    const exportRows = pivot.rows.map((row) => ({ [rowField]: row.key, ...row.values, total: row.total }));
    downloadData(`job-${jobId}-pivot.csv`, exportCsv(exportRows));
  };
  const metricLabel = METRICS.find((item) => item.value === metric)?.label ?? 'Metric';
  return <div className="space-y-4">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-lg font-semibold">Pivot explorer</h2><p className="mt-1 text-xs text-muted">Change rows, columns, and measures to compare the same filtered conversations.</p></div><Button type="button" variant="outline" size="sm" onClick={handleExport} disabled={!pivot.rows.length}>Download pivot CSV</Button></div>
    {sample && <p className="rounded-lg bg-accent-soft/40 px-3 py-2 text-xs text-accent-strong">Pivot values use sample conversations from this job.</p>}
    <Card className="grid gap-3 border-border p-4 sm:grid-cols-3">
      <label htmlFor="pivot-rows" className="space-y-1 text-xs text-muted"><span>Rows</span><select id="pivot-rows" value={rowField} onChange={(event) => setRowField(event.target.value as PivotField)} className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong">{FIELDS.map((field) => <option key={field.value} value={field.value}>{field.label}</option>)}</select></label>
      <label htmlFor="pivot-columns" className="space-y-1 text-xs text-muted"><span>Columns</span><select id="pivot-columns" value={columnField} onChange={(event) => setColumnField(event.target.value as PivotField)} className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong">{FIELDS.map((field) => <option key={field.value} value={field.value}>{field.label}</option>)}</select></label>
      <label htmlFor="pivot-measure" className="space-y-1 text-xs text-muted"><span>Measure</span><select id="pivot-measure" value={metric} onChange={(event) => setMetric(event.target.value as PivotMetric)} className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong">{METRICS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
    </Card>
    {pivot.rows.length ? <Card className="overflow-hidden border-border p-0"><div className="overflow-auto"><table className="w-full min-w-[720px] border-collapse text-left text-sm"><thead><tr className="border-b border-border bg-surface-inset/40 text-[11px] font-semibold uppercase tracking-wider text-muted"><th className="sticky left-0 bg-surface-inset px-4 py-3">{FIELDS.find((field) => field.value === rowField)?.label}</th>{pivot.columns.map((column) => <th key={column} className="px-4 py-3 text-right">{column}</th>)}<th className="px-4 py-3 text-right">Total</th></tr></thead><tbody className="divide-y divide-border">{pivot.rows.map((row) => <tr key={row.key} className="hover:bg-surface-hover/30"><th scope="row" className="sticky left-0 max-w-[260px] truncate bg-surface px-4 py-3 text-left font-medium" title={row.key}>{row.key}</th>{pivot.columns.map((column) => <td key={column} className="px-4 py-3 text-right tabular-nums">{row.values[column]?.toFixed(metric === 'volume' ? 0 : 1) ?? '0'}</td>)}<td className="px-4 py-3 text-right font-semibold tabular-nums">{row.total.toFixed(metric === 'volume' ? 0 : 1)}</td></tr>)}</tbody></table></div><p className="border-t border-border px-4 py-3 text-[11px] text-muted">Measure: {metricLabel} · {records.length.toLocaleString()} filtered transcript records</p></Card> : <Card className="border-dashed border-border p-8 text-center"><p className="text-sm font-medium">No records to pivot</p><p className="mt-1 text-xs text-muted">Choose a job with transcript records or clear the current cluster selection.</p></Card>}
  </div>;
}
