'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import api from '@/lib/api';
import type { Attachment } from '@/lib/types';

interface MemberHint {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

interface StagedFile {
  localId: string;
  file: File;
  progress: number;
  attachment?: Attachment;
  error?: string;
}

interface Props {
  onSend: (content: string, attachmentIds?: string[]) => void;
  onTyping: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  workspaceId?: string;
}

export default function MessageInput({ onSend, onTyping, placeholder, disabled, workspaceId }: Props) {
  const [value, setValue] = useState('');
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // @ autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(-1);
  const [members, setMembers] = useState<MemberHint[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberHint[]>([]);
  const [activeMentionIdx, setActiveMentionIdx] = useState(0);

  // Fetch workspace members when first needed
  useEffect(() => {
    if (mentionQuery === null || !workspaceId || members.length > 0) return;
    api
      .get<{ user: MemberHint }[]>(`/workspaces/${workspaceId}/members`)
      .then((res) => setMembers(res.data.map((m) => m.user)))
      .catch(() => {});
  }, [mentionQuery, workspaceId, members.length]);

  // Filter members as query changes
  useEffect(() => {
    if (mentionQuery === null) {
      setFilteredMembers([]);
      return;
    }
    const q = mentionQuery.toLowerCase();
    setFilteredMembers(
      members.filter((m) => m.username.toLowerCase().startsWith(q)).slice(0, 6),
    );
    setActiveMentionIdx(0);
  }, [mentionQuery, members]);

  const emitStopTyping = useCallback(() => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTyping(false);
    }
  }, [onTyping]);

  const detectMention = useCallback((text: string, cursorPos: number) => {
    // Walk backwards from cursor to find an unbroken @word
    const slice = text.slice(0, cursorPos);
    const match = /@([a-zA-Z0-9_]*)$/.exec(slice);
    if (match) {
      setMentionQuery(match[1]);
      setMentionStart(match.index);
    } else {
      setMentionQuery(null);
      setMentionStart(-1);
    }
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newVal = e.target.value;
      setValue(newVal);
      detectMention(newVal, e.target.selectionStart ?? newVal.length);

      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTyping(true);
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(emitStopTyping, 2000);
    },
    [onTyping, emitStopTyping, detectMention],
  );

  const insertMention = useCallback(
    (username: string) => {
      const before = value.slice(0, mentionStart);
      const after = value.slice(mentionStart + 1 + (mentionQuery?.length ?? 0));
      const newVal = `${before}@${username} ${after}`;
      setValue(newVal);
      setMentionQuery(null);
      setMentionStart(-1);
      setTimeout(() => {
        const ta = textareaRef.current;
        if (ta) {
          const pos = before.length + username.length + 2; // @username + space
          ta.setSelectionRange(pos, pos);
          ta.focus();
        }
      }, 0);
    },
    [value, mentionStart, mentionQuery],
  );

  // ─── File upload via XHR for progress tracking ───────────────────────────────

