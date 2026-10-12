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
- Conversation jobs offer Excel/conversations, Nuance documents, and IVR data. Only file metadata is recorded in demo mode. Nuance/IVR parsing requires the actual service. The meaning of “Express” awaits clarification; no unknown backend mode has been invented.
- Run through shows only the selected stage and its upcoming stages. Consecutive downstream stages execute in a single demo job, with outputs created at each selected stage, then stop at the chosen endpoint. Intent discovery and clustering remain separate steps.
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
