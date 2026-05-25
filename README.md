# DocuGob Web

Frontend for DocuGob — automated administrative document generation
for Peruvian public-sector entities. Next.js 16 (App Router) + React
19 + TanStack Query, talking to a FastAPI backend through a same-origin
proxy.

## Getting started

```bash
pnpm install
cp .env.example .env.local           # then point BACKEND_API_URL at your FastAPI
pnpm dev
```

Open <http://localhost:3000>. The app expects the FastAPI backend to
be reachable at the URL set in `BACKEND_API_URL` (default
`http://127.0.0.1:8000`).

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Next.js dev server with HMR. |
| `pnpm build` | Production build. |
| `pnpm start` | Serve the production build locally. |
| `pnpm typecheck` | `tsc --noEmit` over the whole project. |
| `pnpm lint` | ESLint with the Next config. |
| `pnpm test:e2e` | Run the Playwright smoke (see below). |
| `pnpm test:e2e:install` | One-time: download the chromium binary Playwright needs. |

## End-to-end smoke

The auth flow (sign-up → HttpOnly cookies → RSC dashboard → logout)
is the most fragile part of the stack — it crosses Next.js route
handlers, the catch-all proxy, the silent refresh logic, and Server
Components reading cookies. A single Playwright test in
[`e2e/auth-smoke.spec.ts`](e2e/auth-smoke.spec.ts) covers the whole
happy path. If it stays green, a real user can register and use the
product end-to-end.

First-time setup on a fresh checkout:

```bash
pnpm test:e2e:install      # downloads chromium (~150 MB), one-off
```

Run the smoke with both servers up:

```bash
# Terminal 1 — FastAPI backend
uvicorn app.main:app --reload         # in the backend repo

# Terminal 2 — Next.js + Playwright will reuse it
pnpm dev                              # optional; Playwright starts it if not

# Terminal 3
pnpm test:e2e
```

Each run uses a fresh `smoke-<timestamp>@docugob.test` email so re-runs
don't collide in the database.

## Architecture overview

- **App Router with Route Groups**: `(auth)` for sign-in/sign-up,
  `dashboard/` for authenticated pages. Layouts are RSCs that fetch
  the user server-side — no `"Loading…"` spinner before first paint.
- **Auth**: HttpOnly cookies (`docugob_access`, `docugob_refresh`),
  set by [`/api/auth/login`](src/app/api/auth/login/route.ts) /
  [`/register`](src/app/api/auth/register/route.ts). Cleared by
  [`/logout`](src/app/api/auth/logout/route.ts). Rotated transparently
  by [`/refresh-redirect`](src/app/api/auth/refresh-redirect/route.ts).
  Route gating + CSP nonces live in [`src/proxy.ts`](src/proxy.ts)
  (Next 16's renamed `middleware`).
- **API**: the browser only talks to `/api/*` on the same origin. The
  catch-all proxy at [`src/app/api/[...path]/route.ts`](src/app/api/[...path]/route.ts)
  forwards everything to FastAPI server-side and injects the bearer
  from the access cookie. Silent refresh-on-401 lives in
  [`src/lib/server/api-proxy.ts`](src/lib/server/api-proxy.ts).
- **Forms**: a single
  [`<FormGenerator>`](src/components/forms/form-generator/index.tsx)
  renders Input/Textarea/Select with consistent error / a11y wiring.
  Each form lives in three files: a Zod schema, an orchestration hook,
  and a pure presentational component.
- **Toasts**: Radix Toast with an external reducer so any hook can
  call `toast({...})` without a Provider in scope. See
  [`src/components/ui/use-toast.ts`](src/components/ui/use-toast.ts).

For the design decisions and patterns behind these choices, read
[`AUDIT.md`](AUDIT.md).
