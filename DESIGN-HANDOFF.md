# 34dee4af-a476-4ce1-93b4-12af0acc646c implementation handoff

This archive is the source of truth for turning the design into production code. Start from `index.html`, then preserve the visual system, responsive behavior, and interactions found in the exported files.

## Implementation target
- Build production UI from the exported design, not a loose reinterpretation.
- Preserve typography scale, spacing rhythm, color tokens, border radii, shadows, motion timing, and component states.
- Replace static placeholders only when the target app has real data or functional equivalents.
- Keep generated product UI free of Open Design chrome, preview labels, or design-process annotations.
- Treat this handoff as a visual contract: if implementation choices conflict, match the exported pixels and behavior first, then refactor internals.

## Source map
- Primary entry: `index.html`
- HTML screens detected: 13
- Stylesheets detected: 7
- Script/component files detected: 66
- Supporting assets detected: 59

## Responsive contract
Validate the implementation across this 2025–2026 viewport matrix:
- Mobile compact: 360×800
- Mobile standard: 390×844
- Mobile large: 430×932
- Foldable / small tablet: 600×960
- Tablet portrait: 820×1180
- Tablet landscape: 1024×768
- Laptop: 1366×768
- Desktop: 1440×900
- Wide desktop: 1920×1080

For responsive web exports, treat these as a modern breakpoint system for one adaptive web experience, not three fixed screenshots. Do not split responsive web into unrelated native app screens unless the project explicitly includes native targets. Use semantic layout thresholds, fluid `clamp()` type/spacing, and container queries where component width matters more than viewport width. Preserve any CSS media queries, container queries, fluid `clamp()` scales, and layout changes already present in the exported files.

## Design fidelity contract
- Extract reusable tokens before writing components: background, surface, foreground, muted text, border, accent, radius, shadow, spacing, type scale, and motion duration/easing.
- Map product screens, in-app modules/components, optional landing page, and optional OS widget surfaces before coding. Keep these surfaces separate in the target architecture.
- Match layout geometry: max-widths, gutters, grid columns, card proportions, sticky/fixed elements, and viewport-specific navigation.
- Preserve real copy, labels, and data shown in the export. Do not replace specific text with generic marketing filler.
- Preserve interactive affordances: hover, focus, pressed, disabled, loading, validation, copy/share, tab/accordion, modal/sheet, and keyboard states where present.
- Preserve accessibility semantics when converting: headings stay hierarchical, controls remain buttons/links/inputs, focus states stay visible.
- Do not keep prototype-only annotations, frame labels, or Open Design chrome in the production UI.

## CJX-ready UX contract
- Use `DESIGN-MANIFEST.json` as the machine-readable map for screens, app modules, OS widgets, landing pages, tokens, interactions, and viewport checks.
- Screen-file-first: when multiple user-facing surfaces exist, implement each HTML screen as its own route/file. Treat `index.html` as a launcher/overview when the manifest marks it that way, not as a combined final UI.
- If `landing.html`, app screens, platform screens, or OS widget files exist, preserve those boundaries in the target app instead of merging them into one page.
- A single self-contained `index.html` is acceptable only when the export truly contains one user-facing screen and its CSS/JS are structured enough to extract tokens, components, states, and behavior.
- If separate `css/` or `js/` files exist, treat them as source of truth for token/component/interactions before porting to React, Vue, SwiftUI, Compose, or another target stack.
- In-app modules/components are product UI blocks inside the app. OS widgets are home-screen/lock-screen/quick-access surfaces outside the app. Do not merge those concepts.

## Color and brand contract
- Use the exported design tokens and product/domain context as the color source of truth.
- Do not introduce warm beige / cream / peach / pink / orange-brown background washes unless they are already explicit brand/reference colors in the export.
- A stylesheet or design/token file was detected; inspect it for canonical color variables before choosing framework theme tokens.

## Implementation sequence for AI coding tools
1. Open `index.html` and `DESIGN-MANIFEST.json`; identify every screen file, launcher/overview file, app module, and interaction before coding.
2. If multiple HTML screens exist, map them to separate routes/surfaces first; do not merge `landing.html`, product app screens, platform screens, or OS widgets into one route.
3. Extract a token table from CSS/root styles and inline styles before building framework components.
4. Build product screens and domain-specific in-app modules from largest layout regions down to controls; avoid starting with isolated atoms that lose spatial intent.
5. Port responsive behavior across the modern viewport matrix and test each semantic breakpoint before cleanup.
6. Port interactions and states, then replace static placeholders only with real app data or functional equivalents.
7. Keep optional landing page and OS widget surfaces as separate surfaces if present.
8. Compare final screenshots against the export at 360×800, 390×844, 430×932, 820×1180, 1024×768, 1366×768, 1440×900, and 1920×1080 before declaring done.

## Entry points
- `analysis.html`
- `audit-log.html`
- `connectors.html`
- `dashboard.html`
- `design.html`
- `develop.html`
- `index.html`
- `jobs.html`
- `login.html`
- `projects.html`
- `rbac.html`
- `react/index.html`
- `settings.html`

## Styles
- `assets/tx.css`
- `next/src/pages.css`
- `next/src/tx.css`
- `react/src/App.css`
- `react/src/index.css`
- `react/src/pages.css`
- `react/src/tx.css`

