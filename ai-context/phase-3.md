# Phase 3 - Channels and Direct Messages (Structure)

Status: Not started (0/21)
Backend: 0/10 | Frontend: 0/11

---

## Backend (0/10)

### Schema
- [ ] channels table: id, workspace_id (FK), name, description, is_private, is_archived, created_by (FK), created_at, updated_at
- [ ] channel_members table: id, channel_id (FK), user_id (FK), joined_at
- [ ] direct_message_conversations table: id, workspace_id (FK), created_at
- [ ] dm_participants table: id, conversation_id (FK), user_id (FK)

### Channel Endpoints
- [ ] POST   /workspaces/:id/channels - create channel
- [ ] GET    /workspaces/:id/channels - list channels (public: all; private: joined only)
- [ ] PATCH  /channels/:id - update name/description
- [ ] POST   /channels/:id/join - join public channel
- [ ] POST   /channels/:id/leave - leave channel
- [ ] PATCH  /channels/:id/archive - archive channel (admin+)

### DM Endpoints
- [ ] POST /workspaces/:id/dm - create or retrieve existing 1:1 DM conversation
- [ ] GET  /workspaces/:id/dm - list all DM conversations for current user
- [ ] POST /dm/:id/participants - add participant (group DM)

### Validation
- [ ] Membership guard on all channel and DM endpoints

---

## Frontend (0/11)

### Layout
- [ ] Root app layout with left sidebar: workspace switcher + channels list + DMs list
- [ ] Channel list in sidebar (with unread indicator placeholder)
- [ ] DMs list in sidebar (avatar + name)

### Modals
- [ ] Create channel modal (name, description, public/private toggle)
- [ ] Start DM modal (search users by name/email, click to open DM)

### Detail Views
- [ ] Channel detail view shell (header + empty message area)
- [ ] DM detail view shell (header with participant avatars + empty message area)

### Floating Chat Dock
- [ ] chatDockStore (Zustand): openBoxes array with { conversationId, minimized, unreadCount }
- [ ] ChatDock component in root layout (persists across page navigation)
- [ ] ChatBox component: avatar + name header, minimize/close buttons, message list area, message input
- [ ] Max 3 boxes visible; overflow collapses into stacked icon strip with +N badge
- [ ] Clicking any user avatar/name anywhere opens that DM as a floating chat box
