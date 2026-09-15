export type JobStatus = 'run' | 'queued' | 'done' | 'failed';
export type StepStatus = 'done' | 'run' | 'wait' | 'failed';

export type Job = {
  id: string;
  subtitle: string;
  client: string;
  pipeline: string;
  pipe: 'Analysis' | 'Design' | 'Develop';
  status: JobStatus;
  statusLabel: string;
  badgeClass: string;
  progress: number;
  progressLabel: string;
  progressFill?: 'fill-warn' | 'fill-ok' | '';
  started: string;
  cost: string;
  costMuted?: boolean;
};

export const JOB_STEPS: Record<string, [StepStatus, string][]> = {
  'RUN-4821': [['done', 'Ingestion · 18,442 rows'], ['done', 'PII redaction · 3,104 fields'], ['done', 'Embedding · 24,190 vectors'], ['run', 'Clustering · 68%'], ['wait', 'Coverage report · queued']],
  'GEN-4819': [['done', 'Load approved clusters'], ['run', 'Regenerate process map · 32%'], ['wait', 'Re-sync UML sequence']],
  'RUN-4822': [['wait', 'Waiting for RUN-4821 to finish']],
  'ADK-4808': [['done', 'Generate scaffold'], ['done', 'Wire tools'], ['done', 'Unit tests · 4/4'], ['done', 'Deployed · staging']],
  'RUN-4792': [['done', 'Ingestion · 6,211 rows'], ['done', 'Intent extraction · 41 intents'], ['wait', 'Clustering skipped · below 50-intent threshold'], ['done', 'Review handoff']],
  'RUN-4770': [['done', 'Ingestion · 9,205 rows'], ['done', 'PII redaction'], ['failed', 'Embedding · model quota exceeded'], ['wait', 'Coverage report']],
  'MAP-4761': [['done', 'Cluster → map'], ['done', 'Reviewer approved'], ['done', 'Exported PDF']],
  'LGR-4750': [['done', 'Generate scaffold'], ['done', 'Wire action groups'], ['done', 'Tests · 3/3'], ['done', 'Deployed · staging']],
};

export const JOBS: Job[] = [
  {
    id: 'RUN-4821',
    subtitle: 'Week-26 clustering refresh',
    client: 'Skyline Broadband',
    pipeline: 'Analysis · full',
    pipe: 'Analysis',
    status: 'run',
    statusLabel: 'Running',
    badgeClass: 'badge badge-warn badge-run',
    progress: 68,
    progressLabel: '68%',
    progressFill: 'fill-warn',
    started: '12 min ago',
    cost: '₹1,284',
  },
  {
    id: 'GEN-4819',
    subtitle: 'Billing map regen from cluster drift',
    client: 'Skyline Broadband',
    pipeline: 'Design · map regen',
    pipe: 'Design',
    status: 'run',
    statusLabel: 'Running',
    badgeClass: 'badge badge-warn badge-run',
    progress: 32,
    progressLabel: '32%',
    progressFill: 'fill-warn',
    started: '4 min ago',
    cost: '₹410',
  },
  {
    id: 'RUN-4822',
    subtitle: 'Week-27 refresh · express mode',
    client: 'Skyline Broadband',
    pipeline: 'Analysis · express',
    pipe: 'Analysis',
    status: 'queued',
    statusLabel: 'Queued',
    badgeClass: 'badge',
    progress: 0,
    progressLabel: '—',
    progressFill: '',
    started: 'just now',
    cost: '—',
    costMuted: true,
  },
  {
    id: 'ADK-4808',
    subtitle: 'Agent build · Google ADK',
    client: 'Skyline Broadband',
    pipeline: 'Develop · codegen',
    pipe: 'Develop',
    status: 'done',
    statusLabel: 'Completed',
    badgeClass: 'badge badge-ok',
    progress: 100,
    progressLabel: '100%',
    progressFill: 'fill-ok',
    started: '2 days ago',
    cost: '₹980',
  },
  {
    id: 'RUN-4792',
    subtitle: 'Network Ops Copilot · intent pass',
    client: 'Skyline Broadband',
    pipeline: 'Analysis · intents only',
    pipe: 'Analysis',
    status: 'done',
    statusLabel: 'Clustering skipped',
    badgeClass: 'badge badge-warn',
    progress: 100,
    progressLabel: '41 intents',
    progressFill: 'fill-ok',
    started: '3 days ago',
    cost: '₹640',
  },
  {
    id: 'RUN-4770',
    subtitle: 'Northwind · first pass',
    client: 'Northwind Retail',
    pipeline: 'Analysis · full',
    pipe: 'Analysis',
    status: 'failed',
    statusLabel: 'Failed',
    badgeClass: 'badge badge-err',
    progress: 44,
    progressLabel: '44%',
    progressFill: '',
    started: '4 days ago',
    cost: '₹180',
  },
  {
    id: 'MAP-4761',
    subtitle: 'Claims intake process map v2',
    client: 'Helios Health',
    pipeline: 'Design · process map',
    pipe: 'Design',
    status: 'done',
    statusLabel: 'Completed',
    badgeClass: 'badge badge-ok',
    progress: 100,
    progressLabel: '100%',
    progressFill: 'fill-ok',
    started: '6 days ago',
    cost: '₹720',
  },
  {
    id: 'LGR-4750',
    subtitle: 'LangGraph build · claims bot',
    client: 'Helios Health',
    pipeline: 'Develop · codegen',
    pipe: 'Develop',
    status: 'done',
    statusLabel: 'Completed',
    badgeClass: 'badge badge-ok',
    progress: 100,
    progressLabel: '100%',
    progressFill: 'fill-ok',
    started: '1 week ago',
    cost: '₹1,050',
  },
];
