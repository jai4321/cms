# Agent Instructions — Teams Chat System

This is a Microsoft Teams-like chat application. Read this file fully before making any changes.
The full phase-by-phase plan is in `PHASES.md` at the repo root.

---

## Project Structure

```
cms/
├── backend/          ← NestJS API server
├── frontend/         ← Next.js App Router client
├── docker-compose.yml
├── PHASES.md         ← Full 9-phase feature plan with schemas, endpoints, packages
└── AGENTS.md         ← This file
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS (TypeScript) |
| Frontend | Next.js App Router (TypeScript) |
| Database | PostgreSQL 16 via Docker |
| ORM | Drizzle ORM + drizzle-kit migrations |
| Real-time | Socket.IO |
| Cache / Presence | Redis 7 via Docker |
| File Storage | MinIO via Docker (added in Phase 6) |
| Auth | JWT (access + refresh tokens), 2FA via TOTP (otplib) |
| UI | Tailwind CSS + shadcn/ui |
| State | Zustand |
| Validation | class-validator + class-transformer (backend), zod + react-hook-form (frontend) |

---

## Docker

Start infrastructure before running the backend:
```bash
docker compose up -d
```

Services defined in `docker-compose.yml`: `postgres`, `redis` (and `minio` from Phase 6 onward).

---

## Backend Conventions (`backend/`)

- **Framework:** NestJS with feature modules — one module per domain (auth, users, workspaces, channels, messages, etc.)
- **Config:** All secrets and connection strings via `@nestjs/config` from `.env`. Never hardcode secrets.
- **Database:** Drizzle ORM. All schemas live in `backend/src/db/schema/`. Run migrations with `drizzle-kit migrate`.
- **Validation:** Always use `class-validator` DTOs with `ValidationPipe` globally enabled.
- **Guards:** `JwtAuthGuard` protects all authenticated routes. `PreAuthGuard` protects the 2FA verify endpoint. `RefreshTokenGuard` protects the refresh endpoint.
- **Passwords:** Hashed with `bcrypt` (saltRounds = 12).
- **2FA secret:** Encrypted with AES-256 before storing in DB. Key comes from env var `TWO_FACTOR_ENCRYPTION_KEY`.
- **Refresh tokens:** Stored hashed in DB with expiry. Rotated on every use.
- **Error handling:** Use NestJS built-in `HttpException` classes. Do not expose internal error details to clients.
- **File naming:** `*.module.ts` · `*.controller.ts` · `*.service.ts` · `*.guard.ts` · `*.dto.ts` · `*.schema.ts`

---

## Frontend Conventions (`frontend/`)

- **Router:** Next.js App Router only. No Pages Router.
- **Components:** Build every page with section-wise components. Page folder structure:
  ```
  app/(page)/
  └── components/
      └── PageName/
          ├── SectionOne.tsx
          ├── SectionTwo.tsx
          └── index.ts
  ```
- **State:** Zustand for global auth state and UI state. No Redux.
- **Auth store fields:** `user` · `accessToken` · `isAuthenticated` · `requires2FA` · `preAuthToken`
- **HTTP:** Axios with interceptors — attach access token on requests, auto-refresh on 401 response.
- **Forms:** react-hook-form + zod for all forms.
- **Styling:** Tailwind CSS utility classes + shadcn/ui components. No custom CSS files unless unavoidable.
- **No shared helper files at page level** — keep small helpers inside the component that uses them.

---

## Environment Variables

Backend `.env` (located at `backend/.env`):
```
DATABASE_URL=postgresql://teams:teams_secret@localhost:5432/teams_db
REDIS_URL=redis://:redis_secret@localhost:6379
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<strong-random-secret>
JWT_REFRESH_EXPIRES_IN=7d
PRE_AUTH_SECRET=<strong-random-secret>
PRE_AUTH_EXPIRES_IN=15m
TWO_FACTOR_ENCRYPTION_KEY=<32-byte-hex>
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@example.com
APP_URL=http://localhost:3000
```

Frontend `.env.local` (located at `frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

---

## Current Phase Status

See `PHASES.md` for full details. Check the `## Current Implementation Status` section in that file for what is done and what to build next.

**Ports:**
- Backend: `4000`
- Frontend: `3000`
- PostgreSQL: `5432`
- Redis: `6379`
- MinIO API: `9000` (Phase 6+)
- MinIO Console: `9001` (Phase 6+)

---

## Windows / PowerShell Note

Running scripts may be blocked by execution policy. Run this first in the terminal before using `npx` or other CLI tools:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
