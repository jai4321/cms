# Teams-like Chat System — Master Phase Plan

**Stack:** NestJS · Next.js · PostgreSQL · Drizzle ORM · Socket.IO · Redis · MinIO · JWT · Tailwind CSS · shadcn/ui · Zustand

**Workspace layout:**
```
cms/
├── backend/      ← NestJS
├── frontend/     ← Next.js
├── docker-compose.yml
└── PHASES.md
```

**Docker services:** postgres:16-alpine · redis:7-alpine · minio/minio · backend (NestJS) · frontend (Next.js)

---

## Phase 1 — Foundation, Auth & 2FA

### Backend
- Docker Compose: PostgreSQL + Redis
- NestJS project init with ConfigModule
- Drizzle ORM connection + migration setup
- **Schema — `users`:** id, email, username, password_hash, avatar_url, is_email_verified, two_factor_secret (AES-256 encrypted), two_factor_enabled, two_factor_backup_codes (bcrypt hashed array), created_at, updated_at
- **Auth endpoints:**
  - POST /auth/register → sends email verification
  - GET  /auth/verify-email?token=
  - POST /auth/login → returns pre_auth_token (15 min) if 2FA enabled, else full JWT
  - POST /auth/refresh → refresh token rotation
  - POST /auth/logout → revoke refresh token
  - POST /auth/forgot-password
  - POST /auth/reset-password
- **2FA endpoints:**
  - POST /auth/2fa/setup   → generate TOTP secret + QR code URI (otplib + qrcode pkg)
  - POST /auth/2fa/enable  → confirm TOTP code → store encrypted secret → return 8 backup codes
  - POST /auth/2fa/verify  → submit TOTP code with pre_auth_token → return full JWT
  - POST /auth/2fa/backup  → login with one-time backup code
  - POST /auth/2fa/disable → disable 2FA (requires password confirmation)
- **Guards:** JwtAuthGuard · PreAuthGuard (validates pre_auth_token) · RefreshTokenGuard
- Refresh tokens stored hashed in DB with expiry; rotated on every use
- Email: Nodemailer SMTP (env-driven) for verification + password reset emails
- **Key packages:** @nestjs/config · @nestjs/jwt · @nestjs/passport · passport-jwt · bcrypt · otplib · qrcode · nodemailer · drizzle-orm · drizzle-kit · pg · class-validator · class-transformer

### Frontend
- Next.js App Router init + Tailwind CSS + shadcn/ui
- **Pages:**
  - /login
  - /login/2fa            ← 6-digit TOTP input + "use backup code" link
  - /login/2fa/backup     ← backup code entry
  - /register
  - /verify-email
  - /forgot-password
  - /reset-password
  - /settings/security    ← enable/disable 2FA, view/regenerate backup codes
- **2FA setup flow (in /settings/security):**
  1. Call /auth/2fa/setup → display QR code + manual secret key
  2. User scans with authenticator app (Google Authenticator / Authy)
  3. Enter 6-digit code → call /auth/2fa/enable
  4. Show one-time backup codes screen (copy/download before closing)
- **Zustand auth store:** user · accessToken · isAuthenticated · requires2FA · preAuthToken
- Axios interceptor: attach access token, auto-refresh on 401
- **Key packages:** zustand · axios · react-hook-form · zod

---

## Phase 2 — Workspaces (Organizations / Teams)

### Backend
- **Schema:** `workspaces` · `workspace_members` (roles: owner · admin · member)
- Workspaces CRUD API
- Invite users to workspace by email
- WorkspaceRole guard

### Frontend
- Workspace creation page
- Workspace switcher in sidebar
- Invite members UI
- Workspace settings page (name, icon, members list)

---

## Phase 3 — Channels & Direct Messages (Structure)

### Backend
- **Schema:** `channels` (public/private, workspace-scoped) · `channel_members` · `direct_message_conversations` · `dm_participants`
- Channel CRUD: create, list, join, leave, archive
- DM conversation creation (1:1 and group DMs)
- Membership validation on all endpoints

### Frontend
- Left sidebar layout (Teams-style): workspace channels list + DMs list
- Create channel modal
- Start DM modal (search & select user)
- Channel / DM detail view shell (empty message area placeholder)

---

## Phase 4 — Real-time Messaging (Core)

### Backend
- **Schema:** `messages` · `message_reads`
- REST: send message, fetch paginated message history (cursor-based)
- Socket.IO gateway:
  - Room joining (channel room / DM room)
  - `message:send` → broadcast to room
  - `message:typing` → typing indicator broadcast
- Redis adapter for Socket.IO (multi-instance ready)
- JWT authentication in WebSocket handshake
- **Key packages:** @nestjs/websockets · socket.io · @socket.io/redis-adapter · ioredis

### Frontend
- Socket.IO client with auto-reconnect
- Virtualized message list with infinite scroll upward
- Message input box (Enter to send)
- Typing indicators ("Alice is typing…")
- Unread message badge on sidebar channel/DM items
- Optimistic message UI (show instantly, confirm on socket ack)

---

## Phase 5 — Message Features (Threads, Reactions, Mentions)

### Backend
- **Schema:** `thread_messages` (replies to a parent message) · `reactions` · `mentions`
- Thread reply API + socket events
- Reaction add/remove API + socket events
- @mention parsing: extract user IDs from message content, store in `mentions`, trigger notification
- Unread thread count tracking

### Frontend
- Thread panel (right sidebar, slides in when clicking Reply)
- Emoji reaction picker below messages
- Hover toolbar on each message: React · Reply · More options
- @ autocomplete dropdown in message input
- Mention highlighting in rendered messages

---

## Phase 6 — File & Media Attachments

### Backend
- Add MinIO service to Docker Compose
- **Schema:** `attachments`
- File upload endpoint (multipart/form-data, validated MIME types + size limits)
- Presigned URL generation for secure file download
- Attach files to messages

### Frontend
- Drag-and-drop upload on message input area
- Paste image to upload
- Upload progress bar
- Inline image preview in messages
- File card (non-image) with download link
- Attachment gallery in channel info panel

---

## Phase 7 — User Presence & Notifications

### Backend
- Presence service: store `userId → status` in Redis with TTL
- Socket events: `presence:update` (online · away · offline · dnd)
- Heartbeat mechanism to maintain presence
- **Schema:** `notifications`
- Notification socket events: mention · thread reply · DM received
- REST: list notifications, mark as read

### Frontend
- Presence dot on avatars everywhere (green / yellow / grey)
- Manual status selector (Available, Away, DND, Offline)
- Notification bell with unread count badge
- Notification dropdown panel
- Browser Web Notifications API for mentions / DMs

---

## Phase 8 — Search

### Backend
- PostgreSQL full-text search (`tsvector` / `tsquery`) on messages
- Search API: query across workspace messages, filters by channel · from user · date range
- Results include message context (channel name, author, timestamp)

### Frontend
- Global search bar (Ctrl+K shortcut)
- Search results page with filter panel
- Jump to message in channel from search result

---

## Phase 9 — Polish & Production Readiness

### Backend
- Rate limiting (NestJS throttle guard)
- Helmet, CORS, security headers
- Request logging (Pino / Winston)
- Health check endpoint (`/health`)
- Drizzle migrations in CI pipeline
- Docker Compose production profile (no exposed ports, resource limits)

### Frontend
- Skeleton loaders on all async surfaces
- Error boundaries
- Dark mode support (Tailwind + shadcn/ui theme toggle)
- Keyboard navigation (Slack-style shortcuts)
- Mobile-responsive layout
- PWA manifest + service worker for offline resilience
