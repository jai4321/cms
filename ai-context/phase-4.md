# Phase 4 - Real-time Messaging (Core)

Status: Not started (0/15)
Backend: 0/9 | Frontend: 0/7

---

## Backend (0/9)

### Schema
- [ ] messages table: id, conversation_id (FK), sender_id (FK), content, edited_at, deleted_at, created_at
- [ ] message_reads table: id, message_id (FK), user_id (FK), read_at

### REST Endpoints
- [ ] POST /dm/:id/messages - send message to a DM conversation
- [ ] GET  /dm/:id/messages?cursor=&limit= - paginated DM message history (cursor-based)

### Socket.IO Gateway
- [ ] Install: @nestjs/websockets, socket.io, @socket.io/redis-adapter, ioredis
- [ ] Socket.IO gateway with JWT handshake auth (token from handshake.auth.token)
- [ ] Redis pub/sub adapter for multi-instance readiness
- [ ] Room join on connect: dm:conversationId (user joins rooms for all their DM conversations)
- [ ] message:send event - save to DB, broadcast to room with sender info populated
- [ ] message:typing event - ephemeral broadcast to room (no DB write)
- [ ] Handle disconnect: leave rooms

---

## Frontend (0/7)

- [ ] Socket.IO client singleton (lib/socket.ts) with JWT in handshake, auto-reconnect
- [ ] Virtualized message list with reverse infinite scroll (load older on scroll to top)
- [ ] Message input: Enter to send, Shift+Enter for newline
- [ ] Typing indicator: debounce input, emit message:typing, show "X is typing..." in header
- [ ] Unread badge on sidebar items (increment on incoming message when not focused)
- [ ] Optimistic UI: append message instantly, replace with server-confirmed on socket ack
- [ ] Wire socket into floating chat dock boxes (subscribe on open, unsubscribe on close, increment unreadCount on minimize)
