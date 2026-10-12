import type { Artifact, PipelineRun } from '@/data/pipeline';

export type TranscriptRecord = {
  id: string;
  conversationId: string;
  intent: string;
  l1Id: string;
  l1: string;
  l2Id: string;
  l2: string;
  l3Id: string;
  l3: string;
  resolution: string;
  escalationReason: string;
  holdReason: string;
  painPoints: string[];
  transcript: string;
  handlingMinutes: number;
  complexity: number;
  automationPotential: number;
};

export type ClusterMetric = {
  id: string;
  name: string;
  level: 'L1' | 'L2' | 'L3';
  parentId?: string;
  l1: string;
  l2: string;
  l3: string;
  volume: number;
  coverage: number;
  complexity: number;
  automationPotential: number;
  automationScore: number;
};

export type JobAnalytics = {
  sourceLabel: string;
  sample: boolean;
  metricSource: 'sample' | 'transcript estimate' | 'backend' | 'unavailable';
  transcripts: TranscriptRecord[];
  clusters: ClusterMetric[];
  issues: string[];
};

export type TranscriptSummary = {
  recordCount: number;
  conversationCount: number;
  averageHandlingMinutes: number;
  averageComplexity: number;
  averageAutomationPotential: number;
  escalationRate: number;
  holdRate: number;
  intentCounts: { label: string; conversations: number }[];
  painPointCounts: { label: string; conversations: number }[];
};

export type PivotField = 'l1' | 'l2' | 'l3' | 'intent' | 'resolution' | 'escalationReason' | 'holdReason';
export type PivotMetric = 'volume' | 'avgComplexity' | 'avgAutomationPotential';
export type PivotTable = {
  rowField: PivotField;
  columnField: PivotField;
  metric: PivotMetric;
  columns: string[];
  rows: { key: string; values: Record<string, number>; total: number }[];
};

export type CostInputs = {
  monthlyConversations: number;
  costPerMinute: number;
  implementationCost: number;
  monthlyRunningCost: number;
  currency: string;
  avgHandlingMinutes?: number;
};

export type AutomationEstimate = {
  monthlyGrossSavings: number;
  monthlyNetSavings: number;
  annualRoi: number | null;
  paybackMonths: number | null;
  automationScore: number;
  automaticRate: number;
  currency: string;
  assumptions: string[];
};

type TaxonomyLeaf = { id: string; l1Id: string; l1: string; l2Id: string; l2: string; l3Id: string; l3: string; intent: string; resolution: string; escalationReason: string; holdReason: string; painPoint: string; transcript: string; complexity: number; automationPotential: number; handlingMinutes: number };

