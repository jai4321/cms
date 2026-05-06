# Phase 3 - Direct Messages

Status: Not started (0/14)
Backend: 0/6 | Frontend: 0/8

---

## Backend (0/6)

### Schema
- [ ] direct_message_conversations table: id, workspace_id (FK), created_at
- [ ] dm_participants table: id, conversation_id (FK), user_id (FK)

### DM Endpoints
- [ ] POST /workspaces/:id/dm - create or retrieve existing DM conversation (1:1 or group; matched by exact participant set)
- [ ] GET  /workspaces/:id/dm - list all DM conversations the current user is part of in this workspace
- [ ] POST /dm/:id/participants - add a participant to an existing group DM
- [ ] GET  /dm/:id/participants - list all participants in a DM conversation

### Validation
- [ ] ParticipantGuard - verify requesting user is a participant of the DM conversation before accessing it

---

## Frontend (0/8)

### Layout
- [ ] Root app layout with left sidebar: workspace switcher + DMs list
- [ ] DMs list in sidebar (avatar + participant names preview)

### Modals
- [ ] Start DM modal (search workspace members by name/email; multi-select for group DM)

### Detail Views
- [ ] DM detail view shell (header with participant avatars + empty message area placeholder)

### Floating Chat Dock
- [ ] chatDockStore (Zustand): openBoxes array with { conversationId, minimized, unreadCount }
- [ ] ChatDock component in root layout (persists across page navigation)
- [ ] ChatBox component: participant avatar + name header, minimize/close buttons, message list area, message input
- [ ] Max 3 boxes visible; overflow collapses into stacked icon strip with +N badge
- [ ] Clicking any user avatar/name anywhere in the app opens that DM as a floating chat box
