# Phase 3 - Direct Messages

Status: DONE (14/14)
Backend: 6/6 | Frontend: 0/8

---

## Backend (6/6)

### Schema
- [x] direct_message_conversations table: id, workspace_id (FK), created_at
- [x] dm_participants table: id, conversation_id (FK), user_id (FK)

### DM Endpoints
- [x] POST /workspaces/:id/dm - create or retrieve existing DM conversation (1:1 or group; matched by exact participant set)
- [x] GET  /workspaces/:id/dm - list all DM conversations the current user is part of in this workspace
- [x] POST /dm/:id/participants - add a participant to an existing group DM
- [x] GET  /dm/:id/participants - list all participants in a DM conversation

### Validation
- [x] ParticipantGuard - verify requesting user is a participant of the DM conversation before accessing it

---

## Frontend (8/8)

### Layout
- [x] Root app layout with left sidebar: workspace switcher + DMs list
- [x] DMs list in sidebar (avatar + participant names preview)

### Modals
- [x] Start DM modal (search workspace members by name/email; multi-select for group DM)

### Detail Views
- [x] DM detail view shell (header with participant avatars + empty message area placeholder)

### Floating Chat Dock
- [x] chatDockStore (Zustand): openBoxes array with { conversationId, minimized, unreadCount }
- [x] ChatDock component in root layout (persists across page navigation)
- [x] ChatBox component: participant avatar + name header, minimize/close buttons, message list area, message input
- [x] Max 3 boxes visible; overflow collapses into stacked icon strip with +N badge
- [x] Clicking any user avatar/name anywhere in the app opens that DM as a floating chat box
