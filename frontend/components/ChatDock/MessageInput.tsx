'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send } from 'lucide-react';
import api from '@/lib/api';

interface MemberHint {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

interface Props {
  onSend: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  workspaceId?: string;
}

export default function MessageInput({ onSend, onTyping, placeholder, disabled, workspaceId }: Props) {
  const [value, setValue] = useState('');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
    setMentionQuery(null);
    emitStopTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, [value, onSend, emitStopTyping]);

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

  return (
    <div className="relative flex w-full items-end gap-2">
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

      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? 'Write a message…'}
        disabled={disabled}
        rows={1}
        className="min-w-0 flex-1 resize-none rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
        style={{ maxHeight: '80px', overflowY: 'auto' }}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}

