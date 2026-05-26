'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { Message, Attachment, User } from '@/lib/types';
import { useReactions } from '@/hooks/useThread';
import MessageHoverToolbar from './MessageHoverToolbar';
import ReactionBar from './ReactionBar';
import api from '@/lib/api';
import { Download, FileText } from 'lucide-react';

interface Props {
  messages: Message[];
  currentUser: User;
  hasMore: boolean;
  isLoadingMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onReply: (message: Message) => void;
  className?: string;
}

export default function MessageList({
  messages,
  currentUser,
  hasMore,
  isLoadingMore,
  isLoading,
  onLoadMore,
  onReply,
  className,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(messages.length);
  const isLoadingMoreRef = useRef(isLoadingMore);
  isLoadingMoreRef.current = isLoadingMore;

  useEffect(() => {
    const added = messages.length - prevLengthRef.current;
    prevLengthRef.current = messages.length;
    if (added > 0 && !isLoadingMoreRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || !hasMore || isLoadingMoreRef.current) return;
    if (el.scrollHeight > el.clientHeight && el.scrollTop < el.clientHeight * 0.2) onLoadMore();
  }, [hasMore, onLoadMore]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className ?? ''}`}>
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto ${className ?? ''}`}
    >
      {isLoadingMore && (
        <div className="flex justify-center py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
        </div>
      )}
      {!hasMore && messages.length > 0 && (
        <p className="py-2 text-center text-[11px] text-slate-400">Beginning of conversation</p>
      )}
      {messages.length === 0 && (
        <p className="py-4 text-center text-xs text-slate-400">No messages yet. Say hello!</p>
      )}

      <div className="flex flex-col gap-1 p-3">
        {messages.map((msg) => (
          <MessageRow
            key={msg.id}
            msg={msg}
            currentUser={currentUser}
            onReply={onReply}
          />
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}

// ─── Per-message row (isolated so reactions are per-message) ─────────────────

function MessageRow({
  msg,
  currentUser,
  onReply,
}: {
  msg: Message;
  currentUser: User;
  onReply: (message: Message) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const { reactions, addReaction, toggleReaction } = useReactions(msg.id, currentUser.id);
  const isOwn = (msg.senderId ?? msg.sender?.id) === currentUser.id;

  return (
    <div
      className={`group relative flex gap-2 py-0.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!isOwn && (
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
          {msg.sender.username[0].toUpperCase()}
        </span>
      )}
      <div
        className={`flex max-w-[75%] flex-col gap-0.5 ${
          isOwn ? 'items-end' : 'items-start'
        }`}
      >
        {!isOwn && (
          <span className="text-[10px] font-medium text-slate-500">
            {msg.sender.username}
          </span>
        )}
        <div
          className={`rounded-xl px-3 py-1.5 text-sm leading-snug ${
            isOwn
              ? `bg-indigo-600 text-white ${msg._optimistic ? 'opacity-60' : ''}`
              : 'bg-slate-100 text-slate-900'
          }`}
        >
          {renderContent(msg.content, isOwn)}
        </div>
        {/* Attachments */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="flex flex-col gap-1 pt-0.5">
            {msg.attachments.map((att) => (
              <AttachmentCard key={att.id} attachment={att} isOwn={isOwn} />
            ))}
          </div>
        )}
        <span className="text-[10px] text-slate-400">
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <ReactionBar reactions={reactions} onToggle={toggleReaction} />
      </div>

      {/* Hover toolbar */}
      {hovered && !msg._optimistic && (
        <MessageHoverToolbar
          isOwn={isOwn}
          onReact={(emoji) => { void addReaction(emoji); }}
          onReply={() => onReply(msg)}
        />
      )}
    </div>
  );
}

/** Highlight @mentions in a contrasting colour */
function renderContent(content: string, isOwn: boolean) {
  const parts = content.split(/(@[a-zA-Z0-9_]+)/g);
  return parts.map((part, i) =>
    /^@[a-zA-Z0-9_]+$/.test(part) ? (
      <span
        key={i}
        className={`font-semibold underline decoration-dotted ${
          isOwn ? 'text-indigo-200' : 'text-indigo-600'
        }`}
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}

// ─── Attachment card ──────────────────────────────────────────────────────────

function AttachmentCard({ attachment, isOwn }: { attachment: Attachment; isOwn: boolean }) {
  const isImage = attachment.mimeType.startsWith('image/');
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUrl = useCallback(async () => {
    if (url) return url;
    setLoading(true);
    try {
      const res = await api.get<{ url: string }>(`/attachments/${attachment.id}/url`);
      setUrl(res.data.url);
      return res.data.url;
    } finally {
      setLoading(false);
    }
  }, [attachment.id, url]);

  // Auto-load presigned URL for images on mount
  useEffect(() => {
    if (isImage) { void fetchUrl(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = useCallback(async () => {
    const href = await fetchUrl();
    if (!href) return;
    const a = document.createElement('a');
    a.href = href;
    a.download = attachment.originalFilename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  }, [fetchUrl, attachment.originalFilename]);

  const sizeLabel =
    attachment.sizeBytes < 1024
      ? `${attachment.sizeBytes} B`
      : attachment.sizeBytes < 1024 * 1024
        ? `${(attachment.sizeBytes / 1024).toFixed(1)} KB`
        : `${(attachment.sizeBytes / 1024 / 1024).toFixed(1)} MB`;

  if (isImage) {
    return (
      <div className="overflow-hidden rounded-lg">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={attachment.originalFilename}
            className="max-h-48 max-w-full cursor-pointer rounded-lg object-contain"
            onClick={handleDownload}
          />
        ) : (
          <div className={`flex h-24 w-40 items-center justify-center rounded-lg ${isOwn ? 'bg-indigo-500' : 'bg-slate-200'}`}>
            {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isOwn ? 'bg-indigo-500' : 'bg-slate-200'}`}>
      <FileText className={`h-5 w-5 shrink-0 ${isOwn ? 'text-indigo-100' : 'text-slate-500'}`} />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-xs font-medium ${isOwn ? 'text-white' : 'text-slate-800'}`}>
          {attachment.originalFilename}
        </p>
        <p className={`text-[10px] ${isOwn ? 'text-indigo-200' : 'text-slate-500'}`}>{sizeLabel}</p>
      </div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className={`shrink-0 rounded p-1 transition-colors disabled:opacity-50 ${
          isOwn ? 'text-indigo-100 hover:bg-indigo-400' : 'text-slate-500 hover:bg-slate-300'
        }`}
        title="Download"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}

