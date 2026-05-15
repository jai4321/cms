'use client';

import { useState } from 'react';
import { SmilePlus, MessageSquareReply, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import ReactionPicker from './ReactionPicker';

interface Props {
  isOwn: boolean;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function MessageHoverToolbar({ isOwn, onReact, onReply, onEdit, onDelete }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [showMore, setShowMore] = useState(false);

  return (
    <div
      className={`absolute -top-6 flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1 py-0.5 shadow-md ${
        isOwn ? 'right-0' : 'left-0'
      }`}
    >
      {/* React */}
      <div className="relative">
        <button
          onClick={() => { setShowPicker((v) => !v); setShowMore(false); }}
          className="flex h-6 w-6 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title="React"
        >
          <SmilePlus className="h-3.5 w-3.5" />
        </button>
        {showPicker && (
          <ReactionPicker
            onSelect={onReact}
            onClose={() => setShowPicker(false)}
            align={isOwn ? 'right' : 'left'}
          />
        )}
      </div>

      {/* Reply (thread) */}
      <button
        onClick={onReply}
        className="flex h-6 w-6 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        title="Reply in thread"
      >
        <MessageSquareReply className="h-3.5 w-3.5" />
      </button>

      {/* More (edit/delete — own messages only) */}
      {isOwn && (
        <div className="relative">
          <button
            onClick={() => { setShowMore((v) => !v); setShowPicker(false); }}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            title="More"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {showMore && (
            <div className="absolute top-full right-0 z-50 mt-1 min-w-[120px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
              {onEdit && (
                <button
                  onClick={() => { onEdit(); setShowMore(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => { onDelete(); setShowMore(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
