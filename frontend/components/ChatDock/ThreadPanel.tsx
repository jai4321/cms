'use client';

import { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Message } from '@/lib/types';
import { useThread } from '@/hooks/useThread';
import { useAuthStore } from '@/store/auth.store';
import Avatar from '@/components/Avatar';
import MessageInput from './MessageInput';

interface Props {
  parentMessage: Message;
  onClose: () => void;
}

export default function ThreadPanel({ parentMessage, onClose }: Props) {
  const { user } = useAuthStore();
  const { replies, isLoading, isSending, postReply } = useThread(parentMessage);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies.length]);

  if (!user) return null;

  return (
    <div className="flex w-72 shrink-0 flex-col border-l border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">Thread</h3>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Parent message */}
        <div className="border-b border-slate-100 p-3">
          <div className="flex items-start gap-2">
            <Avatar
              name={parentMessage.sender.username}
              avatarUrl={parentMessage.sender.avatarUrl}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-slate-700">
                {parentMessage.sender.username}
              </span>
              <p className="mt-0.5 text-sm text-slate-800 break-words">{parentMessage.content}</p>
              <span className="text-[10px] text-slate-400">
                {new Date(parentMessage.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </p>
        </div>

        {/* Replies */}
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
            </div>
          )}
          {!isLoading && replies.length === 0 && (
            <p className="py-4 text-center text-xs text-slate-400">No replies yet.</p>
          )}
          <div className="flex flex-col gap-3">
            {replies.map((reply) => {
              const isOwn = reply.sender.id === user.id;
              return (
                <div key={reply.id} className="flex items-start gap-2">
                  <Avatar
                    name={reply.sender.username}
                    avatarUrl={reply.sender.avatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-[11px] font-semibold ${isOwn ? 'text-indigo-600' : 'text-slate-700'}`}>
                        {reply.sender.username}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(reply.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-800 break-words">
                      {renderContent(reply.content)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div ref={bottomRef} />
        </div>

        {/* Reply input */}
        <div className="border-t border-slate-200 p-3">
          <MessageInput
            onSend={(content) => { void postReply(content); }}
            onTyping={() => {}}
            placeholder="Reply…"
            disabled={isSending}
          />
        </div>
      </div>
    </div>
  );
}

/** Highlight @mentions in blue */
function renderContent(content: string) {
  const parts = content.split(/(@[a-zA-Z0-9_]+)/g);
  return parts.map((part, i) =>
    /^@[a-zA-Z0-9_]+$/.test(part) ? (
      <span key={i} className="font-medium text-indigo-600">
        {part}
      </span>
    ) : (
      part
    ),
  );
}