  const uploadFile = useCallback((file: File) => {
    const localId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setStagedFiles((prev) => [...prev, { localId, file, progress: 0 }]);

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setStagedFiles((prev) =>
          prev.map((s) => (s.localId === localId ? { ...s, progress: pct } : s)),
        );
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const attachment = JSON.parse(xhr.responseText) as Attachment;
        setStagedFiles((prev) =>
          prev.map((s) => (s.localId === localId ? { ...s, progress: 100, attachment } : s)),
        );
      } else {
        setStagedFiles((prev) =>
          prev.map((s) => (s.localId === localId ? { ...s, error: 'Upload failed' } : s)),
        );
      }
    });

    xhr.addEventListener('error', () => {
      setStagedFiles((prev) =>
        prev.map((s) => (s.localId === localId ? { ...s, error: 'Network error' } : s)),
      );
    });

    const token = (() => {
      try {
        const raw = localStorage.getItem('auth-storage');
        if (!raw) return '';
        const parsed = JSON.parse(raw) as { state?: { accessToken?: string } };
        return parsed?.state?.accessToken ?? '';
      } catch { return ''; }
    })();

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    xhr.open('POST', `${apiBase}/upload`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  }, []);

  const handleFiles = useCallback(
    (files: FileList | File[]) => { Array.from(files).forEach(uploadFile); },
    [uploadFile],
  );

  const removeStagedFile = useCallback((localId: string) => {
    setStagedFiles((prev) => prev.filter((s) => s.localId !== localId));
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const imageFiles = Array.from(e.clipboardData.files).filter((f) =>
        f.type.startsWith('image/'),
      );
      if (imageFiles.length > 0) {
        e.preventDefault();
        handleFiles(imageFiles);
      }
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    const readyAttachments = stagedFiles.filter((s) => s.attachment);
    const isUploading = stagedFiles.some((s) => !s.attachment && !s.error);
    if (!trimmed && readyAttachments.length === 0) return;
    if (isUploading) return;

    const attachmentIds = readyAttachments.map((s) => s.attachment!.id);
    onSend(trimmed || '\u200b', attachmentIds.length > 0 ? attachmentIds : undefined);
    setValue('');
    setStagedFiles([]);
    setMentionQuery(null);
    emitStopTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, [value, stagedFiles, onSend, emitStopTyping]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Navigate autocomplete with arrow keys
      if (mentionQuery !== null && filteredMembers.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveMentionIdx((i) => Math.min(i + 1, filteredMembers.length - 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveMentionIdx((i) => Math.max(i - 1, 0));
          return;
        }
        if (e.key === 'Tab' || e.key === 'Enter') {
          e.preventDefault();
          insertMention(filteredMembers[activeMentionIdx].username);
          return;
        }
        if (e.key === 'Escape') {
          setMentionQuery(null);
          return;
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, mentionQuery, filteredMembers, activeMentionIdx, insertMention],
  );

  const isUploading = stagedFiles.some((s) => !s.attachment && !s.error);
  const canSend = !disabled && !isUploading && (value.trim().length > 0 || stagedFiles.some((s) => s.attachment));

  return (
    <div
      className={`relative flex flex-col gap-1 rounded-lg border transition-colors ${
        isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Staged file chips */}
      {stagedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-2 pt-2">
          {stagedFiles.map((staged) => (
            <StagedFileChip key={staged.localId} staged={staged} onRemove={removeStagedFile} />
          ))}
        </div>
      )}

      {/* Drag overlay hint */}
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-indigo-50/80">
          <p className="text-sm font-medium text-indigo-600">Drop files here</p>
        </div>
      )}

      {/* @ autocomplete dropdown */}
      {mentionQuery !== null && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
          {filteredMembers.map((m, i) => (
            <button
              key={m.id}
              onMouseDown={(e) => { e.preventDefault(); insertMention(m.username); }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm text-slate-700 ${
                i === activeMentionIdx ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'
              }`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white">
                {m.username[0].toUpperCase()}
              </span>
              <span className="truncate">@{m.username}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1 px-2 pb-1.5 pt-1">
        {/* Paperclip */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-40"
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }}
        />

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={isDragging ? 'Drop files here…' : (placeholder ?? 'Write a message…')}
          disabled={disabled}
          rows={1}
          className="min-w-0 flex-1 resize-none bg-transparent py-1 text-sm outline-none disabled:opacity-50"
          style={{ maxHeight: '80px', overflowY: 'auto' }}
        />

        <button
          onClick={handleSubmit}
          disabled={!canSend}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
          title={isUploading ? 'Uploading…' : 'Send'}
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Staged file chip ────────────────────────────────────────────────────────

function StagedFileChip({
  staged,
  onRemove,
}: {
  staged: StagedFile;
  onRemove: (id: string) => void;
}) {
  const isImage = staged.file.type.startsWith('image/');
  const [previewUrl] = useState(() =>
    isImage ? URL.createObjectURL(staged.file) : null,
  );

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  return (
    <div className="relative flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 p-1.5">
      {isImage && previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={staged.file.name} className="h-10 w-10 rounded object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-200 text-[9px] font-bold uppercase text-slate-500">
          {staged.file.name.split('.').pop()?.slice(0, 4)}
        </div>
      )}
      <div className="flex max-w-[80px] flex-col gap-0.5">
        <span className="truncate text-[10px] text-slate-600">{staged.file.name}</span>
        {staged.error ? (
          <span className="text-[10px] text-red-500">{staged.error}</span>
        ) : staged.attachment ? (
          <span className="text-[10px] text-green-600">Ready</span>
        ) : (
          <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${staged.progress}%` }}
            />
          </div>
        )}
      </div>
      <button
        onClick={() => onRemove(staged.localId)}
        className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-500 text-white hover:bg-red-500"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

