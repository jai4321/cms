# Phase 2 - Workspaces

Status: DONE (15/15)
Backend: 11/11 | Frontend: 4/4

---

## Backend (11/11)

### Schema
- [x] workspaces table: id, name, slug, icon_url, owner_id (FK users), created_at, updated_at
- [x] workspace_members table: id, workspace_id (FK), user_id (FK), role (owner/admin/member), joined_at

### Endpoints
- [x] POST   /workspaces - create workspace (requester becomes owner)
- [x] GET    /workspaces - list workspaces the current user belongs to
- [x] GET    /workspaces/:id - get workspace details (members only)
- [x] PATCH  /workspaces/:id - update name/icon (admin+)
- [x] DELETE /workspaces/:id - delete workspace (owner only)
- [x] POST   /workspaces/:id/invite - invite user by email (admin+)
- [x] GET    /workspaces/:id/members - list members with roles
- [x] PATCH  /workspaces/:id/members/:userId - change member role (owner only)
- [x] DELETE /workspaces/:id/members/:userId - remove member (admin+; owner cannot be removed)

### Guards
- [x] WorkspaceMemberGuard - checks current user is a member of the workspace
- [x] WorkspaceRoleGuard - checks minimum required role (owner/admin/member)

---

## Frontend (4/4)

- [x] Workspace creation page (/workspaces/new)
- [x] Workspace switcher in left sidebar
- [x] Invite members UI (email input + role selector)
- [x] Workspace settings page (/workspaces/:id/settings) - name, icon, members list with role controls
