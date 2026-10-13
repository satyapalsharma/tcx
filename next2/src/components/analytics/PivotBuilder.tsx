'use client';

import { useMemo, useState } from 'react';
import type {
  PivotField,
  PivotMetric,
  TranscriptRecord,
} from '@/lib/job-analytics';
import { exportCsv, pivotTranscripts, downloadData } from '@/lib/job-analytics';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SelectField } from '@/components/common';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const FIELDS: { value: PivotField; label: string }[] = [
  { value: 'l1', label: 'L1 group' },
  { value: 'l2', label: 'L2 group' },
  { value: 'l3', label: 'L3 group' },
  { value: 'intent', label: 'Intent' },
  { value: 'resolution', label: 'Resolution' },
  { value: 'escalationReason', label: 'Escalation reason' },
  { value: 'holdReason', label: 'Hold reason' },
];
const METRICS: { value: PivotMetric; label: string }[] = [
  { value: 'volume', label: 'Conversation volume' },
  { value: 'avgComplexity', label: 'Average complexity' },
  { value: 'avgAutomationPotential', label: 'Average automation potential' },
];
export function PivotBuilder({
  records,
  sample,
  jobId,
  clusterOutputAvailable = true,
}: {
  records: TranscriptRecord[];
  sample: boolean;
  jobId: string;
  clusterOutputAvailable?: boolean;
}) {
  const [rowField, setRowField] = useState<PivotField>(
    clusterOutputAvailable ? 'l1' : 'intent',
  );
  const [columnField, setColumnField] = useState<PivotField>('intent');
  const [metric, setMetric] = useState<PivotMetric>('volume');
  const fields = FIELDS.filter(
    (field) =>
      clusterOutputAvailable || !['l1', 'l2', 'l3'].includes(field.value),
  );
  const pivot = useMemo(
    () => pivotTranscripts(records, rowField, columnField, metric),
    [records, rowField, columnField, metric],
  );
  const handleExport = () => {
    const exportRows = pivot.rows.map((row) => ({
      [rowField]: row.key,
      ...row.values,
      total: row.total,
    }));
    downloadData(`job-${jobId}-pivot.csv`, exportCsv(exportRows));
  };
  const metricLabel =
    METRICS.find((item) => item.value === metric)?.label ?? 'Metric';
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-lg font-semibold">Pivot explorer</h2>
          <p className="mt-1 text-xs text-muted">
            Change rows, columns, and measures to compare the same filtered
            conversations.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={!pivot.rows.length}
        >
          Download pivot CSV
        </Button>
      </div>
      {sample && (
        <p className="rounded-lg bg-accent-soft/40 px-3 py-2 text-xs text-accent-strong">
          Pivot values use sample conversations from this job.
        </p>
      )}
      <Card className="grid gap-3 border-border p-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="pivot-rows" className="text-xs text-muted">
            Rows
          </Label>
          <SelectField
            id="pivot-rows"
            value={rowField}
            onValueChange={(value) => setRowField(value as PivotField)}
            options={fields}
            className="h-9 w-full"
            size="default"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pivot-columns" className="text-xs text-muted">
            Columns
          </Label>
          <SelectField
            id="pivot-columns"
            value={columnField}
            onValueChange={(value) => setColumnField(value as PivotField)}
            options={fields}
            className="h-9 w-full"
            size="default"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pivot-measure" className="text-xs text-muted">
            Measure
          </Label>
          <SelectField
            id="pivot-measure"
            value={metric}
            onValueChange={(value) => setMetric(value as PivotMetric)}
            options={METRICS}
            className="h-9 w-full"
            size="default"
          />
        </div>
      </Card>
      {pivot.rows.length ? (
        <Card className="overflow-hidden border-border p-0">
          <Table className="min-w-[720px] border-collapse text-left text-sm">
            <TableHeader>
              <TableRow className="border-b border-border bg-surface-inset/40 text-[11px] font-semibold uppercase tracking-wider text-muted">
                <TableHead
                  scope="col"
                  className="sticky left-0 bg-surface-inset px-4 py-3"
                >
                  {FIELDS.find((field) => field.value === rowField)?.label}
                </TableHead>
                {pivot.columns.map((column) => (
                  <TableHead
                    scope="col"
                    key={column}
                    className="px-4 py-3 text-right"
                  >
                    {column}
                  </TableHead>
                ))}
                <TableHead scope="col" className="px-4 py-3 text-right">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {pivot.rows.map((row) => (
                <TableRow key={row.key} className="hover:bg-surface-hover/30">
                  <TableHead
                    scope="row"
                    className="sticky left-0 max-w-[260px] truncate bg-surface px-4 py-3 text-left font-medium"
                    title={row.key}
                  >
                    {row.key}
                  </TableHead>
                  {pivot.columns.map((column) => (
                    <TableCell
                      key={column}
                      className="px-4 py-3 text-right tabular-nums"
                    >
                      {row.values[column]?.toFixed(
                        metric === 'volume' ? 0 : 1,
                      ) ?? '0'}
                    </TableCell>
                  ))}
                  <TableCell className="px-4 py-3 text-right font-semibold tabular-nums">
                    {row.total.toFixed(metric === 'volume' ? 0 : 1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="border-t border-border px-4 py-3 text-[11px] text-muted">
            Measure: {metricLabel} · {records.length.toLocaleString()} filtered
            transcript records
          </p>
        </Card>
      ) : (
        <Card className="border-dashed border-border p-8 text-center">
          <p className="text-sm font-medium">No records to pivot</p>
          <p className="mt-1 text-xs text-muted">
            Choose a job with transcript records or clear the current cluster
            selection.
          </p>
        </Card>
      )}
    </div>
  );
}
