# Phase 2 - Workspaces

Status: Not started (0/15)
Backend: 0/11 | Frontend: 0/4

---

## Backend (0/11)

### Schema
- [ ] workspaces table: id, name, slug, icon_url, owner_id (FK users), created_at, updated_at
- [ ] workspace_members table: id, workspace_id (FK), user_id (FK), role (owner/admin/member), joined_at

### Endpoints
- [ ] POST   /workspaces - create workspace (requester becomes owner)
- [ ] GET    /workspaces - list workspaces the current user belongs to
- [ ] GET    /workspaces/:id - get workspace details (members only)
- [ ] PATCH  /workspaces/:id - update name/icon (admin+)
- [ ] DELETE /workspaces/:id - delete workspace (owner only)
- [ ] POST   /workspaces/:id/invite - invite user by email (admin+)
- [ ] GET    /workspaces/:id/members - list members with roles
- [ ] PATCH  /workspaces/:id/members/:userId - change member role (owner only)
- [ ] DELETE /workspaces/:id/members/:userId - remove member (admin+; owner cannot be removed)

### Guards
- [ ] WorkspaceMemberGuard - checks current user is a member of the workspace
- [ ] WorkspaceRoleGuard - checks minimum required role (owner/admin/member)

---

## Frontend (0/4)

- [ ] Workspace creation page (/workspaces/new)
- [ ] Workspace switcher in left sidebar
- [ ] Invite members UI (email input + role selector)
- [ ] Workspace settings page (/workspaces/:id/settings) - name, icon, members list with role controls
