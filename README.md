# Teams Chat System

A real-time team chat application built with NestJS and Next.js. The current implementation supports workspaces, direct messages, authentication, and collaborative messaging features.

## Features

- Email and password registration, email verification, password reset, JWT sessions, and optional TOTP two-factor authentication with backup codes
- Workspaces with member invitations and owner, admin, and member roles
- One-to-one and group direct messages
- Real-time messages, typing indicators, and online presence over Socket.IO
- Message threads, emoji reactions, and @mentions
- File and image attachments stored in MinIO
- In-app notifications for mentions, thread replies, and direct messages

This project is in active development. Search, channels, and production polish are planned work. See [`ai-context/PHASES.md`](ai-context/PHASES.md) for phase details and current progress.

## Technology

| Area | Tools |
| --- | --- |
| Frontend | Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui |
| Client state and forms | Zustand, React Hook Form, Zod |
| Backend | NestJS, TypeScript, REST, Socket.IO |
| Database | PostgreSQL 16, Drizzle ORM, drizzle-kit |
| Realtime adapter and presence | Redis 7 |
| File storage | MinIO |
| Authentication | JWT, bcrypt, TOTP (`otplib`) |

## Project layout

```text
backend/       NestJS API, database schema, and migrations
frontend/      Next.js application
ai-context/    Project phases and planning notes
docker-compose.yml
```

## Prerequisites

- Node.js and npm
- Docker with the Compose plugin
- PostgreSQL 16
- SMTP credentials for email verification and password reset

The current `docker-compose.yml` starts Redis and MinIO. PostgreSQL is not defined in that file, so use an existing PostgreSQL 16 instance or start one separately.

## Local development

### 1. Start infrastructure

Start Redis and MinIO from the repository root:

```powershell
docker compose up -d redis minio
```

If you need a local PostgreSQL instance, this is one option:

```powershell
docker run --name teams-postgres --restart unless-stopped -e POSTGRES_USER=teams -e POSTGRES_PASSWORD=local-dev-only -e POSTGRES_DB=teams_db -p 5432:5432 -v teams-postgres-data:/var/lib/postgresql/data -d postgres:16-alpine
```

`local-dev-only` is an example for a private development machine. Use your own local database credentials and make `DATABASE_URL` match them.

### 2. Configure the backend

Create `backend/.env` with the settings shown in [`backend/env-example`](backend/env-example). Set values for your local services and generate your own secrets. The main settings are:

- `DATABASE_URL` and `REDIS_URL`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `PRE_AUTH_SECRET`, with their expiry settings
- `TWO_FACTOR_ENCRYPTION_KEY` (a 32-byte hexadecimal key)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`
- `APP_URL`
- `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, and `MINIO_BUCKET`

Use credentials that match your local Redis and MinIO configuration. Keep `backend/.env` private; do not commit real credentials.

### 3. Install backend dependencies, migrate the database, and start the API

```powershell
cd backend
npm ci
npm run db:migrate
npm run start:dev
```

The API and Socket.IO server listen on port `4000`.

### 4. Configure and start the frontend

In a second terminal:

```powershell
cd frontend
if (-not (Test-Path .env.local)) { Copy-Item example.env.local .env.local }
npm ci
npm run dev
```

If `frontend/.env.local` already exists, keep it and confirm its API and WebSocket URLs point to your backend. The web application is available at [http://localhost:3000](http://localhost:3000).

## Ports

| Service | Port |
| --- | ---: |
| Frontend | 3000 |
| Backend API and Socket.IO | 4000 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| MinIO API | 9000 |
| MinIO Console | 9001 |

## Useful commands

Run these from the corresponding project directory:

| Directory | Command | Purpose |
| --- | --- | --- |
| `backend` | `npm run start:dev` | Run the API in watch mode |
| `backend` | `npm run build` | Build the API |
| `backend` | `npm run db:generate` | Generate a migration from schema changes |
| `backend` | `npm run db:migrate` | Apply pending migrations |
| `backend` | `npm run test` | Run backend unit tests |
| `backend` | `npm run test:e2e` | Run backend end-to-end tests |
| `frontend` | `npm run dev` | Run the web application in development mode |
| `frontend` | `npm run build` | Build the web application |

## Development notes

- Backend environment variables are loaded from `backend/.env`; the frontend uses `frontend/.env.local`.
- Update `backend/src/db/schema/` and generate a migration when changing the database schema. Commit generated migration files under `backend/drizzle/`.
- The Compose file currently contains development service credentials. Replace them and keep them aligned with `backend/.env` before using the services outside a private local setup.
- See [`AGENTS.md`](AGENTS.md) for repository conventions and [`ai-context/PHASES.md`](ai-context/PHASES.md) for the implementation roadmap.
