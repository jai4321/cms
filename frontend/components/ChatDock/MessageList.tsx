'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Message, User } from '@/lib/types';

interface Props {
  messages: Message[];
  currentUser: User;
  hasMore: boolean;
  isLoadingMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  className?: string;
}

export default function MessageList({
  messages,
  currentUser,
  hasMore,
  isLoadingMore,
  isLoading,
  onLoadMore,
  className,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(messages.length);
  const isLoadingMoreRef = useRef(isLoadingMore);
  isLoadingMoreRef.current = isLoadingMore;

  // Scroll to bottom when new messages are appended (not when prepending older ones)
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
    if (el.scrollTop < 80) {
      onLoadMore();
    }
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
        <p className="py-2 text-center text-[11px] text-slate-400">
          Beginning of conversation
        </p>
      )}
      {messages.length === 0 && (
        <p className="py-4 text-center text-xs text-slate-400">
          No messages yet. Say hello!
        </p>
      )}

      <div className="flex flex-col gap-1 p-3">
        {messages.map((msg) => {
          const isOwn = (msg.senderId ?? msg.sender?.id) === currentUser.id;
          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
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
                  {msg.content}
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
