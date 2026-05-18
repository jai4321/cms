'use client';

import { useChatDockStore } from '@/store/chat-dock.store';
import ChatBox from './ChatBox';

export default function ChatDock() {
  const { openBoxes, fullscreenConversationId } = useChatDockStore();

  // Hide boxes that are open in fullscreen — they render via ChatFullscreen instead
  const dockBoxes = openBoxes.filter((b) => b.conversationId !== fullscreenConversationId);

  if (dockBoxes.length === 0) return null;

  return (
    <>
      {/* Dock: all open boxes anchored bottom-right */}
      <div className="fixed bottom-0 right-4 z-40 flex items-end gap-3">
        {dockBoxes.map((box) => (
          <ChatBox key={box.conversationId} box={box} />
        ))}
      </div>
    </>
  );
}