const SYNTHETIC_LEAVES: TaxonomyLeaf[] = [
  { id: 'c-charge', l1Id: 'c-billing', l1: 'Billing & payments', l2Id: 'c-invoice', l2: 'Invoice disputes', l3Id: 'c-charge', l3: 'Unexpected charge', intent: 'Dispute an unexpected bill', resolution: 'Review the invoice and apply an eligible credit.', escalationReason: 'Credit exceeds the self-service limit.', holdReason: 'Retrieving invoice history.', painPoint: 'Repeated contacts about the same charge.', transcript: 'I cancelled the extra line but I am still being charged. Can you check the latest invoice?', complexity: 48, automationPotential: 82, handlingMinutes: 7 },
  { id: 'c-credit', l1Id: 'c-billing', l1: 'Billing & payments', l2Id: 'c-invoice', l2: 'Invoice disputes', l3Id: 'c-credit', l3: 'Missing credit', intent: 'Dispute an unexpected bill', resolution: 'Confirm credit eligibility and correct the invoice.', escalationReason: 'Credit is missing from a closed billing period.', holdReason: 'Checking the previous invoice and credit ledger.', painPoint: 'A promised credit did not appear.', transcript: 'The agent promised a credit last month, but my new bill still has the full amount.', complexity: 55, automationPotential: 74, handlingMinutes: 8 },
  { id: 'c-pending', l1Id: 'c-billing', l1: 'Billing & payments', l2Id: 'c-payment', l2: 'Payment status', l3Id: 'c-pending', l3: 'Payment pending', intent: 'Check a payment status', resolution: 'Confirm settlement state and share the payment reference.', escalationReason: 'Payment remains missing after the settlement window.', holdReason: 'Checking payment gateway status.', painPoint: 'No confirmation after payment.', transcript: 'The money left my account yesterday, but the service still says the bill is unpaid.', complexity: 36, automationPotential: 90, handlingMinutes: 5 },
  { id: 'c-confirm', l1Id: 'c-billing', l1: 'Billing & payments', l2Id: 'c-payment', l2: 'Payment status', l3Id: 'c-confirm', l3: 'Confirmation missing', intent: 'Check a payment status', resolution: 'Verify receipt and send a payment confirmation.', escalationReason: 'No transaction reference is available.', holdReason: 'Matching the account and transaction.', painPoint: 'Uncertainty after submitting payment.', transcript: 'I paid this morning and need a receipt because I did not get a confirmation message.', complexity: 28, automationPotential: 94, handlingMinutes: 4 },
  { id: 'c-area', l1Id: 'c-network', l1: 'Network support', l2Id: 'c-outage', l2: 'Connectivity issues', l3Id: 'c-area', l3: 'Area outage', intent: 'Report a network outage', resolution: 'Confirm the area outage and share a restoration update.', escalationReason: 'No restoration estimate is available.', holdReason: 'Checking area diagnostics and outage notices.', painPoint: 'Unclear outage updates.', transcript: 'The whole street has lost service. Is there an outage and when might it be restored?', complexity: 42, automationPotential: 80, handlingMinutes: 6 },
  { id: 'c-speed', l1Id: 'c-network', l1: 'Network support', l2Id: 'c-outage', l2: 'Connectivity issues', l3Id: 'c-speed', l3: 'Slow connection', intent: 'Resolve slow internet', resolution: 'Run diagnostics and guide a connection reset.', escalationReason: 'A persistent line fault needs a technician.', holdReason: 'Running a line test.', painPoint: 'Repeating the same troubleshooting steps.', transcript: 'My connection slows down every evening even after I restart the router.', complexity: 62, automationPotential: 68, handlingMinutes: 9 },
  { id: 'c-install', l1Id: 'c-account', l1: 'Account services', l2Id: 'c-lifecycle', l2: 'Service lifecycle', l3Id: 'c-install', l3: 'New installation', intent: 'Book an installation', resolution: 'Check address eligibility and schedule a visit.', escalationReason: 'The address is not currently serviceable.', holdReason: 'Checking technician availability.', painPoint: 'Missed installation appointments.', transcript: 'I need to arrange an installation and want to know which appointment slots are open.', complexity: 44, automationPotential: 78, handlingMinutes: 6 },
  { id: 'c-cancel', l1Id: 'c-account', l1: 'Account services', l2Id: 'c-lifecycle', l2: 'Service lifecycle', l3Id: 'c-cancel', l3: 'Cancellation', intent: 'Cancel a service', resolution: 'Explain closure terms and confirm the cancellation request.', escalationReason: 'A disputed fee or retention request needs review.', holdReason: 'Reviewing account terms.', painPoint: 'A complicated cancellation process.', transcript: 'I would like to close the account and understand any final charges before it is cancelled.', complexity: 72, automationPotential: 52, handlingMinutes: 10 },
];
const SAMPLE_COUNTS: Record<string, number> = { 'c-charge': 7, 'c-credit': 4, 'c-pending': 6, 'c-confirm': 4, 'c-area': 9, 'c-speed': 7, 'c-install': 6, 'c-cancel': 5 };
const KIND_LABELS: Record<string, string> = { insights: 'Conversation insights', clusters: 'Intent clusters' };

