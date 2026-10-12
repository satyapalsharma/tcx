'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { useApp } from '@/context/AppContext';
import { usePipeline } from '@/context/PipelineContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TASK_LABELS, type PipelineRun } from '@/data/pipeline';

const states: PipelineRun['status'][] = ['queued', 'running', 'paused', 'completed', 'failed', 'cancelled'];
const selectStyle = 'h-9 max-w-full rounded-lg border border-border bg-surface px-3 text-sm';

export default function OrganizationDashboard() {
  const router = useRouter();
  const { currentOrg, workspacesForCurrentOrg: projects, membersForCurrentOrg, switchWorkspace, setIsNewWsOpen } = useApp();
  const { organizationRuns: jobs, organizationArtifacts: outputs } = usePipeline();
  const [projectFilter, setProjectFilter] = useState('all');
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(0);
  const visible = useMemo(() => jobs.filter(job => (projectFilter === 'all' || job.workspaceId === projectFilter) && (status === 'all' || job.status === status) && `${job.name} ${job.id}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'progress' ? b.progress - a.progress : b.createdAt - a.createdAt), [jobs, projectFilter, status, query, sort]);
  const pageCount = Math.max(1, Math.ceil(visible.length / 12));
  const currentPage = Math.min(page, pageCount - 1);
  const active = jobs.filter(job => ['queued', 'running', 'paused'].includes(job.status)).length;
  const completed = jobs.filter(job => job.status === 'completed').length;
  const openJob = (job: PipelineRun) => { switchWorkspace(job.workspaceId); router.push(`/job-analytics?jobId=${encodeURIComponent(job.id)}`); };
  const reset = () => { setProjectFilter('all'); setStatus('all'); setQuery(''); setPage(0); };
  const exportJobs = () => {
    const blob = new Blob([JSON.stringify({ organization: { id: currentOrg.id, name: currentOrg.name }, jobs: visible }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${currentOrg.slug}-jobs.json`; link.click(); URL.revokeObjectURL(url);
  };

  return <AppShell crumb="Organization dashboard"><main className="mx-auto w-full max-w-[1400px] space-y-6 p-5 sm:p-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-wider text-muted">Organization overview</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">{currentOrg.name}</h1></div><Button variant="accent" onClick={() => setIsNewWsOpen(true)}>New project</Button></header>
    <section aria-label="Organization summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[
      ['Projects', projects.length], ['Jobs', jobs.length], ['Active', active], ['Members', membersForCurrentOrg.filter(member => member.status !== 'service').length],
    ].map(([label, value]) => <Card key={String(label)} className="gap-1 p-4"><p className="text-xs text-muted">{label}</p><p className="text-3xl font-semibold tabular-nums">{value}</p></Card>)}</section>
    <p className="text-xs text-muted">Demo data · {completed} completed jobs · {outputs.length} shared outputs across this organization.</p>
    <section aria-labelledby="projects-heading" className="space-y-3">
      <div><h2 id="projects-heading" className="text-lg font-semibold">Projects</h2><p className="mt-1 text-sm text-muted">Open a project to continue its work.</p></div>
      <Card className="gap-0 overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-surface-inset text-xs text-muted"><tr><th className="px-4 py-3">Project</th><th className="px-4 py-3">Jobs</th><th className="px-4 py-3">Active</th><th className="px-4 py-3">Outputs</th><th className="px-4 py-3"><span className="sr-only">Open</span></th></tr></thead><tbody className="divide-y divide-border">{projects.map(project => <tr key={project.id}><td className="px-4 py-3 font-medium">{project.name}</td><td className="px-4 py-3 tabular-nums">{jobs.filter(job => job.workspaceId === project.id).length}</td><td className="px-4 py-3 tabular-nums">{jobs.filter(job => job.workspaceId === project.id && ['queued', 'running', 'paused'].includes(job.status)).length}</td><td className="px-4 py-3 tabular-nums">{outputs.filter(output => output.workspaceId === project.id).length}</td><td className="px-4 py-3"><Button size="sm" variant="outline" onClick={() => { switchWorkspace(project.id); router.push('/dashboard'); }}>Open</Button></td></tr>)}</tbody></table></div>{!projects.length && <div className="p-8 text-center"><p className="text-sm text-muted">No projects yet. Create a project to get started.</p><Button size="sm" variant="accent" className="mt-3" onClick={() => setIsNewWsOpen(true)}>New project</Button></div>}</Card>
    </section>
    <details className="rounded-xl border border-border bg-surface px-4 py-3"><summary className="cursor-pointer text-sm font-medium">All organization jobs <span className="ml-1 font-normal text-muted">({jobs.length})</span></summary><div className="mt-4 space-y-4">
      <Card className="p-4"><h2 className="font-semibold">Job status</h2><p className="mt-1 text-xs text-muted">Select a status to filter the list.</p><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{states.map(state => { const count = jobs.filter(job => job.status === state).length; return <button key={state} type="button" aria-pressed={status === state} onClick={() => { setStatus(state); setPage(0); }} className="block w-full rounded-lg p-2 text-left hover:bg-surface-inset/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><div className="flex justify-between text-xs"><span className="capitalize">{state}</span><span>{count}</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-inset"><div className={`h-full ${state === 'failed' ? 'bg-destructive' : 'bg-accent-strong'}`} style={{ width: `${jobs.length ? count / jobs.length * 100 : 0}%` }} /></div></button>; })}</div></Card>
      <Card className="gap-0 overflow-hidden p-0"><div className="space-y-3 border-b border-border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Jobs <span className="text-sm font-normal text-muted">{visible.length} of {jobs.length}</span></h2><Button size="sm" variant="outline" disabled={!visible.length} onClick={exportJobs}>Download filtered jobs</Button></div><div className="flex flex-wrap gap-2"><Input aria-label="Search organization jobs" placeholder="Search jobs…" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} className="w-full sm:w-64" /><select aria-label="Filter by project" value={projectFilter} onChange={event => { setProjectFilter(event.target.value); setPage(0); }} className={selectStyle}><option value="all">All projects</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select><select aria-label="Filter organization job status" value={status} onChange={event => { setStatus(event.target.value); setPage(0); }} className={selectStyle}><option value="all">Any status</option>{states.map(state => <option key={state} value={state}>{state}</option>)}</select><select aria-label="Sort organization jobs" value={sort} onChange={event => { setSort(event.target.value); setPage(0); }} className={selectStyle}><option value="newest">Newest first</option><option value="name">Name A–Z</option><option value="progress">Progress</option></select><Button size="sm" variant="ghost" onClick={reset}>Clear filters</Button></div></div>
      <div className="divide-y divide-border">{visible.slice(currentPage * 12, (currentPage + 1) * 12).map(job => <button type="button" key={job.id} onClick={() => openJob(job)} className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-4 text-left hover:bg-surface-inset/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"><div className="min-w-0"><p className="text-sm font-medium">{job.name}</p><p className="mt-1 text-xs text-muted">{job.id} · {projects.find(project => project.id === job.workspaceId)?.name} · {TASK_LABELS[job.type]}</p></div><div className="flex items-center gap-3"><Badge variant="outline" className="capitalize">{job.status}</Badge><span className="text-xs tabular-nums text-muted">{job.progress}%</span><span className="text-xs font-medium text-accent-strong">Job dashboard →</span></div></button>)}</div>
      {!visible.length && <div className="p-8 text-center"><h3 className="text-sm font-medium">{jobs.length ? 'No jobs match your filters' : 'No jobs yet'}</h3><p className="mt-1 text-xs text-muted">{jobs.length ? 'Clear a filter to explore other organization jobs.' : 'Create a project to begin.'}</p>{jobs.length ? <Button size="sm" variant="outline" className="mt-3" onClick={reset}>Clear filters</Button> : <Button size="sm" variant="accent" className="mt-3" onClick={() => setIsNewWsOpen(true)}>New project</Button>}</div>}
      {visible.length > 12 && <div className="flex items-center justify-between border-t border-border p-3 text-xs text-muted"><span>Page {currentPage + 1} of {pageCount}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={currentPage + 1 === pageCount} onClick={() => setPage(currentPage + 1)}>Next</Button></div></div>}
      </Card>
    </div></details>
  </main></AppShell>;
}
