# Proposed pipeline API contract

**Status: proposal only.** This describes the interface expected by `src/lib/pipeline-api.ts`; it is not evidence that these routes exist. No backend API specification or service URL is currently configured. The browser demo remains the active product mode. Do not enable live requests until the backend team confirms the routes, DTOs, authentication, upload limits, and error contract.

## Configuration and scope

Set `NEXT_PUBLIC_PIPELINE_API_BASE_URL` to the service origin (for example, a same-origin `/api` prefix) only after an implementation is available. The adapter is opt-in: importing it does not make requests. The variable contains a public URL only; never put API keys, tokens, or other secrets in a `NEXT_PUBLIC_` variable.

Every job and output operation is scoped by both organization and workspace in the URL. The service must authenticate the caller from its session cookie, authorize membership in the organization and workspace, and verify that the resource belongs to both. A client-supplied scope is not authorization. The adapter sends cookies with `credentials: 'include'`; a cross-origin service must configure credentialed CORS for the exact app origin and use appropriate CSRF protection. The client stores no credentials.

## Proposed routes

All routes below are proposals and use JSON unless marked multipart. Successful responses use `{ "data": ... }`; list responses use `{ "data": { "items": [...], "nextCursor": null } }`. The adapter also accepts an unwrapped success body during migration.

| Method and path | Purpose | Success body |
| --- | --- | --- |
| `GET /v1/organizations/{orgId}/workspaces/{workspaceId}/jobs?cursor=&limit=` | List scoped jobs | `data` is a paginated list of `Job` |
| `POST /v1/organizations/{orgId}/workspaces/{workspaceId}/jobs` | Create a job | `data` is the created `Job` |
| `GET /v1/organizations/{orgId}/workspaces/{workspaceId}/jobs/{jobId}` | Read current job state for polling | `data` is a `Job` |
| `POST /v1/organizations/{orgId}/workspaces/{workspaceId}/jobs/{jobId}/cancel` | Cancel queued or active job | `data` is the updated `Job` |
| `POST /v1/organizations/{orgId}/workspaces/{workspaceId}/jobs/{jobId}/retry` | Retry an eligible job | `data` is the new/current `Job` |
| `GET /v1/organizations/{orgId}/workspaces/{workspaceId}/outputs?cursor=&limit=` | List scoped outputs | `data` is a paginated list of `Output` |
| `GET /v1/organizations/{orgId}/workspaces/{workspaceId}/outputs/{outputId}` | Read output content and metadata | `data` is an `Output` |
| `PATCH /v1/organizations/{orgId}/workspaces/{workspaceId}/outputs/{outputId}` | Update editable output fields | `data` is the updated `Output` |
| `POST /v1/organizations/{orgId}/workspaces/{workspaceId}/outputs/{outputId}/review` | Record review decision | JSON `{ "action": "approve" \| "request_changes" }`; `data` is updated `Output` |

Creating a job without a file sends JSON. With a file, send `multipart/form-data` with a binary `file` part and a JSON `metadata` part containing `name`, `type`, `sourceArtifactId`, `sourceConnectionId`, `runtime`, and `advanced`. The browser sets the multipart boundary; the caller must not set `Content-Type` manually. The client accepts an actual browser `File` and does not read its contents before upload. Agree on file size, media types, scanning, retention, and upload error behavior before enabling this path.

## DTO shape

The proposed DTOs use camelCase and align with `src/data/pipeline.ts`, so a backend can map its internal names at the API boundary.

`Job` fields: `id`, `workspaceId`, `name`, `type`, `status`, `progress`, `steps`, `createdAt`, `updatedAt`, optional `sourceArtifactId`, `fileName`, `sourceConnectionId`, `runtime`, `error`, and `advanced`. `type` is one of `extract_intents`, `cluster_intents`, `design_flow`, `generate_uml`, `generate_agent`, or `full_pipeline`. `status` is `queued`, `running`, `paused`, `completed`, `failed`, or `cancelled`. `steps` is an array of `{ id, label, status }`, where step status is `waiting`, `running`, `completed`, or `failed`. Timestamps are Unix milliseconds. `progress` is an integer from 0 through 100. If returned, `error` must be suitable for display and must not expose stack traces or secrets.

`Output` fields: `id`, `workspaceId`, `kind`, `name`, `status`, `version`, `createdBy`, `updatedAt`, optional `sourceId`, `runId`, `content`, plus `notes`. `kind` is `insights`, `clusters`, `process_map`, `uml`, or `agent_code`; `status` is `draft`, `review`, or `approved`; timestamps are ISO 8601 strings. `PATCH` accepts only `name`, `notes`, and `content`. The review route records an `approve` or `request_changes` action and changes review status; authorization and any workflow rules belong on the service.

