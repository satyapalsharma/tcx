# Transform.cx — React (Vite)

Standalone React port of the Open Design HTML prototype. Original static files remain in the project root.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Routes

All 12 screens: `/`, `/login`, `/projects`, `/jobs`, `/dashboard`, `/analysis`, `/design`, `/develop`, `/connectors`, `/rbac`, `/settings`, `/audit-log`

Uses `assets/tx.css` design tokens (copied to `src/tx.css`). Demo auth via localStorage — any valid email + 8+ char password.