/** Uses only artifacts produced by this run. Sample rows are clearly synthetic; live content is never fabricated. */
export function getJobAnalytics(run: PipelineRun, artifacts: Artifact[]): JobAnalytics {
  const scoped = artifacts.filter((artifact) => artifact.workspaceId === run.workspaceId);
  const outputs = scoped.filter((artifact) => artifact.runId === run.id);
  const directKind = run.type === 'extract_intents' ? 'insights' : run.type === 'cluster_intents' ? 'clusters' : undefined;
  const directAnalytics = outputs.filter((artifact) => artifact.kind === 'insights' || artifact.kind === 'clusters');
  let output = directAnalytics.find((artifact) => artifact.kind === directKind);
  if (!output && run.type === 'full_pipeline') output = directAnalytics.find((artifact) => artifact.kind === 'clusters') ?? directAnalytics.find((artifact) => artifact.kind === 'insights');
  let inherited = false;
  const mayInheritSource = run.type === 'design_flow' || run.type === 'generate_uml' || run.type === 'generate_agent';
  if (!output && mayInheritSource) {
    const starts = [run.sourceArtifactId, ...outputs.map((artifact) => artifact.sourceId)].filter((id): id is string => Boolean(id));
    output = findNearestAnalyticsArtifact(starts, scoped);
    inherited = Boolean(output);
  }
  if (!output) return unavailableAnalytics('No analysis output is linked to this job or its source-artifact lineage.');

  const source = run.sourceArtifactId ? scoped.find((artifact) => artifact.id === run.sourceArtifactId) : undefined;
  const lineageIssues = run.sourceVersion !== undefined && source && source.version !== run.sourceVersion
    ? [`Source metrics reflect current artifact revision; job input pinned v${run.sourceVersion}.`]
    : [];
  if (output.sample) {
    const storedAnalytics = (output as Artifact & { analytics?: unknown }).analytics;
    if (isRecord(storedAnalytics) && Object.hasOwn(storedAnalytics, 'transcripts')) {
      const analytics = readAnalytics(output);
      if (!analytics.ok) {
        return {
          sourceLabel: `${inherited ? `${output.name} · source job ${output.runId ?? 'unknown'} · ` : ''}Saved sample analytics`,
          sample: true,
          metricSource: 'sample',
          transcripts: [],
          clusters: [],
          issues: [analytics.issue, 'This is local demo data; source customer conversations are not connected.', ...lineageIssues],
        };
      }
      return {
        sourceLabel: `${inherited ? `${output.name} · source job ${output.runId ?? 'unknown'} · ` : ''}Saved sample analytics`,
        sample: true,
        metricSource: 'sample',
        transcripts: analytics.transcripts,
        clusters: buildClusterMetrics(analytics.transcripts),
        issues: ['Sample analytics are stored in this browser; source customer conversations are not connected.', ...lineageIssues],
      };
    }
    const transcripts = makeSampleTranscripts();
    return {
      sourceLabel: `${inherited ? `${output.name} · source job ${output.runId ?? 'unknown'} · ` : ''}${run.fileName ? `Synthetic demo conversations · ${run.fileName} was not analyzed` : 'Synthetic demo conversations · Customer Operations'}`,
      sample: true,
      metricSource: 'sample',
      transcripts,
      clusters: buildClusterMetrics(transcripts),
      issues: ['Synthetic example transcripts are shown for demonstration; source conversation content was not analyzed.', ...lineageIssues],
    };
  }

  const analytics = readAnalytics(output);
  if (!analytics.ok) return { ...unavailableAnalytics(analytics.issue), sourceLabel: `${KIND_LABELS[output.kind] ?? 'Analytics'} · ${output.name}` };
  return {
    sourceLabel: `${inherited ? `${output.name} · source job ${output.runId ?? 'unknown'}` : `${KIND_LABELS[output.kind] ?? 'Analytics'} · ${output.name}`}`,
    sample: false,
    transcripts: analytics.transcripts,
    clusters: analytics.clusters ?? buildClusterMetrics(analytics.transcripts),
    metricSource: analytics.clusters && analytics.metricSource !== 'transcript estimate' ? 'backend' : 'transcript estimate',
    issues: [...(analytics.issue ? [analytics.issue] : analytics.transcripts.length ? [] : ['The live analytics response contains no transcript records.']), ...lineageIssues],
  };
}

