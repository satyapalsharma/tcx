# Transform.CX application

Transform.CX organizes customer conversations into a pipeline: intent analysis, L1/L2/L3 clustering, process maps, UML, and agent code. Full pipeline is the primary flow; individual stages and team handoffs remain available.

This repository currently runs the **frontend demo**. Local jobs, connector setup, invitations, reviews, and audit events persist in browser storage. Uploaded contents are not processed, sample outputs are labeled, and login/RBAC are not production authentication or authorization. `src/lib/pipeline-api.ts` provides a proposed backend adapter; its endpoints and authentication must be agreed with the backend team before integration. See `PIPELINE-CONTRACT.md`.

## Run

Use Node.js 20.9 or newer, with npm:

```sh
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3000
```

## Modules

| Location | Responsibility |
| --- | --- |
| `src/app` | Next.js routes, providers, shared styles |
| `src/views` | Screen composition and user interactions |
| `src/components/layout` | Shared sidebar provider, navigation, scope switcher, breadcrumb |
| `src/components/ui` | Owned shadcn/Radix primitives |
| `src/components/common` | Shared product controls and states |
| `src/components/pipeline` | Job input, stage plan, advanced options, output selection, diagram editors |
| `src/components/analytics` | Clusters, transcripts, charts, pivot, savings estimates |
| `src/context` | Organization/project scope and demo pipeline orchestration |
| `src/data` | Domain types, constants, explicit demo fixtures |
| `src/lib` | Input validation, pure transitions, cluster/analytics logic, API adapter, SVG renderer |
| `src/hooks` | Reusable React/browser hooks |
| `scripts` | Domain and API contract regression checks |

Prefer the existing shadcn controls for forms, dialogs, menus, filters, tabs, tables, and disclosures. Native semantic controls remain suitable for file uploads, hierarchy/tree disclosures, and custom chart/canvas interactions. Mermaid SVG is sanitized before mounting or exporting.

## Checks

```sh
npm run lint
npm run typecheck
npm run format:check
npm run test:ux
npm run build
npm audit --omit=dev
```

`npm run format` formats application code and scripts; generated shadcn primitive files are excluded. TypeScript is strict. The tests exercise API scoping/cancellation/timeouts, diagram parsing, job lineage/metrics, taxonomy edits, persisted state, and run transitions.

If this host rejects Turbopack's subprocess port binding, use the supported webpack build:

```sh
npm run build -- --webpack
npm run start -- --hostname 127.0.0.1 --port 3000
```

See [the code audit](CODE-AUDIT.md) for findings, fixes, validation evidence, and remaining production work.
