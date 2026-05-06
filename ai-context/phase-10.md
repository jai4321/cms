# Phase 10 - Polish and Production Readiness

Status: Not started (0/12)
Backend: 0/6 | Frontend: 0/6

---

## Backend (0/6)

- [ ] Rate limiting: @nestjs/throttler on public endpoints (register, login, forgot-password)
- [ ] Security headers: helmet() middleware + explicit CORS origin allowlist
- [ ] Request logging: Pino or Winston, structured JSON output with request id
- [ ] Health check: GET /health returns { status: ok, db: ok, redis: ok }
- [ ] CI migrations: drizzle-kit migrate step in GitHub Actions workflow before deploy
- [ ] Docker Compose production profile: no exposed ports for pg/redis, resource limits, restart: always

---

## Frontend (0/6)

- [ ] Skeleton loaders on all async surfaces (message list, sidebar, members, notifications)
- [ ] Error boundaries at page and major component level with friendly fallback UI
- [ ] Dark mode: Tailwind dark class + shadcn/ui theme; persist in localStorage; toggle in user menu
- [ ] Keyboard shortcuts (Ctrl+K search, Alt+Up/Down nav, Esc close panels)
- [ ] Mobile-responsive layout (collapsible sidebar, bottom nav bar, full-screen chat on mobile)
- [ ] PWA: manifest.json with icons, service worker for offline page caching
