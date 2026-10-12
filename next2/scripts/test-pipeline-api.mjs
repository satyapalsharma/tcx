import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Module from 'node:module';
import path from 'node:path';
import ts from 'typescript';

const sourcePath = path.resolve('src/lib/pipeline-api.ts');
const source = await readFile(sourcePath, 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const loaded = new Module(sourcePath);
loaded.filename = sourcePath;
loaded.paths = Module._nodeModulePaths(path.dirname(sourcePath));
loaded._compile(output, sourcePath);
const { createPipelineApi, PipelineApiError } = loaded.exports;

const workspaceId = 'ws / one';
const baseJob = (patch = {}) => ({
  id: 'job-1', workspaceId, name: 'Analysis', type: 'extract_intents', status: 'running', progress: 35,
  steps: [{ id: 's1', label: 'Read source', status: 'running' }], createdAt: 100, updatedAt: 200, ...patch,
});
const baseOutput = (patch = {}) => ({
  id: 'out-1', workspaceId, kind: 'insights', name: 'Insights', status: 'review', version: 1,
  createdBy: 'A User', updatedAt: new Date().toISOString(), notes: '', ...patch,
});
const jsonResponse = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('sends an actual file as multipart with encoded organization/workspace scope and cookies', async () => {
  let captured;
  const api = createPipelineApi({ baseUrl: 'https://demo.invalid/api/', fetcher: async (url, init) => {
    captured = { url, init };
    return jsonResponse({ data: baseJob({ status: 'queued', progress: 0, steps: [] }) });
  } });
  const file = new File(['sample'], 'calls.csv', { type: 'text/csv' });
  const job = await api.createJob('org / team', workspaceId, { type: 'extract_intents', inputKind: 'nuance', plannedStages: ['extract_intents', 'cluster_intents'], file });
  assert.equal(job.id, 'job-1');
  assert.equal(captured.url, 'https://demo.invalid/api/v1/organizations/org%20%2F%20team/workspaces/ws%20%2F%20one/jobs');
  assert.equal(captured.init.credentials, 'include');
  assert.ok(captured.init.body instanceof FormData);
  assert.equal(captured.init.body.get('file').name, 'calls.csv');
  const metadata = JSON.parse(await captured.init.body.get('metadata').text());
  assert.equal(metadata.type, 'extract_intents');
  assert.equal(metadata.inputKind, 'nuance');
  assert.deepEqual(metadata.plannedStages, ['extract_intents', 'cluster_intents']);
  assert.equal(new Headers(captured.init.headers).has('Content-Type'), false, 'browser should set the multipart boundary');
});

test('uses bounded URL parameters and validates list resource scope', async () => {
  let capturedUrl;
  let wrongScope = false;
  const api = createPipelineApi({ baseUrl: 'https://demo.invalid', fetcher: async (url) => { capturedUrl = url; return jsonResponse({ data: { items: [baseJob(wrongScope ? { workspaceId: 'unexpected' } : {})], nextCursor: 'next' } }); } });
  const result = await api.listJobs('org-1', workspaceId, { cursor: 'c 1', limit: 10 });
  assert.match(capturedUrl, /cursor=c\+1&limit=10$/);
  assert.equal(result.nextCursor, 'next');
  wrongScope = true;
  await assert.rejects(() => api.listJobs('org-1', workspaceId, { limit: 10 }), (error) => error instanceof PipelineApiError && error.code === 'INVALID_RESPONSE');
});

test('turns a non-JSON HTTP failure into a safe status message', async () => {
  const api = createPipelineApi({ baseUrl: 'https://demo.invalid', fetcher: async () => ({ ok: false, status: 503, json: async () => { throw new Error('private upstream details'); } }) });
  await assert.rejects(() => api.getJob('org', workspaceId, 'job-1'), (error) => {
    assert.equal(error.status, 503);
    assert.match(error.message, /HTTP 503/);
    assert.doesNotMatch(error.message, /private upstream details/);
    return true;
  });
});

test('aborts a request when the caller signal fires', async () => {
  const caller = new AbortController();
  const api = createPipelineApi({ baseUrl: 'https://demo.invalid', fetcher: (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true })) });
  const pending = api.getJob('org', workspaceId, 'job-1', { signal: caller.signal });
  caller.abort();
  await assert.rejects(pending, (error) => error.code === 'REQUEST_ABORTED');
});

test('converts a stalled fetch into a useful request timeout', async () => {
  const api = createPipelineApi({ timeoutMs: 8, baseUrl: 'https://demo.invalid', fetcher: (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true })) });
  await assert.rejects(() => api.getJob('org', workspaceId, 'job-1'), (error) => error.code === 'REQUEST_TIMEOUT' && /did not respond in time/.test(error.message));
});

test('rejects malformed job and output DTOs', async () => {
  const api = createPipelineApi({ baseUrl: 'https://demo.invalid', fetcher: async (url) => url.endsWith('/jobs/job-1') ? jsonResponse({ data: { ...baseJob(), progress: 140 } }) : jsonResponse({ data: { ...baseOutput(), workspaceId: 'wrong-workspace' } }) });
  await assert.rejects(() => api.getJob('org', workspaceId, 'job-1'), (error) => error.code === 'INVALID_RESPONSE');
  await assert.rejects(() => api.getOutput('org', workspaceId, 'out-1'), (error) => error.code === 'INVALID_RESPONSE');
});

test('polls with progress callbacks and stops on a terminal status', async () => {
  let calls = 0;
  const api = createPipelineApi({ baseUrl: 'https://demo.invalid', fetcher: async () => {
    calls += 1;
    const job = calls === 1 ? baseJob({ progress: 20 }) : baseJob({ status: 'completed', progress: 100 });
    return jsonResponse({ data: job });
  } });
  const progress = [];
  const job = await api.pollJob('org', workspaceId, 'job-1', { intervalMs: 1, maxIntervalMs: 2, onProgress: (item) => progress.push(item.progress) });
  assert.equal(job.status, 'completed');
  assert.deepEqual(progress, [20, 100]);
  assert.equal(calls, 2);
});

test('polling deadline and caller abort stop both network waits and interval waits', async () => {
  const pendingApi = createPipelineApi({ baseUrl: 'https://demo.invalid', fetcher: async () => jsonResponse({ data: baseJob() }) });
  await assert.rejects(() => pendingApi.pollJob('org', workspaceId, 'job-1', { timeoutMs: 10, intervalMs: 40, maxIntervalMs: 40 }), (error) => error.code === 'JOB_POLL_TIMEOUT');

  const caller = new AbortController();
  const pending = pendingApi.pollJob('org', workspaceId, 'job-1', { signal: caller.signal, intervalMs: 5_000 });
  setTimeout(() => caller.abort(), 5);
  await assert.rejects(pending, (error) => error.code === 'REQUEST_ABORTED');
});

for (const [name, run] of tests) {
  await run();
  process.stdout.write(`✓ ${name}\n`);
}
process.stdout.write(`Passed ${tests.length} pipeline API checks.\n`);
