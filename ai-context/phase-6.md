# Phase 6 - File and Media Attachments

Status: Not started (0/12)
Backend: 0/6 | Frontend: 0/6

---

## Backend (0/6)

### Infrastructure
- [ ] Add MinIO to docker-compose.yml (image: minio/minio, ports 9000/9001, MINIO_ROOT_USER/PASSWORD env vars)

### Schema
- [ ] attachments table: id, message_id (FK nullable), uploader_id (FK), bucket, object_key, original_filename, mime_type, size_bytes, created_at

### Endpoints and Services
- [ ] POST /upload - multipart upload; validate MIME allowlist and max 25 MB; store in MinIO; return attachment record
- [ ] GET  /attachments/:id/url - generate presigned download URL (1h expiry) with channel/DM access check
- [ ] Accept optional attachmentIds array in message send body; link attachments to message
- [ ] MinioService wrapper: upload, getPresignedUrl, delete

---

## Frontend (0/6)

- [ ] Drag-and-drop upload zone over message input (react-dropzone or native dragover events)
- [ ] Paste image to upload (clipboard paste event handler)
- [ ] Upload progress bar shown in message input area
- [ ] Inline image preview in messages (img tag for image/* mime types)
- [ ] File card for non-image attachments (filename, size, download button using presigned URL)
- [ ] Attachment gallery in channel/DM info panel (grid of all shared media)
