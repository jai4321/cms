export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export type WorkspaceRole = 'owner' | 'admin' | 'member';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string | null;
  ownerId: string;
  role: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  role: WorkspaceRole;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    username: string;
    avatarUrl?: string | null;
  };
}

export interface DmParticipant {
  userId: string;
  username: string;
  avatarUrl?: string | null;
}

export interface DmConversation {
  id: string;
  workspaceId: string;
  name?: string | null;
  createdBy?: string | null;
  createdAt: string;
  participants: DmParticipant[];
}

export interface MessageSender {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

export interface Attachment {
  id: string;
  messageId: string | null;
  uploaderId: string;
  bucket: string;
  objectKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  replyToMessageId?: string | null;
  replyTo?: { id: string; content: string; sender: MessageSender } | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  sender: MessageSender;
  attachments?: Attachment[];
  reactions?: Reaction[];
  _optimistic?: boolean;
}

export interface ThreadMessage {
  id: string;
  parentMessageId: string;
  content: string;
  editedAt: string | null;
  createdAt: string;
  sender: MessageSender;
}

export interface Reaction {
  id: string;
  emoji: string;
  createdAt: string;
  user: { id: string; username: string; avatarUrl?: string | null };
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  reactedByMe: boolean;
  userIds: string[];
}

export type PresenceStatus = 'online' | 'away' | 'offline' | 'dnd';

export const STATUS_OPTIONS: { value: PresenceStatus; label: string; color: string }[] = [
  { value: 'online', label: 'Online', color: 'bg-green-500' },
  { value: 'away', label: 'Away', color: 'bg-yellow-400' },
  { value: 'dnd', label: 'Do not disturb', color: 'bg-red-500' },
  { value: 'offline', label: 'Appear offline', color: 'bg-slate-400' },
];

export type NotificationType = 'mention' | 'thread_reply' | 'dm';

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

