# Phase 5 - Threads, Reactions, Mentions

Status: Not started (0/13)
Backend: 0/8 | Frontend: 0/5

---

## Backend (0/8)

### Schema
- [ ] thread_messages table: id, parent_message_id (FK messages), sender_id (FK), content, edited_at, deleted_at, created_at
- [ ] reactions table: id, message_id (FK), user_id (FK), emoji, created_at - UNIQUE(message_id, user_id, emoji)
- [ ] mentions table: id, message_id (FK), mentioned_user_id (FK), created_at

### Thread Endpoints
- [ ] POST /messages/:id/replies - post reply to thread
- [ ] GET  /messages/:id/replies - list thread replies (paginated)

### Reaction Endpoints
- [ ] POST   /messages/:id/reactions - add reaction { emoji }
- [ ] DELETE /messages/:id/reactions/:emoji - remove current user reaction

### Mentions and Events
- [ ] Parse @mention format in message content, lookup userIds by username
- [ ] Insert into mentions table on message save
- [ ] Emit notification socket event to mentioned user
- [ ] Track unread thread reply counts per user

---

## Frontend (0/5)

- [ ] Thread panel (right sidebar, opens on Reply click, shows parent + replies)
- [ ] Emoji reaction picker (popover on hover, use emoji-mart or similar)
- [ ] Hover toolbar per message: React, Reply, More options (edit/delete)
- [ ] @ autocomplete dropdown in message input (trigger on @, search users, insert tag)
- [ ] Mention highlighting in rendered message content
