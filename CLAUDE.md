# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hermes is an AI agent-powered platform for optimizing PTO and vacation planning. Users provide their days off, destination preferences, and remaining PTO days; AI agents find the best trips.

## Repository Structure

```
frontend/   React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui
backend/    Python 3.12 + FastAPI
```

## Commands

### Frontend (run from `frontend/`)

```bash
npm run dev           # Dev server at http://localhost:5173
npm run build         # Type-check + Vite build
npm run lint          # ESLint
npm run format        # Prettier (write)
npm run format:check  # Prettier (check only, used in CI)
```

### Backend (run from `backend/`)

```bash
fastapi dev main.py          # Dev server (hot reload)
python -m black .            # Format
python -m ruff check .       # Lint
python -m ruff check . --fix # Lint + auto-fix
python -m compileall .       # Syntax validation
```

Install dependencies: `pip install -r requirements.txt`

## Architecture

### Frontend

- **Routing**: React Router v7. `App.tsx` defines a single `<Layout>` route wrapping all pages via `<Outlet>`.
- **Layout**: `Layout.tsx` composes `<Navbar>`, `<main><Outlet /></main>`, and `<Footer>` — all pages render inside this shell.
- **UI components**: shadcn/ui built on radix-ui primitives. Component files live in `src/components/ui/`. Add new shadcn components via `npx shadcn add <component>`.
- **Path alias**: `@` resolves to `src/` (configured in `vite.config.ts` and `tsconfig.json`).
- **Styling**: Tailwind CSS v4 via the `@tailwindcss/vite` plugin (no `tailwind.config.js` needed).

### Backend

- `main.py` is the FastAPI entrypoint.
- CORS is configured to allow requests from `http://localhost:5173` only.

### CI / Pre-commit

CI (`.github/workflows/ci.yaml`) runs on every push and PR to main:
1. Frontend: format check → lint → build
2. Backend: black check → ruff lint → compileall

Pre-commit hooks (`.pre-commit-config.yaml`) mirror CI: Prettier + ESLint for frontend, black + ruff for backend. Install with `pre-commit install`.
