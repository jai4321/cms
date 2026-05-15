# Phase 5 - Threads, Reactions, Mentions

Status: DONE (13/13)
Backend: 8/8 | Frontend: 5/5

---

## Backend (8/8)

### Schema
- [x] thread_messages table: id, parent_message_id (FK messages), sender_id (FK), content, edited_at, deleted_at, created_at
- [x] reactions table: id, message_id (FK), user_id (FK), emoji, created_at - UNIQUE(message_id, user_id, emoji)
- [x] mentions table: id, message_id (FK), mentioned_user_id (FK), created_at

### Thread Endpoints
- [x] POST /messages/:id/replies - post reply to thread
- [x] GET  /messages/:id/replies - list thread replies (paginated)

### Reaction Endpoints
- [x] POST   /messages/:id/reactions - add reaction { emoji }
- [x] DELETE /messages/:id/reactions/:emoji - remove current user reaction

### Mentions and Events
- [x] Parse @mention format in message content, lookup userIds by username
- [x] Insert into mentions table on message save
- [x] Emit notification socket event to mentioned user
- [x] Track unread thread reply counts per user

---

## Frontend (5/5)

- [x] Thread panel (right sidebar, opens on Reply click, shows parent + replies)
- [x] Emoji reaction picker (popover on hover, use emoji-mart or similar)
- [x] Hover toolbar per message: React, Reply, More options (edit/delete)
- [x] @ autocomplete dropdown in message input (trigger on @, search users, insert tag)
- [x] Mention highlighting in rendered message content