## Scripts/components
- `assets/ui.js`
- `next/eslint.config.mjs`
- `next/next-env.d.ts`
- `next/next.config.ts`
- `next/src/app/analysis/page.tsx`
- `next/src/app/audit-log/page.tsx`
- `next/src/app/connectors/page.tsx`
- `next/src/app/dashboard/page.tsx`
- `next/src/app/design/page.tsx`
- `next/src/app/develop/page.tsx`
- `next/src/app/jobs/page.tsx`
- `next/src/app/layout.tsx`
- `next/src/app/login/page.tsx`
- `next/src/app/page.tsx`
- `next/src/app/projects/page.tsx`
- `next/src/app/providers.tsx`
- `next/src/app/rbac/page.tsx`
- `next/src/app/settings/page.tsx`
- `next/src/components/AppShell.tsx`
- `next/src/components/ClusterMapSvg.tsx`
- `next/src/components/Icon.tsx`
- `next/src/components/Overlay.tsx`
- `next/src/components/ProcessMapSvg.tsx`
- `next/src/components/Toast.tsx`
- `next/src/components/ui.tsx`
- `next/src/components/UmlSequenceSvg.tsx`
- `next/src/data/jobs.ts`
- `next/src/hooks/useReveal.ts`
- `next/src/lib/navigation.tsx`
- `next/src/views/Analysis.tsx`
- `next/src/views/AuditLog.tsx`
- `next/src/views/Connectors.tsx`
- `next/src/views/Dashboard.tsx`
- `next/src/views/Design.tsx`
- `next/src/views/Develop.tsx`
- `next/src/views/Jobs.tsx`
- `next/src/views/Launcher.tsx`
- `next/src/views/Login.tsx`
- `next/src/views/Projects.tsx`
- `next/src/views/Rbac.tsx`
- `next/src/views/Settings.tsx`
- `react/src/App.tsx`
- `react/src/components/AppShell.tsx`
- `react/src/components/ClusterMapSvg.tsx`
- `react/src/components/Icon.tsx`
- `react/src/components/Overlay.tsx`
- `react/src/components/ProcessMapSvg.tsx`
- `react/src/components/Toast.tsx`
- `react/src/components/ui.tsx`
- `react/src/components/UmlSequenceSvg.tsx`
- `react/src/data/jobs.ts`
- `react/src/hooks/useReveal.ts`
- `react/src/main.tsx`
- `react/src/pages/Analysis.tsx`
- `react/src/pages/AuditLog.tsx`
- `react/src/pages/Connectors.tsx`
- `react/src/pages/Dashboard.tsx`
- `react/src/pages/Design.tsx`
- `react/src/pages/Develop.tsx`
- `react/src/pages/Jobs.tsx`
- `react/src/pages/Launcher.tsx`
- `react/src/pages/Login.tsx`
- `react/src/pages/Projects.tsx`
- `react/src/pages/Rbac.tsx`
- `react/src/pages/Settings.tsx`
- `react/vite.config.ts`

## Assets and supporting files
- `brand-spec.md`
- `EXL_Service_logo.svg.webp`
- `next/AGENTS.md`
- `next/CLAUDE.md`
- `next/package-lock.json`
- `next/package.json`
- `next/public/EXL_Service_logo.svg.webp`
- `next/public/file.svg`
- `next/public/globe.svg`
- `next/public/next.svg`
- `next/public/vercel.svg`
- `next/public/window.svg`
- `next/README.md`
- `next/src/app/favicon.ico`
- `next/tsconfig.json`
- `react/package-lock.json`
- `react/package.json`
- `react/public/EXL_Service_logo.svg.webp`
- `react/public/favicon.svg`
- `react/public/icons.svg`
- `react/README.md`
- `react/src/assets/hero.png`
- `react/src/assets/react.svg`
- `react/src/assets/vite.svg`
- `react/tsconfig.app.json`
- `react/tsconfig.json`
- `react/tsconfig.node.json`
- `WhatsApp-Image-2026-08-03-at-21.23.30-1.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.30.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.31-_1_-1.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.31-_1_.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.31-1.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.31.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.32-1.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.32.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.33-_1_-1.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.33-_1_.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.33-1.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.33.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.34-_1_-1.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.34-_1_.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.34-_2_-1.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.34-_2_.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.34-1.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.34.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.35-_1_-1.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.35-_1_.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.35-1.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.35.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.36-_1_-1.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.36-_1_.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.36-1.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.36.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.37-_1_-1.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.37-_1_.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.37-1.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.37.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.38-1.jpeg`
- `WhatsApp-Image-2026-08-03-at-21.23.38.jpeg`

## Coding checklist for AI tools
1. Inspect `index.html` and `DESIGN-MANIFEST.json` first and identify reusable components before coding.
2. Implement each user-facing screen file as its own route/surface; keep launcher, landing, app, platform, and OS widget files separate.
3. Extract design tokens into the target stack: colors, type scale, spacing, radius, shadows, and motion.
4. Implement layout with real 2025–2026 responsive breakpoints, fluid type/spacing, and container-query-aware component behavior; test with no horizontal overflow.
5. Preserve interactive controls, hover/focus/pressed states, form behavior, validation, and copy actions where present.
6. Implement domain-specific in-app modules with real states; do not flatten them into generic cards.
7. Keep landing page, product screens, and OS widget/quick-access surfaces separate when present.
8. Confirm the production result visually matches the exported design before refactoring internals.
9. Reject implementation shortcuts that flatten the design into generic cards, generic gradients, placeholder stats, or framework-default typography.
10. If a detail is ambiguous, keep the exported HTML/CSS/JS behavior rather than inventing a new pattern.
