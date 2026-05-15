'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Pencil, Check, Plus, Search, LogOut, Images } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useMessageStore } from '@/store/message.store';
import type { Attachment, DmConversation, DmParticipant, WorkspaceMember } from '@/lib/types';
import api from '@/lib/api';
import Avatar from '@/components/Avatar';

interface Props {
  conversation: DmConversation;
  onClose: () => void;
  onConversationUpdate: (updated: Partial<DmConversation>) => void;
  onLeave: () => void;
}

export default function GroupInfoPanel({
  conversation,
  onClose,
  onConversationUpdate,
  onLeave,
}: Props) {
  const { user } = useAuthStore();
  const { activeWorkspace } = useWorkspaceStore();
  const { conversations } = useMessageStore();

  // Collect all attachments from loaded messages
  const sharedMedia = (conversations[conversation.id]?.items ?? [])
    .flatMap((m) => m.attachments ?? [])
    .filter((a) => a.mimeType.startsWith('image/'));

  const sharedFiles = (conversations[conversation.id]?.items ?? [])
    .flatMap((m) => m.attachments ?? [])
    .filter((a) => !a.mimeType.startsWith('image/'));

  // ─── Rename ───────────────────────────────────────────────────────────────────
  const canRename =
    conversation.createdBy === user?.id ||
    activeWorkspace?.role === 'owner' ||
    activeWorkspace?.role === 'admin';

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(conversation.name ?? '');
  const [renaming, setRenaming] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

  const handleRenameSave = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === conversation.name) {
      setEditingName(false);
      return;
    }
    setRenaming(true);
    try {
      await api.patch(`/dm/${conversation.id}/name`, { name: trimmed });
      onConversationUpdate({ name: trimmed });
      setEditingName(false);
    } catch {
      // ignore
    } finally {
      setRenaming(false);
    }
  };

  // ─── Add member ───────────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (!addOpen || !activeWorkspace) return;
    api
      .get<WorkspaceMember[]>(`/workspaces/${activeWorkspace.id}/members`)
      .then((res) => {
        const existingIds = new Set(conversation.participants.map((p) => p.userId));
        setWorkspaceMembers(res.data.filter((m) => !existingIds.has(m.user.id)));
      })
      .catch(() => {});
  }, [addOpen, activeWorkspace?.id]);

  const filteredMembers = workspaceMembers.filter(
    (m) =>
      m.user.username.toLowerCase().includes(memberQuery.toLowerCase()) ||
      m.user.email.toLowerCase().includes(memberQuery.toLowerCase()),
  );

  const handleAddMember = async (member: WorkspaceMember) => {
    setAddingId(member.user.id);
    try {
      await api.post(`/dm/${conversation.id}/participants`, { userId: member.user.id });
      const newParticipant: DmParticipant = {
        userId: member.user.id,
        username: member.user.username,
        avatarUrl: member.user.avatarUrl ?? null,
      };
      onConversationUpdate({
        participants: [...conversation.participants, newParticipant],
      });
      setWorkspaceMembers((prev) => prev.filter((m) => m.user.id !== member.user.id));
      setMemberQuery('');
    } catch {
      // ignore
    } finally {
      setAddingId(null);
    }
  };

  // ─── Leave ────────────────────────────────────────────────────────────────────
  const [leaving, setLeaving] = useState(false);

  const handleLeave = async () => {
    if (!confirm('Leave this group conversation?')) return;
    setLeaving(true);
    try {
      await api.delete(`/dm/${conversation.id}/leave`);
      onLeave();
    } catch {
      // ignore
    } finally {
      setLeaving(false);
    }
  };

  const formattedDate = new Date(conversation.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
        <h2 className="text-sm font-semibold text-slate-900">Group Info</h2>
        <button
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
        {/* Group name */}
        <section>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Group Name
          </p>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                ref={nameInputRef}
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSave();
                  if (e.key === 'Escape') setEditingName(false);
                }}
                maxLength={100}
                className="min-w-0 flex-1 rounded border border-indigo-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <button
                onClick={handleRenameSave}
                disabled={renaming}
                className="rounded p-1 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                {conversation.name || <span className="text-slate-400 italic">No name set</span>}
              </span>
              {canRename && (
                <button
                  onClick={() => {
                    setNameValue(conversation.name ?? '');
                    setEditingName(true);
                  }}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </section>

        {/* Created */}
        <section>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Created
          </p>
          <p className="text-sm text-slate-700">{formattedDate}</p>
        </section>

        {/* Members */}
        <section className="flex flex-1 flex-col">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Members ({conversation.participants.length})
            </p>
            <button
              onClick={() => setAddOpen((v) => !v)}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title="Add member"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Add member search */}
          {addOpen && (
            <div className="mb-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
              <div className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2 py-1.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search members…"
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400"
                />
              </div>
              <ul className="mt-1 max-h-32 overflow-y-auto">
                {filteredMembers.length === 0 && (
                  <li className="py-2 text-center text-xs text-slate-400">
                    {workspaceMembers.length === 0 ? 'All members added' : 'No results'}
                  </li>
                )}
                {filteredMembers.map((m) => (
                  <li key={m.user.id}>
                    <button
                      onClick={() => handleAddMember(m)}
                      disabled={addingId === m.user.id}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-slate-100 disabled:opacity-50 transition-colors"
                    >
                      <Avatar name={m.user.username} avatarUrl={m.user.avatarUrl} />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-800">
                        {m.user.username}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Participant list */}
          <ul className="flex flex-col gap-1">
            {conversation.participants.map((p) => {
              const isMe = p.userId === user?.id;
              const isCreator = p.userId === conversation.createdBy;
              return (
                <li key={p.userId} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
                  <Avatar name={p.username} avatarUrl={p.avatarUrl} />
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-800">
                    {p.username}
                    {isMe && <span className="ml-1 text-slate-400">(you)</span>}
                  </span>
                  {isCreator && (
                    <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                      Creator
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* Shared Media */}
        {sharedMedia.length > 0 && (
          <section>
            <div className="mb-2 flex items-center gap-1.5">
              <Images className="h-3.5 w-3.5 text-slate-400" />
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Shared Media
              </p>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {sharedMedia.map((att) => (
                <GalleryImage key={att.id} attachment={att} />
              ))}
            </div>
          </section>
        )}

        {/* Shared Files */}
        {sharedFiles.length > 0 && (
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Shared Files
            </p>
            <ul className="flex flex-col gap-1">
              {sharedFiles.map((att) => (
                <GalleryFileRow key={att.id} attachment={att} />
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Leave group */}
      <div className="border-t border-slate-200 px-4 py-3">
        <button
          onClick={handleLeave}
          disabled={leaving}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {leaving ? 'Leaving…' : 'Leave Group'}
        </button>
      </div>
    </aside>
  );
}

// ─── Gallery helpers ──────────────────────────────────────────────────────────

function GalleryImage({ attachment }: { attachment: Attachment }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ url: string }>(`/attachments/${attachment.id}/url`)
      .then((res) => setUrl(res.data.url))
      .catch(() => {});
  }, [attachment.id]);

  const handleOpen = useCallback(() => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }, [url]);

  return (
    <button
      onClick={handleOpen}
      className="aspect-square overflow-hidden rounded bg-slate-100"
      title={attachment.originalFilename}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={attachment.originalFilename} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full animate-pulse bg-slate-200" />
      )}
    </button>
  );
}

function GalleryFileRow({ attachment }: { attachment: Attachment }) {
  const handleDownload = useCallback(async () => {
    const res = await api.get<{ url: string }>(`/attachments/${attachment.id}/url`);
    const a = document.createElement('a');
    a.href = res.data.url;
    a.download = attachment.originalFilename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  }, [attachment]);

  const sizeLabel =
    attachment.sizeBytes < 1024 * 1024
      ? `${(attachment.sizeBytes / 1024).toFixed(1)} KB`
      : `${(attachment.sizeBytes / 1024 / 1024).toFixed(1)} MB`;

  return (
    <li>
      <button
        onClick={handleDownload}
        className="flex w-full items-center gap-2 rounded px-1 py-1.5 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-200 text-[8px] font-bold uppercase text-slate-500">
          {attachment.originalFilename.split('.').pop()?.slice(0, 4)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-slate-700">{attachment.originalFilename}</p>
          <p className="text-[10px] text-slate-400">{sizeLabel}</p>
        </div>
      </button>
    </li>
  );
}
