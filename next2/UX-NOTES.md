# Conversation-to-automation workbench

## Confirmed product decisions

Transform.cx is a shared SaaS workspace with three independent umbrellas. **Reviews are optional**. Users can reuse a coworker's draft or upload their own input without running upstream stages.

| Umbrella | Team | Tools | Reusable output |
| --- | --- | --- | --- |
| Analysis | Business analysts | Conversation analysis; intent clustering | Intents, resolutions, escalation reasons, hold reasons, pain points; L1/L2/L3 taxonomy |
| Design | CX designers | Process maps; UML information flows | Editable maps and user/orchestrator/tools/sub-agent sequences |
| Develop | Developers | Agent generation | Google ADK, CX Agent Studio, Amazon Bedrock or LangGraph scaffold |

The full pipeline is the primary dashboard journey and the default for new jobs. Individual tools remain available as secondary entry points. Individual tools use the same concise job dialog: requested tool, input and optional name; runtime only when relevant. Tool switching and advanced settings are collapsed. Inputs can be compatible project outputs, files, or organization connections for conversation analysis. The selected output's owner, version and draft/review status are visible.

## Teamwork and long-running jobs

Project outputs track creator, version, source, sample status and job. Edits update the preview, save a new revision and record activity. Job input versions are pinned at creation. Process maps and UML provide structured label editing; source editing stays in Advanced. Review status is optional and never blocks the next team.

Jobs show queue/running/paused/completed/failed/cancelled states, progress and per-step status. Pause, resume, cancel confirmation and retry work in the demo. Full-pipeline outputs appear as individual stages complete. Jobs and outputs remain scoped when switching organizations/projects and persist across navigation and reloads.

Supporting pages cover demo login, specialized member roles, S3/Salesforce/HubSpot/Genesys/NICE CXone connections, organization activity, settings and projects. Connectors in the current preview are explicitly local demo records.

## Visual and accessibility changes

