export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export interface User {
  id: string; // uuid v4
  login: string;
  password: string; // bcrypt hash
  role: UserRole;
  createdAt: number; // timestamp of creation
  updatedAt: number; // timestamp of last update
}
