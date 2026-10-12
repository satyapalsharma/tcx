'use client';

import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { PageHeader, StatusBadge } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from '../lib/navigation';
import { useApp } from '@/context/AppContext';
import { usePipeline } from '@/context/PipelineContext';
import { ARTIFACT_LABELS, TASK_LABELS, type Artifact, type StageType } from '@/data/pipeline';

const umbrellas = [
  { name: 'Analysis', role: 'Conversation analysts', description: 'Find customer intents, outcomes, friction, and the patterns behind them.', route: '/analysis', tone: 'border-border bg-surface text-foreground', icon: 'search' as const, actions: [{ type: 'extract_intents' as const, label: 'Analyze conversations' }, { type: 'cluster_intents' as const, label: 'Cluster intents' }] },
  { name: 'Design', role: 'CX designers', description: 'Shape shared insights into process maps and clear interaction sequences.', route: '/design', tone: 'border-border bg-surface text-foreground', icon: 'flow' as const, actions: [{ type: 'design_flow' as const, label: 'Create process map' }, { type: 'generate_uml' as const, label: 'Generate UML' }] },
  { name: 'Develop', role: 'Agent developers', description: 'Turn a shared process map or sequence into a runtime-specific agent scaffold.', route: '/develop', tone: 'border-border bg-surface text-foreground', icon: 'code' as const, actions: [{ type: 'generate_agent' as const, label: 'Generate agent code' }] },
];
const outputRoute: Record<Artifact['kind'], string> = { insights: '/analysis', clusters: '/analysis', process_map: '/design', uml: '/design', agent_code: '/develop' };
const nextStage: Partial<Record<Artifact['kind'], StageType>> = { insights: 'cluster_intents', clusters: 'design_flow', process_map: 'generate_uml', uml: 'generate_agent' };

function statusStyle(status: Artifact['status']) {
  return status === 'approved' ? 'success' : status === 'review' ? 'warn' : 'muted';
}

