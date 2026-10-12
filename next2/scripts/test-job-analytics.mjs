import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Module from 'node:module';
import path from 'node:path';
import ts from 'typescript';

const sourcePath = path.resolve('src/lib/job-analytics.ts');
const source = await readFile(sourcePath, 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const loaded = new Module(sourcePath);
loaded.filename = sourcePath;
loaded.paths = Module._nodeModulePaths(path.dirname(sourcePath));
loaded._compile(output, sourcePath);
const { getJobAnalytics, summarizeTranscripts, buildClusterMetrics, estimateAutomation, pivotTranscripts, exportCsv } = loaded.exports;

const run = (patch = {}) => ({ id: 'run-1', workspaceId: 'ws-1', name: 'Analysis run', type: 'extract_intents', status: 'completed', progress: 100, steps: [], createdAt: 1, updatedAt: 2, ...patch });
const artifact = (patch = {}) => ({ id: 'out-1', workspaceId: 'ws-1', kind: 'insights', name: 'Insights', status: 'review', version: 1, createdBy: 'Analyst', updatedAt: new Date(0).toISOString(), notes: '', sample: false, runId: 'run-1', ...patch });
const transcript = (patch = {}) => ({
  id: 'row-1', conversationId: 'conv-1', intent: 'Billing question', l1Id: 'l1', l1: 'Billing', l2Id: 'l2', l2: 'Payments', l3Id: 'l3', l3: 'Status',
  resolution: 'Confirmed receipt', escalationReason: '', holdReason: '', painPoints: ['No confirmation'], transcript: 'My payment has not updated.', handlingMinutes: 5, complexity: 40, automationPotential: 80, ...patch,
});
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('sample analysis returns 48 unique, clearly synthetic conversations with taxonomy-consistent totals', () => {
  const result = getJobAnalytics(run(), [artifact({ sample: true })]);
  assert.equal(result.sample, true);
  assert.equal(result.transcripts.length, 48);
  assert.equal(new Set(result.transcripts.map((row) => row.conversationId)).size, 48);
  assert.match(result.sourceLabel, /Synthetic demo conversations/);
  assert.match(result.issues.join(' '), /not analyzed/);
  for (const level of ['L1', 'L2', 'L3']) {
    assert.equal(result.clusters.filter((cluster) => cluster.level === level).reduce((sum, cluster) => sum + cluster.volume, 0), 48);
  }
});

test('job lineage excludes unrelated, other-workspace, and unsupported stage artifacts', () => {
  const result = getJobAnalytics(run(), [artifact({ id: 'other-run', runId: 'different-run', sample: true }), artifact({ id: 'other-ws', workspaceId: 'ws-other', sample: true })]);
  assert.equal(result.sample, false);
  assert.deepEqual(result.transcripts, []);
  assert.match(result.issues[0], /No analysis output/);
  const design = getJobAnalytics(run({ type: 'design_flow' }), [artifact({ runId: 'run-1', sample: true })]);
  assert.deepEqual(design.transcripts, []);
});

test('downstream jobs follow only their nearest same-workspace analytics ancestor with a cycle guard', () => {
  const design = run({ type: 'design_flow', sourceArtifactId: 'map-1' });
  const result = getJobAnalytics(design, [
    artifact({ id: 'map-1', kind: 'process_map', runId: 'prior-design', sourceId: 'cluster-1' }),
    artifact({ id: 'cluster-1', name: 'Support intent taxonomy', kind: 'clusters', runId: 'cluster-job', sample: true, sourceId: 'insights-1' }),
    artifact({ id: 'insights-1', kind: 'insights', runId: 'analysis-job', sample: true }),
    artifact({ id: 'foreign-cluster', workspaceId: 'ws-other', kind: 'clusters', sample: true }),
  ]);
  assert.equal(result.sample, true);
  assert.match(result.sourceLabel, /Support intent taxonomy · source job cluster-job/);

  const cycle = getJobAnalytics(design, [
    artifact({ id: 'map-1', kind: 'process_map', runId: 'prior-design', sourceId: 'map-2' }),
    artifact({ id: 'map-2', kind: 'uml', runId: 'prior-uml', sourceId: 'map-1' }),
  ]);
  assert.deepEqual(cycle.transcripts, []);
  assert.match(cycle.issues[0], /No analysis output/);
});

test('full pipeline prefers its own cluster output over its insights output', () => {
  const result = getJobAnalytics(run({ type: 'full_pipeline' }), [
    artifact({ id: 'insights-1', kind: 'insights', sample: true }),
    artifact({ id: 'clusters-1', name: 'Authoritative support taxonomy', kind: 'clusters', sample: false, analytics: { clusters: [{ id: 'l1', name: 'Billing', level: 'L1', l1: 'Billing', l2: '', l3: '', volume: 1, coverage: 1, complexity: 30, automationPotential: 80, automationScore: 60 }] } }),
  ]);
  assert.equal(result.sample, false);
  assert.equal(result.metricSource, 'backend');
  assert.match(result.sourceLabel, /Authoritative support taxonomy/);
});

test('live results use only validated typed analytics and never fall back to sample content', () => {
  const live = transcript({ id: 'live-1' });
  const valid = getJobAnalytics(run(), [artifact({ analytics: { transcripts: [live] } })]);
  assert.equal(valid.sample, false);
  assert.deepEqual(valid.transcripts, [live]);
  const absent = getJobAnalytics(run(), [artifact({ content: 'looks like transcripts', sample: false })]);
  assert.deepEqual(absent.transcripts, []);
  assert.match(absent.issues[0], /does not include typed/);
  const malformed = getJobAnalytics(run(), [artifact({ analytics: { transcripts: [{ ...live, complexity: 150 }] } })]);
  assert.deepEqual(malformed.transcripts, []);
  assert.match(malformed.issues[0], /incomplete/);
});

test('edited sample analytics hydrate from the artifact and remain labeled sample data', () => {
  const edited = transcript({ l1: 'Customer care', intent: 'Updated sample intent' });
  const result = getJobAnalytics(run(), [artifact({ sample: true, analytics: { transcripts: [edited] } })]);
  assert.equal(result.sample, true);
  assert.equal(result.metricSource, 'sample');
  assert.deepEqual(result.transcripts, [edited]);
  assert.match(result.sourceLabel, /Saved sample analytics/);
  assert.match(result.issues.join(' '), /not connected/);
  const malformed = getJobAnalytics(run(), [artifact({ sample: true, analytics: { transcripts: [{ ...edited, automationPotential: 180 }] } })]);
  assert.deepEqual(malformed.transcripts, []);
  assert.equal(malformed.metricSource, 'sample');
  assert.match(malformed.issues.join(' '), /incomplete transcript/);
});

test('uses supplied backend cluster metrics and flags a changed source artifact revision', () => {
  const authoritative = [{ id: 'c-billing', name: 'Billing', level: 'L1', l1: 'Billing', l2: '', l3: '', volume: 2, coverage: 1, complexity: 35, automationPotential: 90, automationScore: 79 }];
  const result = getJobAnalytics(run({ sourceArtifactId: 'source-1', sourceVersion: 2 }), [
    artifact({ sourceId: 'source-1', analytics: { transcripts: [transcript()], clusters: authoritative } }),
    artifact({ id: 'source-1', runId: undefined, kind: 'clusters', version: 3 }),
  ]);
  assert.equal(result.metricSource, 'backend');
  assert.deepEqual(result.clusters, authoritative);
  assert.ok(result.issues.some((issue) => issue.includes('job input pinned v2')));
  const estimated = getJobAnalytics(run(), [artifact({ analytics: { transcripts: [transcript()] } })]);
  assert.equal(estimated.metricSource, 'transcript estimate');
  const storedEstimate = getJobAnalytics(run(), [artifact({ analytics: { transcripts: [transcript()], clusters: authoritative, metricSource: 'transcript estimate' } })]);
  assert.equal(storedEstimate.metricSource, 'transcript estimate');
  assert.notDeepEqual(storedEstimate.clusters, authoritative, 'persisted computed values are rebuilt from the current transcript assignments');
});

test('summaries count distinct conversations and weight conversation metrics once', () => {
  const rows = [transcript(), transcript({ id: 'row-2', complexity: 60, automationPotential: 60, handlingMinutes: 7, painPoints: ['No confirmation', 'Unclear payment state'] }), transcript({ id: 'row-3', conversationId: 'conv-2', intent: 'Outage', escalationReason: 'No estimate', holdReason: 'Checking status', painPoints: ['Unclear outage updates'] })];
  const summary = summarizeTranscripts(rows);
  assert.equal(summary.recordCount, 3);
  assert.equal(summary.conversationCount, 2);
  assert.equal(summary.averageComplexity, 45);
  assert.equal(summary.averageHandlingMinutes, 5.5);
  assert.equal(summary.escalationRate, 0.5);
  assert.equal(summary.painPointCounts.find((item) => item.label === 'No confirmation').conversations, 1);
});

test('cluster metrics deduplicate conversations and compute coverage within each level', () => {
  const rows = [
    transcript(), transcript({ id: 'row-2', complexity: 60 }),
    transcript({ id: 'row-3', l2Id: 'l2b', l2: 'Billing issue', l3Id: 'l3b', l3: 'Dispute' }),
    transcript({ id: 'row-4', conversationId: 'conv-2', l1Id: 'l1b', l1: 'Network', l2Id: 'l2c', l2: 'Outage', l3Id: 'l3c', l3: 'Area outage' }),
    transcript({ id: 'row-5', conversationId: 'conv-3', l1Id: '', l1: '', l2Id: '', l2: '', l3Id: '', l3: '' }),
  ];
  const metrics = buildClusterMetrics(rows);
  const billing = metrics.find((item) => item.id === 'l1');
  const payments = metrics.find((item) => item.id === 'l2');
  const billingCoverage = metrics.filter((item) => item.level === 'L2').reduce((sum, item) => sum + item.coverage, 0);
  assert.equal(billing.volume, 1);
  assert.equal(billing.coverage, 1 / 3);
  assert.equal(payments.volume, 1);
  assert.equal(payments.complexity, 50, 'multiple rows in one conversation are averaged before weighting conversations');
  assert.equal(billingCoverage, 1, 'coverage uses all job conversations, including unassigned ones; per-category coverage need not sum to 100%');
  assert.equal(metrics.filter((item) => item.level === 'L1').reduce((sum, item) => sum + item.volume, 0), 2);
});

test('automation estimate exposes assumptions, nullable ROI, and zero-value behavior', () => {
  const cluster = { id: 'l1', name: 'Billing', level: 'L1', l1: 'Billing', l2: '', l3: '', volume: 10, coverage: 1, complexity: 40, automationPotential: 80, automationScore: 75 };
  const estimate = estimateAutomation(cluster, { monthlyConversations: 1000, costPerMinute: 2, implementationCost: 10_000, monthlyRunningCost: 1_100, avgHandlingMinutes: 5, currency: 'USD' });
  assert.ok(Math.abs(estimate.automaticRate - 0.64) < 1e-12);
  assert.equal(estimate.monthlyGrossSavings, 6400);
  assert.equal(estimate.monthlyNetSavings, 5300);
  assert.equal(estimate.paybackMonths, 1.89);
  assert.equal(estimate.annualRoi, 536);
  assert.match(estimate.assumptions.join(' '), /not a forecast|Actual results/i);
  const zero = estimateAutomation({ ...cluster, complexity: 100, automationPotential: 0 }, { monthlyConversations: 0, costPerMinute: 0, implementationCost: 100, monthlyRunningCost: 0, currency: 'USD' });
  assert.equal(zero.monthlyGrossSavings, 0);
  assert.equal(zero.paybackMonths, null);
  assert.equal(zero.annualRoi, -100);
  assert.equal(estimateAutomation(cluster, { monthlyConversations: 10, costPerMinute: 1, implementationCost: 0, monthlyRunningCost: 0, currency: 'USD' }).annualRoi, null);
});

test('pivot counts unique conversations and computes per-conversation averages', () => {
  const rows = [transcript(), transcript({ id: 'row-2', complexity: 60 }), transcript({ id: 'row-3', conversationId: 'conv-2', l1: 'Network', l1Id: 'l1b', complexity: 20 })];
  const pivot = pivotTranscripts(rows, 'l1', 'intent', 'volume');
  assert.deepEqual(pivot.columns, ['Billing question']);
  assert.equal(pivot.rows.find((item) => item.key === 'Billing').values['Billing question'], 1);
  assert.equal(pivot.rows.find((item) => item.key === 'Billing').total, 1);
  const averages = pivotTranscripts(rows, 'l1', 'intent', 'avgComplexity');
  assert.equal(averages.rows.find((item) => item.key === 'Billing').values['Billing question'], 50);
});

test('CSV quotes fields and escapes spreadsheet formulas', () => {
  const csv = exportCsv([{ name: 'A, "B"', detail: 'first\nsecond', unsafe: '=SUM(A1:A3)' }, { name: 'plain', detail: '', unsafe: '-2' }]);
  assert.match(csv, /"A, ""B"""/);
  assert.match(csv, /"first\nsecond"/);
  assert.match(csv, /'=SUM\(A1:A3\)/);
  assert.match(csv, /'\-2/);
  assert.equal(exportCsv([]), '');
});

for (const [name, runTest] of tests) {
  await runTest();
  process.stdout.write(`✓ ${name}\n`);
}
process.stdout.write(`Passed ${tests.length} job analytics checks.\n`);
