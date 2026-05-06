# Phase 1 - Foundation, Auth and 2FA

Status: COMPLETE (29/29)
Backend: 18/18 | Frontend: 11/11

---

## Backend (18/18)

### Infrastructure
- [x] Docker Compose: postgres:16-alpine and redis:7-alpine with health checks
- [x] NestJS project init with ConfigModule (global)
- [x] Drizzle ORM setup + drizzle.config.ts
- [x] Migration generated and applied (users table in DB)

### Schema
- [x] users table: id, email, username, password_hash, avatar_url, is_email_verified, email_verification_token, email_verification_expiry, refresh_token_hash, refresh_token_expiry, password_reset_token, password_reset_expiry, two_factor_secret (AES-256 encrypted), two_factor_enabled, two_factor_backup_codes (bcrypt hashed array), created_at, updated_at

### Auth Endpoints
- [x] POST /auth/register - hash password, create user, send verification email
- [x] GET  /auth/verify-email?token= - validate token, mark email verified
- [x] POST /auth/login - verify password; if 2FA return pre_auth_token else return JWT pair
- [x] POST /auth/refresh - validate refresh JWT, rotate and return new token pair
- [x] POST /auth/logout - clear refresh token hash from DB
- [x] POST /auth/forgot-password - generate reset token, send email (always returns same message)
- [x] POST /auth/reset-password - validate token, hash new password, clear refresh tokens
- [x] GET  /auth/me - return safe user object (JwtAuthGuard)

### 2FA Endpoints
- [x] POST /auth/2fa/setup - generate TOTP secret + QR data URL (otplib + qrcode)
- [x] POST /auth/2fa/enable - verify TOTP code, store AES-256 encrypted secret, generate 8 bcrypt-hashed backup codes
- [x] POST /auth/2fa/verify - verify TOTP code via pre_auth_token, issue full JWT pair
- [x] POST /auth/2fa/backup - verify one-time backup code (bcrypt compare + consume), issue JWT pair
- [x] POST /auth/2fa/disable - require password confirmation, clear 2FA data

### Guards and Security
- [x] JwtAuthGuard (passport-jwt, validates JWT_SECRET)
- [x] PreAuthGuard (validates pre_auth_token signed with PRE_AUTH_SECRET)
- [x] RefreshTokenGuard (passport-jwt from body field, validates JWT_REFRESH_SECRET, bcrypt-compares stored hash)
- [x] Refresh tokens issued as signed JWTs, hashed and stored in DB for revocation
- [x] Email service: Nodemailer SMTP via env vars (SMTP_HOST/PORT/USER/PASS/FROM)

---

## Frontend (11/11)

### Setup
- [x] Next.js App Router + Tailwind CSS + shadcn/ui

### Auth Store and HTTP
- [x] Zustand auth store: user, accessToken, refreshToken, isAuthenticated, hasHydrated, requires2FA, preAuthToken
- [x] Axios instance: request interceptor (attach Bearer) + response interceptor (auto-refresh on 401 with queue)

### Pages
- [x] /login - email+password form; redirect to /login/2fa if requiresTwoFactor
- [x] /login/2fa - 6-digit TOTP input using preAuthToken; link to backup code page
- [x] /login/2fa/backup - backup code entry form
- [x] /register - registration form with validation
- [x] /verify-email - calls verify-email endpoint on mount
- [x] /forgot-password - email form, shows success message
- [x] /reset-password - new password form using token from URL
- [x] /settings/security - 2FA setup (QR, confirm code, backup codes) + disable 2FA
