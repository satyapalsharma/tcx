import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import ts from 'typescript';

const root = process.cwd();
function loadTs(file, parent = null) {
  const filename = path.resolve(root, file);
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  const loaded = new Module(filename, parent ?? undefined);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = loaded.require.bind(loaded);
  loaded.require = (id) =>
    id.startsWith('@/')
      ? loadTs(`src/${id.slice(2)}.ts`, loaded)
      : originalRequire(id);
  loaded._compile(output, filename);
  return loaded.exports;
}
const {
  readPipelineState,
  advanceDemoPipeline,
  reviseArtifact,
  transitionRun,
  retryAsNewRun,
} = loadTs('src/lib/pipeline-state.ts');
const pipeline = loadTs('src/data/pipeline.ts');

const sourceArtifact = pipeline.SAMPLE_ARTIFACTS[0];
const run = {
  id: 'job-test',
  workspaceId: 'project-a',
  name: 'Test analysis',
  type: 'extract_intents',
  status: 'queued',
  progress: 0,
  steps: pipeline.stageSteps('extract_intents'),
  createdAt: 100,
  updatedAt: 100,
  sourceArtifactId: sourceArtifact.id,
};
const base = {
  artifacts: [{ ...sourceArtifact, workspaceId: 'project-a' }],
  runs: [run],
  connections: [
    {
      id: 'connection-a',
      orgId: 'org-a',
      provider: 'CRM',
      name: 'CRM',
      status: 'connected',
      lastSync: 'never',
    },
  ],
  events: [
    {
      id: 'event-a',
      orgId: 'org-a',
      workspaceId: 'project-a',
      actor: 'Tester',
      action: 'Created',
      detail: 'Fixture',
      time: 100,
    },
  ],
};

const parsed = readPipelineState(base);
assert.ok(parsed, 'valid persisted state parses');
assert.equal(
  readPipelineState({ ...base, runs: [{ ...run, progress: Infinity }] }),
  null,
  'non-finite progress is rejected',
);
assert.equal(
  readPipelineState({ ...base, runs: [{ ...run, progress: 101 }] }),
  null,
  'progress above 100 is rejected',
);
assert.equal(
  readPipelineState({
    ...base,
    artifacts: [
      { ...base.artifacts[0], sourceId: 'artifact-b' },
      { ...base.artifacts[0], id: 'artifact-b', workspaceId: 'project-b' },
    ],
  }),
  null,
  'cross-project artifact references are rejected',
);
assert.equal(
  readPipelineState({
    ...base,
    artifacts: [base.artifacts[0], base.artifacts[0]],
  }),
  null,
  'duplicate entity IDs are rejected',
);
const legacy = readPipelineState({
  ...base,
  artifacts: [{ ...base.artifacts[0], id: 'art-map', runId: undefined }],
});
assert.equal(
  legacy.artifacts[0].runId,
  'JOB-1045',
  'legacy sample artifact job links are restored',
);
const legacyCrossScope = readPipelineState({
  ...base,
  artifacts: [{ ...base.artifacts[0], id: 'art-map', runId: undefined }],
  runs: [
    {
      ...run,
      id: 'JOB-1045',
      workspaceId: 'project-b',
      sourceArtifactId: undefined,
    },
  ],
});
assert.equal(
  legacyCrossScope,
  null,
  'migrated legacy links are checked against run workspace scope',
);

assert.ok(
  readPipelineState({
    artifacts: [],
    runs: [],
    connections: base.connections,
    events: [
      { ...base.events[0], workspaceId: '' },
      { ...base.events[0], id: 'org-event-2', orgId: 'org-b', workspaceId: '' },
    ],
  }),
  'organization audit events and connections persist before projects exist',
);

const projects = [
  { id: 'project-a', orgId: 'org-a' },
  { id: 'project-b', orgId: 'org-a' },
];
const twoQueued = { ...base, runs: [run, { ...run, id: 'job-second' }] };
const claimed = advanceDemoPipeline(twoQueued, projects, 200);
assert.equal(
  claimed.runs[0].status,
  'running',
  'the first queued job is claimed',
);
assert.equal(
  claimed.runs[1].status,
  'queued',
  'only one job per project runs at once',
);
assert.equal(
  claimed.runs[0].steps[0].status,
  'running',
  'claiming a job marks its first step active',
);
const completeRun = { ...run, status: 'running', progress: 96 };
const completed = advanceDemoPipeline(
  { ...base, runs: [completeRun] },
  projects,
  300,
);
assert.equal(
  completed.runs[0].status,
  'completed',
  'a final tick completes the run',
);
assert.equal(
  completed.artifacts.at(-1).id,
  'job-test-insights',
  'output IDs derive deterministically from run and kind',
);
assert.equal(
  completed.events[0].id,
  'job-test-completed-300',
  'completion event IDs derive from the run and tick time',
);

