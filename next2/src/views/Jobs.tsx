'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useApp, type WorkspaceJob } from '@/context/AppContext';
import { PageHeader, StatusBadge, EmptyState, SearchToolbar, SelectField } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const statusVariant = (job: WorkspaceJob) => {
  if (job.status === 'run') return 'warn';
  if (job.status === 'done') return 'ok';
  if (job.status === 'failed') return 'danger';
  return 'neutral';
};

export default function Jobs() {
  const { openNewRun, currentWorkspace, jobsForCurrentWorkspace: jobs } = useApp();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedJob, setSelectedJob] = useState<WorkspaceJob | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesText = `${job.id} ${job.subtitle} ${job.pipeline}`.toLowerCase().includes(query);
      return matchesText && (!status || job.status === status);
    });
  }, [jobs, search, status]);

  const resetFilters = () => {
    setSearch('');
    setStatus('');
  };

  const resultPath = selectedJob?.taskType === 'design_flow'
    ? '/design'
    : selectedJob?.taskType === 'generate_agent'
      ? '/develop'
      : selectedJob?.taskType
        ? '/analysis'
        : undefined;

  const sourceLabel = selectedJob?.input?.source.replaceAll('_', ' ');

  return (
    <AppShell crumb="Jobs">
      <div className="mx-auto w-full max-w-[1120px] p-4 pb-16 sm:p-6 lg:p-8" data-od-id="jobs-page">
        <PageHeader
          title="Jobs"
          description={`Jobs in ${currentWorkspace.name}`}
          dataOdId="page-title"
          actions={
            <Button type="button" variant="accent" className="h-9 gap-2 px-3.5 text-sm" onClick={() => openNewRun()}>
              <Icon name="plus" className="size-4 shrink-0" />
              New job
            </Button>
          }
        />

        <p className="mb-5 text-xs leading-5 text-muted">
          Demo jobs are saved in this browser; processing is not connected yet.
        </p>

        <Card className="gap-0 overflow-hidden rounded-xl border border-border bg-surface p-0 shadow-xs">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-foreground">All jobs <span className="font-normal text-muted">({filtered.length})</span></h2>
            <SearchToolbar
              query={search}
              onQueryChange={setSearch}
              placeholder="Search by name or ID"
            >
              <SelectField
                id="job-status"
                aria-label="Filter jobs by status"
                value={status}
                onValueChange={setStatus}
                className="h-9 w-full sm:w-[140px]"
                options={[
                  { value: '', label: 'Any status' },
                  { value: 'queued', label: 'Queued' },
                  { value: 'run', label: 'Running' },
                  { value: 'done', label: 'Completed' },
                  { value: 'failed', label: 'Failed' },
                ]}
              />
            </SearchToolbar>
          </div>

          {jobs.length === 0 ? (
            <EmptyState
              icon="play"
              title={`No jobs in ${currentWorkspace.name} yet`}
              description="Create a job to add it to this workspace."
              dataOdId="jobs-empty"
              action={
                <Button type="button" variant="accent" size="sm" className="mt-2 gap-2 text-xs" onClick={() => openNewRun()}>
                  <Icon name="plus" className="size-4 shrink-0" />
                  New job
                </Button>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="search"
              title="No jobs found"
              description="Try a different search or status."
              dataOdId="jobs-empty"
              action={
                <Button type="button" variant="outline" size="sm" className="mt-2 text-xs" onClick={resetFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto sm:block">
                <Table id="jobs-table" className="min-w-[620px]">
                  <TableHeader>
                    <TableRow className="text-[11px] font-semibold uppercase tracking-wider text-muted hover:bg-transparent">
                      <TableHead className="px-4 py-3">Job</TableHead>
                      <TableHead className="px-4 py-3">Type</TableHead>
                      <TableHead className="px-4 py-3">Status</TableHead>
                      <TableHead className="px-4 py-3">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((job) => (
                      <TableRow key={job.id} data-status={job.status}>
                        <TableCell className="max-w-[340px] px-4 py-3">
                          <Button variant="link" className="p-0 h-auto block max-w-full truncate text-left text-sm font-medium text-foreground hover:underline cursor-pointer" onClick={() => setSelectedJob(job)}>
                            {job.subtitle}
                          </Button>
                          <Button variant="ghost" className="p-0 h-auto mt-0.5 font-mono text-[11px] text-muted hover:text-foreground cursor-pointer" onClick={() => setSelectedJob(job)}>
                            {job.id}
                          </Button>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs text-foreground">{job.pipeline}</TableCell>
                        <TableCell className="px-4 py-3">
                          <StatusBadge status={statusVariant(job)} pulse={job.status === 'run'}>
                            {job.statusLabel}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs text-muted">{job.started}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="divide-y divide-border sm:hidden">
                {filtered.map((job) => (
                  <article key={job.id} className="space-y-2.5 p-4" data-status={job.status}>
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Button variant="link" className="p-0 h-auto block max-w-full truncate text-left text-sm font-medium text-foreground hover:underline cursor-pointer" onClick={() => setSelectedJob(job)}>
                          {job.subtitle}
                        </Button>
                        <Button variant="ghost" className="p-0 h-auto mt-0.5 font-mono text-[11px] text-muted hover:text-foreground cursor-pointer" onClick={() => setSelectedJob(job)}>
                          {job.id}
                        </Button>
                      </div>
                      <StatusBadge status={statusVariant(job)} pulse={job.status === 'run'} className="shrink-0">
                        {job.statusLabel}
                      </StatusBadge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                      <span className="text-foreground">{job.pipeline}</span>
                      <span aria-hidden="true">·</span>
                      <span>{job.started}</span>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <Dialog open={Boolean(selectedJob)} onOpenChange={(open) => !open && setSelectedJob(null)}>
        {selectedJob && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="pr-7">{selectedJob.subtitle}</DialogTitle>
              <DialogDescription>{selectedJob.id} · {selectedJob.pipeline}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Status</span>
                <StatusBadge status={statusVariant(selectedJob)} pulse={selectedJob.status === 'run'}>{selectedJob.statusLabel}</StatusBadge>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-muted">Workspace</span>
                <span className="text-right font-medium text-foreground">{currentWorkspace.name}</span>
              </div>
              <div className="space-y-2 rounded-lg border border-border p-3">
                <div className="text-xs font-semibold text-foreground">Input</div>
                {selectedJob.input ? (
                  <dl className="space-y-1.5 text-xs">
                    <div className="flex justify-between gap-3"><dt className="text-muted">Source</dt><dd className="text-right capitalize text-foreground">{sourceLabel}</dd></div>
                    {selectedJob.input.fileName && <div className="flex justify-between gap-3"><dt className="text-muted">File</dt><dd className="max-w-[220px] truncate text-right text-foreground">{selectedJob.input.fileName}</dd></div>}
                    {selectedJob.input.runtime && <div className="flex justify-between gap-3"><dt className="text-muted">Runtime</dt><dd className="text-right text-foreground">{selectedJob.input.runtime}</dd></div>}
                  </dl>
                ) : (
                  <p className="text-xs leading-5 text-muted">No input details were saved for this sample job.</p>
                )}
              </div>
              <p className="text-[11px] leading-4 text-muted">Job details are demo data. File contents are not uploaded or processed.</p>
            </div>
            {selectedJob.status === 'done' && resultPath && (
              <DialogFooter>
                <Button asChild variant="accent" className="gap-2">
                  <Link href={resultPath}>Open related view<Icon name="arrowr" className="size-4" /></Link>
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        )}
      </Dialog>
    </AppShell>
  );
}
