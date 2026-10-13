'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getArtifactVersion } from '@/lib/artifact-versions';
import { AppShell } from '@/components/AppShell';
import { useApp } from '@/context/AppContext';
import { usePipeline } from '@/context/PipelineContext';
import {
  TASK_LABELS,
  STAGE_OUTPUT,
  PIPELINE_STAGES,
  type PipelineStage,
  type Artifact,
  type PipelineRun,
} from '@/data/pipeline';
import {
  formatDateTime,
  getCurrentStep,
  getNextStage,
  getOutputRoute,
  RUN_STATUS_CLASSES,
  RUN_STATUS_LABELS,
} from '@/lib/pipeline-navigation';
import {
  getJobAnalytics,
  summarizeTranscripts,
  downloadData,
  type JobAnalytics,
  type ClusterMetric,
  type TranscriptRecord,
} from '@/lib/job-analytics';
import { OpportunityCharts } from '@/components/analytics/OpportunityCharts';
import { AnalyticsSummary } from '@/components/analytics/AnalyticsSummary';
import {
  ClusterExplorer,
  type ClusterFilters,
} from '@/components/analytics/ClusterExplorer';
import { CostEstimator } from '@/components/analytics/CostEstimator';
import { PivotBuilder } from '@/components/analytics/PivotBuilder';
import { TranscriptExplorer } from '@/components/analytics/TranscriptExplorer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SelectField } from '@/components/common';
import { ArrowLeft, ArrowRight, Check, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type AnalyticsTab = 'overview' | 'clusters' | 'transcripts';
const DEFAULT_FILTERS: ClusterFilters = {
  search: '',
  level: 'all',
  minComplexity: '',
  maxComplexity: '',
  minAutomation: '',
};
const SOURCE_LABEL: Record<string, string> = {
  sample: 'Synthetic sample',
  'transcript estimate': 'Transcript-based estimate',
  backend: 'Backend analytics',
  unavailable: 'Unavailable',
};

function matchesClusterBranch(
  cluster: ClusterMetric,
  selected: ClusterMetric | undefined,
  allClusters: ClusterMetric[],
) {
  if (!selected) return true;
  let current: ClusterMetric | undefined = cluster;
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    if (current.id === selected.id) return true;
    seen.add(current.id);
    current = allClusters.find((item) => item.id === current?.parentId);
  }
  return false;
}
function recordInBranch(
  record: TranscriptRecord,
  selected: ClusterMetric | undefined,
) {
  if (!selected) return true;
  if (selected.level === 'L1') return record.l1Id === selected.id;
  if (selected.level === 'L2') return record.l2Id === selected.id;
  return record.l3Id === selected.id;
}
function JobOutputView({
  run,
  analytics: rawAnalytics,
  sourceRuns,
}: {
  run: PipelineRun;
  analytics: JobAnalytics;
  sourceRuns: PipelineRun[];
}) {
  const [tab, setTab] = useState<AnalyticsTab>('overview');
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(
    null,
  );
  const [filters, setFilters] = useState<ClusterFilters>(DEFAULT_FILTERS);
  const { artifacts, selectArtifact, handoffArtifact, resumeRun, continueRun } =
    usePipeline();
  const { currentOrg } = useApp();
  const canRunExpress =
    currentOrg.role === 'Owner' || currentOrg.role === 'Admin';
  const router = useRouter();
  const analyticsArtifact = artifacts.find(
    (artifact) => artifact.id === rawAnalytics.sourceArtifactId,
  );
  const hasClusterOutput = analyticsArtifact?.kind === 'clusters';
  const analytics = useMemo(
    () =>
      hasClusterOutput
        ? rawAnalytics
        : {
            ...rawAnalytics,
            clusters: [],
            transcripts: rawAnalytics.transcripts.map((record) => ({
              ...record,
              l1Id: '',
              l1: '',
              l2Id: '',
              l2: '',
              l3Id: '',
              l3: '',
            })),
          },
    [rawAnalytics, hasClusterOutput],
  );
  const summary = useMemo(
    () => summarizeTranscripts(analytics.transcripts),
    [analytics.transcripts],
  );
  const availableClusters = useMemo(
    () => (hasClusterOutput ? analytics.clusters : []),
    [hasClusterOutput, analytics.clusters],
  );
  const selectedCluster = availableClusters.find(
    (cluster) => cluster.id === selectedClusterId,
  );
  const filteredClusters = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const minComplexity =
      filters.minComplexity === '' ? null : Number(filters.minComplexity);
    const maxComplexity =
      filters.maxComplexity === '' ? null : Number(filters.maxComplexity);
    const minAutomation =
      filters.minAutomation === '' ? null : Number(filters.minAutomation);
    return availableClusters.filter((cluster) => {
      if (!matchesClusterBranch(cluster, selectedCluster, availableClusters))
        return false;
      if (filters.level !== 'all' && cluster.level !== filters.level)
        return false;
      const path = [cluster.name, cluster.l1, cluster.l2, cluster.l3]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (query && !path.includes(query)) return false;
      if (minComplexity !== null && cluster.complexity < minComplexity)
        return false;
      if (maxComplexity !== null && cluster.complexity > maxComplexity)
        return false;
      if (minAutomation !== null && cluster.automationPotential < minAutomation)
        return false;
      return true;
    });
  }, [availableClusters, filters, selectedCluster]);
  const filteredTranscripts = useMemo(() => {
    if (
      !selectedCluster &&
      Object.entries(filters).every(([key, value]) =>
        key === 'level' ? value === 'all' : value === '',
      )
    )
      return analytics.transcripts;
    const matchingLevel = filters.level === 'all' ? 'L3' : filters.level;
    const allowedIds = new Set(
      filteredClusters
        .filter((cluster) => cluster.level === matchingLevel)
        .map((cluster) => cluster.id),
    );
    return analytics.transcripts.filter((record) => {
      if (!recordInBranch(record, selectedCluster)) return false;
      const recordClusterId =
        filters.level === 'L1'
          ? record.l1Id
          : filters.level === 'L2'
            ? record.l2Id
            : record.l3Id;
      if (!allowedIds.has(recordClusterId)) return false;
      return true;
    });
  }, [analytics.transcripts, filters, filteredClusters, selectedCluster]);
  const uniqueIntents = new Set(
    analytics.transcripts.map((record) => record.intent).filter(Boolean),
  ).size;
  const notes = analytics.issues.filter(
    (issue) =>
      !analytics.sample ||
      !/synthetic|local demo|sample analytics/i.test(issue),
  );
  const sourceMetric =
    SOURCE_LABEL[analytics.metricSource] ?? analytics.metricSource;
  const inheritedSourceId = analytics.inherited
    ? analytics.sourceJobId
    : undefined;
  const inheritedSourceRun = inheritedSourceId
    ? sourceRuns.find((sourceRun) => sourceRun.id === inheritedSourceId)
    : undefined;
  const sourceAnalyticsArtifact = artifacts.find(
    (artifact) => artifact.id === analytics.sourceArtifactId,
  );
  const provenance = analytics.inherited
    ? `This job uses conversation data from ${inheritedSourceRun?.name ?? sourceAnalyticsArtifact?.name ?? 'the linked analysis input'}${inheritedSourceId ? ` (${inheritedSourceId})` : ''}.`
    : analytics.transcripts.length > 0
      ? 'Conversation metrics generated by this job.'
      : `No conversation analytics are linked to this ${TASK_LABELS[run.type].toLowerCase()} yet.`;
  const step = getCurrentStep(run);
  const openTranscripts = (cluster: ClusterMetric) => {
    setSelectedClusterId(cluster.id);
    setFilters(DEFAULT_FILTERS);
    setTab('transcripts');
  };
  const downloadRawJson = () =>
    downloadData(
      `job-${run.id}-analytics.json`,
      JSON.stringify(
        {
          job: run,
          sourceLabel: analytics.sourceLabel,
          metricSource: analytics.metricSource,
          sample: analytics.sample,
          transcripts: analytics.transcripts,
          clusters: analytics.clusters,
          issues: analytics.issues,
        },
        null,
        2,
      ),
      'application/json',
    );

  const filtered = Boolean(
    selectedCluster ||
    Object.entries(filters).some(([key, value]) =>
      key === 'level' ? value !== 'all' : value !== '',
    ),
  );
  const drillInto = (cluster: ClusterMetric) => {
    setSelectedClusterId(cluster.id);
    setFilters(DEFAULT_FILTERS);
    setTab('clusters');
  };
  const ownOutputs = artifacts.filter(
    (artifact) =>
      artifact.runId === run.id && artifact.workspaceId === run.workspaceId,
  );
  const relatedOutputs = new Map(
    ownOutputs.map((artifact) => [artifact.id, artifact]),
  );
  const addAncestors = (sourceId?: string, sourceVersion?: number) => {
    const seen = new Set<string>();
    let id = sourceId;
    let version = sourceVersion;
    while (id && !seen.has(id)) {
      seen.add(id);
      const head = artifacts.find(
        (artifact) =>
          artifact.id === id && artifact.workspaceId === run.workspaceId,
      );
      const source =
        head && version !== undefined
          ? getArtifactVersion(head, version)
          : head;
      if (!source) break;
      relatedOutputs.set(source.id, source);
      id = source.sourceId;
      version = source.sourceVersion;
    }
  };
  ownOutputs.forEach((output) =>
    addAncestors(output.sourceId, output.sourceVersion),
  );
  addAncestors(run.sourceArtifactId, run.sourceVersion);
  const stageLabels: Record<PipelineStage, string> = {
    extract_intents: 'Intents',
    cluster_intents: 'Clusters',
    design_flow: 'Process map',
    generate_uml: 'System flow',
    generate_agent: 'Agent',
  };
  const stages = PIPELINE_STAGES.map((stage) => ({
    stage,
    label: stageLabels[stage],
  }));
  const planned =
    run.plannedStages ??
    (run.type === 'full_pipeline'
      ? stages.map((item) => item.stage)
      : [run.type]);
  const stageOutputs = stages.map((item) => ({
    ...item,
    output: [...relatedOutputs.values()]
      .filter((output) => output.kind === STAGE_OUTPUT[item.stage])
      .sort(
        (a, b) =>
          Number(b.runId === run.id) - Number(a.runId === run.id) ||
          b.version - a.version,
      )[0],
  }));
  const latest = [...stageOutputs]
    .reverse()
    .find((item) => item.output?.runId === run.id)?.output;
  const nextStage = latest ? getNextStage(latest.kind) : undefined;
  const active = ['queued', 'running', 'paused'].includes(run.status);
  const waitingForHandoff = run.waitingFor === 'handoff';
  const pendingPlannedStages = planned.filter(
    (stage) =>
      !ownOutputs.some((output) => output.kind === STAGE_OUTPUT[stage]),
  );
  const nextPlannedStage = pendingPlannedStages[0];
  const canContinueToNext = Boolean(
    run.status === 'completed' &&
    latest &&
    nextStage &&
    !planned.includes(nextStage),
  );
  const openOutput = (output: Artifact) => {
    selectArtifact(output.id, output.version);
    router.push(getOutputRoute(output.kind));
  };
  const resultLabel =
    latest?.kind === 'agent_code'
      ? 'Open agent code'
      : latest?.kind === 'process_map' || latest?.kind === 'uml'
        ? 'Open design'
        : 'Review analysis';

  return (
    <div className="space-y-5">
      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Badge
                variant="outline"
                className={RUN_STATUS_CLASSES[run.status]}
              >
                {waitingForHandoff
                  ? 'Ready to continue'
                  : RUN_STATUS_LABELS[run.status]}
              </Badge>
              <span>{TASK_LABELS[run.type]}</span>
            </div>
            <h2 className="mt-3 text-base font-semibold">
              {waitingForHandoff
                ? 'Partial results'
                : active
                  ? 'Job progress'
                  : run.status === 'completed'
                    ? 'Results'
                    : 'Job status'}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {waitingForHandoff
                ? 'This job has paused at a stage boundary. Available outputs are ready to review while the remaining planned stages wait.'
                : active
                  ? `${step?.label ?? 'Preparing your results'} · ${Math.round(run.progress)}% complete`
                  : run.status === 'completed'
                    ? 'Your results are ready to explore.'
                    : (run.error ?? 'Open job details to continue.')}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {latest && !active ? (
              <Button
                variant="accent"
                onClick={() => {
                  if (canContinueToNext && nextStage) {
                    handoffArtifact(latest.id, nextStage);
                    return;
                  }
                  openOutput(latest);
                }}
              >
                {canContinueToNext && nextStage
                  ? `Continue to ${TASK_LABELS[nextStage].toLowerCase()}`
                  : resultLabel}
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button asChild variant="accent">
                <Link href={`/jobs?jobId=${encodeURIComponent(run.id)}`}>
                  {active ? 'View progress' : 'View job details'}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="More job options"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/jobs?jobId=${encodeURIComponent(run.id)}`}>
                    Job details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadRawJson}>
                  Download all analytics (JSON)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {active && (
          <Progress
            aria-label="Job progress"
            value={run.progress}
            className="h-1 bg-surface-inset [&_[data-slot=progress-indicator]]:bg-accent-strong"
          />
        )}
        <ol
          aria-label="Pipeline results"
          className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-5"
        >
          {stageOutputs.map((item, index) => (
            <li key={item.stage} className="min-w-0 bg-surface">
              <button
                type="button"
                disabled={!item.output}
                onClick={() => item.output && openOutput(item.output)}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left enabled:hover:bg-accent-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:text-muted-foreground"
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full text-xs ${item.output ? 'bg-accent-soft text-accent-strong' : 'bg-surface-inset text-muted'}`}
                >
                  {item.output ? <Check className="size-3.5" /> : index + 1}
                </span>
                <span>
                  <span className="block text-xs font-medium">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-muted">
                    {item.output
                      ? item.output.runId === run.id
                        ? 'Open result'
                        : 'Source result'
                      : planned.includes(item.stage)
                        ? waitingForHandoff
                          ? item.stage === nextPlannedStage
                            ? 'Ready to continue'
                            : 'Waiting'
                          : run.status === 'completed'
                            ? 'Unavailable'
                            : 'Pending'
                        : 'Not included'}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </Card>
      {waitingForHandoff && latest && nextPlannedStage && (
        <Card className="border-accent-border bg-accent-soft/25 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="max-w-2xl">
              <Badge
                className="border-accent-border bg-surface text-accent-strong"
                variant="outline"
              >
                Partial results ready
              </Badge>
              <h3 className="mt-3 text-base font-semibold">
                Continue to {TASK_LABELS[nextPlannedStage].toLowerCase()}
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted">
                The outputs above are available now. The remaining planned steps
                are waiting at this boundary.
              </p>
              <ol className="mt-4 grid gap-2 sm:grid-cols-2">
                {pendingPlannedStages.map((stage, index) => (
                  <li
                    key={stage}
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs"
                  >
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-surface-inset font-medium text-muted">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 font-medium">
                      {TASK_LABELS[stage]}
                    </span>
                    <span className="text-muted">
                      {index === 0 ? 'Ready' : 'Waiting'}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:min-w-56">
              <Button variant="accent" onClick={() => resumeRun(run.id)}>
                Continue to {TASK_LABELS[nextPlannedStage].toLowerCase()}
                <ArrowRight className="size-4" />
              </Button>
              <span className="text-center text-[11px] text-muted">
                Guided mode · resume this same job
              </span>
              {canRunExpress && (
                <Button
                  variant="outline"
                  onClick={() => continueRun(run.id, 'express')}
                >
                  Run remaining automatically
                </Button>
              )}
              {canRunExpress && (
                <span className="text-center text-[11px] text-muted">
                  Express mode · advance planned stages
                </span>
              )}
            </div>
          </div>
        </Card>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <p>
          {analytics.sample
            ? `Demo · ${summary.conversationCount} synthetic conversations. Scores are estimates.`
            : `${sourceMetric} · ${summary.conversationCount} unique conversations`}
        </p>
        {latest &&
          nextStage &&
          run.status === 'completed' &&
          !canContinueToNext && (
            <button
              type="button"
              onClick={() => handoffArtifact(latest.id, nextStage)}
              className="font-medium text-accent-strong hover:underline"
            >
              Continue to {TASK_LABELS[nextStage].toLowerCase()} →
            </button>
          )}
      </div>
      {notes.length > 0 && (
        <Accordion
          type="single"
          collapsible
          className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4"
        >
          <AccordionItem value="data-notes" className="border-0">
            <AccordionTrigger className="py-3 text-xs font-medium hover:no-underline">
              Data notes ({notes.length})
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <ul className="list-disc space-y-1 pl-4 text-xs leading-5 text-muted">
                {notes.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
      <div className="rounded-lg border border-border bg-surface px-4 py-3 text-xs leading-5 text-muted">
        <p>{provenance}</p>
        <p className="mt-1">
          {sourceMetric}
          {inheritedSourceRun && (
            <>
              {' '}
              ·{' '}
              <Link
                className="font-medium text-accent-strong hover:underline"
                href={`/job-analytics?jobId=${encodeURIComponent(inheritedSourceRun.id)}`}
              >
                View source job →
              </Link>
            </>
          )}
        </p>
      </div>
      {analytics.transcripts.length > 0 ? (
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as AnalyticsTab)}
          className="gap-5"
        >
          <TabsList
            aria-label="Job result views"
            variant="line"
            className="h-11 w-full justify-start gap-4 border-b border-border"
          >
            <TabsTrigger value="overview" className="flex-none px-1">
              Overview
            </TabsTrigger>
            {hasClusterOutput && (
              <TabsTrigger value="clusters" className="flex-none px-1">
                Clusters
              </TabsTrigger>
            )}
            <TabsTrigger value="transcripts" className="flex-none px-1">
              Transcripts
            </TabsTrigger>
          </TabsList>
          {filtered && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-inset/60 px-3 py-2 text-xs text-muted">
              <span>
                Filtered view{selectedCluster && ` · ${selectedCluster.name}`} ·{' '}
                {filteredTranscripts.length} transcript records · Whole job:{' '}
                {summary.conversationCount} conversations across{' '}
                {summary.recordCount} records
                {tab === 'overview' && ' · Summary totals show the whole job'}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedClusterId(null);
                  setFilters(DEFAULT_FILTERS);
                }}
              >
                Reset view
              </Button>
            </div>
          )}
          <TabsContent value="overview" className="space-y-5">
            <AnalyticsSummary
              summary={summary}
              clusters={analytics.clusters}
              intents={uniqueIntents}
              clusterOutputAvailable={hasClusterOutput}
              onSelectCluster={drillInto}
            />
            <Accordion
              type="single"
              collapsible
              className="rounded-xl border border-border bg-surface px-5"
            >
              <AccordionItem value="advanced-analysis" className="border-0">
                <AccordionTrigger className="py-5 hover:no-underline">
                  <span>
                    <span className="block text-sm font-semibold">
                      Advanced analysis
                    </span>
                    <span className="mt-1 block text-xs font-normal text-muted">
                      Compare clusters, create a pivot table, or estimate
                      savings.
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <Tabs
                    defaultValue={hasClusterOutput ? 'charts' : 'pivot'}
                    className="gap-4"
                  >
                    <TabsList
                      aria-label="Advanced analysis tools"
                      variant="line"
                      className="max-w-full justify-start overflow-x-auto"
                    >
                      {hasClusterOutput && (
                        <TabsTrigger value="charts" className="px-3">
                          Charts
                        </TabsTrigger>
                      )}
                      <TabsTrigger value="pivot" className="px-3">
                        Pivot table
                      </TabsTrigger>
                      {hasClusterOutput && (
                        <TabsTrigger value="costs" className="px-3">
                          Savings estimate
                        </TabsTrigger>
                      )}
                    </TabsList>
                    {hasClusterOutput && (
                      <TabsContent value="charts">
                        <OpportunityCharts
                          clusters={filteredClusters}
                          onSelect={drillInto}
                        />
                      </TabsContent>
                    )}
                    <TabsContent value="pivot">
                      <PivotBuilder
                        records={filteredTranscripts}
                        sample={analytics.sample}
                        jobId={run.id}
                        clusterOutputAvailable={hasClusterOutput}
                      />
                    </TabsContent>
                    {hasClusterOutput && (
                      <TabsContent value="costs">
                        <CostEstimator
                          key={selectedCluster?.id ?? 'all'}
                          clusters={availableClusters}
                          summary={summary}
                          sample={analytics.sample}
                          defaultClusterId={selectedCluster?.id}
                        />
                      </TabsContent>
                    )}
                  </Tabs>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          {hasClusterOutput && (
            <TabsContent value="clusters">
              <ClusterExplorer
                clusters={filteredClusters}
                allClusters={availableClusters}
                filters={filters}
                onFiltersChange={setFilters}
                selectedClusterId={selectedClusterId}
                onSelectCluster={(cluster) => {
                  setSelectedClusterId(cluster?.id ?? null);
                  setFilters(DEFAULT_FILTERS);
                }}
                onViewTranscripts={openTranscripts}
                jobId={run.id}
              />
            </TabsContent>
          )}
          <TabsContent value="transcripts">
            <TranscriptExplorer
              records={filteredTranscripts}
              sample={analytics.sample}
              clusterOutputAvailable={hasClusterOutput}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="gap-2 border-dashed p-7">
          <h3 className="font-semibold">
            {active
              ? 'Your analysis is on its way'
              : 'No conversation analytics yet'}
          </h3>
          <p className="max-w-xl text-sm leading-6 text-muted">
            {active
              ? 'Results will appear here as the job progresses. You can leave this page and return later.'
              : latest
                ? 'Open the result above. Conversation analytics appear when transcript data is included in this job or its source.'
                : 'This job does not have transcript results to explore yet. Check its progress or input in job details.'}
          </p>
          {run.error && <p className="text-sm text-destructive">{run.error}</p>}
        </Card>
      )}
      <Accordion
        type="single"
        collapsible
        className="border-t border-border pt-2 text-xs text-muted"
      >
        <AccordionItem value="about-data" className="border-0">
          <AccordionTrigger className="py-2 text-xs font-medium text-muted hover:no-underline">
            About this data
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="space-y-2 leading-5">
              <p>
                {run.id} · Started {formatDateTime(run.createdAt)}
              </p>
              <p>Source: {analytics.sourceLabel}</p>
              <p>
                Metrics: {sourceMetric}.{' '}
                {analytics.sample &&
                  'Synthetic examples for this demo; uploaded customer content has not been analyzed.'}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export default function JobAnalytics() {
  const { currentWorkspace } = useApp();
  const { runs, artifacts, connections } = usePipeline();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedJobId = searchParams.get('jobId') ?? '';
  const projectRuns = useMemo(
    () =>
      runs
        .filter((run) => run.workspaceId === currentWorkspace.id)
        .sort((a, b) => b.createdAt - a.createdAt),
    [runs, currentWorkspace.id],
  );
  const projectArtifacts = useMemo(
    () =>
      artifacts.filter(
        (artifact) => artifact.workspaceId === currentWorkspace.id,
      ),
    [artifacts, currentWorkspace.id],
  );
  const selectedRun = requestedJobId
    ? projectRuns.find((run) => run.id === requestedJobId)
    : projectRuns[0];
  const selectedAnalytics = useMemo(
    () =>
      selectedRun ? getJobAnalytics(selectedRun, projectArtifacts) : undefined,
    [selectedRun, projectArtifacts],
  );
  const sourceHead = selectedRun?.sourceArtifactId
    ? projectArtifacts.find(
        (artifact) => artifact.id === selectedRun.sourceArtifactId,
      )
    : undefined;
  const sourceArtifact =
    sourceHead && selectedRun?.sourceVersion !== undefined
      ? getArtifactVersion(sourceHead, selectedRun.sourceVersion)
      : sourceHead;
  const inputDescription = selectedRun?.fileName
    ? `Input file · ${selectedRun.fileName}`
    : sourceArtifact
      ? `Project input · ${sourceArtifact.name}`
      : selectedRun?.sourceConnectionId
        ? `Connected source · ${connections.find((connection) => connection.id === selectedRun.sourceConnectionId)?.name ?? 'Saved connection'}`
        : 'Input source not recorded';

  return (
    <AppShell crumb="Job results">
      <div className="mx-auto w-full max-w-[1180px] space-y-5 p-5 pb-16 sm:p-8">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="min-w-0">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              All jobs
            </Link>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              {selectedRun?.name ?? 'Job results'}
            </h1>
            {selectedRun && (
              <p className="mt-1 text-xs text-muted">
                Job {selectedRun.id} · Project {currentWorkspace.name} ·{' '}
                {inputDescription}
              </p>
            )}
          </div>
          {projectRuns.length > 0 && (
            <div className="w-full space-y-2 rounded-xl border border-accent-border bg-accent-soft/40 p-3 text-xs text-muted md:max-w-sm">
              <label
                htmlFor="switch-job"
                className="font-medium text-foreground"
              >
                Switch job{' '}
                <span className="ml-1 font-normal text-muted">
                  in this project
                </span>
              </label>
              <SelectField
                id="switch-job"
                aria-label="Switch job, project, and input"
                value={selectedRun?.id ?? ''}
                onValueChange={(value) =>
                  router.replace(
                    `/job-analytics?jobId=${encodeURIComponent(value)}`,
                    { scroll: false },
                  )
                }
                options={projectRuns.map((run) => ({
                  value: run.id,
                  label: `${run.name} · ${TASK_LABELS[run.type]} · ${run.fileName ?? (run.sourceConnectionId ? 'Connected source' : 'Project output')} · ${run.id}`,
                }))}
                placeholder="Choose a job"
                className="h-10 w-full"
                size="default"
              />
            </div>
          )}
        </header>
        {requestedJobId && !selectedRun && (
          <Card className="border-amber-500/30 bg-amber-500/5 p-5">
            <h2 className="text-sm font-semibold">
              Job not found in this project
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              The requested job ID does not belong to the currently selected
              project. Choose a job above to continue, or return to the{' '}
              <Link
                className="font-medium text-accent-strong hover:underline"
                href="/jobs"
              >
                Jobs list
              </Link>
              .
            </p>
          </Card>
        )}
        {selectedRun && selectedAnalytics ? (
          <JobOutputView
            key={selectedRun.id}
            run={selectedRun}
            analytics={selectedAnalytics}
            sourceRuns={projectRuns}
          />
        ) : projectRuns.length === 0 ? (
          <Card className="border-dashed border-border p-8 text-center">
            <h2 className="text-base font-semibold">
              No jobs in this project yet
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">
              Once a job is created, its own linked analytics will appear here
              when available.
            </p>
            <Link
              href="/jobs"
              className="mt-4 inline-flex h-9 items-center rounded-lg bg-accent-strong px-3 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Open Jobs
            </Link>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
