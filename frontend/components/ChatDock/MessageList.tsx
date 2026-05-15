'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { Message, User } from '@/lib/types';
import { useReactions } from '@/hooks/useThread';
import MessageHoverToolbar from './MessageHoverToolbar';
import ReactionBar from './ReactionBar';

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
    if (el.scrollTop < 80) onLoadMore();
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