export function summarizeTranscripts(transcripts: TranscriptRecord[]): TranscriptSummary {
  const conversations = byConversation(transcripts);
  const total = conversations.size;
  const uniqueRecords = [...conversations.values()];
  const averages = uniqueRecords.map((records) => ({
    handling: average(records.map((record) => record.handlingMinutes)),
    complexity: average(records.map((record) => record.complexity)),
    automation: average(records.map((record) => record.automationPotential)),
    escalation: records.some((record) => isPresent(record.escalationReason)) ? 1 : 0,
    hold: records.some((record) => isPresent(record.holdReason)) ? 1 : 0,
  }));
  return {
    recordCount: transcripts.length,
    conversationCount: total,
    averageHandlingMinutes: average(averages.map((item) => item.handling)),
    averageComplexity: average(averages.map((item) => item.complexity)),
    averageAutomationPotential: average(averages.map((item) => item.automation)),
    escalationRate: total ? averages.filter((item) => item.escalation).length / total : 0,
    holdRate: total ? averages.filter((item) => item.hold).length / total : 0,
    intentCounts: countConversations(transcripts, (row) => row.intent),
    painPointCounts: countConversationPainPoints(transcripts),
  };
}

/** Groups each taxonomy level independently; coverage divides by all unique job conversations, including unassigned rows. Parent and child volumes are never added together. */
export function buildClusterMetrics(transcripts: TranscriptRecord[]): ClusterMetric[] {
  const uniqueConversations = [...byConversation(transcripts).values()];
  const fields = [
    { level: 'L1' as const, idField: 'l1Id' as const, nameField: 'l1' as const, parentField: undefined, pathField: 'l1' as const },
    { level: 'L2' as const, idField: 'l2Id' as const, nameField: 'l2' as const, parentField: 'l1Id' as const, pathField: 'l2' as const },
    { level: 'L3' as const, idField: 'l3Id' as const, nameField: 'l3' as const, parentField: 'l2Id' as const, pathField: 'l3' as const },
  ];
  const metrics: ClusterMetric[] = [];
  for (const field of fields) {
    const groups = new Map<string, { row: TranscriptRecord; conversations: Map<string, TranscriptRecord[]> }>();
    for (const records of uniqueConversations) {
      const eligible = records.filter((row) => isPresent(row[field.idField]) && isPresent(row[field.nameField]));
      const perGroup = new Map<string, TranscriptRecord[]>();
      for (const row of eligible) perGroup.set(row[field.idField], [...(perGroup.get(row[field.idField]) ?? []), row]);
      for (const [id, rows] of perGroup) {
        const group = groups.get(id) ?? { row: rows[0], conversations: new Map<string, TranscriptRecord[]>() };
        group.conversations.set(rows[0].conversationId, rows);
        groups.set(id, group);
      }
    }
    const denominator = uniqueConversations.length;
    const maxVolume = Math.max(0, ...[...groups.values()].map((group) => group.conversations.size));
    for (const [id, group] of groups) {
      const conversationCount = group.conversations.size;
      const complexity = weightedConversationAverage(group.conversations, (row) => row.complexity);
      const automationPotential = weightedConversationAverage(group.conversations, (row) => row.automationPotential);
      const row = group.row;
      metrics.push({
        id,
        name: row[field.nameField],
        level: field.level,
        ...(field.parentField ? { parentId: row[field.parentField] } : {}),
        l1: row.l1,
        l2: field.level === 'L1' ? '' : row.l2,
        l3: field.level === 'L3' ? row.l3 : '',
        volume: conversationCount,
        coverage: denominator ? conversationCount / denominator : 0,
        complexity,
        automationPotential,
        automationScore: scoreAutomation(conversationCount, complexity, automationPotential, maxVolume),
      });
    }
  }
  return metrics;
}

/**
 * Savings estimate uses effective automation rate = potential × (1 - complexity/200).
 * This is a planning scenario, not a forecast or financial guarantee.
 */
