import type { Artifact, PipelineRun, StageType } from '@/data/pipeline';

/** Wire DTOs for the proposed pipeline service contract. These are not confirmed backend endpoints. */
export type ApiJob = PipelineRun;
export type ApiOutput = Artifact;
export type JobCreateInput = {
  name?: string;
  type: StageType;
  inputKind?: PipelineRun['inputKind'];
  plannedStages?: PipelineRun['plannedStages'];
  sourceArtifactId?: string;
  sourceConnectionId?: string;
  runtime?: string;
  advanced?: Record<string, string | boolean>;
  file?: File;
};
export type OutputUpdateInput = Partial<Pick<Artifact, 'name' | 'notes' | 'content'>>;
export type OutputReviewAction = 'approve' | 'request_changes';
export type ListResult<T> = { items: T[]; nextCursor?: string | null };

export type PipelineApi = {
  listJobs(orgId: string, workspaceId: string, options?: { cursor?: string; limit?: number; signal?: AbortSignal }): Promise<ListResult<ApiJob>>;
  createJob(orgId: string, workspaceId: string, input: JobCreateInput, options?: { signal?: AbortSignal }): Promise<ApiJob>;
  getJob(orgId: string, workspaceId: string, jobId: string, options?: { signal?: AbortSignal }): Promise<ApiJob>;
  cancelJob(orgId: string, workspaceId: string, jobId: string, options?: { signal?: AbortSignal }): Promise<ApiJob>;
  retryJob(orgId: string, workspaceId: string, jobId: string, options?: { signal?: AbortSignal }): Promise<ApiJob>;
  pollJob(orgId: string, workspaceId: string, jobId: string, options?: PollJobOptions): Promise<ApiJob>;
  listOutputs(orgId: string, workspaceId: string, options?: { cursor?: string; limit?: number; signal?: AbortSignal }): Promise<ListResult<ApiOutput>>;
  getOutput(orgId: string, workspaceId: string, outputId: string, options?: { signal?: AbortSignal }): Promise<ApiOutput>;
  updateOutput(orgId: string, workspaceId: string, outputId: string, patch: OutputUpdateInput, options?: { signal?: AbortSignal }): Promise<ApiOutput>;
  reviewOutput(orgId: string, workspaceId: string, outputId: string, action: OutputReviewAction, options?: { signal?: AbortSignal }): Promise<ApiOutput>;
};

export type PollJobOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
  intervalMs?: number;
  maxIntervalMs?: number;
  backoffFactor?: number;
  onProgress?: (job: ApiJob) => void;
};

export type PipelineApiConfig = { baseUrl: string; timeoutMs?: number; fetcher?: typeof fetch };

/** Safe-to-render error for UI surfaces. Response bodies are never forwarded verbatim. */
export class PipelineApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;

  constructor(message: string, status: number, code?: string, requestId?: string) {
    super(message);
    this.name = 'PipelineApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export function getPipelineApiBaseUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_PIPELINE_API_BASE_URL?.trim();
  return value ? value.replace(/\/+$/, '') : null;
}