The original EXL wordmark anchors the sidebar and login. EXL orange (#FB4E0B), darker orange actions for readable white labels, charcoal navigation, neutral panels and restrained orange highlights follow the company brand. Mobile navigation closes after selecting an action. Essential fields stay visible; deeper details are collapsed. Dialogs trap focus and close on Escape. Diagram labels are keyboard-accessible. The narrow diagram renderer supports the documented sample Mermaid subset and shows the original source when unsupported syntax is encountered.

## Integration boundary

The user requested connection to existing APIs. This repository contains no backend service, API schema, URL or authentication configuration. These details have been requested. **The live backend is not connected.**

`src/lib/pipeline-api.ts` is a tested opt-in adapter for a proposed scoped contract, with actual multipart File upload, typed/validated responses, aborts, timeout, status polling and bounded backoff. `BACKEND-CONTRACT.md` distinguishes proposed routes from confirmed APIs. Do not enable requests before mapping the actual service, organizational identities and authentication.

The preview uses an explicitly labeled local simulation. File contents are not uploaded or analyzed, code examples are scaffolds, credentials are not collected, and email invitations are not sent. Server authentication and RBAC are not implemented by the browser demo. Uploaded-file job outputs use the billing-support example, not inferred data from the uploaded file.

## Validation

Changed-file ESLint, TypeScript and production build passed. Focused adapter checks use injected fake fetch responses and verify multipart/scoping/credentials, response validation, errors, aborts, timeout and terminal polling. Diagram checks cover all eight process nodes, repeated declarations and UML alias edits preserving participant references. Browser checks cover independent clustering, input defaults, live demo progress, pause persistence/resume/completion, reusable output navigation, structured map editing and optional review.

Browser review created a `Support clustering refresh` sample job and changed the example map's identity-verification wording. These are local preview fixtures; no external service was contacted.


## Team feedback — 12 October 2026

- Organization setup has a separate, limited sidebar (Create organization, Find organization, Help). Work-email suggestions use exact active-member domain matches in local demo data. Suggestions do not grant membership; access requests are local pending records. Personal email domains do not trigger company suggestions.
- The primary organization container is named **Project** throughout the active application. The existing `workspaceId` and local-storage identifiers are retained for compatibility; a Project currently uses that existing container rather than adding another nesting level.
- Conversation jobs offer Excel/conversations, Nuance documents, and IVR data. Only file metadata is recorded in demo mode. Nuance/IVR parsing requires the actual service. Express is an admin/owner option that runs selected steps without handoff pauses; local demo execution remains separate from the service contract.
- Run through shows only the selected stage and its upcoming stages. Dependency-safe downstream stages run in one job, with outputs available at each completed step. Guided jobs pause for an optional handoff; Express jobs continue automatically. Clustering can be omitted when process maps use insights directly. Intent discovery and clustering remain separate steps.
- Job-output pickers expose individual outputs and versions, with job IDs, author and source lineage. One job may own multiple output records. Cluster trees expose their L1/L2/L3 members. Map creation can target all clusters or a specific branch; this selection is stored with job settings. Maps and agent builds remain individually selectable.
- Validation is optional: approved records display **Validated**, other records display **Not validated**. Saving a changed output revision returns it to draft and clears prior validation. Validation is never required to continue. Demo validation records reviewer identity, time and output version alongside the existing approved status; production must persist these server-side.
- Analysis, Design and Develop include empty and processing/error states, with available input/start/retry actions. Deployment has an honest empty state because no deployment service is connected; generated code is not presented as deployed.
- The diagram canvas supports zoom, reset, scrolling/dragging to pan, node-label editing, adding/removing steps, editing connections and version saves. It remains a limited Mermaid renderer; arbitrary diagram syntax uses a source fallback. Freeform node placement, arbitrary diagram syntax and live coediting remain future editor capabilities.

Backend additions proposed for review: organization directory discovery with verified domains and opt-in visibility, access requests, Project DTO mapping, upload input kind, ordered stage plans, output collections, version-bound SME validation, and deployment records linked to build outputs. These are contract proposals, not live integration.

Validation fixtures created during this review: local organization `UX feedback review` with an empty General Project; local job `JOB-B8F8B340` (`UX upcoming stages check`) from clustering through process map only. Its map revision was edited to verify that previous validation clears. No external organization requests, file processing or deployments were made.

Full-pipeline prominence: a primary dashboard card explains all five stages with a Start full pipeline CTA. Sidebar Start pipeline and generic New job actions default to the full journey through agent code. Tool-specific actions still open their corresponding stage.


## Analytics and taxonomy curation

Organization dashboard (`/organization-dashboard`) counts actual saved jobs and outputs across every project in the selected organization. Project/status/search filters, sorting and JSON export operate on this scoped collection. Job dashboard (`/job-analytics?jobId=...`) resolves the requested job without substituting an unrelated job and follows only same-project upstream artifact lineage when needed.

Job analytics includes distinct intents/conversations, L1/L2/L3 counts, coverage bars, a complexity/automation opportunity plot, sortable/filterable cluster records, hierarchy drill-down, pivot dimensions/measures, transcript search and column controls, paging, per-record full text, and filtered/selected CSV/JSON/TXT downloads. CSV cells protect spreadsheet formula interpretation. Sample analytics contains 48 explicit synthetic conversations, not the old illustrative 8,140-volume summary. Coverage denominator is all unique conversations in the job; overlapping assignments can make level sums exceed 100%, so parent and child levels are not added together.

Complexity and automation opportunity are labeled estimates until supplied by the backend. ROI scenarios cover all three cluster levels. Effective automatic rate is potential × (1 − complexity/200); monthly savings are cluster share of total monthly volume × handling minutes × cost/minute × effective automatic rate. Net savings subtract running cost; ROI/payback use implementation cost. Financial inputs default to zero rather than invented costs and are editable. A formula disclosure explains each assumption.

The existing Analysis page directly exposes Clusters and Transcripts. L1/L2 can be renamed or merged at the same level, L2 can move to an L1, and L3 intent nodes can move to an L2. Drag/drop has an accessible Move dialog alternative. Actions create a reviewable local draft; Save changes writes a new artifact revision, updates transcript mappings and recalculates coverage. New revisions clear previous SME validation. L3 details can expand to show additional intents, outcomes, escalation/hold reasons and pain points. Jobs now use compact status rows and a clear View results action; input/settings remain under disclosure.

Backend analytics is not connected. Proposed integration must return complete job-scoped transcript assignments and distinct conversation identifiers, metric provenance, coverage denominator, cluster ancestry, score definitions and paging/export endpoints. Taxonomy mutations require optimistic version checks and atomic server-side updates of the taxonomy plus affected assignments. Local demo mutations do not edit external customer data.

## Design and job setup refinements · 13 October 2026

Design exposes process-map generation in the New design start card, separately from the saved design library and current diagram. Process maps use the official Mermaid renderer and an in-app source editor with live preview, syntax errors, fit/zoom/pan, SVG and Mermaid-source downloads, and validated revision saves. The editor pins the opened artifact and revision so a changed selection or concurrent revision cannot receive stale edits. Mermaid loads only when a diagram is viewed, uses strict rendering, and does not send diagram content to an external editor. Legacy sample maps with the reserved `end` node ID are normalized for viewing/editing; new samples use `finish`. UML keeps its existing structured editor.

New job setup starts with input selection. Once a file, shared output, or connection is selected, the form visibly lists included stages and optional following stages, with Run through and the target runtime when relevant. Design starts at Process map or UML; Develop starts at Agent code. Earlier stages are excluded. Job type uses descriptive shadcn radio cards, while optional job name and advanced settings remain under disclosures. Creating a job opens that job’s own progress details, including when another job dialog was previously opened on the Jobs page.

The job dashboard shows the selected job name, ID, project and input in its header. Job switching includes name/ID labels and resets the view. Analytics now carries structured source artifact/job identity; inherited conversation metrics identify the upstream job and link to it. Invalid requested job IDs retain the not-found state instead of substituting another job. Filtered record counts remain distinct from whole-job summary totals.

Verification: changed-file ESLint, TypeScript and the existing API/diagram/analytics/cluster checks passed. Browser checks covered direct process-map generation, a synthetic JSON upload, upcoming-stage selection through Agent, valid/invalid Mermaid source, and a revision save. The local sample `art-map` was saved as v3 with its existing workflow preserved and the legacy node ID repaired. Upload selection was verified without creating a customer-data job; the demo still does not process uploaded file contents. Screenshots: `mermaid-editor-preview.jpg` and `design-upload-pipeline.jpg`.

Production compilation also passed with `npm run build -- --webpack` (all 18 static pages). The default Turbopack build hit the local environment’s subprocess port-binding restriction; the supported Webpack fallback completed TypeScript and prerendering. Production preview was restarted on 127.0.0.1:3000 and its Design endpoint returned HTTP 200.


## Workflow clarity, empty states, and immutable design versions · 13 October 2026

New email workspaces start with no organizations or projects. `tx-session-v1` selects account-scoped app/pipeline storage; the separate sample demo retains the existing `tx-app-v1` and `tx-pipeline-v2` data. This is a local UX preview, not authentication or server-enforced RBAC. Organization creation leads to the first-project state; empty projects and job lists expose one clear starting action. Organization settings, members, and connectors remain accessible before a project exists. Work-email discovery only suggests known organizations with active matching member domains and never adds membership automatically.

Job types use reusable shadcn RadioGroup cards with a clear purpose for each tool. Sensitive-data masking is a default-on checkbox. Owner/admin Express mode and optional clustering bypass live under Advanced options. The source-aware planner validates stage order and dependencies: intent analysis supplies clustering or a direct map; UML requires a map; existing agent generation accepts a map or UML. Advanced stage selection includes the prerequisites. Guided jobs pause at output boundaries with `waitingFor: handoff`; continuing keeps the same job ID. Express can be selected initially or for the remaining steps at a handoff. Validation remains optional.

Job dashboards show a prominent scoped job selector, available outputs, stage progress, and a highlighted next action. Intent results remain usable before clustering finishes. Cluster metrics, taxonomy assignments, and cluster pivot dimensions are hidden until linked cluster output exists. Overview graphics show intent distribution, cluster coverage, and a volume heatmap across complexity/automation bands using the job's available data. Cluster filter/column options use a shadcn Popover with draft settings, Reset/Cancel/Apply.

Design separates New design, Continue from insights/clusters, and a searchable saved design library. The open diagram identifies its source output, source version, job, and cluster target (or direct-intent scope). Saved map/UML revisions are immutable and retained in full. A historical edit creates a new head revision with a baseVersion link, while a concurrent head change blocks stale saving. Continuing with any saved revision pins sourceArtifactId/sourceVersion to the exact snapshot; job analytics follows the same pinned lineage. Missing historical revisions never silently substitute the latest output. API creation metadata and output-write DTOs carry revision/execution settings for backend implementation.

Both Mermaid source editing and visual editing are available. Visual controls safely round-trip simple node/decision declarations and plain arrows, and the existing visual canvas supports its original node/connection editing. Unsupported Mermaid constructs keep source editing and rendering available and disable destructive visual transforms. All rendered diagrams use strict Mermaid configuration and SVG sanitization.

Research informed the start/library split and explicit version history: [Miro dashboard guidance](https://help.miro.com/hc/en-us/articles/360017571294-What-is-on-your-dashboard), [Miro board versions](https://help.miro.com/hc/en-us/articles/360021668819-Board-history-versions), [Mermaid flowchart syntax](https://mermaid.js.org/syntax/flowchart.html). Empty states follow [NN/g guidance](https://www.nngroup.com/articles/empty-state-interface-design/) by explaining state and offering a direct next task. These are adapted design decisions, not claims that Transform.cx has Miro's collaboration feature set.

Backend follow-up: persist plans, guided handoffs, Express permissions, pinned input versions, revision snapshots and optimistic writes atomically; return actual stage status and partial outputs. The local worker does not analyze uploaded data or perform external connector sync. No production endpoint has been inferred or enabled.

Validation for this update: ESLint, strict TypeScript, Prettier, all seven domain/API regression scripts, and a Webpack production build pass. Browser verification covered first account setup, first organization/project, masking and Express controls, an intent-only partial dashboard, same-job guided continuation to clustering, transcript columns before clustering, filter/column popover, visual map editing (v1 → v2), and a historical v1 UML handoff while v2 remained the head. Local fixtures: `UX review organization` / `First project`, the named demo source `UX review sample archive`, and jobs `JOB-98620DB2` / `JOB-0F272701`. No external service was contacted. Evidence is in `ux-review/`.