## Errors, polling, and compatibility

The proposed error body is `{ "error": { "code": "...", "message": "A concise user-safe explanation", "requestId": "..." } }`. Keep messages free of credentials, stack traces, internal URLs, and sensitive customer data. The adapter limits message length and does not render response bodies as markup; when a response has no usable message it shows a generic status/network/timeout message. Clients should retain the request ID for support diagnostics.

Job state is read with `GET .../jobs/{jobId}`. The adapter exposes `pollJob(orgId, workspaceId, jobId, options)` with a five-minute default deadline, bounded exponential interval growth, an `onProgress` callback, and an `AbortSignal`. It resolves on `completed`, `failed`, or `cancelled`, and rejects with a useful timeout message while leaving the job available for later status checks. Both in-flight requests and waits between polls are abortable. Cancellation and retry are explicit actions. Use idempotency keys for job creation and retry if duplicate submissions are a concern, and return a stable job ID for polling. Pagination uses an opaque `nextCursor`; clients should not infer page ordering from IDs.

Before replacing the local demo provider, map confirmed server DTOs to `PipelineRun` and `Artifact`, define how connection setup and audit events are served, agree on review permissions, and add the service's real OpenAPI or equivalent contract. This adapter intentionally does not imply that the demo connection flow, audit store, or sample pipeline data is connected to a backend.


## Remaining supporting service contracts

These routes are proposals to discuss with the backend team, not implemented integrations:

| Scope | Required capability |
| --- | --- |
| Authentication | Session/sign-in/sign-out and current user; real login must replace demo access |
| Organizations | List/create/update organizations and membership identity mapping |
| Workspaces | List/create/update workspaces within an organization |
| Members | Invite, list, change roles and remove membership; enforce authorization on the server |
| Connections | Provider-specific setup/authentication, status, scopes, sync and disconnect |
| Audit | Cursor-based organizational activity with workspace filters |
| Jobs | Confirm whether pause/resume are supported; expose them conditionally if supported |
| Revisions | Pin sourceId + sourceVersion; return immutable history for edited designs |

The frontend artifact includes `sample` to label examples, optional `updatedBy` and optional revision `history`. Real outputs should set `sample: false`. Job inputs optionally record `sourceVersion`. Diagram/content structures must be agreed on; the current sample renderer supports a narrow Mermaid subset and must not silently substitute example diagrams for unsupported real content.


## Team-feedback additions (proposed, 12 October 2026)

The UI labels the existing workspace container **Project**, while retaining `workspaceId` on existing DTOs. Confirm whether the service uses Project identifiers before changing routes. Job creation adds optional `inputKind` (`conversations`, `nuance`, `ivr`) and ordered `plannedStages`. Stage plans must be consecutive from the input stage and stop at the requested final stage; the server must return actual stage progress and all output records. Multipart metadata carries both fields alongside the original file.

Organization discovery must use verified email domains and organization visibility settings, not automatic domain-based membership. Access requests require a server status, requester identity, review policy and scoped administrator visibility. SME validation is version-specific and optional; return reviewer identity, time and validated version. Deployment records should reference job/build/output version, environment, status, endpoint and errors. No organization lookup, Nuance/IVR parsing, validation service or deployment API is currently connected in the prototype.


## Analytics and taxonomy revision contract (proposed)

`Artifact.analytics` can contain `transcripts: TranscriptRecord[]`, optional `clusters: ClusterMetric[]`, and `metricSource: backend | transcript estimate`. The TypeScript fields and validation live in `src/lib/job-analytics.ts`. `coverage` is a ratio from 0 to 1 of ALL job-level distinct conversation IDs; complexity, automation potential and opportunity score are 0–100. Full text and per-conversation metadata are required for transcript drill-down. For production-sized data, add scoped server paging/filter/sort/pivot and complete-data export rather than treating one fetched page as the whole job. Backends should supply observed handling metrics and their score definitions; local ROI calculation remains a configurable scenario.

Proposed taxonomy operations: rename an L1/L2, merge L1→L1 or L2→L2 (including across L1 parents), move L2→L1 or L3→L2. Submit artifact ID, expected version and explicit stable source/target IDs. Respond with a new version, updated hierarchy and assignment metrics. Apply these atomically, retain history and clear validation of changed versions. The frontend currently stages these changes locally and saves them into browser storage. It does not call unconfirmed endpoints.
