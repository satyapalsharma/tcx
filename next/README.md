# Transform.cx — Next.js

Standalone Next.js App Router port of the Open Design HTML prototype. Original static files remain in the project root.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Build

```bash
npm run build
npm start
```

## Routes

All 12 screens: `/`, `/login`, `/projects`, `/jobs`, `/dashboard`, `/analysis`, `/design`, `/develop`, `/connectors`, `/rbac`, `/settings`, `/audit-log`

Uses `tx.css` design tokens (copied to `src/tx.css`). Demo auth via localStorage — any valid email + 8+ char password.