export function estimateAutomation(cluster: ClusterMetric, costInputs: CostInputs): AutomationEstimate {
  const automaticRate = clamp(cluster.automationPotential, 0, 100) / 100 * (1 - clamp(cluster.complexity, 0, 100) / 200);
  const handlingMinutes = Math.max(0, finiteOr(costInputs.avgHandlingMinutes, 6));
  const monthlyGrossSavings = round(Math.max(0, finiteOr(costInputs.monthlyConversations, 0)) * automaticRate * handlingMinutes * Math.max(0, finiteOr(costInputs.costPerMinute, 0)), 2);
  const monthlyNetSavings = round(monthlyGrossSavings - Math.max(0, finiteOr(costInputs.monthlyRunningCost, 0)), 2);
  const implementationCost = Math.max(0, finiteOr(costInputs.implementationCost, 0));
  const annualRoi = implementationCost > 0 ? round(((monthlyNetSavings * 12 - implementationCost) / implementationCost) * 100, 1) : null;
  const paybackMonths = monthlyNetSavings > 0 ? round(implementationCost / monthlyNetSavings, 2) : null;
  return {
    monthlyGrossSavings,
    monthlyNetSavings,
    annualRoi,
    paybackMonths,
    automationScore: cluster.automationScore,
    automaticRate,
    currency: costInputs.currency,
    assumptions: [
      `Handling time uses ${handlingMinutes} minutes per conversation${costInputs.avgHandlingMinutes === undefined ? ' (default assumption)' : ''}.`,
      'Savings assume avoided handling time equals the estimated automatic rate.',
      'Monthly net savings subtract running cost; annual ROI subtracts implementation cost from 12 months of net savings.',
      'Actual results depend on service quality, adoption, and operating costs.',
    ],
  };
}

export function pivotTranscripts(transcripts: TranscriptRecord[], rowField: PivotField, columnField: PivotField, metric: PivotMetric): PivotTable {
  const rowGroups = new Map<string, TranscriptRecord[]>();
  for (const transcript of transcripts) {
    const rowKey = pivotValue(transcript, rowField);
    rowGroups.set(rowKey, [...(rowGroups.get(rowKey) ?? []), transcript]);
  }
  const columns = [...new Set(transcripts.map((transcript) => pivotValue(transcript, columnField)))].sort((a, b) => a.localeCompare(b));
  const rows = [...rowGroups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, group]) => {
    const conversationGroups = new Map<string, TranscriptRecord[]>();
    for (const record of group) conversationGroups.set(record.conversationId, [...(conversationGroups.get(record.conversationId) ?? []), record]);
    const values: Record<string, number> = {};
    for (const column of columns) {
      const matching = group.filter((record) => pivotValue(record, columnField) === column);
      values[column] = pivotMetricValue(matching, metric);
    }
    return { key, values, total: pivotMetricValue([...conversationGroups.values()].flat(), metric) };
  });
  return { rowField, columnField, metric, columns, rows };
}

/** Produces RFC 4180-style CSV, escapes quotes, and prefixes formula-like values against spreadsheet injection. */
export function exportCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ''))]
    .map((line) => line.map(csvCell).join(','))
    .join('\r\n');
}