export function createPipelineApi(config: PipelineApiConfig): PipelineApi {
  const baseUrl = config.baseUrl.trim().replace(/\/+$/, '');
  if (!baseUrl) throw new Error('Pipeline API base URL is required.');
  const timeoutMs = config.timeoutMs ?? 20_000;
  const fetcher = config.fetcher ?? fetch;

  const request = async <T>(path: string, init: RequestInit = {}, externalSignal?: AbortSignal): Promise<T> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), timeoutMs);
    const relayAbort = () => controller.abort(externalSignal?.reason);
    externalSignal?.addEventListener('abort', relayAbort, { once: true });
    if (externalSignal?.aborted) relayAbort();
    try {
      const headers = new Headers(init.headers);
      if (!headers.has('Accept')) headers.set('Accept', 'application/json');
      const response = await fetcher(`${baseUrl}${path}`, {
        ...init,
        credentials: init.credentials ?? 'include',
        signal: controller.signal,
        headers,
      });
      if (!response.ok) {
        let payload: unknown;
        try { payload = await response.json(); } catch { payload = undefined; }
        const error = readError(payload);
        throw new PipelineApiError(error.message || `The service could not complete the request (HTTP ${response.status}).`, response.status, error.code, error.requestId);
      }
      if (response.status === 204) return undefined as T;
      let payload: unknown;
      try { payload = await response.json(); } catch {
        throw new PipelineApiError('The service returned an unreadable response. Try again or contact your administrator.', response.status);
      }
      if (isRecord(payload) && 'data' in payload) return payload.data as T;
      return payload as T;
    } catch (error) {
      if (error instanceof PipelineApiError) throw error;
      if (controller.signal.aborted) {
        if (externalSignal?.aborted) throw new PipelineApiError('Request cancelled.', 0, 'REQUEST_ABORTED');
        throw new PipelineApiError('The service did not respond in time. Check your connection and try again.', 0, 'REQUEST_TIMEOUT');
      }
      throw new PipelineApiError('Could not reach the service. Check your connection and try again.', 0, 'NETWORK_ERROR');
    } finally {
      clearTimeout(timeout);
      externalSignal?.removeEventListener('abort', relayAbort);
    }
  };

  const scope = (orgId: string, workspaceId: string) => `/v1/organizations/${segment(orgId)}/workspaces/${segment(workspaceId)}`;
  const query = (options?: { cursor?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (options?.cursor) params.set('cursor', options.cursor);
    if (options?.limit) params.set('limit', String(options.limit));
    const value = params.toString();
    return value ? `?${value}` : '';
  };
  const signal = (options?: { signal?: AbortSignal }) => options?.signal;

  const api: PipelineApi = {
    listJobs: async (orgId, workspaceId, options) => parseList(await request(`${scope(orgId, workspaceId)}/jobs${query(options)}`, { method: 'GET' }, signal(options)), (item) => parseJob(item, workspaceId)),
    createJob: (orgId, workspaceId, input, options) => {
      const path = `${scope(orgId, workspaceId)}/jobs`;
      if (input.file) {
        const body = new FormData();
        body.set('file', input.file, input.file.name);
        body.set('metadata', new Blob([JSON.stringify({ name: input.name, type: input.type, inputKind: input.inputKind, plannedStages: input.plannedStages, sourceArtifactId: input.sourceArtifactId, sourceConnectionId: input.sourceConnectionId, runtime: input.runtime, advanced: input.advanced })], { type: 'application/json' }));
        return request<unknown>(path, { method: 'POST', body }, signal(options)).then((item) => parseJob(item, workspaceId));
      }
      const { file, ...body } = input;
      void file;
      return request<unknown>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, signal(options)).then((item) => parseJob(item, workspaceId));
    },
    getJob: (orgId, workspaceId, jobId, options) => request<unknown>(`${scope(orgId, workspaceId)}/jobs/${segment(jobId)}`, { method: 'GET' }, signal(options)).then((item) => parseJob(item, workspaceId, jobId)),
    cancelJob: (orgId, workspaceId, jobId, options) => request<unknown>(`${scope(orgId, workspaceId)}/jobs/${segment(jobId)}/cancel`, { method: 'POST' }, signal(options)).then((item) => parseJob(item, workspaceId, jobId)),
    retryJob: (orgId, workspaceId, jobId, options) => request<unknown>(`${scope(orgId, workspaceId)}/jobs/${segment(jobId)}/retry`, { method: 'POST' }, signal(options)).then((item) => parseJob(item, workspaceId)),
    pollJob: (orgId, workspaceId, jobId, options) => pollJob(api.getJob, orgId, workspaceId, jobId, options),
    listOutputs: async (orgId, workspaceId, options) => parseList(await request(`${scope(orgId, workspaceId)}/outputs${query(options)}`, { method: 'GET' }, signal(options)), (item) => parseOutput(item, workspaceId)),
    getOutput: (orgId, workspaceId, outputId, options) => request<unknown>(`${scope(orgId, workspaceId)}/outputs/${segment(outputId)}`, { method: 'GET' }, signal(options)).then((item) => parseOutput(item, workspaceId, outputId)),
    updateOutput: (orgId, workspaceId, outputId, patch, options) => request<unknown>(`${scope(orgId, workspaceId)}/outputs/${segment(outputId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }, signal(options)).then((item) => parseOutput(item, workspaceId, outputId)),
    reviewOutput: (orgId, workspaceId, outputId, action, options) => request<unknown>(`${scope(orgId, workspaceId)}/outputs/${segment(outputId)}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) }, signal(options)).then((item) => parseOutput(item, workspaceId, outputId)),
  };
  return api;
}

const TERMINAL_JOB_STATUSES = new Set(['completed', 'failed', 'cancelled']);
export async function pollJob(
  getJob: PipelineApi['getJob'],
  orgId: string,
  workspaceId: string,
  jobId: string,
  options: PollJobOptions = {},
): Promise<ApiJob> {
  const timeoutMs = options.timeoutMs ?? 5 * 60_000;
  const maxIntervalMs = options.maxIntervalMs ?? 8_000;
  const backoffFactor = options.backoffFactor ?? 1.5;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || !Number.isFinite(maxIntervalMs) || maxIntervalMs <= 0 || !Number.isFinite(options.intervalMs ?? 1_000) || (options.intervalMs ?? 1_000) <= 0 || !Number.isFinite(backoffFactor) || backoffFactor < 1) {
    throw new Error('Polling timeout and intervals must be positive, and the backoff factor must be at least 1.');
  }
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort(new DOMException('Job polling timed out', 'TimeoutError'));
  }, timeoutMs);
  const relayAbort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener('abort', relayAbort, { once: true });
  if (options.signal?.aborted) relayAbort();
  let interval = Math.min(options.intervalMs ?? 1_000, maxIntervalMs);
  try {
    while (true) {
      if (controller.signal.aborted) throw pollAbortError(timedOut);
      let job: ApiJob;
      try {
        job = await getJob(orgId, workspaceId, jobId, { signal: controller.signal });
      } catch (error) {
        if (controller.signal.aborted) throw pollAbortError(timedOut);
        throw error;
      }
      options.onProgress?.(job);
      if (TERMINAL_JOB_STATUSES.has(job.status)) return job;
      await abortableDelay(interval, controller.signal).catch(() => { throw pollAbortError(timedOut); });
      interval = Math.min(maxIntervalMs, Math.ceil(interval * backoffFactor));
    }
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', relayAbort);
  }
}

