# Phase 8 - Search

Status: Not started (0/5)
Backend: 0/2 | Frontend: 0/3

---

## Backend (0/2)

- [ ] Add tsvector search_vector column to messages; populate via trigger or on-write; GIN index
- [ ] GET /workspaces/:id/search?q=&channelId=&userId=&from=&to=&limit=&cursor= - full-text search with filters; return results with channel name, sender, timestamp, content snippet

---

## Frontend (0/3)

- [ ] Global search bar in top navigation (Ctrl+K opens as modal/command palette)
- [ ] Search results with filter controls (channel picker, user picker, date range)
- [ ] Jump-to-message: click result to navigate to channel/DM and scroll to and highlight the message
