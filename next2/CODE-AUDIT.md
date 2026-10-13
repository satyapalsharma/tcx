# Transform.CX code audit — 13 October 2026

Scope: the active `next2` application served on port 3000. Earlier root HTML exports and the `next`/`react` implementations are retained references, not the active application. Luna workers reviewed analytics, stage modules, supporting pages, and persistence; the primary agent integrated and checked the changes.

## Changes made

- Replaced loosely cast browser state with validated organization/project/member and pipeline state readers. Invalid records are backed up when possible before fallback; failed backups preserve the original raw records. Storage failures leave the demo usable in memory.
- Added a shared cached browser store and `useSyncExternalStore` hook. SSR snapshots are deterministic, storage subscriptions clean up, cross-tab updates are handled, and no-op updates do not write or trigger renders. Mobile detection and launcher initialization no longer set state in effects.
- Moved organization types/fixtures and sample pipeline state out of providers. Removed the unused duplicate active job store; legacy saved job records remain preserved. `PipelineContext` now delegates parsing, worker ticks, revision history, and run transitions to pure functions in `lib/pipeline-state.ts`.
- Scoped member mutations, connections, artifacts, and job controls to the active organization/project. Changing scope closes context-bound job/invitation modals. Legacy output provenance is migrated before reference scope checks.
- Fixed partial-job retries: each retry creates a new queued job, links to the original, and preserves previous outputs. The Jobs screen opens the new attempt and exposes its original job link.
- Extracted new-job input, upcoming pipeline plan, and advanced settings into separate components. Full pipeline stays prominent, optional settings remain collapsed, and the form still supports stage-specific uploads and shared inputs.
- Standardized selects, form inputs, checkboxes, menus, dialogs, tabs, tables, and primary disclosures with the existing shadcn/Radix primitives. Shared `SelectField` handles empty filters without sentinel collisions. Custom tree/canvas/chart interactions and simple semantic disclosures remain purpose-built.
- Fixed output chooser dismissal, transcript selection/filter scoping, and job dashboard selection. Analytics are derived only for the selected job rather than every project job on every worker tick.
- Pinned diagram edit targets/revisions, added dirty-draft discard protection, and retained syntax validation before save. Mermaid runs in strict mode and its generated SVG is explicitly sanitized with DOMPurify before mounting/export.
- Improved supporting form validation and honest demo status messages. Added a single main landmark per application screen, retained accessible dialog titles/descriptions, and removed redundant custom menu behavior.
- Added Prettier configuration, formatting/check commands, strict typecheck command, and persistence/transition regression checks. Application code/scripts are formatted; generated shadcn primitive files retain their upstream formatting.

## Module boundaries

| Area | Main modules |
| --- | --- |
| Route and screen composition | `src/app`, `src/views` |
| UI primitives and shared controls | `src/components/ui`, `src/components/common` |
| Job creation and diagram workflow | `src/components/pipeline` |
| Analytics views | `src/components/analytics` |
| Scope and demo orchestration | `src/context` |
| Types and explicit demo fixtures | `src/data/organization.ts`, `pipeline.ts`, `demo-pipeline-state.ts` |
| Domain calculations/mutations | `lib/job-analytics.ts`, `cluster-operations.ts`, `diagram-source.ts`, `pipeline-state.ts` |
| Persistence and validation | `lib/browser-store.ts`, `app-state.ts`, `hooks/use-browser-state.ts` |
| Backend contract boundary | `lib/pipeline-api.ts`, `PIPELINE-CONTRACT.md`, `BACKEND-CONTRACT.md` |

Screen components still own local interaction state and compose feature modules. This is a useful separation, not a claim that every screen is small or that all domain-specific UI should become a shadcn component.

## Dependency audit

Updated Next.js and its ESLint config to 16.3.8, source-map-js to a patched version, and Mermaid's KaTeX dependency to 0.18.2 or newer within the compatible override range. The shadcn generation CLI is now a development dependency; the application uses the checked-in primitives.

`npm audit --omit=dev --json` reported **0 runtime advisories** after these changes. Full `npm audit` still reported **9 affected development-tool packages** through the `braces` nested-pattern stack-exhaustion advisory. A patched `braces@3.0.4` was not available from the configured registry during this audit. No forced major downgrade was applied. Track the upstream patch and rerun the full audit when it is available; build-tool advisories remain relevant to the toolchain even when absent from runtime dependencies.

## Verification

- Full ESLint, strict TypeScript, formatting, and whitespace checks.
- Seven regression scripts: API scoping/cookies/multipart uploads/cancellation/timeouts/polling; diagram parsing and legacy Mermaid compatibility; job analytics lineage/deduplication/metrics/ROI/CSV protection; cluster rename/merge/move invariants; app storage migration/scoping; pipeline parsing/queue/revisions/retries; browser storage/cache/failures/subscriptions.
- Browser checks: organization/project hydration, scoped job identity and upstream provenance, shadcn stage selectors, direct process-map generation, invalid Mermaid Save disabled, dirty-draft confirmation, and valid Mermaid math rendering after the dependency override.
- Production build result is recorded below after final verification.