function pollAbortError(timedOut: boolean): PipelineApiError {
  return timedOut
    ? new PipelineApiError('Job is still running. You can check its status again later.', 0, 'JOB_POLL_TIMEOUT')
    : new PipelineApiError('Job status check cancelled.', 0, 'REQUEST_ABORTED');
}

function abortableDelay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(signal.reason); return; }
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
    const abort = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); reject(signal.reason); };
    signal.addEventListener('abort', abort, { once: true });
  });
}

function segment(value: string): string { return encodeURIComponent(value); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
function parseList<T>(value: unknown, parseItem: (item: unknown) => T): ListResult<T> {
  if (Array.isArray(value)) return { items: value.map(parseItem) };
  if (isRecord(value) && Array.isArray(value.items)) return { items: value.items.map(parseItem), nextCursor: typeof value.nextCursor === 'string' ? value.nextCursor : null };
  throw new PipelineApiError('The service returned an invalid list response.', 200, 'INVALID_RESPONSE');
}
const JOB_TYPES = new Set(['extract_intents', 'cluster_intents', 'design_flow', 'generate_uml', 'generate_agent', 'full_pipeline']);
const JOB_STATUSES = new Set(['queued', 'running', 'paused', 'completed', 'failed', 'cancelled']);
const STEP_STATUSES = new Set(['waiting', 'running', 'completed', 'failed']);
const OUTPUT_KINDS = new Set(['insights', 'clusters', 'process_map', 'uml', 'agent_code']);
const OUTPUT_STATUSES = new Set(['draft', 'review', 'approved']);
function invalidDto(resource: string): never {
  throw new PipelineApiError(`The service returned an invalid ${resource} response. Refresh and contact support if this continues.`, 502, 'INVALID_RESPONSE');
}
function parseJob(value: unknown, workspaceId: string, expectedId?: string): ApiJob {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.workspaceId !== 'string' || value.workspaceId !== workspaceId || (expectedId && value.id !== expectedId) || typeof value.name !== 'string' || typeof value.type !== 'string' || !JOB_TYPES.has(value.type) || typeof value.status !== 'string' || !JOB_STATUSES.has(value.status) || typeof value.progress !== 'number' || !Number.isFinite(value.progress) || value.progress < 0 || value.progress > 100 || !Array.isArray(value.steps) || !Number.isFinite(value.createdAt) || !Number.isFinite(value.updatedAt)) invalidDto('job');
  const validSteps = value.steps.every((step) => isRecord(step) && typeof step.id === 'string' && typeof step.label === 'string' && typeof step.status === 'string' && STEP_STATUSES.has(step.status));
  if (!validSteps) invalidDto('job');
  return value as unknown as ApiJob;
}
function parseOutput(value: unknown, workspaceId: string, expectedId?: string): ApiOutput {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.workspaceId !== 'string' || value.workspaceId !== workspaceId || (expectedId && value.id !== expectedId) || typeof value.kind !== 'string' || !OUTPUT_KINDS.has(value.kind) || typeof value.status !== 'string' || !OUTPUT_STATUSES.has(value.status) || typeof value.name !== 'string' || typeof value.notes !== 'string' || typeof value.version !== 'number' || !Number.isInteger(value.version) || value.version < 1 || typeof value.createdBy !== 'string' || typeof value.updatedAt !== 'string' || !Number.isFinite(Date.parse(value.updatedAt))) invalidDto('output');
  if (value.content !== undefined && typeof value.content !== 'string') invalidDto('output');
  if (value.sample !== undefined && typeof value.sample !== 'boolean') invalidDto('output');
  return { ...value, sample: value.sample === true } as unknown as ApiOutput;
}
function readError(payload: unknown): { message?: string; code?: string; requestId?: string } {
  if (!isRecord(payload)) return {};
  const nested = isRecord(payload.error) ? payload.error : payload;
  const message = typeof nested.message === 'string' ? nested.message.slice(0, 240) : undefined;
  const code = typeof nested.code === 'string' ? nested.code.slice(0, 80) : undefined;
  const requestId = typeof nested.requestId === 'string' ? nested.requestId.slice(0, 100) : undefined;
  return { message, code, requestId };
}
