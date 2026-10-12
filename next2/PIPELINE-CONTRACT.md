# Shared UX contract for this implementation

Root owns PipelineContext.tsx, AppContext.tsx, app/providers.tsx, data/pipeline.ts, AppShell, globals.css, Dashboard, Jobs and NewRunModal. Other workers must not edit those files.

The root is adding `usePipeline` from `@/context/PipelineContext` with:
- `artifacts: Artifact[]` scoped to current workspace
- `runs: PipelineRun[]` scoped to current workspace
- `events: PipelineEvent[]` scoped to current organization
- `connections: Connection[]` scoped to current organization
- `startRun({name?, type, sourceArtifactId?, fileName?, sourceConnectionId?, runtime?, advanced?}): PipelineRun`
- `importArtifact({name, kind, fileName}): Artifact` (demo sample fixture, not parsing arbitrary uploaded contents)
- `updateArtifact(id, {name?, status?, notes?, content?}): void` records revision + audit event
- `approveArtifact(id): void`
- `pauseRun(id), resumeRun(id), cancelRun(id), retryRun(id)`
- `connectProvider(provider,name): void` creates a **demo** connection only; no credentials / real network
- `disconnectProvider(id): void`
- `selectArtifact(id): void`, `selectedArtifactId: string | null`
- `handoffArtifact(artifactId, nextType): void` selects source and opens global NewRun dialog, type supported values below
- `recordEvent(action,detail): void`

Types exported from `@/data/pipeline`:
`StageType = 'extract_intents'|'cluster_intents'|'design_flow'|'generate_uml'|'generate_agent'|'full_pipeline'` (AppContext ModularTaskType root adds generate_uml).
`ArtifactKind = 'insights'|'clusters'|'process_map'|'uml'|'agent_code'`.
`Artifact {id,workspaceId,kind,name,status:'draft'|'review'|'approved',version:number,createdBy:string,updatedAt:string,sourceId?:string,runId?:string,notes:string,content?:string, sample:boolean}`.
`PipelineRun {id,workspaceId,name,type, status:'queued'|'running'|'paused'|'completed'|'failed'|'cancelled', progress:number, steps: {id,label,status:'waiting'|'running'|'completed'|'failed'}[], createdAt:number, updatedAt:number, sourceArtifactId?:string,fileName?:string,sourceConnectionId?:string,runtime?:string,error?:string,advanced?:Record<string,string|boolean>}`.
`Connection {id,orgId,provider,name,status:'connected'|'attention', lastSync:string}`.
`PipelineEvent {id,orgId,workspaceId,actor,action,detail,time:number}`.

Root will export reusable demo fixtures in data/pipeline:
`DEMO_INSIGHTS` array of `{id,intent,resolution,escalation,hold,painPoint,volume,confidence,quote}`.
`DEMO_CLUSTERS` tree array of `{id,name,level:'L1'|'L2'|'L3',volume,children?:ClusterNode[]}`.
`DEMO_PROCESS_CONTENT` and `DEMO_UML_CONTENT` strings (Mermaid) and `agentCode(runtime:string): string`.
`TASK_LABELS` Record<StageType,string>, `ARTIFACT_LABELS` Record<ArtifactKind,string>.

Use shared artifacts as the backbone, select relevant artifact via local select or selectedArtifactId. Do not show results without a real scoped artifact. Seed only original Customer Operations with labeled examples; successful demo runs create **sample** artifacts in their actual workspace. Every result preview shows Sample badge / small demo note. Imported files produce metadata/sample demo artifact; never pretend to analyze real file contents.

Each umbrella includes concise description, task-specific CTA, prior-team handoff / reusable input, shared output list, useful result preview, advanced accordion. Analyst preview must show all signals + collapsible L1/L2/L3 taxonomy. Designer must review/edit process map source + UML source (one selected artifact, local source edit saved through updateArtifact creates version). Developer can reuse any shared process_map/uml artifact, choose runtime in global job form and preview/copy/download code from selected artifact.

Confirmed: reviews are optional. All teams may reuse shared drafts, review versions or approved versions. Agent generation has no mandatory review gate. Users may upload their own input and skip upstream stages. Existing backend APIs must be connected after their URL, authentication and schema are supplied; no backend contract is currently present in this repository. The service adapter is a proposal only.

Visual system: Root is replacing orange accents with deep violet primary, cool off-white canvas, ink navy sidebar, white panels; system sans font; muted small eyebrow text, generous but efficient spacing. Use `bg-surface`, `text-foreground`, `text-muted`, `border-border`, `text-accent-strong`, `bg-accent-soft` and existing UI components. Avoid orange-specific styles, fake success toasts or runtime backend claims. Generic `max-w-[1280px] mx-auto w-full p-5 sm:p-8` main wrappers. Helpful concise advanced sections via native details or shadcn Accordion.

All supporting UX remains frontend prototype; no real auth/RBAC/data integrations yet. Login prominently labeled demo access, working form/demo continue path to dashboard, no fake password reset/SSO messages. RBAC page person roles + collapsible simple permission explanation, not a large always-visible matrix. Connections support S3, Salesforce, HubSpot, Genesys Cloud, NICE CXone; demo connection selection+display name only; no credential collection. Audit uses `events`, supports search; sample history only original org. Record meaningful new member/org actions via recordEvent in supporting views where needed.