## Remaining production work

The current provider explicitly operates in demo mode. Real authentication, server-enforced RBAC/tenant isolation, invitations, connector OAuth/credentials/sync, uploads/processing, durable background jobs, server audit logs, and deployments are not connected. The proposed API adapter has contract tests but has not been verified against a live backend. Client-side scope checks support the demo UX and do not replace server authorization.

Large production datasets will need server pagination/filtering/aggregation and virtualization where justified. Frontend sample complexity/automation/ROI values remain estimates pending backend metrics. This audit establishes a cleaner frontend foundation; it does not certify production security, accessibility conformance, or a live end-to-end backend pipeline.

Final result: `npm run format:check`, `npm run lint`, `npm run typecheck`, all seven `test:ux` scripts, and `git diff --check` passed. `npm run build -- --webpack` completed successfully on Next.js 16.3.8 (production compile, TypeScript, and static page generation). Webpack was used because this host previously rejected Turbopack's subprocess port binding; this is an environment limitation, not a successful default Turbopack build claim.

Production preview check: JOB-1044 loaded with its job name, project, and source provenance; the cluster table displayed the three L1 groups and their coverage/complexity/automation metrics. The page exposed one main landmark and no browser console errors in the captured production session. Screenshot: `code-audit-preview.png`.

## Second review — shadcn alignment and duplication

Reviewed the current official Radix docs and matched this app's configured `radix-nova` primitives, rather than mixing the Base UI API with Radix. The [Sidebar composition](https://ui.shadcn.com/docs/components/radix/sidebar) now lives in focused layout modules: shared provider, application sidebar, scope switcher, breadcrumb, and navigation configuration. Desktop open state survives route changes and reloads. Off-canvas content becomes inert while hidden. Mobile uses the stock Sheet with a visible close action; organization/project selection uses radio menu items, navigation closes the sheet, and current links expose `aria-current`.

Generic controls now use [Collapsible](https://ui.shadcn.com/docs/components/radix/collapsible), [Accordion](https://ui.shadcn.com/docs/components/radix/accordion), [Popover](https://ui.shadcn.com/docs/components/radix/popover), [Pagination](https://ui.shadcn.com/docs/components/radix/pagination), [Empty](https://ui.shadcn.com/docs/components/radix/empty), [Field](https://ui.shadcn.com/docs/components/radix/field), and [Alert Dialog](https://ui.shadcn.com/docs/components/radix/alert-dialog) where they fit. New primitive source came from the official shadcn registry through its CLI view command, with the configured Lucide icons applied. Existing branded Button variants were preserved. The shared Disclosure/EmptyState wrappers only compose these primitives; they do not implement collapse or dialog behavior themselves. The native draggable L3 tree disclosure remains part of the domain editor.

Fixed the [Progress](https://ui.shadcn.com/docs/components/radix/progress) primitive to pass its value into Radix Root, so current progress is exposed to assistive technology. Replaced remaining manual bars, custom filter/menu panels, and single-selection button groups with standard components. In-place transcript paging composes Pagination with real buttons and disabled states; it does not invent navigation URLs.

Centralized stage order, stage handoff, output routes, current step, run status/date/elapsed formatting, runtime filenames, and validated cluster choices. Removed the unused active-app legacy tabs wrapper, three static SVG demo diagrams, old job fixture module, and global Overlay wrapper/provider. Member confirmation now has local, scoped dialog state. Scope configuration is decoded once by the new-job form and passed to its advanced UI.

Luna workers performed the feature passes and an independent final integration review. Browser checks passed for desktop group toggles, sidebar persistence through navigation/reload, mobile sheet/menu behavior at 390 × 844, keyboard input-source selection, disabled submission without a file, cluster scope configuration, transcript page changes, and Mermaid syntax/discard protection. The mobile Design page had equal viewport/scroll widths (390px) and no horizontal page overflow. No browser errors/warnings were captured in these checks. Temporary viewport overrides were reset.

Production/backend limitations from the first review still apply. This is a concrete frontend review and regression pass, not a claim that every future architecture choice or accessibility conformance requirement has been certified.

Second-pass final verification: full lint, strict typecheck, formatting, all seven regression scripts, and whitespace checks passed. The optimized webpack production build passed again after the sidebar and primitive changes. Added regression coverage for the canonical next-stage chain, output destinations, current-step precedence, and malformed/duplicate cluster scope inputs.

Final production smoke check: the updated job dashboard had one main landmark, one named main navigation landmark, and no captured console errors/warnings. The verified desktop and mobile screenshots are `shadcn-review-preview.png` and `shadcn-sidebar-mobile.png`; the local production preview remains available on port 3000.
