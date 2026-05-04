export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
}
