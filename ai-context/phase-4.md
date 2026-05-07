# Phase 4 - Real-time Messaging (Core)

Status: DONE (16/16)
Backend: 9/9 | Frontend: 7/7

---

## Backend (9/9)

### Schema
- [x] messages table: id, conversation_id (FK), sender_id (FK), content, edited_at, deleted_at, created_at
- [x] message_reads table: id, message_id (FK), user_id (FK), read_at

### REST Endpoints
- [x] POST /dm/:id/messages - send message to a DM conversation
- [x] GET  /dm/:id/messages?cursor=&limit= - paginated DM message history (cursor-based)

### Socket.IO Gateway
- [x] Install: @nestjs/websockets, socket.io, @socket.io/redis-adapter, ioredis
- [x] Socket.IO gateway with JWT handshake auth (token from handshake.auth.token)
- [x] Redis pub/sub adapter for multi-instance readiness
- [x] Room join on connect: dm:conversationId (user joins rooms for all their DM conversations)
- [x] message:send event - save to DB, broadcast to room with sender info populated
- [x] message:typing event - ephemeral broadcast to room (no DB write)
- [x] Handle disconnect: leave rooms

---

## Frontend (7/7)

- [x] Socket.IO client singleton (lib/socket.ts) with JWT in handshake, auto-reconnect
- [x] Virtualized message list with reverse infinite scroll (load older on scroll to top)
- [x] Message input: Enter to send, Shift+Enter for newline
- [x] Typing indicator: debounce input, emit message:typing, show "X is typing..." in header
- [x] Unread badge on sidebar items (increment on incoming message when not focused)
- [x] Optimistic UI: append message instantly, replace with server-confirmed on socket ack
- [x] Wire socket into floating chat dock boxes (subscribe on open, unsubscribe on close, increment unreadCount on minimize)