export function downloadData(filename: string, text: string, mime = 'text/csv;charset=utf-8'): void {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') throw new Error('Downloads are only available in a browser.');
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function unavailableAnalytics(issue: string): JobAnalytics {
  return { sourceLabel: 'Analytics unavailable', sample: false, metricSource: 'unavailable', transcripts: [], clusters: [], issues: [issue] };
}
function findNearestAnalyticsArtifact(startIds: string[], artifacts: Artifact[]): Artifact | undefined {
  const byId = new Map(artifacts.map((artifact) => [artifact.id, artifact]));
  const visited = new Set<string>();
  const queue = [...startIds];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const id = queue[cursor];
    if (visited.has(id)) continue;
    visited.add(id);
    const artifact = byId.get(id);
    if (!artifact) continue;
    if (artifact.kind === 'insights' || artifact.kind === 'clusters') return artifact;
    if (artifact.sourceId) queue.push(artifact.sourceId);
  }
  return undefined;
}
function makeSampleTranscripts(): TranscriptRecord[] {
  const rows: TranscriptRecord[] = [];
  for (const leaf of SYNTHETIC_LEAVES) {
    const count = SAMPLE_COUNTS[leaf.id];
    for (let index = 0; index < count; index += 1) {
      const number = rows.length + 1;
      rows.push({
        id: `sample-row-${String(number).padStart(3, '0')}`,
        conversationId: `sample-conversation-${String(number).padStart(3, '0')}`,
        intent: leaf.intent,
        l1Id: leaf.l1Id, l1: leaf.l1, l2Id: leaf.l2Id, l2: leaf.l2, l3Id: leaf.l3Id, l3: leaf.l3,
        resolution: leaf.resolution,
        escalationReason: index % 4 === 0 ? leaf.escalationReason : '',
        holdReason: index % 3 === 0 ? leaf.holdReason : '',
        painPoints: [leaf.painPoint],
        transcript: `${leaf.transcript} (Synthetic example ${String(index + 1).padStart(2, '0')}; no customer data.)`,
        handlingMinutes: Math.max(1, leaf.handlingMinutes + ((index % 3) - 1)),
        complexity: clamp(leaf.complexity + ((index % 5) - 2) * 3, 0, 100),
        automationPotential: clamp(leaf.automationPotential - ((index % 4) - 1) * 2, 0, 100),
      });
    }
  }
  return rows;
}

function readAnalytics(artifact: Artifact): { ok: true; transcripts: TranscriptRecord[]; clusters?: ClusterMetric[]; metricSource?: 'backend' | 'transcript estimate'; issue?: string } | { ok: false; issue: string } {
  const analytics = (artifact as Artifact & { analytics?: unknown }).analytics;
  if (!isRecord(analytics)) return { ok: false, issue: 'This live output does not include typed analytics.' };
  if (analytics.metricSource !== undefined && analytics.metricSource !== 'backend' && analytics.metricSource !== 'transcript estimate') {
    return { ok: false, issue: 'The live output contains an unknown cluster metric source.' };
  }
  const transcriptValid = Array.isArray(analytics.transcripts) && analytics.transcripts.every(isTranscriptRecord);
  const clustersValid = Array.isArray(analytics.clusters) && analytics.clusters.every(isClusterMetric);
  const transcripts = transcriptValid ? analytics.transcripts as TranscriptRecord[] : [];
  const clusters = clustersValid && analytics.metricSource !== 'transcript estimate' ? analytics.clusters as ClusterMetric[] : undefined;
  if (!transcriptValid && !clusters) {
    if (Array.isArray(analytics.transcripts) && !transcriptValid) return { ok: false, issue: 'The live output contains incomplete transcript analytics.' };
    if (Array.isArray(analytics.clusters) && !clustersValid) return { ok: false, issue: 'The live output contains incomplete cluster analytics.' };
    return { ok: false, issue: 'This live output does not include typed transcript or cluster analytics.' };
  }
  return {
    ok: true,
    transcripts,
    clusters,
    ...(clusters ? { metricSource: 'backend' as const } : { metricSource: 'transcript estimate' as const }),
    ...(!transcriptValid ? { issue: Array.isArray(analytics.transcripts) ? 'The live output contains incomplete transcript analytics; valid cluster metrics are still available.' : 'The live output contains no transcript records; valid cluster metrics are still available.' } : {}),
    ...(!clustersValid && Array.isArray(analytics.clusters) ? { issue: 'The live output contains incomplete cluster metrics; transcript-derived metrics are shown.' } : {}),
  };
}