export default function Dashboard() {
  const { currentWorkspace, openNewRun } = useApp();
  const { artifacts, runs, selectArtifact, handoffArtifact, connections } = usePipeline();
  const recentRuns = [...runs.filter((run) => ['queued', 'running', 'paused'].includes(run.status)), ...runs.filter((run) => !['queued', 'running', 'paused'].includes(run.status)).sort((a, b) => b.updatedAt - a.updatedAt)].slice(0, 5);
  const outputs = [...artifacts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const hasConnector = connections.some((connection) => connection.status === 'connected');

  return <AppShell crumb="Overview">
    <main className="mx-auto w-full max-w-[1320px] space-y-7 p-5 sm:p-8" data-od-id="dashboard-page">
      <PageHeader title={currentWorkspace.name} description={currentWorkspace.description || 'Turn customer conversations into agent-ready outputs.'} />

      <section aria-labelledby="pipeline-heading">
        <Card className="gap-0 overflow-hidden border-accent-border bg-surface p-0">
          <div className="flex flex-col gap-5 border-b border-accent-border/50 bg-accent-soft/40 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl"><p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent-strong"><Icon name="bolt" className="size-4" />Full pipeline</p><h2 id="pipeline-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">From conversations to agent code</h2><p className="mt-2 text-sm leading-6 text-muted">One project input moves through each stage, with shared outputs along the way.</p></div>
            <Button variant="accent" size="lg" className="h-11 w-full gap-2 self-start px-5 sm:w-auto lg:self-center" onClick={() => openNewRun('full_pipeline')}><Icon name="play" className="size-4" />Start full pipeline</Button>
          </div>
          <ol aria-label="Full pipeline stages" className="grid gap-4 p-5 sm:grid-cols-3 sm:p-7 xl:grid-cols-5">{[
            {name:'Intent discovery',detail:'Understand customer needs'},
            {name:'Clustering',detail:'Organize L1, L2 and L3'},
            {name:'Process maps',detail:'Capture conversation flows'},
            {name:'UML diagrams',detail:'Define agent interactions'},
            {name:'Agent code',detail:'Build for your runtime'},
          ].map((stage,index)=><li key={stage.name} className="flex min-w-0 items-start gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-strong">{index+1}</span><div><p className="text-sm font-medium">{stage.name}</p><p className="mt-0.5 text-xs leading-5 text-muted">{stage.detail}</p></div></li>)}</ol>
        </Card>
      </section>

      <section aria-labelledby="jobs-heading" className="space-y-3">
        <div className="flex items-end justify-between gap-3"><div><h2 id="jobs-heading" className="text-base font-semibold">Recent jobs</h2><p className="mt-1 text-sm text-muted">Check progress or open completed results.</p></div><Link to="/jobs" className="text-sm font-medium text-accent-strong hover:underline">All jobs</Link></div>
        {recentRuns.length ? <Card className="divide-y divide-border overflow-hidden p-0 gap-0">{recentRuns.map(run=>{const working=['queued','running','paused'].includes(run.status);const step=run.steps.find(item=>item.status==='running')?.label??(run.status==='queued'?'Waiting to start':run.status==='paused'?'Paused':'');const completedWithOutputs=run.status==='completed'&&artifacts.some(artifact=>artifact.runId===run.id);const destination=completedWithOutputs?`/job-analytics?jobId=${encodeURIComponent(run.id)}`:`/jobs?jobId=${encodeURIComponent(run.id)}`;return <div key={run.id} className="flex flex-wrap items-center gap-3 px-4 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{run.name}</p><p className="mt-0.5 text-xs text-muted">{working?`${step} · ${run.progress}%`:run.status==='completed'?'Completed':'Needs attention'}</p></div><StatusBadge status={run.status==='running'?'accent':run.status==='completed'?'success':run.status==='failed'?'warn':'muted'}>{run.status}</StatusBadge><Link to={destination} className="rounded-md px-2 py-1 text-xs font-medium text-accent-strong hover:bg-accent-soft">{working?'View progress':completedWithOutputs?'View results':'View details'}</Link></div>})}</Card> : <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted">Your jobs and their results will appear here.</p><Button variant="accent" onClick={() => openNewRun('full_pipeline')}><Icon name="play" className="mr-2 size-4"/>Start full pipeline</Button></Card>}
      </section>

      <details className="rounded-xl border border-border bg-surface px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium">Explore tools and shared outputs</summary>
        <div className="mt-5 space-y-7">
      <section aria-labelledby="teams-heading" className="space-y-3">
        <div><h2 id="teams-heading" className="text-base font-semibold">Individual tools</h2><p className="mt-1 text-sm text-muted">Use a single stage when you need it.</p></div>
        <div className="grid gap-4 lg:grid-cols-3">
          {umbrellas.map((item) => <Card key={item.name} className={`flex h-full flex-col gap-0 border p-4 sm:p-5 ${item.tone}`}>
            <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-strong"><Icon name={item.icon} className="size-5" /></span><div><p className="text-xs font-medium opacity-70">{item.role}</p><Link to={item.route} className="mt-0.5 inline-flex items-center gap-2 text-lg font-semibold hover:underline">{item.name}<Icon name="arrowr" className="size-4" /></Link></div></div>
            <p className="mt-3 min-h-10 text-sm leading-relaxed opacity-80">{item.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">{item.actions.map((action) => <Button key={action.type} size="sm" variant="outline" className="border-current/20 bg-white/80 text-foreground hover:bg-white" onClick={() => openNewRun(action.type)}>{action.label}</Button>)}{item.name === 'Develop' && <Link to="/develop" className="inline-flex h-8 items-center rounded-lg px-2 text-xs font-medium hover:bg-white/70">Review code</Link>}</div>
          </Card>)}
        </div>
      </section>



      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="outputs-heading" className="space-y-3">
          <div className="flex items-end justify-between gap-3"><div><h2 id="outputs-heading" className="text-base font-semibold">Shared outputs</h2><p className="mt-1 text-sm text-muted">Artifacts available to teammates in this project.</p></div><Link to="/jobs" className="text-sm font-medium text-accent-strong hover:underline">All jobs</Link></div>
          {outputs.length ? <Card className="divide-y divide-border overflow-hidden p-0 gap-0">{outputs.map((artifact) => <div key={artifact.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-inset/30"><Link to={outputRoute[artifact.kind]} onClick={() => selectArtifact(artifact.id)} className="min-w-0 flex-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex flex-wrap items-center gap-2"><span className="truncate text-sm font-medium text-foreground">{artifact.name}</span><StatusBadge status={statusStyle(artifact.status)}>{artifact.status}</StatusBadge>{artifact.sample && <Badge variant="outline" className="text-[10px]">Sample</Badge>}</span><span className="mt-1 block text-xs text-muted">{ARTIFACT_LABELS[artifact.kind]} · v{artifact.version} · {artifact.createdBy}</span></Link>{nextStage[artifact.kind] && <Button type="button" variant="ghost" size="icon-sm" title={`Continue to ${TASK_LABELS[nextStage[artifact.kind]!]}`} aria-label={`Continue ${artifact.name} to next stage`} onClick={() => handoffArtifact(artifact.id, nextStage[artifact.kind]!)}><Icon name="arrowr" className="size-4 text-muted" /></Button>}</div>)}</Card> : <Card className="border-dashed p-7 text-center"><p className="text-sm font-medium">This project has no shared outputs yet</p><p className="mx-auto mt-1 max-w-md text-sm text-muted">Start with conversation data or connect a source to create the first artifact.</p><div className="mt-4 flex justify-center gap-2"><Button size="sm" variant="accent" onClick={() => openNewRun('full_pipeline')}>Start full pipeline</Button><Link to="/connectors" className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-xs font-medium hover:bg-surface-inset">Explore connections</Link></div></Card>}
        </section>

        <aside className="space-y-4">
          <Card className="flex flex-row items-start gap-3 p-4"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-inset text-muted"><Icon name="plug" className="size-4" /></span><div><p className="text-sm font-semibold">{hasConnector ? 'Manage connections' : 'Connect a data source'}</p><p className="mt-1 text-xs leading-relaxed text-muted">{hasConnector ? 'Review the organization’s available sources.' : 'Set up a project connection to make it easier to start new analyses.'}</p><Link to="/connectors" className="mt-2 inline-flex text-xs font-medium text-accent-strong hover:underline">{hasConnector ? 'Open connections →' : 'Explore connections →'}</Link></div></Card>
        </aside>
      </div>

      <p className="max-w-4xl text-xs leading-relaxed text-muted">Teams share artifacts in the project. Analysts can pass insights to Design, designers can share process maps and UML with Develop, and developers can build from shared drafts or review versions.</p>
        </div>
      </details>
    </main>
  </AppShell>;
}
