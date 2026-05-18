# Phase 7 - User Presence and Notifications

Status: COMPLETE (13/13)
Backend: 7/7 | Frontend: 6/6
Backend: 7/7 | Frontend: 0/6

---

## Backend (7/7)

### Presence
- [x] PresenceService: userId->status in Redis with 30s TTL (key: presence:{userId})
- [x] Socket event presence:update { status: online|away|offline|dnd } - update Redis, broadcast to workspace room
- [x] Heartbeat: client sends presence:heartbeat every 20s; server refreshes TTL; no heartbeat = expire = offline
- [x] presence:get event - return status map for a list of userIds

### Notifications
- [x] notifications table: id, recipient_id (FK), type (mention/thread_reply/dm), payload (jsonb), is_read, created_at
- [x] Emit notification socket event to recipient on @mention, thread reply, new DM received
- [x] GET  /notifications - list for current user (paginated, newest first)
- [x] PATCH /notifications/read - mark all or specific ids as read

---

## Frontend (6/6)

- [x] Presence dot component (green=online, yellow=away, grey=offline, red=dnd) on all avatars
- [x] Presence dot visible in floating chat dock box headers
- [x] Manual status selector dropdown in user menu / sidebar bottom
- [x] Notification bell with unread count badge in top navigation bar
- [x] Notification dropdown panel (type icon, message preview, timestamp; click to navigate)
- [x] Browser Web Notifications API (request permission on login; OS notification on mention/DM when tab unfocused)