const revised = reviseArtifact(
  {
    ...base.artifacts[0],
    status: 'approved',
    version: 4,
    validatedBy: 'Reviewer',
    validatedAt: '2026-01-01T00:00:00.000Z',
    validatedVersion: 4,
  },
  { notes: 'Updated notes' },
  'Editor',
  400,
);
assert.equal(revised.version, 5, 'content revisions increment the version');
assert.equal(revised.status, 'draft', 'content revisions return to draft');
assert.equal(
  revised.validatedBy,
  undefined,
  'content revisions clear validation',
);
assert.equal(
  revised.history?.at(-1)?.version,
  4,
  'the prior revision is retained',
);
assert.equal(
  revised.analytics,
  base.artifacts[0].analytics,
  'unknown analytics data is preserved',
);
const approved = reviseArtifact(
  revised,
  { status: 'approved' },
  'Reviewer',
  500,
);
assert.equal(
  approved.validatedVersion,
  revised.version,
  'approval records the current version',
);

const cancelled = { ...run, status: 'cancelled', progress: 40 };
const alreadyCompleted = { ...run, status: 'completed' };
assert.equal(
  transitionRun(alreadyCompleted, 'pause', 600),
  alreadyCompleted,
  'illegal transitions preserve input identity',
);
const retriedRun = retryAsNewRun(
  { ...cancelled, error: 'Worker stopped' },
  'job-test-retry-1',
  600,
);
assert.equal(
  retriedRun.id,
  'job-test-retry-1',
  'retry receives a fresh execution ID',
);
assert.equal(
  retriedRun.retryOf,
  'job-test',
  'retry preserves a link to its original logical job',
);
assert.equal(retriedRun.createdAt, 600, 'retry receives a fresh creation time');
assert.equal(retriedRun.error, undefined, 'retry clears the previous error');
assert.equal(retriedRun.status, 'queued', 'new retry attempts are queued');
assert.equal(
  retriedRun.progress,
  0,
  'new retry attempts start at zero progress',
);
assert.ok(
  retriedRun.steps.every((step) => step.status === 'waiting'),
  'new retry attempts reset all steps',
);
const nestedRetry = retryAsNewRun(retriedRun, 'job-test-retry-2', 700);
assert.equal(
  nestedRetry.retryOf,
  'job-test',
  'retries remain linked to the first logical run',
);
const retried = transitionRun(cancelled, 'retry', 600);
assert.equal(retried.status, 'queued', 'cancelled jobs can be retried');
assert.equal(retried.progress, 0, 'retry resets progress');
assert.ok(
  retried.steps.every((step) => step.status === 'waiting'),
  'retry resets all steps',
);

const { getCurrentStep, getNextStage, getOutputRoute, formatRunElapsed } =
  loadTs('src/lib/pipeline-navigation.ts');
assert.equal(getNextStage('insights'), 'cluster_intents');
assert.equal(getNextStage('clusters'), 'design_flow');
assert.equal(getNextStage('process_map'), 'generate_uml');
assert.equal(getNextStage('uml'), 'generate_agent');
assert.equal(
  getNextStage('agent_code'),
  undefined,
  'final output has no next stage',
);
assert.equal(getOutputRoute('clusters'), '/analysis');
assert.equal(getOutputRoute('uml'), '/design');
assert.equal(getOutputRoute('agent_code'), '/develop');
assert.equal(
  getCurrentStep({
    ...run,
    steps: [
      { id: 'a', label: 'Waiting', status: 'waiting' },
      { id: 'b', label: 'Working', status: 'running' },
    ],
  }).id,
  'b',
  'active step takes precedence over waiting steps',
);
assert.equal(
  formatRunElapsed({
    ...run,
    status: 'completed',
    createdAt: 0,
    updatedAt: 61000,
  }),
  '1m 1s',
);

const { getClusterOptions } = loadTs('src/lib/cluster-options.ts');
const clusterInput = {
  ...sourceArtifact,
  kind: 'clusters',
  content: JSON.stringify(pipeline.DEMO_CLUSTERS),
};
const clusterChoices = getClusterOptions(clusterInput);
assert.equal(
  clusterChoices.length,
  15,
  'all three hierarchy levels are available as process-map scopes',
);
assert.ok(
  clusterChoices.some(
    (option) =>
      option.label ===
      'Billing & payments / Invoice disputes / Unexpected charge',
  ),
);
assert.deepEqual(
  getClusterOptions({ ...clusterInput, content: '{broken' }),
  [],
  'unreadable hierarchy is not offered as valid choices',
);
const duplicateNodes = JSON.parse(clusterInput.content);
duplicateNodes[1].id = duplicateNodes[0].id;
assert.deepEqual(
  getClusterOptions({
    ...clusterInput,
    content: JSON.stringify(duplicateNodes),
  }),
  [],
  'duplicate identifiers cannot select an ambiguous cluster',
);
const invalidDepth = JSON.parse(clusterInput.content);
invalidDepth[0].children[0].level = 'L3';
assert.deepEqual(
  getClusterOptions({ ...clusterInput, content: JSON.stringify(invalidDepth) }),
  [],
  'parent levels must remain consecutive',
);

