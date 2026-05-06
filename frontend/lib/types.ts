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
