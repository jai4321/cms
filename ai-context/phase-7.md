# Phase 7 - User Presence and Notifications

Status: Not started (0/13)
Backend: 0/7 | Frontend: 0/6

---

## Backend (0/7)

### Presence
- [ ] PresenceService: userId->status in Redis with 30s TTL (key: presence:{userId})
- [ ] Socket event presence:update { status: online|away|offline|dnd } - update Redis, broadcast to workspace room
- [ ] Heartbeat: client sends presence:heartbeat every 20s; server refreshes TTL; no heartbeat = expire = offline
- [ ] presence:get event - return status map for a list of userIds

### Notifications
- [ ] notifications table: id, recipient_id (FK), type (mention/thread_reply/dm), payload (jsonb), is_read, created_at
- [ ] Emit notification socket event to recipient on @mention, thread reply, new DM received
- [ ] GET  /notifications - list for current user (paginated, newest first)
- [ ] PATCH /notifications/read - mark all or specific ids as read

---

## Frontend (0/6)

- [ ] Presence dot component (green=online, yellow=away, grey=offline, red=dnd) on all avatars
- [ ] Presence dot visible in floating chat dock box headers
- [ ] Manual status selector dropdown in user menu / sidebar bottom
- [ ] Notification bell with unread count badge in top navigation bar
- [ ] Notification dropdown panel (type icon, message preview, timestamp; click to navigate)
- [ ] Browser Web Notifications API (request permission on login; OS notification on mention/DM when tab unfocused)
