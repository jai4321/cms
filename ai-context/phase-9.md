# Phase 9 - Channels

Status: Not started (0/16)
Backend: 0/12 | Frontend: 0/4

---

## Backend (0/12)

### Schema
- [ ] channels table: id, workspace_id (FK), name, description, is_private, is_archived, created_by (FK users), created_at, updated_at
- [ ] channel_members table: id, channel_id (FK), user_id (FK), joined_at
- [ ] Add channel_id (FK nullable) to messages table via Drizzle migration

### Channel Endpoints
- [ ] POST   /workspaces/:id/channels - create channel (requester auto-joins as first member)
- [ ] GET    /workspaces/:id/channels - list channels (public: all; private: joined only)
- [ ] PATCH  /channels/:id - update name/description (admin+)
- [ ] POST   /channels/:id/join - join a public channel
- [ ] POST   /channels/:id/leave - leave a channel
- [ ] PATCH  /channels/:id/archive - archive channel (admin+)

### Message Endpoints (Channel)
- [ ] POST /channels/:id/messages - send message to channel
- [ ] GET  /channels/:id/messages?cursor=&limit= - paginated channel message history

### Socket.IO
- [ ] Extend gateway: room join for channel:channelId rooms on connect
- [ ] Extend ChannelMemberGuard to block non-members from private channel rooms

---

## Frontend (0/4)

- [ ] Channel list in sidebar (with unread indicator)
- [ ] Create channel modal (name, description, public/private toggle)
- [ ] Channel detail view (header + message list wired to channel socket room)
- [ ] Workspace settings: manage channels (archive, edit name/description)