const { createPipelinePlan, validatePipelinePlan, requiredStagesFor } = loadTs(
  'src/lib/pipeline-plan.ts',
);
const { getArtifactVersion } = loadTs('src/lib/artifact-versions.ts');
const skipPlan = createPipelinePlan('full_pipeline', 'generate_agent', true);
assert.deepEqual(skipPlan, [
  'extract_intents',
  'design_flow',
  'generate_uml',
  'generate_agent',
]);
assert.equal(validatePipelinePlan('full_pipeline', skipPlan), null);
assert.ok(
  validatePipelinePlan('full_pipeline', ['extract_intents', 'generate_uml']),
);
assert.equal(
  validatePipelinePlan(
    'design_flow',
    ['design_flow', 'generate_uml'],
    'insights',
  ),
  null,
);
assert.deepEqual(requiredStagesFor('generate_uml', 'insights'), [
  'design_flow',
  'generate_uml',
]);
assert.deepEqual(requiredStagesFor('generate_agent', 'process_map'), [
  'generate_agent',
]);
assert.ok(
  validatePipelinePlan('full_pipeline', ['extract_intents', 'extract_intents']),
);
const guided = {
  ...run,
  type: 'full_pipeline',
  executionMode: 'guided',
  plannedStages: skipPlan,
  sourceArtifactId: undefined,
  steps: [
    { id: 'prepare', label: 'Prepare', status: 'waiting' },
    ...skipPlan.map((stage) => ({
      id: stage,
      label: stage,
      status: 'waiting',
    })),
  ],
};
let staged = { ...base, artifacts: [], runs: [guided] };
for (let tick = 0; tick < 100 && staged.runs[0].status !== 'paused'; tick++)
  staged = advanceDemoPipeline(staged, projects, 1000 + tick);
assert.equal(
  staged.runs[0].waitingFor,
  'handoff',
  'normal jobs wait at a completed output',
);
assert.equal(staged.runs[0].progress, 40);
assert.deepEqual(
  staged.artifacts.map((item) => item.kind),
  ['insights'],
  'only completed outputs are available',
);
staged = { ...staged, runs: [transitionRun(staged.runs[0], 'resume', 1200)] };
for (let tick = 0; tick < 100 && staged.runs[0].status !== 'paused'; tick++)
  staged = advanceDemoPipeline(staged, projects, 1300 + tick);
assert.deepEqual(
  staged.artifacts.map((item) => item.kind),
  ['insights', 'process_map'],
  'clustering bypass maps directly from intents',
);
assert.equal(staged.artifacts[1].sourceId, staged.artifacts[0].id);
assert.equal(staged.artifacts[1].sourceVersion, 1);
let express = {
  ...base,
  artifacts: [],
  runs: [{ ...guided, executionMode: 'express' }],
};
for (let tick = 0; tick < 100 && express.runs[0].status !== 'completed'; tick++)
  express = advanceDemoPipeline(express, projects, 1500 + tick);
assert.equal(
  express.runs[0].status,
  'completed',
  'express completes all selected stages without pauses',
);
assert.deepEqual(
  express.artifacts.map((item) => item.kind),
  ['insights', 'process_map', 'uml', 'agent_code'],
);
assert.ok(readPipelineState(express), 'skipped dependency-safe plans persist');
const original = {
  ...base.artifacts[0],
  version: 1,
  name: 'Original map',
  content: 'flowchart TD\nA-->B',
};
const version2 = reviseArtifact(
  original,
  { name: 'Updated map', content: 'flowchart TD\nA-->C' },
  'Editor',
  1800,
);
assert.equal(getArtifactVersion(version2, 1).name, 'Original map');
assert.equal(getArtifactVersion(version2, 1).content, original.content);
assert.equal(getArtifactVersion(version2, 999), undefined);
const version3 = reviseArtifact(
  version2,
  { notes: 'Branch from first revision' },
  'Editor',
  1900,
  1,
);
assert.equal(version3.version, 3);
assert.equal(version3.baseVersion, 1);
assert.equal(version3.content, original.content);
assert.deepEqual(
  version3.history.map((item) => item.version),
  [1, 2],
  'editing history creates a new head and retains all prior versions',
);
assert.equal(getArtifactVersion(version3, 2).content, version2.content);

console.log('Pipeline state, navigation, and cluster option checks passed.');
