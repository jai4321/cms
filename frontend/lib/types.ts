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
  createdAt: string;
  participants: DmParticipant[];
}

export interface MessageSender {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  sender: MessageSender;
  _optimistic?: boolean;
}