function isTranscriptRecord(value: unknown): value is TranscriptRecord {
  if (!isRecord(value)) return false;
  const textFields: (keyof TranscriptRecord)[] = ['id', 'conversationId', 'intent', 'l1Id', 'l1', 'l2Id', 'l2', 'l3Id', 'l3', 'resolution', 'escalationReason', 'holdReason', 'transcript'];
  return textFields.every((key) => typeof value[key] === 'string') && isPresent(value.id as string) && isPresent(value.conversationId as string) && Array.isArray(value.painPoints) && value.painPoints.every((point) => typeof point === 'string') &&
    finiteIn(value.handlingMinutes, 0, Number.MAX_SAFE_INTEGER) && finiteIn(value.complexity, 0, 100) && finiteIn(value.automationPotential, 0, 100);
}
function isClusterMetric(value: unknown): value is ClusterMetric {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' && typeof value.name === 'string' && ['L1', 'L2', 'L3'].includes(String(value.level)) &&
    (value.parentId === undefined || typeof value.parentId === 'string') && typeof value.l1 === 'string' && typeof value.l2 === 'string' && typeof value.l3 === 'string' &&
    finiteIn(value.volume, 0, Number.MAX_SAFE_INTEGER) && Number.isInteger(value.volume) && finiteIn(value.coverage, 0, 1) &&
    finiteIn(value.complexity, 0, 100) && finiteIn(value.automationPotential, 0, 100) && finiteIn(value.automationScore, 0, 100);
}

function byConversation(transcripts: TranscriptRecord[]): Map<string, TranscriptRecord[]> {
  const groups = new Map<string, TranscriptRecord[]>();
  for (const transcript of transcripts) groups.set(transcript.conversationId, [...(groups.get(transcript.conversationId) ?? []), transcript]);
  return groups;
}
function weightedConversationAverage(groups: Map<string, TranscriptRecord[]>, metric: (record: TranscriptRecord) => number): number {
  return average([...groups.values()].map((records) => average(records.map(metric))));
}
function countConversations(transcripts: TranscriptRecord[], label: (row: TranscriptRecord) => string): { label: string; conversations: number }[] {
  const counts = new Map<string, Set<string>>();
  for (const row of transcripts) {
    const value = isPresent(label(row)) ? label(row) : 'Unspecified';
    counts.set(value, (counts.get(value) ?? new Set()).add(row.conversationId));
  }
  return [...counts].map(([value, ids]) => ({ label: value, conversations: ids.size })).sort((a, b) => b.conversations - a.conversations || a.label.localeCompare(b.label));
}
function countConversationPainPoints(transcripts: TranscriptRecord[]): { label: string; conversations: number }[] {
  const counts = new Map<string, Set<string>>();
  for (const row of transcripts) for (const point of new Set(row.painPoints.map((item) => item.trim()).filter(Boolean))) counts.set(point, (counts.get(point) ?? new Set()).add(row.conversationId));
  return [...counts].map(([label, ids]) => ({ label, conversations: ids.size })).sort((a, b) => b.conversations - a.conversations || a.label.localeCompare(b.label));
}
function pivotValue(row: TranscriptRecord, field: PivotField): string { return isPresent(row[field]) ? row[field] : 'Unspecified'; }
function pivotMetricValue(records: TranscriptRecord[], metric: PivotMetric): number {
  if (metric === 'volume') return new Set(records.map((record) => record.conversationId)).size;
  const byConversationRows = byConversation(records);
  return weightedConversationAverage(byConversationRows, (record) => metric === 'avgComplexity' ? record.complexity : record.automationPotential);
}
function scoreAutomation(volume: number, complexity: number, potential: number, maxVolume: number): number {
  if (volume <= 0 || maxVolume <= 0) return 0;
  const effectivePotential = clamp(potential, 0, 100) * (1 - clamp(complexity, 0, 100) / 200);
  const scale = Math.log1p(volume) / Math.log1p(maxVolume);
  return round(clamp(effectivePotential * scale, 0, 100), 1);
}
function csvCell(value: unknown): string {
  let text = value instanceof Date ? value.toISOString() : typeof value === 'string' ? value : typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
  if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function finiteIn(value: unknown, min: number, max: number): value is number { return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max; }
function finiteOr(value: number | undefined, fallback: number): number { return typeof value === 'number' && Number.isFinite(value) ? value : fallback; }
function average(values: number[]): number { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; }
function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, value)); }
function round(value: number, decimals: number): number { const factor = 10 ** decimals; return Math.round(value * factor) / factor; }
function isPresent(value: string): boolean { return value.trim().length > 0; }
